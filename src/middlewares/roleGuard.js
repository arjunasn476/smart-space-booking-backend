// requireRole(...roles) — 403s if req.user.role isn't in the allowed
// list. Must run AFTER requireAuth (needs req.user already set).
const { AppError } = require('../utils/AppError');

module.exports = function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'Anda tidak memiliki akses ke resource ini!', 'Forbidden');
    }
    next();
  };
};
