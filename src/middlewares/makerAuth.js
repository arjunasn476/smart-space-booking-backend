// resolveMaker — resolves the x-maker-key/x-app-key header (Ketentuan
// Global §III.1, mandatory multi-tenancy mechanism), attaches
// req.maker/req.makerId. Used on almost every route except root/health
// and the maker register/login/list endpoints themselves.
const prisma = require('../lib/prisma');
const { AppError } = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async function resolveMaker(req, res, next) {
  const appKey = req.header('x-maker-key') || req.header('x-app-key');
  if (!appKey) {
    throw new AppError(401, 'Header x-maker-key wajib disertakan!', 'Unauthorized');
  }

  const maker = await prisma.maker.findUnique({ where: { appKey } });
  if (!maker) {
    throw new AppError(401, 'App Key tidak valid atau tidak ditemukan!', 'Unauthorized');
  }

  req.maker = maker;
  req.makerId = maker.id;
  next();
});
