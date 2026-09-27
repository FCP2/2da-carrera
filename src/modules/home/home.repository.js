const pool = require('../../config/database');

class HomeRepository {

  async getEventSummary() {

    const result = await pool.query(`
      SELECT
        e.id,
        e.nombre,
        e.capacidad,
        e.folios_reservados,
        e.registros_abiertos,

        COUNT(r.id) FILTER (
          WHERE r.estatus = 'confirmado'
        )::INTEGER AS confirmados,

        COUNT(r.id) FILTER (
          WHERE r.estatus = 'pendiente_confirmacion'
        )::INTEGER AS pendientes

      FROM eventos e

      LEFT JOIN registros r
        ON r.evento_id = e.id

      WHERE e.slug = 'voces-que-corren-2026'

      GROUP BY
        e.id,
        e.nombre,
        e.capacidad,
        e.folios_reservados,
        e.registros_abiertos

      LIMIT 1;
    `);

    return result.rows[0] || null;
  }

}

module.exports = new HomeRepository();