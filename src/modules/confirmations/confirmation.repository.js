const pool = require('../../config/database');

class ConfirmationRepository {

  async findTokenForUpdate(client, tokenHash) {

    const result = await client.query(
      `
        SELECT
          tc.id AS token_id,
          tc.registro_id,
          tc.expires_at,
          tc.usado_at,

          r.evento_id,
          r.participante_id,
          r.estatus,
          r.folio,
          r.numero_folio,

          p.nombres,
          p.apellido_paterno,
          p.apellido_materno,
          p.correo,

          e.nombre AS evento_nombre,
          e.fecha_evento,
          e.hora_evento,
          e.capacidad,
          e.folios_reservados

        FROM tokens_confirmacion tc

        INNER JOIN registros r
          ON r.id = tc.registro_id

        INNER JOIN participantes p
          ON p.id = r.participante_id

        INNER JOIN eventos e
          ON e.id = r.evento_id

        WHERE tc.token_hash = $1

        LIMIT 1

        FOR UPDATE OF tc, r
      `,
      [tokenHash]
    );

    return result.rows[0] || null;
  }


  async lockEvent(client, eventoId) {

    const result = await client.query(
      `
        SELECT
          id,
          capacidad,
          folios_reservados
        FROM eventos
        WHERE id = $1
        FOR UPDATE
      `,
      [eventoId]
    );

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


  async getHighestFolioNumber(client, eventoId) {

    const result = await client.query(
      `
        SELECT
          COALESCE(MAX(numero_folio), 0)::INTEGER
          AS ultimo
        FROM registros
        WHERE evento_id = $1
        AND numero_folio IS NOT NULL
      `,
      [eventoId]
    );

    return result.rows[0].ultimo;
  }


  async confirmRegistration(
    client,
    registroId,
    numeroFolio,
    folio
  ) {

    const result = await client.query(
      `
        UPDATE registros
        SET
          estatus = 'confirmado',
          numero_folio = $2,
          folio = $3,
          confirmado_at = NOW(),
          updated_at = NOW()
        WHERE id = $1

        RETURNING *
      `,
      [
        registroId,
        numeroFolio,
        folio
      ]
    );

    return result.rows[0];
  }


  async markTokenAsUsed(client, tokenId) {

    await client.query(
      `
        UPDATE tokens_confirmacion
        SET usado_at = NOW()
        WHERE id = $1
      `,
      [tokenId]
    );

  }

}

module.exports =
  new ConfirmationRepository();