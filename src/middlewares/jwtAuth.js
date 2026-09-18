// requireAuth — verifies Authorization Bearer USER token (member or
// admin_space), attaches req.user (with .member / .spaceOwner
// relations loaded). Also cross-checks the token's makerId against
// req.makerId (set earlier by resolveMaker) so a token minted under
// one App Key can never be replayed against another tenant's data.
const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/AppError');
const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async function requireAuth(req, res, next) {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Token akses tidak ditemukan!', 'Unauthorized');
  }

  let payload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    throw new AppError(401, 'Token tidak valid atau kedaluwarsa!', 'Unauthorized');
  }

  if (payload.type !== 'user') {
    throw new AppError(401, 'Token tidak valid untuk resource ini!', 'Unauthorized');
  }

  if (req.makerId && String(req.makerId) !== String(payload.makerId)) {
    throw new AppError(401, 'Token tidak sesuai dengan App Key yang digunakan!', 'Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(payload.userId) },
    include: { member: true, spaceOwner: true },
  });
  if (!user) throw new AppError(401, 'Akun pengguna tidak ditemukan!', 'Unauthorized');

  req.user = user;
  req.makerId = user.makerId;
  next();
});
