const crypto = require('crypto');

const pool = require('../../config/database');
const registrationRepository =
  require('./registration.repository');
const emailService =
  require('../email/email.service');

async function verifyTurnstileToken(token, remoteIp) {
  const secret = String(process.env.CARRERA_TURNSTILE_SECRET_KEY || '').trim();

  if (!secret) {
    const error = new Error('La verificación de seguridad no está configurada en el servidor.');
    error.status = 503;
    error.code = 'TURNSTILE_NOT_CONFIGURED';
    throw error;
  }

  let response;
  try {
    response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          secret,
          response: token,
          remoteip: remoteIp || undefined
        })
      }
    );
  } catch (error) {
    const unavailableError = new Error('No fue posible validar la verificación de seguridad.');
    unavailableError.status = 502;
    unavailableError.code = 'TURNSTILE_UNAVAILABLE';
    throw unavailableError;
  }

  if (!response.ok) {
    const error = new Error('No fue posible validar la verificación de seguridad.');
    error.status = 502;
    error.code = 'TURNSTILE_UNAVAILABLE';
    throw error;
  }

  const result = await response.json();

  if (!result.success) {
    const error = new Error('Completa nuevamente la verificación de seguridad.');
    error.status = 400;
    error.code = 'TURNSTILE_FAILED';
    throw error;
  }
}

function normalizeFullName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-MX');
}

function isMinorOnRegistrationDate(dateInput) {
  const value = String(dateInput || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const birth = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== value) return null;

  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(new Date()).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));

  const age = parts.year - birth.getUTCFullYear()
    - (parts.month < birth.getUTCMonth() + 1
      || (parts.month === birth.getUTCMonth() + 1 && parts.day < birth.getUTCDate()) ? 1 : 0);

  return age < 0 ? null : age < 18;
}

class RegistrationService {

