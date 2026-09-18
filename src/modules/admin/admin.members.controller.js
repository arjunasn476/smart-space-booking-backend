// list, create, detail, update, remove — Member CRUD by Admin Space.
// All queries scoped by makerId (tenant isolation).
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const parseId = require('../../utils/parseId');
const { hashPassword } = require('../../utils/password');

function serializeMember(m, withCreatedAt = false) {
  const base = {
    id: m.id,
    nama_member: m.namaMember,
    instansi: m.instansi,
    alamat: m.alamat,
    telp: m.telp,
    foto: m.foto,
  };
  if (withCreatedAt) base.created_at = m.createdAt;
  return base;
}

const list = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { search } = req.query;

  const where = { makerId };
  if (search) {
    where.OR = [
      { namaMember: { contains: search, mode: 'insensitive' } },
      { instansi: { contains: search, mode: 'insensitive' } },
      { telp: { contains: search, mode: 'insensitive' } },
    ];
  }

  const members = await prisma.member.findMany({ where, orderBy: { id: 'asc' } });
  return success(res, { data: members.map((m) => serializeMember(m, true)) });
});

const create = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { username, password, nama_member, instansi, alamat, telp, foto } = req.validated;

  const existing = await prisma.user.findUnique({ where: { makerId_username: { makerId, username } } });
  if (existing) throw new AppError(400, 'Username sudah digunakan oleh akun lain!', 'Bad Request');

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      makerId,
      username,
      password: hashed,
      role: 'member',
      member: { create: { makerId, namaMember: nama_member, instansi, alamat, telp, foto: foto || null } },
    },
    include: { member: true },
  });

  return success(res, {
    statusCode: 201,
    message: 'Data member baru berhasil ditambahkan!',
    data: serializeMember(user.member),
  });
});

const detail = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const id = parseId(req.params.id, 'ID Member');
  const member = await prisma.member.findFirst({ where: { id, makerId } });
  if (!member) throw new AppError(404, 'Member dengan ID tersebut tidak ditemukan!', 'Not Found');
  return success(res, { data: serializeMember(member) });
});

const update = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const id = parseId(req.params.id, 'ID Member');
  const { nama_member, instansi, alamat, telp, password, foto } = req.validated;

  const existing = await prisma.member.findFirst({ where: { id, makerId } });
  if (!existing) throw new AppError(404, 'Member dengan ID tersebut tidak ditemukan!', 'Not Found');

  const data = {};
  if (nama_member !== undefined) data.namaMember = nama_member;
  if (instansi !== undefined) data.instansi = instansi;
  if (alamat !== undefined) data.alamat = alamat;
  if (telp !== undefined) data.telp = telp;
  if (foto !== undefined) data.foto = foto;

  const updated = await prisma.$transaction(async (tx) => {
    const m = Object.keys(data).length
      ? await tx.member.update({ where: { id }, data })
      : existing;
    // Password lives on `users`, not `member` — reset it there when asked.
    if (password) {
      await tx.user.update({ where: { id: existing.idUser }, data: { password: await hashPassword(password) } });
    }
    return m;
  });

  return success(res, { message: 'Data member berhasil diperbarui!', data: serializeMember(updated) });
});

const remove = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const id = parseId(req.params.id, 'ID Member');

  const member = await prisma.member.findFirst({ where: { id, makerId } });
  if (!member) throw new AppError(404, 'Member dengan ID tersebut tidak ditemukan!', 'Not Found');

  // reservasi.id_member is ON DELETE RESTRICT to protect booking
  // history, so refuse the delete explicitly with a clear message
  // instead of letting the FK throw a raw constraint error.
  const bookingCount = await prisma.reservasi.count({ where: { idMember: id } });
  if (bookingCount > 0) {
    throw new AppError(400, 'Member tidak dapat dihapus karena masih memiliki data reservasi!', 'Bad Request');
  }

  // Deleting the user cascades to its member profile (schema: member.id_user ON DELETE CASCADE).
  await prisma.user.delete({ where: { id: member.idUser } });

  return success(res, { message: 'Data member berhasil dihapus!', data: { id, deleted: true } });
});

module.exports = { list, create, detail, update, remove };
