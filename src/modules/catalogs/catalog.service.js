const catalogRepository = require('./catalog.repository');

class CatalogService {

  async getMunicipios() {
    const municipios = await catalogRepository.getMunicipios();

    return municipios;
  }

}

module.exports = new CatalogService();