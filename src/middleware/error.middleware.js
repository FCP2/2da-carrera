function errorMiddleware(error, req, res, next) {

  console.error('');
  console.error('======================================');
  console.error('❌ ERROR DEL SERVIDOR');
  console.error('Código:', error.code || 'INTERNAL_ERROR');
  console.error('Mensaje:', error.message);
  console.error(error.stack);
  console.error('======================================');
  console.error('');


  res
    .status(error.status || 500)
    .json({
      success: false,

      code:
        error.code ||
        'INTERNAL_ERROR',

      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : (
              error.status && error.status < 500
                ? error.message
                : 'Ocurrió un error interno en el servidor.'
            )
    });
}


module.exports = errorMiddleware;
