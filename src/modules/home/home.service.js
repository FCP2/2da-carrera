const homeRepository =
  require('./home.repository');

class HomeService {

  async getHomeData() {

    const evento =
      await homeRepository.getEventSummary();

    if (!evento) {
      throw new Error(
        'No se encontró el evento activo.'
      );
    }

    return {
      capacity:
        Number(evento.capacidad),

      confirmed:
        Number(evento.confirmados),

      pending:
        Number(evento.pendientes),

      reserved:
        Number(evento.folios_reservados),

      registrationsOpen:
        evento.registros_abiertos
    };
  }

}

module.exports = new HomeService();