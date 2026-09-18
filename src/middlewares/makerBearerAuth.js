// requireMakerBearer — strict Bearer-token auth for GET /api/maker/me,
// which the Contract specifies as "Bearer Token App Maker" only (no
// x-maker-key alternative, unlike /api/maker/stats).
const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/AppError');
const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async function requireMakerBearer(req, res, next) {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Token App Maker tidak ditemukan!', 'Unauthorized');
  }

  let payload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    throw new AppError(401, 'Token tidak valid atau kedaluwarsa!', 'Unauthorized');
  }

  if (payload.type !== 'maker') {
    throw new AppError(401, 'Token bukan token App Maker!', 'Unauthorized');
  }

  const maker = await prisma.maker.findUnique({ where: { id: BigInt(payload.makerId) } });
  if (!maker) {
    throw new AppError(401, 'Akun App Maker tidak ditemukan!', 'Unauthorized');
  }

  req.maker = maker;
  req.makerId = maker.id;
  next();
});
