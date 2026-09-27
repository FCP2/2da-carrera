const confirmationService =
  require('./confirmation.service');


class ConfirmationController {

  async confirm(req, res) {

    try {

      const {
        token
      } = req.params;


      const result =
        await confirmationService.confirm(
          token
        );


      res.render(
        'public/confirmation',
        {
          title:
            'Inscripción confirmada | Voces que Corren',

          success: true,

          alreadyConfirmed:
            result.alreadyConfirmed,

          data:
            result,

          errorCode:
            null,

          errorMessage:
            null
        }
      );


    } catch (error) {

      console.error(
        '❌ Error confirmando registro:',
        error
      );


      res.status(400).render(
        'public/confirmation',
        {
          title:
            'Confirmación | Voces que Corren',

          success: false,

          alreadyConfirmed:
            false,

          data:
            null,

          errorCode:
            error.code ||
            'CONFIRMATION_ERROR',

          errorMessage:
            error.message ||
            'No fue posible confirmar tu inscripción.'
        }
      );

    }

  }

}


module.exports =
  new ConfirmationController();