// register, login, me, stats, list — App Maker (multi-tenancy) endpoints.
// Matches Kontrak API §III "Multi-Tenancy Siswa (App Maker)" section
// response shapes exactly.
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const generateAppKey = require('../../utils/generateAppKey');

const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.validated;

  const existing = await prisma.maker.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    throw new AppError(400, 'Username atau Email sudah terdaftar sebagai App Maker!', 'Bad Request');
  }

  const hashed = await hashPassword(password);

  let appKey = generateAppKey();
  // Collision odds are astronomically low with 32 hex chars, but guard anyway.
  while (await prisma.maker.findUnique({ where: { appKey } })) {
    appKey = generateAppKey();
  }

  const maker = await prisma.maker.create({
    data: { name, username, email, password: hashed, appKey },
  });

  const accessToken = signToken({ type: 'maker', makerId: maker.id.toString() });

  return success(res, {
    statusCode: 201,
    message: 'Registrasi App Maker berhasil! Simpan app_key Anda dengan baik.',
    data: {
      id: maker.id,
      name: maker.name,
      username: maker.username,
      email: maker.email,
      app_key: maker.appKey,
      created_at: maker.createdAt,
      updated_at: maker.updatedAt,
      access_token: accessToken,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.validated;

  const maker = await prisma.maker.findFirst({
    where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
  });

  if (!maker || !(await comparePassword(password, maker.password))) {
    throw new AppError(401, 'Kredensial login App Maker salah!', 'Unauthorized');
  }

  const accessToken = signToken({ type: 'maker', makerId: maker.id.toString() });

  return success(res, {
    message: 'Login App Maker berhasil!',
    data: {
      id: maker.id,
      name: maker.name,
      username: maker.username,
      email: maker.email,
      app_key: maker.appKey,
      access_token: accessToken,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  const maker = req.maker;
  return success(res, {
    data: {
      id: maker.id,
      name: maker.name,
      username: maker.username,
      email: maker.email,
      app_key: maker.appKey,
      created_at: maker.createdAt,
    },
  });
});

const stats = asyncHandler(async (req, res) => {
  const makerId = req.makerId;

  const [total_members, total_spaces, total_diskon, total_reservasi, pendapatanAgg] = await Promise.all([
    prisma.member.count({ where: { makerId } }),
    prisma.space.count({ where: { makerId } }),
    prisma.diskon.count({ where: { makerId } }),
    prisma.reservasi.count({ where: { makerId } }),
    prisma.reservasi.aggregate({
      where: { makerId, status: { in: ['aktif', 'selesai'] } },
      _sum: { totalBayar: true },
    }),
  ]);

  return success(res, {
    data: {
      total_members,
      total_spaces,
      total_diskon,
      total_reservasi,
      total_pendapatan: pendapatanAgg._sum.totalBayar || 0,
    },
  });
});

const list = asyncHandler(async (req, res) => {
  const makers = await prisma.maker.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true, username: true, email: true, appKey: true, createdAt: true },
  });

  return success(res, {
    data: makers.map((m) => ({
      id: m.id,
      name: m.name,
      username: m.username,
      email: m.email,
      app_key: m.appKey,
      created_at: m.createdAt,
    })),
  });
});

module.exports = { register, login, me, stats, list };
