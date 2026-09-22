// list, updateStatus, checkIn, checkOut — Reservation management by Admin.
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const parseId = require('../../utils/parseId');
const { formatTime } = require('../../utils/dateTime');

const list = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { month, year, status, id_space, tanggal } = req.query;

  const where = { makerId, idOwner: req.user.spaceOwner.id };

  if (status) {
    const allowed = ['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'];
    if (!allowed.includes(status)) {
      throw new AppError(400, `Status filter tidak valid! Pilihan: ${allowed.join(', ')}`, 'Bad Request');
    }
    where.status = status;
  }

  if (id_space) where.idSpace = parseId(id_space, 'id_space');

  // A specific date wins over month/year when both are supplied.
  // month/year are independent filters here (unlike myHistory/reports,
  // which always represent exactly one month) — each combination below
  // is handled explicitly instead of silently defaulting the missing
  // one to "now", which used to make "?year=2026" alone secretly only
  // return the current month instead of the whole year.
  if (tanggal) {
    where.tanggalReservasi = new Date(tanggal);
  } else if (month && year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      throw new AppError(400, 'Parameter month harus antara 1-12!', 'Bad Request');
    }
    where.tanggalReservasi = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
  } else if (month && !year) {
    const m = parseInt(month, 10);
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      throw new AppError(400, 'Parameter month harus antara 1-12!', 'Bad Request');
    }
    const y = new Date().getUTCFullYear();
    where.tanggalReservasi = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
  } else if (year && !month) {
    const y = parseInt(year, 10);
    where.tanggalReservasi = { gte: new Date(Date.UTC(y, 0, 1)), lt: new Date(Date.UTC(y + 1, 0, 1)) };
  }

  const rows = await prisma.reservasi.findMany({
    where,
    include: { member: true, space: true },
    orderBy: { id: 'desc' },
  });

  return success(res, {
    data: rows.map((r) => ({
      id: r.id,
      kode_booking: r.kodeBooking,
      tanggal_reservasi: r.tanggalReservasi.toISOString().slice(0, 10),
      jam_mulai: formatTime(r.jamMulai),
      jam_selesai: formatTime(r.jamSelesai),
      durasi_jam: r.durasiJam,
      total_harga_awal: r.totalHargaAwal,
      potongan_diskon: r.potonganDiskon,
      total_bayar: r.totalBayar,
      status: r.status,
      member: { id: r.member.id, nama_member: r.member.namaMember, telp: r.member.telp },
      space: { id: r.space.id, nama_space: r.space.namaSpace, tipe: r.space.tipe },
    })),
  });
});

// Loads a reservation that belongs to this admin's location, or 404s.
async function findOwnedReservasi(req, id) {
  const r = await prisma.reservasi.findFirst({
    where: { id, makerId: req.makerId, idOwner: req.user.spaceOwner.id },
  });
  if (!r) throw new AppError(404, 'Reservasi dengan ID tersebut tidak ditemukan!', 'Not Found');
  return r;
}

const updateStatus = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Reservasi');
  const { status } = req.validated;

  const existing = await findOwnedReservasi(req, id);
  if (existing.status === status) {
    throw new AppError(400, `Status reservasi sudah bernilai '${status}'!`, 'Bad Request');
  }

  const updated = await prisma.reservasi.update({ where: { id }, data: { status } });

  return success(res, {
    message: `Status reservasi berhasil diperbarui menjadi ${status}`,
    data: { id: updated.id, status: updated.status, updated_at: updated.updatedAt },
  });
});

const checkIn = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Reservasi');
  const existing = await findOwnedReservasi(req, id);

  // Status transition guard: only an approved booking can be checked in.
  if (existing.status !== 'disetujui') {
    throw new AppError(400, "Check-in hanya dapat dilakukan pada reservasi berstatus 'disetujui'!", 'Bad Request');
  }

  const now = new Date();
  const updated = await prisma.reservasi.update({
    where: { id },
    data: { status: 'aktif', checkInTime: now },
  });

  return success(res, {
    message: 'Check-in member berhasil! Status reservasi aktif.',
    data: { id: updated.id, status: updated.status, check_in_time: updated.checkInTime },
  });
});

const checkOut = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Reservasi');
  const existing = await findOwnedReservasi(req, id);

  // Only an active (checked-in) booking can be checked out.
  if (existing.status !== 'aktif') {
    throw new AppError(400, "Check-out hanya dapat dilakukan pada reservasi berstatus 'aktif'!", 'Bad Request');
  }

  const now = new Date();
  const updated = await prisma.reservasi.update({
    where: { id },
    data: { status: 'selesai', checkOutTime: now },
  });

  return success(res, {
    message: 'Check-out member berhasil! Reservasi telah selesai.',
    data: { id: updated.id, status: updated.status, check_out_time: updated.checkOutTime },
  });
});

module.exports = { list, updateStatus, checkIn, checkOut };