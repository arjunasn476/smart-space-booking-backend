// Baku response formatter — every endpoint in this API MUST respond
// through success()/error() so the JSON shape matches Ketentuan Global
// §III.3 exactly (status/statusCode/message/data/timestamp).

function success(res, { statusCode = 200, message = 'Berhasil memproses permintaan', data = null } = {}) {
  return res.status(statusCode).json({
    status: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function error(res, { statusCode = 400, message = 'Terjadi kesalahan', error: errorName = 'Bad Request' } = {}) {
  return res.status(statusCode).json({
    status: false,
    statusCode,
    message,
    error: errorName,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { success, error };