  async createRegistration(body, remoteIp) {

    const turnstileToken = String(body.turnstileToken || '').trim();

    if (!turnstileToken || turnstileToken.length > 2048) {
      const error = new Error('Completa la verificación de seguridad para continuar.');
      error.status = 400;
      error.code = 'TURNSTILE_REQUIRED';
      throw error;
    }

    await verifyTurnstileToken(turnstileToken, remoteIp);

    const client = await pool.connect();

    try {

      await client.query('BEGIN');


      const evento =
        await registrationRepository.getActiveEvent(client);

      if (!evento) {
        throw new Error(
          'No existe un evento disponible.'
        );
      }


      if (!evento.registros_abiertos) {
        throw new Error(
          'Los registros todavía no se encuentran abiertos.'
        );
      }


      const confirmed =
        await registrationRepository.countConfirmed(
          client,
          evento.id
        );


      if (confirmed >= evento.capacidad) {
        throw new Error(
          'El cupo del evento se encuentra completo.'
        );
      }


      const correo =
        String(body.correo || '')
          .trim()
          .toLowerCase();

      const correoConfirmacion =
        String(body.correoConfirmacion || '')
          .trim()
          .toLowerCase();


      const telefono =
        String(body.telefono || '')
          .replace(/\D/g, '');


      const telefonoEmergencia =
        String(body.telefonoEmergencia || '')
          .replace(/\D/g, '');


      if (!correo) {
        throw new Error(
          'El correo electrónico es obligatorio.'
        );
      }

      if (!correoConfirmacion) {
        const error = new Error(
          'Confirma tu correo electrónico para continuar.'
        );
        error.status = 400;
        error.code = 'EMAIL_CONFIRMATION_REQUIRED';
        throw error;
      }

      if (correo !== correoConfirmacion) {
        const error = new Error(
          'Los correos electrónicos no coinciden.'
        );
        error.status = 400;
        error.code = 'EMAIL_MISMATCH';
        throw error;
      }


      if (telefono.length !== 10) {
        throw new Error(
          'El teléfono debe contener 10 dígitos.'
        );
      }


      if (telefonoEmergencia.length !== 10) {
        throw new Error(
          'El teléfono de emergencia debe contener 10 dígitos.'
        );
      }

      const nombres = String(body.nombres || '').trim().replace(/\s+/g, ' ');
      const apellidoPaterno = String(body.apellidoPaterno || '').trim().replace(/\s+/g, ' ');
      const apellidoMaterno = String(body.apellidoMaterno || '').trim().replace(/\s+/g, ' ');
      const nombreValido = /^\p{L}+(?:\s+\p{L}+)*$/u;

      if (![nombres, apellidoPaterno, apellidoMaterno].every(value => nombreValido.test(value))) {
        const error = new Error('Nombre y apellidos solo pueden contener letras y espacios.');
        error.status = 400;
        error.code = 'INVALID_NAME_FORMAT';
        throw error;
      }

      const categoriaCompetencia = String(body.categoriaCompetencia || '').trim();

      const esMenorEdad = body.esMenorEdad === true || body.esMenorEdad === 'true';
      const fechaNacimiento = String(body.fechaNacimiento || '').trim();
      const edadMenor = isMinorOnRegistrationDate(fechaNacimiento);

      if (edadMenor === null || edadMenor !== esMenorEdad) {
        const error = new Error(edadMenor === null
          ? 'Escribe una fecha de nacimiento válida.'
          : 'Verifica la fecha de nacimiento y la opción de menor de edad.');
        error.status = 400;
        error.code = 'MINOR_AGE_MISMATCH';
        throw error;
      }

      if (!['femenil', 'varonil'].includes(categoriaCompetencia)) {
        const error = new Error('Selecciona una categoría de competencia válida.');
        error.status = 400;
        error.code = 'INVALID_CATEGORY';
        throw error;
      }

      const identidadLgbtiq = body.identidadLgbtiq
        ? String(body.identidadLgbtiq).trim()
        : null;

      if (identidadLgbtiq && !['si', 'no', 'prefiero_no_responder'].includes(identidadLgbtiq)) {
        const error = new Error('La respuesta LGBTIQ+ no es válida.');
        error.status = 400;
        error.code = 'INVALID_LGBTIQ_RESPONSE';
        throw error;
      }


      const residencia =
        String(body.esEdomex || '')
          .trim()
          .toLowerCase();

      if (!['true', 'false'].includes(residencia)) {
        throw new Error(
          'Debes indicar si resides en el Estado de México.'
        );
      }

      const esEstadoMexico =
        residencia === 'true';


      let municipioId = null;
      let estadoForaneo = null;
      let ciudadForanea = null;


      if (esEstadoMexico) {

        municipioId = Number(body.municipioId);

        const municipio =
          await registrationRepository.findMunicipio(
            client,
            municipioId
          );


        if (!municipio) {
          throw new Error(
            'El municipio seleccionado no es válido.'
          );
        }

      } else {

        estadoForaneo =
          String(body.estadoForaneo || '').trim();

        ciudadForanea =
          String(body.ciudadForanea || '').trim();


        if (!estadoForaneo || !ciudadForanea) {
          throw new Error(
            'Para participantes foráneos, estado y ciudad son obligatorios.'
          );
        }
      }


      let participante = esMenorEdad
        ? await registrationRepository.findMinorParticipantByIdentity(client, {
            correo, nombres, apellidoPaterno, apellidoMaterno, fechaNacimiento
          })
        : await registrationRepository.findAdultParticipantByEmail(client, correo);

      if (!esMenorEdad && participante) {
        const nombreIngresado = normalizeFullName([nombres, apellidoPaterno, apellidoMaterno].join(' '));
        const nombreExistente = normalizeFullName([
          participante.nombres,
          participante.apellido_paterno ?? participante.apellidoPaterno,
          participante.apellido_materno ?? participante.apellidoMaterno
        ].join(' '));
        const fechaExistente = participante.fecha_nacimiento_text
          ?? participante.fechaNacimiento
          ?? (participante.fecha_nacimiento instanceof Date
            ? participante.fecha_nacimiento.toISOString().slice(0, 10)
            : participante.fecha_nacimiento);

        if (nombreIngresado !== nombreExistente || fechaNacimiento !== fechaExistente) {
          const error = new Error('Este correo ya está asociado a otra persona adulta. Usa un correo diferente para este preregistro.');
          error.status = 409;
          error.code = 'ADULT_EMAIL_IN_USE';
          throw error;
        }
      }


      if (!participante) {

        participante =
          await registrationRepository.createParticipant(
            client,
            {
              nombres,

              apellidoPaterno,

              apellidoMaterno,

              fechaNacimiento,

              esMenorEdad,

              categoriaCompetencia,

              identidadLgbtiq,

              curp:
                body.curp
                  ? String(body.curp).trim().toUpperCase()
                  : null,

              esEstadoMexico,

              municipioId,

              estadoForaneo,

              ciudadForanea,

              correo,

              telefono,

              tipoSangre:
                body.tipoSangre || null,

              contactoEmergencia:
                String(
                  body.contactoEmergencia || ''
                ).trim(),

              telefonoEmergencia
            }
          );

      }


      const existingRegistration =
        await registrationRepository
          .findRegistrationByParticipant(
            client,
            evento.id,
            participante.id
          );


      if (existingRegistration) {

        const error = new Error(
          'Esta persona ya tiene un preregistro para el evento.'
        );

        error.status = 409;
        error.code = 'EMAIL_ALREADY_REGISTERED';

        throw error;
      }


      const registration =
        await registrationRepository.createRegistration(
          client,
          {
            eventoId: evento.id,

            participanteId: participante.id,

            talla: body.talla,

            aceptaPrivacidad:
              Boolean(body.aceptaPrivacidad),

            aceptaExoneracion:
              Boolean(body.aceptaExoneracion),

            autorizaImagen:
              Boolean(body.autorizaImagen)
          }
        );


      const token =
        crypto.randomBytes(32).toString('hex');


      const tokenHash =
        crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');


      const expiresAt =
        new Date(
          Date.now() +
          60 * 60 * 1000
        );


      await registrationRepository
        .invalidatePreviousTokens(
          client,
          registration.id
        );


      await registrationRepository
        .createConfirmationToken(
          client,
          registration.id,
          tokenHash,
          expiresAt
        );


      await client.query('COMMIT');

      const appUrl = String(process.env.APP_URL || '').replace(/\/+$/, '');
      if (!appUrl) {
        throw new Error('APP_URL no está configurada para generar el enlace de confirmación.');
      }
      const confirmationUrl = `${appUrl}/confirmar/${token}`;

      let emailSent = true;
      try {
        await emailService.sendConfirmationEmail({
          to: correo,
          name: [body.nombres, body.apellidoPaterno, body.apellidoMaterno]
            .filter(Boolean)
            .join(' '),
          confirmationUrl
        });
      } catch (emailError) {
        emailSent = false;
        console.error('No se pudo enviar el correo inicial:', emailError);
      }


      console.log('');
      console.log('====================================');
      console.log('📩 ENLACE DE CONFIRMACIÓN');
      console.log(confirmationUrl);
      console.log('====================================');
      console.log('');


      return {
        registroId: registration.id,
        estatus: registration.estatus,
        expiresAt,
        emailSent,
        devConfirmationUrl:
          process.env.NODE_ENV === 'development'
            ? confirmationUrl
            : undefined
      };


    } catch (error) {

      await client.query('ROLLBACK');

      if (error.code === '23505') {
        const curpDuplicada = error.constraint === 'idx_participantes_curp_unique';
        const adultEmailDuplicado = error.constraint === 'idx_participantes_email_adultos_unique';
        const duplicate = new Error(curpDuplicada
          ? 'Esta CURP ya está asociada a otra persona participante.'
          : adultEmailDuplicado
            ? 'Este correo ya está asociado a una persona adulta. Usa un correo diferente para este preregistro.'
            : 'Esta persona ya tiene un preregistro para el evento.');
        duplicate.status = 409;
        duplicate.code = curpDuplicada
          ? 'CURP_ALREADY_REGISTERED'
          : adultEmailDuplicado ? 'ADULT_EMAIL_IN_USE' : 'EMAIL_ALREADY_REGISTERED';
        throw duplicate;
      }

      throw error;

    } finally {

      client.release();

    }

  }

