// Wraps an async Express route/middleware handler so that any rejected
// promise (an error thrown inside `await`) is forwarded to next(err) —
// without this, unhandled async errors crash the process instead of
// reaching errorHandler.
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
