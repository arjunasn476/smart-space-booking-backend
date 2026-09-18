// Custom error class for expected/handled errors (validation failures,
// "not found", "unauthorized", etc). Anything NOT an AppError that
// reaches errorHandler is treated as an unexpected 500.
class AppError extends Error {
  constructor(statusCode, message, errorName) {
    super(message);
    this.statusCode = statusCode;
    this.errorName = errorName || defaultErrorName(statusCode);
    this.isOperational = true;
  }
}

function defaultErrorName(statusCode) {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    default:
      return 'Internal Server Error';
  }
}

module.exports = { AppError };
