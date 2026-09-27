const homeService =
  require('./home.service');

class HomeController {

  async index(req, res, next) {

    try {

      const data =
        await homeService.getHomeData();

      res.render('public/home', {
        title: 'Voces que Corren',

        capacity:
          data.capacity,

        confirmed:
          data.confirmed,

        pending:
          data.pending,

        reserved:
          data.reserved,

        registrationsOpen:
          data.registrationsOpen
      });

    } catch (error) {

      next(error);

    }
  }

}

module.exports =
  new HomeController();