  async resendConfirmation(input = {}) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const evento = await registrationRepository.getActiveEvent(client);
      if (!evento) {
        throw new Error('No existe un evento disponible.');
      }

      const data = typeof input === 'string' ? { correo: input } : input;
      const correo = String(data.correo || '').trim().toLowerCase();
      if (!correo) {
        const error = new Error('El correo electrónico es obligatorio.');
        error.status = 400;
        error.code = 'EMAIL_REQUIRED';
        throw error;
      }

      const registros = await registrationRepository.findRegistrationsByEmail(client, evento.id, correo);
      if (registros.length === 0) {
        const error = new Error('No encontramos un preregistro asociado a ese correo.');
        error.status = 404;
        error.code = 'REGISTRATION_NOT_FOUND';
        throw error;
      }

      const nombreCompleto = normalizeFullName(data.nombreCompleto);
      const fechaNacimiento = String(data.fechaNacimiento || '').trim();
      if (Boolean(nombreCompleto) !== Boolean(fechaNacimiento)) {
        const error = new Error('Escribe el nombre completo y la fecha de nacimiento.');
        error.status = 400;
        error.code = 'REGISTRATION_IDENTITY_INCOMPLETE';
        throw error;
      }
      if (registros.length > 1 && (!nombreCompleto || !fechaNacimiento)) {
        const error = new Error('Este correo tiene varios preregistros. Indica el nombre completo y la fecha de nacimiento de la persona participante.');
        error.status = 409;
        error.code = 'REGISTRATION_IDENTITY_REQUIRED';
        throw error;
      }

