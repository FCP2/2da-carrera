const galleryService =
  require('./gallery.service');

class GalleryController {

  async index(req, res, next) {

    try {

      const data =
        await galleryService.getGallery();

      res.render(
        'public/gallery',
        {
          title:
            'Galería | Voces que Corren',

          photos:
            data.photos,

          totalPhotos:
            data.totalPhotos
        }
      );

    } catch (error) {

      next(error);

    }

  }

}

module.exports =
  new GalleryController();