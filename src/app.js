const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const homeRoutes = require('./modules/home/home.routes');
const registrationRoutes = require('./modules/registrations/registration.routes');
const errorMiddleware = require('./middleware/error.middleware');

const catalogRoutes = require('./modules/catalogs/catalog.routes');

const galleryRoutes =
  require('./modules/gallery/gallery.routes');

const confirmationRoutes =
  require('./modules/confirmations/confirmation.routes');

const app = express();


app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

const galleryStoragePath = path.resolve(
  process.env.GALLERY_STORAGE_PATH ||
  path.join(process.cwd(), 'storage', 'gallery')
);

app.use(
  '/media/gallery',
  express.static(galleryStoragePath, {
    maxAge: '1h',
    fallthrough: true
  })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use('/', homeRoutes);
app.use('/registro', registrationRoutes);
app.use('/api/catalogos', catalogRoutes);

app.use(
  '/galeria',
  galleryRoutes
);

app.use(
  '/confirmar',
  confirmationRoutes
);

app.use((req, res) => {
  res.status(404).render('public/error', {
    title: 'Página no encontrada | Voces que Corren',
    message: 'La página que buscas no existe.'
  });
});

app.use(errorMiddleware);

module.exports = app;
