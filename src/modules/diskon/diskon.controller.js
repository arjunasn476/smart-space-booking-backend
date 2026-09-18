// active, check, detail — public/user promo catalog.
// Matches Kontrak API §III "Diskon & Promo (Katalog Diskon)".
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const parseId = require('../../utils/parseId');

function serializeDiskon(d) {
  return {
    id: d.id,
    nama_diskon: d.namaDiskon,
    persentase_diskon: Number(d.persentaseDiskon),
    tanggal_awal: d.tanggalAwal,
    tanggal_akhir: d.tanggalAkhir,
  };
}

const active = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const now = new Date();
  const diskons = await prisma.diskon.findMany({
    where: { makerId, tanggalAwal: { lte: now }, tanggalAkhir: { gte: now } },
    orderBy: { id: 'asc' },
  });
  return success(res, { data: diskons.map(serializeDiskon) });
});

const check = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { nama_diskon } = req.validated;
  const now = new Date();

  const diskon = await prisma.diskon.findFirst({ where: { makerId, namaDiskon: nama_diskon } });
  const isActive = diskon && diskon.tanggalAwal <= now && diskon.tanggalAkhir >= now;

  if (!diskon || !isActive) {
    throw new AppError(400, 'Kode promo tidak ditemukan atau sudah kedaluwarsa!', 'Bad Request');
  }

  return success(res, {
    message: 'Kode promo valid dan masih berlaku!',
    data: { ...serializeDiskon(diskon), is_active: true },
  });
});

const detail = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const id = parseId(req.params.id, 'ID Diskon');
  const diskon = await prisma.diskon.findFirst({ where: { id, makerId } });
  if (!diskon) throw new AppError(404, 'Diskon dengan ID tersebut tidak ditemukan!', 'Not Found');
  return success(res, { data: serializeDiskon(diskon) });
});

module.exports = { active, check, detail, serializeDiskon };