      const registro = nombreCompleto || fechaNacimiento
        ? registros.find(row =>
            normalizeFullName([row.nombres, row.apellido_paterno, row.apellido_materno].join(' ')) === nombreCompleto
            && row.fecha_nacimiento === fechaNacimiento
          )
        : registros[0];

      if (!registro) {
        const error = new Error('No encontramos un preregistro con esos datos. Revisa el nombre completo y la fecha de nacimiento.');
        error.status = 404;
        error.code = 'REGISTRATION_NOT_FOUND';
        throw error;
      }

      if (registro.estatus === 'confirmado') {
        const error = new Error('Este preregistro ya fue confirmado y tiene un folio asignado.');
        error.status = 409;
        error.code = 'REGISTRATION_ALREADY_CONFIRMED';
        throw error;
      }

      if (registro.estatus !== 'pendiente_confirmacion') {
        const error = new Error('Este preregistro ya no está disponible para confirmación.');
        error.status = 409;
        error.code = 'REGISTRATION_NOT_PENDING';
        throw error;
      }

      const reenviosUsados = Number(registro.reenvios_confirmacion || 0);
      if (reenviosUsados >= 3) {
        const error = new Error('Has alcanzado el límite de 3 reenvíos. Solicita apoyo para reactivar tu confirmación.');
        error.status = 429;
        error.code = 'RESEND_LIMIT_REACHED';
        throw error;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      const resend = await registrationRepository.consumeConfirmationResend(client, registro.id);
      if (!resend) {
        const error = new Error('Has alcanzado el límite de 3 reenvíos. Solicita apoyo para reactivar tu confirmación.');
        error.status = 429;
        error.code = 'RESEND_LIMIT_REACHED';
        throw error;
      }

      await registrationRepository.invalidatePreviousTokens(client, registro.id);
      await registrationRepository.createConfirmationToken(client, registro.id, tokenHash, expiresAt);

      await client.query('COMMIT');

      const appUrl = String(process.env.APP_URL || '').replace(/\/+$/, '');
      if (!appUrl) {
        throw new Error('APP_URL no está configurada para generar el enlace de confirmación.');
      }
      const confirmationUrl = `${appUrl}/confirmar/${token}`;
      console.log('Nuevo enlace de confirmación:', confirmationUrl);

      let emailSent = true;
      try {
        await emailService.sendConfirmationEmail({
          to: correo,
          name: [registro.nombres, registro.apellido_paterno, registro.apellido_materno]
            .filter(Boolean)
            .join(' '),
          confirmationUrl
        });
      } catch (emailError) {
        emailSent = false;
        await registrationRepository.refundConfirmationResend(client, registro.id);
        console.error('No se pudo reenviar el correo:', emailError);
      }

      return {
        expiresAt,
        emailSent,
        reenviosUsados: resend.reenvios_confirmacion,
        reenviosRestantes: 3 - Number(resend.reenvios_confirmacion),
        devConfirmationUrl:
          process.env.NODE_ENV === 'development' ? confirmationUrl : undefined
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

}

module.exports = new RegistrationService();
