// makerFlexibleAuth — accepts EITHER x-maker-key OR a Bearer maker
// token, matching the Contract's "Auth: Bearer Token App Maker /
// Header x-maker-key" line for GET /api/maker/stats.
const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/AppError');
const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async function makerFlexibleAuth(req, res, next) {
  const appKey = req.header('x-maker-key') || req.header('x-app-key');
  if (appKey) {
    const maker = await prisma.maker.findUnique({ where: { appKey } });
    if (!maker) throw new AppError(401, 'App Key tidak valid!', 'Unauthorized');
    req.maker = maker;
    req.makerId = maker.id;
    return next();
  }

  const header = req.header('authorization');
  if (header && header.startsWith('Bearer ')) {
    let payload;
    try {
      payload = verifyToken(header.slice(7));
    } catch {
      throw new AppError(401, 'Token tidak valid!', 'Unauthorized');
    }
    if (payload.type === 'maker') {
      const maker = await prisma.maker.findUnique({ where: { id: BigInt(payload.makerId) } });
      if (!maker) throw new AppError(401, 'Akun App Maker tidak ditemukan!', 'Unauthorized');
      req.maker = maker;
      req.makerId = maker.id;
      return next();
    }
  }

  throw new AppError(401, 'Autentikasi diperlukan (x-maker-key atau Bearer token)!', 'Unauthorized');
});
