const registrationService = require('./registration.service');

class RegistrationController {

  showForm(req, res) {
    res.render('public/register', {
      title: 'Registro | Voces que Corren',
      capacity: 2000,
      confirmed: 0,
      turnstileSiteKey: process.env.CARRERA_TURNSTILE_SITE_KEY || ''
    });
  }


  async create(req, res, next) {
    try {

      const result =
        await registrationService.createRegistration(req.body, req.ip);

      res.status(201).json({
        success: true,
        message:
          'Preregistro creado correctamente. Revisa tu correo para confirmar tu inscripción.',
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  async resendConfirmation(req, res, next) {
    try {
      const result = await registrationService.resendConfirmation(req.body?.correo);

      if (!result.emailSent) {
        return res.status(502).json({
          success: false,
          code: 'EMAIL_DELIVERY_FAILED',
          message: 'El enlace no pudo enviarse. En modo de prueba, Resend solo permite el correo propietario de la cuenta o un dominio verificado.'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Generamos un nuevo enlace de confirmación.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new RegistrationController();
