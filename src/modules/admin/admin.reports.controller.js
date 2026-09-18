// monthly, income — revenue recap reports (Panel Admin).
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { TIPE_LABELS } = require('../../utils/reservasiHelpers');

// Cancelled bookings never count toward revenue or usage stats.
const COUNTED_STATUSES = ['belum_dikonfirm', 'disetujui', 'aktif', 'selesai'];

// Resolves ?month/?year (defaulting to the current month) into a date
// range, shared by both report endpoints.
function resolvePeriod(req) {
  const now = new Date();
  const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
  const year = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError(400, 'Parameter month harus antara 1-12!', 'Bad Request');
  }
  if (!Number.isInteger(year)) {
    throw new AppError(400, 'Parameter year tidak valid!', 'Bad Request');
  }

  return {
    month,
    year,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

async function fetchRows(req, period) {
  return prisma.reservasi.findMany({
    where: {
      makerId: req.makerId,
      idOwner: req.user.spaceOwner.id,
      status: { in: COUNTED_STATUSES },
      tanggalReservasi: { gte: period.start, lt: period.end },
    },
    include: { space: true },
  });
}

const monthly = asyncHandler(async (req, res) => {
  const period = resolvePeriod(req);
  const rows = await fetchRows(req, period);

  const estimasiKotor = rows.reduce((s, r) => s + r.totalHargaAwal, 0);
  const totalPotongan = rows.reduce((s, r) => s + r.potonganDiskon, 0);
  const realisasiBersih = rows.reduce((s, r) => s + r.totalBayar, 0);
  const totalJam = rows.reduce((s, r) => s + r.durasiJam, 0);

  // Always emit all three space types, even with zero bookings, so the
  // frontend chart has a stable shape to render.
  const rincian = Object.keys(TIPE_LABELS).map((tipe) => {
    const subset = rows.filter((r) => r.space.tipe === tipe);
    return {
      tipe,
      label: TIPE_LABELS[tipe],
      total_booking: subset.length,
      total_jam: subset.reduce((s, r) => s + r.durasiJam, 0),
      total_pendapatan: subset.reduce((s, r) => s + r.totalBayar, 0),
    };
  });

  return success(res, {
    data: {
      month: period.month,
      year: period.year,
      total_transaksi: rows.length,
      total_jam_terpakai: totalJam,
      estimasi_pendapatan_kotor: estimasiKotor,
      total_potongan_diskon: totalPotongan,
      realisasi_pendapatan_bersih: realisasiBersih,
      rincian_per_tipe_space: rincian,
    },
  });
});

const income = asyncHandler(async (req, res) => {
  const period = resolvePeriod(req);
  const rows = await fetchRows(req, period);

  return success(res, {
    data: {
      month: period.month,
      year: period.year,
      realisasi_pendapatan_bersih: rows.reduce((s, r) => s + r.totalBayar, 0),
    },
  });
});

module.exports = { monthly, income };
