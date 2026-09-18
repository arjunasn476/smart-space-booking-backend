// list, create, detail, update, remove — Diskon/Promo CRUD by Admin.
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const parseId = require('../../utils/parseId');
const { serializeDiskon } = require('../diskon/diskon.controller');

const list = asyncHandler(async (req, res) => {
  const diskons = await prisma.diskon.findMany({ where: { makerId: req.makerId }, orderBy: { id: 'asc' } });
  return success(res, { data: diskons.map(serializeDiskon) });
});

const create = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { nama_diskon, persentase_diskon, tanggal_awal, tanggal_akhir } = req.validated;

  const existing = await prisma.diskon.findFirst({ where: { makerId, namaDiskon: nama_diskon } });
  if (existing) throw new AppError(400, 'Kode promo dengan nama tersebut sudah ada!', 'Bad Request');

  const awal = new Date(tanggal_awal);
  const akhir = new Date(tanggal_akhir);
  if (Number.isNaN(awal.getTime()) || Number.isNaN(akhir.getTime())) {
    throw new AppError(400, 'Format tanggal tidak valid! Gunakan format ISO 8601.', 'Bad Request');
  }
  if (akhir < awal) {
    throw new AppError(400, 'Tanggal akhir tidak boleh lebih awal dari tanggal awal!', 'Bad Request');
  }

  const diskon = await prisma.diskon.create({
    data: { makerId, namaDiskon: nama_diskon, persentaseDiskon: persentase_diskon, tanggalAwal: awal, tanggalAkhir: akhir },
  });

  return success(res, {
    statusCode: 201,
    message: 'Kode promo baru berhasil dibuat!',
    data: serializeDiskon(diskon),
  });
});

const detail = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Diskon');
  const diskon = await prisma.diskon.findFirst({ where: { id, makerId: req.makerId } });
  if (!diskon) throw new AppError(404, 'Diskon dengan ID tersebut tidak ditemukan!', 'Not Found');
  return success(res, { data: serializeDiskon(diskon) });
});

const update = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const id = parseId(req.params.id, 'ID Diskon');
  const { nama_diskon, persentase_diskon, tanggal_awal, tanggal_akhir } = req.validated;

  const existing = await prisma.diskon.findFirst({ where: { id, makerId } });
  if (!existing) throw new AppError(404, 'Diskon dengan ID tersebut tidak ditemukan!', 'Not Found');

  if (nama_diskon && nama_diskon !== existing.namaDiskon) {
    const dup = await prisma.diskon.findFirst({ where: { makerId, namaDiskon: nama_diskon } });
    if (dup) throw new AppError(400, 'Kode promo dengan nama tersebut sudah ada!', 'Bad Request');
  }

  const data = {};
  if (nama_diskon !== undefined) data.namaDiskon = nama_diskon;
  if (persentase_diskon !== undefined) data.persentaseDiskon = persentase_diskon;
  if (tanggal_awal !== undefined) data.tanggalAwal = new Date(tanggal_awal);
  if (tanggal_akhir !== undefined) data.tanggalAkhir = new Date(tanggal_akhir);

  const updated = await prisma.diskon.update({ where: { id }, data });
  return success(res, { message: 'Data promo diskon berhasil diperbarui!', data: serializeDiskon(updated) });
});

const remove = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Diskon');
  const existing = await prisma.diskon.findFirst({ where: { id, makerId: req.makerId } });
  if (!existing) throw new AppError(404, 'Diskon dengan ID tersebut tidak ditemukan!', 'Not Found');

  // reservasi.id_diskon is ON DELETE SET NULL, so past bookings keep
  // their snapshotted totals — safe to delete without extra guards.
  await prisma.diskon.delete({ where: { id } });
  return success(res, { message: 'Kode promo berhasil dihapus!', data: { id, deleted: true } });
});

module.exports = { list, create, detail, update, remove };
