const express = require('express');

const router = express.Router();

const galleryController =
  require('./gallery.controller');

router.get(
  '/',
  galleryController.index.bind(galleryController)
);

module.exports = router;