// list, create, detail, update, remove — Space CRUD by Admin Space.
// Scoped by BOTH makerId (tenant) and idOwner (this admin's location).
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const parseId = require('../../utils/parseId');
const { buildFotoUrl } = require('../../utils/fotoUrl');

function serializeSpace(s, req, opts = {}) {
  const base = {
    id: s.id,
    nama_space: s.namaSpace,
    harga_per_jam: s.hargaPerJam,
    tipe: s.tipe,
    kapasitas: s.kapasitas,
    foto: s.foto,
  };
  if (opts.withDeskripsi) base.deskripsi = s.deskripsi;
  if (opts.withOwner) base.id_owner = s.idOwner;
  if (opts.withFotoUrl) base.foto_url = buildFotoUrl(req, 'spaces', s.foto);
  return base;
}

const list = asyncHandler(async (req, res) => {
  const spaces = await prisma.space.findMany({
    where: { makerId: req.makerId, idOwner: req.user.spaceOwner.id },
    orderBy: { id: 'asc' },
  });
  return success(res, { data: spaces.map((s) => serializeSpace(s, req, { withFotoUrl: true })) });
});

const create = asyncHandler(async (req, res) => {
  const { nama_space, harga_per_jam, tipe, kapasitas, deskripsi, foto } = req.validated;

  const space = await prisma.space.create({
    data: {
      makerId: req.makerId,
      idOwner: req.user.spaceOwner.id,
      namaSpace: nama_space,
      hargaPerJam: harga_per_jam,
      tipe,
      kapasitas,
      deskripsi,
      foto: foto || null,
    },
  });

  return success(res, {
    statusCode: 201,
    message: 'Space baru berhasil ditambahkan!',
    data: serializeSpace(space, req, { withDeskripsi: true, withOwner: true }),
  });
});

const detail = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Space');
  const space = await prisma.space.findFirst({
    where: { id, makerId: req.makerId, idOwner: req.user.spaceOwner.id },
  });
  if (!space) throw new AppError(404, 'Space dengan ID tersebut tidak ditemukan!', 'Not Found');
  return success(res, { data: serializeSpace(space, req, { withDeskripsi: true }) });
});

const update = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Space');
  const { nama_space, harga_per_jam, tipe, kapasitas, deskripsi, foto } = req.validated;

  const existing = await prisma.space.findFirst({
    where: { id, makerId: req.makerId, idOwner: req.user.spaceOwner.id },
  });
  if (!existing) throw new AppError(404, 'Space dengan ID tersebut tidak ditemukan!', 'Not Found');

  const data = {};
  if (nama_space !== undefined) data.namaSpace = nama_space;
  if (harga_per_jam !== undefined) data.hargaPerJam = harga_per_jam;
  if (tipe !== undefined) data.tipe = tipe;
  if (kapasitas !== undefined) data.kapasitas = kapasitas;
  if (deskripsi !== undefined) data.deskripsi = deskripsi;
  if (foto !== undefined) data.foto = foto;

  const updated = await prisma.space.update({ where: { id }, data });

  return success(res, {
    message: 'Data space berhasil diperbarui!',
    data: serializeSpace(updated, req, { withDeskripsi: true }),
  });
});

const remove = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Space');

  const existing = await prisma.space.findFirst({
    where: { id, makerId: req.makerId, idOwner: req.user.spaceOwner.id },
  });
  if (!existing) throw new AppError(404, 'Space dengan ID tersebut tidak ditemukan!', 'Not Found');

  // reservasi.id_space is ON DELETE RESTRICT — refuse clearly rather
  // than surfacing a raw FK violation.
  const bookingCount = await prisma.reservasi.count({ where: { idSpace: id } });
  if (bookingCount > 0) {
    throw new AppError(400, 'Space tidak dapat dihapus karena masih memiliki data reservasi!', 'Bad Request');
  }

  await prisma.space.delete({ where: { id } });
  return success(res, { message: 'Space berhasil dihapus!', data: { id, deleted: true } });
});

module.exports = { list, create, detail, update, remove };
