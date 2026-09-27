const express = require('express');

const router = express.Router();

const catalogController = require('./catalog.controller');

router.get(
  '/municipios',
  catalogController.getMunicipios.bind(catalogController)
);

module.exports = router;