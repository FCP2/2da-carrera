const pool = require('../../config/database');

class RegistrationRepository {

  async getActiveEvent(client) {
    const result = await client.query(`
      SELECT
        id,
        nombre,
        capacidad,
        registros_abiertos
      FROM eventos
      ORDER BY id DESC
      LIMIT 1
    `);

    return result.rows[0] || null;
  }


  async countConfirmed(client, eventoId) {
    const result = await client.query(
      `
        SELECT COUNT(*)::INTEGER AS total
        FROM registros
        WHERE evento_id = $1
        AND estatus = 'confirmado'
      `,
      [eventoId]
    );

    return result.rows[0].total;
  }


  async findMunicipio(client, municipioId) {
    const result = await client.query(
      `
        SELECT id
        FROM municipios
        WHERE id = $1
        AND activo = TRUE
      `,
      [municipioId]
    );

    return result.rows[0] || null;
  }


  async findParticipantByEmail(client, email) {
    const result = await client.query(
      `
        SELECT *
        FROM participantes
        WHERE LOWER(correo) = LOWER($1)
        LIMIT 1
      `,
      [email]
    );

    return result.rows[0] || null;
  }


  async createParticipant(client, data) {
    const result = await client.query(
      `
        INSERT INTO participantes (
          nombres,
          apellido_paterno,
          apellido_materno,
          fecha_nacimiento,
          categoria_competencia,
          identidad_lgbtiq,
          curp,
          es_estado_mexico,
          municipio_id,
          estado_foraneo,
          ciudad_foranea,
          correo,
          telefono,
          tipo_sangre,
          contacto_emergencia,
          telefono_emergencia
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
        )
        RETURNING *
      `,
      [
        data.nombres,
        data.apellidoPaterno,
        data.apellidoMaterno,
        data.fechaNacimiento,
        data.categoriaCompetencia,
        data.identidadLgbtiq || null,
        data.curp || null,
        data.esEstadoMexico,
        data.municipioId || null,
        data.estadoForaneo || null,
        data.ciudadForanea || null,
        data.correo,
        data.telefono,
        data.tipoSangre || null,
        data.contactoEmergencia,
        data.telefonoEmergencia
      ]
    );

    return result.rows[0];
  }


  async findRegistrationByParticipant(
    client,
    eventoId,
    participanteId
  ) {
    const result = await client.query(
      `
        SELECT *
        FROM registros
        WHERE evento_id = $1
        AND participante_id = $2
        LIMIT 1
      `,
      [eventoId, participanteId]
    );

    return result.rows[0] || null;
  }


  async createRegistration(client, data) {
    const result = await client.query(
      `
        INSERT INTO registros (
          evento_id,
          participante_id,
          talla,
          estatus,
          acepta_privacidad,
          acepta_exoneracion,
          autoriza_imagen,
          consentimiento_at,
          version_privacidad,
          version_exoneracion
        )
        VALUES (
          $1,
          $2,
          $3,
          'pendiente_confirmacion',
          $4,
          $5,
          $6,
          NOW(),
          $7,
          $8
        )
        RETURNING *
      `,
      [
        data.eventoId,
        data.participanteId,
        data.talla,
        data.aceptaPrivacidad,
        data.aceptaExoneracion,
        data.autorizaImagen,
        '1.0',
        '1.0'
      ]
    );

    return result.rows[0];
  }


  async invalidatePreviousTokens(client, registroId) {
    await client.query(
      `
        UPDATE tokens_confirmacion
        SET usado_at = NOW()
        WHERE registro_id = $1
        AND usado_at IS NULL
      `,
      [registroId]
    );
  }

  async consumeConfirmationResend(client, registroId) {
    const result = await client.query(
      `
        UPDATE registros
        SET
          reenvios_confirmacion = reenvios_confirmacion + 1,
          ultimo_reenvio_confirmacion_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
          AND estatus = 'pendiente_confirmacion'
          AND reenvios_confirmacion < 3
        RETURNING reenvios_confirmacion
      `,
      [registroId]
    );

    return result.rows[0] || null;
  }

  async refundConfirmationResend(client, registroId) {
    await client.query(
      `
        UPDATE registros
        SET
          reenvios_confirmacion = GREATEST(reenvios_confirmacion - 1, 0),
          updated_at = NOW()
        WHERE id = $1
      `,
      [registroId]
    );
  }


  async createConfirmationToken(
    client,
    registroId,
    tokenHash,
    expiresAt
  ) {
    const result = await client.query(
      `
        INSERT INTO tokens_confirmacion (
          registro_id,
          token_hash,
          expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [
        registroId,
        tokenHash,
        expiresAt
      ]
    );

    return result.rows[0];
  }

}

module.exports = new RegistrationRepository();
