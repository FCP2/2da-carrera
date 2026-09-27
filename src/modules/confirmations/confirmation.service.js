const crypto = require('crypto');

const pool = require('../../config/database');

const confirmationRepository =
  require('./confirmation.repository');
const emailService =
  require('../email/email.service');


class ConfirmationService {

  async confirm(token) {

    if (!token || token.length < 20) {

      const error =
        new Error('El enlace de confirmación no es válido.');

      error.code = 'INVALID_TOKEN';

      throw error;
    }


    const tokenHash =
      crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');


    const client =
      await pool.connect();


    try {

      await client.query('BEGIN');


      // Buscar y bloquear token + registro
      const confirmation =
        await confirmationRepository
          .findTokenForUpdate(
            client,
            tokenHash
          );


      if (!confirmation) {

        const error =
          new Error(
            'El enlace de confirmación no existe o ya no es válido.'
          );

        error.code = 'TOKEN_NOT_FOUND';

        throw error;
      }


      // Si ya confirmó anteriormente
      if (
        confirmation.estatus === 'confirmado'
      ) {

        await client.query('COMMIT');

        return {
          alreadyConfirmed: true,

          folio:
            confirmation.folio,

          nombre:
            this.buildName(confirmation),

          evento:
            confirmation.evento_nombre
        };
      }


      // Token ya utilizado
      if (confirmation.usado_at) {

        const error =
          new Error(
            'Este enlace de confirmación ya fue utilizado.'
          );

        error.code = 'TOKEN_ALREADY_USED';

        throw error;
      }


      // Token expirado
      const expiration =
        new Date(confirmation.expires_at);


      if (expiration <= new Date()) {

        const error =
          new Error(
            'Tu enlace de confirmación ha expirado.'
          );

        error.code = 'TOKEN_EXPIRED';

        throw error;
      }


      // Bloqueamos evento
      // para proteger asignación concurrente de folios
      const evento =
        await confirmationRepository
          .lockEvent(
            client,
            confirmation.evento_id
          );


      if (!evento) {

        const error =
          new Error(
            'No fue posible localizar el evento.'
          );

        error.code = 'EVENT_NOT_FOUND';

        throw error;
      }


      // Comprobación general de capacidad
      const confirmed =
        await confirmationRepository
          .countConfirmed(
            client,
            evento.id
          );


      if (confirmed >= evento.capacidad) {

        const error =
          new Error(
            'El cupo disponible para la carrera se ha agotado.'
          );

        error.code = 'EVENT_FULL';

        throw error;
      }


      // Obtener último número utilizado
      const highestNumber =
        await confirmationRepository
          .getHighestFolioNumber(
            client,
            evento.id
          );


      const reserved =
        Number(
          evento.folios_reservados || 0
        );


      // Si no hay folios todavía:
      // max(0,10) + 1 = 11
      const numeroFolio =
        Math.max(
          highestNumber,
          reserved
        ) + 1;


      // Formato:
      // VC-2026-0011

      const year =
        confirmation.fecha_evento
          ? new Date(
              confirmation.fecha_evento
            ).getUTCFullYear()
          : new Date().getFullYear();


      const folio =
        `VC-${year}-${String(numeroFolio).padStart(4, '0')}`;


      // Confirmamos
      const registro =
        await confirmationRepository
          .confirmRegistration(
            client,
            confirmation.registro_id,
            numeroFolio,
            folio
          );


      // Token deja de servir
      await confirmationRepository
        .markTokenAsUsed(
          client,
          confirmation.token_id
        );


      await client.query('COMMIT');

      let emailSent = true;
      try {
        await emailService.sendRegistrationConfirmedEmail({
          to: confirmation.correo,
          name: this.buildName(confirmation),
          folio,
          evento: confirmation.evento_nombre
        });
      } catch (emailError) {
        emailSent = false;
        console.error('No se pudo enviar el correo con folio:', emailError);
      }


      console.log('');
      console.log(
        '======================================'
      );
      console.log(
        '✅ INSCRIPCIÓN CONFIRMADA'
      );
      console.log(
        `Participante: ${this.buildName(confirmation)}`
      );
      console.log(
        `Folio: ${folio}`
      );
      console.log(
        '======================================'
      );
      console.log('');


      return {

        alreadyConfirmed: false,

        registroId:
          registro.id,

        folio,

        numeroFolio,
        emailSent,

        nombre:
          this.buildName(confirmation),

        evento:
          confirmation.evento_nombre,

        fechaEvento:
          confirmation.fecha_evento,

        horaEvento:
          confirmation.hora_evento

      };


    } catch (error) {

      await client.query('ROLLBACK');

      throw error;

    } finally {

      client.release();

    }

  }


  buildName(data) {

    return [
      data.nombres,
      data.apellido_paterno,
      data.apellido_materno
    ]
      .filter(Boolean)
      .join(' ');

  }

}


module.exports =
  new ConfirmationService();
