const pool = require('../../config/database');

class CatalogRepository {

  async getMunicipios() {
    const query = `
      SELECT
        id,
        clave,
        nombre
      FROM municipios
      WHERE activo = TRUE
      ORDER BY nombre ASC
    `;

    const result = await pool.query(query);

    return result.rows;
  }

}

module.exports = new CatalogRepository();