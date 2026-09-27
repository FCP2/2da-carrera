const express =
  require('express');

const router =
  express.Router();

const confirmationController =
  require('./confirmation.controller');


router.get(
  '/:token',
  confirmationController
    .confirm
    .bind(confirmationController)
);


module.exports = router;