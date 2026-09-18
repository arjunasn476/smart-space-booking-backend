// registerMember, registerAdminSpace, login, profile — user auth
// endpoints, all scoped by req.makerId (set by resolveMaker upstream).
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');

const registerMember = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { username, password, nama_member, instansi, alamat, telp, foto } = req.validated;

  const existingUser = await prisma.user.findUnique({
    where: { makerId_username: { makerId, username } },
  });
  if (existingUser) {
    throw new AppError(400, 'Username sudah digunakan oleh akun lain!', 'Bad Request');
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      makerId,
      username,
      password: hashed,
      role: 'member',
      member: {
        create: { makerId, namaMember: nama_member, instansi, alamat, telp, foto: foto || null },
      },
    },
    include: { member: true },
  });

  const accessToken = signToken({ type: 'user', userId: user.id.toString(), makerId: makerId.toString(), role: user.role });

  return success(res, {
    statusCode: 201,
    message: 'Registrasi member berhasil!',
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      member: {
        id: user.member.id,
        nama_member: user.member.namaMember,
        instansi: user.member.instansi,
        alamat: user.member.alamat,
        telp: user.member.telp,
        foto: user.member.foto,
      },
      access_token: accessToken,
    },
  });
});

const registerAdminSpace = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { username, password, nama_coworking, nama_pemilik, telp } = req.validated;

  const existingUser = await prisma.user.findUnique({
    where: { makerId_username: { makerId, username } },
  });
  if (existingUser) {
    throw new AppError(400, 'Username sudah digunakan oleh akun lain!', 'Bad Request');
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      makerId,
      username,
      password: hashed,
      role: 'admin_space',
      spaceOwner: {
        create: { makerId, namaCoworking: nama_coworking, namaPemilik: nama_pemilik, telp },
      },
    },
    include: { spaceOwner: true },
  });

  const accessToken = signToken({ type: 'user', userId: user.id.toString(), makerId: makerId.toString(), role: user.role });

  return success(res, {
    statusCode: 201,
    message: 'Registrasi Admin Space berhasil!',
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      space_owner: {
        id: user.spaceOwner.id,
        nama_coworking: user.spaceOwner.namaCoworking,
        nama_pemilik: user.spaceOwner.namaPemilik,
        telp: user.spaceOwner.telp,
      },
      access_token: accessToken,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { username, password } = req.validated;

  const user = await prisma.user.findUnique({
    where: { makerId_username: { makerId, username } },
    include: { member: true, spaceOwner: true },
  });

  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError(401, 'Username atau Password salah!', 'Unauthorized');
  }

  const accessToken = signToken({ type: 'user', userId: user.id.toString(), makerId: makerId.toString(), role: user.role });

  return success(res, {
    message: 'Login berhasil!',
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      maker_id: makerId,
      member: user.member
        ? {
            id: user.member.id,
            nama_member: user.member.namaMember,
            instansi: user.member.instansi,
            alamat: user.member.alamat,
            telp: user.member.telp,
            foto: user.member.foto,
          }
        : null,
      space_owner: user.spaceOwner
        ? {
            id: user.spaceOwner.id,
            nama_coworking: user.spaceOwner.namaCoworking,
            nama_pemilik: user.spaceOwner.namaPemilik,
            telp: user.spaceOwner.telp,
          }
        : null,
      access_token: accessToken,
    },
  });
});

const profile = asyncHandler(async (req, res) => {
  const user = req.user;
  return success(res, {
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      member: user.member
        ? {
            id: user.member.id,
            nama_member: user.member.namaMember,
            instansi: user.member.instansi,
            alamat: user.member.alamat,
            telp: user.member.telp,
            foto: user.member.foto,
          }
        : undefined,
      space_owner: user.spaceOwner
        ? {
            id: user.spaceOwner.id,
            nama_coworking: user.spaceOwner.namaCoworking,
            nama_pemilik: user.spaceOwner.namaPemilik,
            telp: user.spaceOwner.telp,
          }
        : undefined,
    },
  });
});

module.exports = { registerMember, registerAdminSpace, login, profile };
