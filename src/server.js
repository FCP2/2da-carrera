require('dotenv').config();

const app = require('./app');
const pool = require('./config/database');

const PORT = process.env.PORT || 4001;

async function startServer() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurada en el archivo .env');
    }

    if (!process.env.APP_URL) {
      throw new Error('APP_URL no está configurada en el archivo .env');
    }

    await pool.query('SELECT NOW()');

    app.listen(PORT, () => {
      console.log('');
      console.log('🏃 VOCES QUE CORREN');
      console.log('🐘 PostgreSQL conectado');
      console.log(`🌐 http://localhost:${PORT}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor.');
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
