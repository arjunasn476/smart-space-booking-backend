// Global Express error handler — the LAST middleware registered in
// app.js. Converts AppError + known Prisma error codes into the baku
// error response shape; anything unrecognized is logged server-side
// and returned as a generic 500 (never leaks stack traces to the client).
const { error } = require('../utils/response');
const { AppError } = require('../utils/AppError');

// Multer's default error messages are English and terse (e.g.
// "Unexpected field") — map the common codes to clearer Indonesian
// messages instead of passing them through as-is.
const MULTER_MESSAGES = {
  LIMIT_UNEXPECTED_FILE: 'Hanya boleh mengunggah 1 file dalam satu permintaan!',
  LIMIT_FILE_SIZE: 'Ukuran file terlalu besar! Maksimal 5 MB.',
  LIMIT_FILE_COUNT: 'Terlalu banyak file dalam satu permintaan!',
};

module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return error(res, { statusCode: err.statusCode, message: err.message, error: err.errorName });
  }

  // Prisma known-error codes worth translating into friendlier messages
  if (err.code === 'P2002') {
    return error(res, { statusCode: 400, message: 'Data sudah ada (duplikat)!', error: 'Bad Request' });
  }
  if (err.code === 'P2025') {
    return error(res, { statusCode: 404, message: 'Data tidak ditemukan!', error: 'Not Found' });
  }
  if (err.code === 'P2003') {
    return error(res, { statusCode: 400, message: 'Data masih direferensikan oleh data lain!', error: 'Bad Request' });
  }
  if (err.name === 'MulterError') {
    const friendly = MULTER_MESSAGES[err.code] || err.message;
    return error(res, { statusCode: 400, message: friendly, error: 'Bad Request' });
  }

  console.error('[Unhandled Error]', err);
  return error(res, { statusCode: 500, message: 'Terjadi kesalahan pada server!', error: 'Internal Server Error' });
};