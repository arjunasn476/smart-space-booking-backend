// Generic request-body validator middleware, given a Zod schema.
// On failure, forwards AppError(400) with the first validation
// message — keeps every DTO's "Wajib"/format rule enforced in one
// place instead of scattered `if` checks inside each controller.
const { AppError } = require('../utils/AppError');

module.exports = function validate(schema) {
  return function (req, res, next) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const fieldPath = firstIssue?.path?.join('.');
      const message = fieldPath
        ? `${fieldPath}: ${firstIssue.message}`
        : firstIssue?.message || 'Data yang dikirim tidak valid!';
      return next(new AppError(400, message, 'Bad Request'));
    }
    req.validated = result.data;
    next();
  };
};
