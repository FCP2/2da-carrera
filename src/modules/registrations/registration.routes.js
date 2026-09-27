const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const registrationController = require('./registration.controller');

const resendConfirmationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RESEND_RATE_LIMITED',
    message: 'Espera unos minutos antes de solicitar otro enlace.'
  }
});

router.get(
  '/',
  registrationController.showForm.bind(registrationController)
);

router.post(
  '/',
  registrationController.create.bind(registrationController)
);

router.post(
  '/reenviar-confirmacion',
  resendConfirmationLimiter,
  registrationController.resendConfirmation.bind(registrationController)
);

module.exports = router;
