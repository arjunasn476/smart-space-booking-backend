// Catch-all handler for any request that didn't match a defined route.
// Must be registered AFTER all real routes in app.js, BEFORE errorHandler.
const { error } = require('../utils/response');

module.exports = function notFound(req, res) {
  return error(res, {
    statusCode: 404,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan!`,
    error: 'Not Found',
  });
};
