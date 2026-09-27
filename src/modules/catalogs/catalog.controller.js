const catalogService = require('./catalog.service');

class CatalogController {

  async getMunicipios(req, res, next) {
    try {

      const municipios = await catalogService.getMunicipios();

      res.status(200).json({
        success: true,
        data: municipios
      });

    } catch (error) {
      next(error);
    }
  }

}

module.exports = new CatalogController();