// create, my, myHistory, detail, eTicket, cancel — Member booking flow.
// Matches Kontrak API §III "Reservasi Member (Pemesanan & Histori)".
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const parseId = require('../../utils/parseId');
const { addHoursToTime, isOverlap, formatTime, crossesMidnight } = require('../../utils/dateTime');
const {
  generateKodeBooking,
  generateETicketNumber,
  generateQrPayload,
  timeStringToDate,
  TIPE_LABELS,
} = require('../../utils/reservasiHelpers');

// Statuses that still occupy the room — a 'selesai' or 'dibatalkan'
// booking frees its slot up again.
const BLOCKING_STATUSES = ['belum_dikonfirm', 'disetujui', 'aktif'];

const create = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const member = req.user.member;
  if (!member) throw new AppError(403, 'Hanya member yang dapat membuat reservasi!', 'Forbidden');

  const { id_space, tanggal_reservasi, jam_mulai, durasi_jam, id_diskon, kode_promo } = req.validated;

  const space = await prisma.space.findFirst({ where: { id: BigInt(id_space), makerId } });
  if (!space) throw new AppError(404, 'Space dengan ID tersebut tidak ditemukan!', 'Not Found');

    if (crossesMidnight(jam_mulai, durasi_jam)) {
    throw new AppError(400, 'Reservasi tidak boleh melewati tengah malam (00:00)! Pilih jam_mulai atau durasi_jam yang lebih pendek.', 'Bad Request');
  }
  const jamSelesai = addHoursToTime(jam_mulai, durasi_jam);
  const tanggalDate = new Date(tanggal_reservasi);

  // Overlap check — a range comparison, so it must live here at the
  // application layer (no plain DB unique index can express it).
  const existing = await prisma.reservasi.findMany({
    where: { makerId, idSpace: space.id, tanggalReservasi: tanggalDate, status: { in: BLOCKING_STATUSES } },
  });
  const bentrok = existing.some((r) =>
    isOverlap(jam_mulai, jamSelesai, formatTime(r.jamMulai), formatTime(r.jamSelesai))
  );
  if (bentrok) {
    throw new AppError(400, 'Space tidak tersedia pada tanggal dan rentang jam tersebut!', 'Bad Request');
  }

  // Resolve the discount from either id_diskon or kode_promo (the DTO
  // allows both; id_diskon wins when both are supplied).
  let diskon = null;
  const now = new Date();
  if (id_diskon) {
    diskon = await prisma.diskon.findFirst({ where: { id: BigInt(id_diskon), makerId } });
    if (!diskon) throw new AppError(400, 'Diskon dengan ID tersebut tidak ditemukan!', 'Bad Request');
  } else if (kode_promo) {
    diskon = await prisma.diskon.findFirst({ where: { makerId, namaDiskon: kode_promo } });
    if (!diskon) throw new AppError(400, 'Kode promo tidak ditemukan atau sudah kedaluwarsa!', 'Bad Request');
  }
  if (diskon && (diskon.tanggalAwal > now || diskon.tanggalAkhir < now)) {
    throw new AppError(400, 'Kode promo tidak ditemukan atau sudah kedaluwarsa!', 'Bad Request');
  }

  // Price math — harga_per_jam is snapshotted so later price edits on
  // the space never rewrite this booking's historical total.
  const hargaPerJam = space.hargaPerJam;
  const totalHargaAwal = hargaPerJam * durasi_jam;
  const potonganDiskon = diskon ? Math.floor((totalHargaAwal * Number(diskon.persentaseDiskon)) / 100) : 0;
  const totalBayar = totalHargaAwal - potonganDiskon;

  // kode_booking embeds the row's own id, so it's filled in a second
  // step inside one transaction (create -> update) to stay consistent.
  const reservasi = await prisma.$transaction(async (tx) => {
    const created = await tx.reservasi.create({
      data: {
        makerId,
        kodeBooking: `TEMP-${Date.now()}`,
        idOwner: space.idOwner,
        idMember: member.id,
        idSpace: space.id,
        idDiskon: diskon ? diskon.id : null,
        tanggalReservasi: tanggalDate,
        jamMulai: timeStringToDate(jam_mulai),
        jamSelesai: timeStringToDate(jamSelesai),
        durasiJam: durasi_jam,
        hargaPerJam,
        totalHargaAwal,
        potonganDiskon,
        totalBayar,
        status: 'belum_dikonfirm',
      },
    });

    return tx.reservasi.update({
      where: { id: created.id },
      data: { kodeBooking: generateKodeBooking(tanggalDate, Number(created.id)) },
    });
  });

  return success(res, {
    statusCode: 201,
    message: 'Reservasi berhasil dibuat! Silakan tunggu konfirmasi admin.',
    data: {
      id: reservasi.id,
      kode_booking: reservasi.kodeBooking,
      id_member: reservasi.idMember,
      id_space: reservasi.idSpace,
      id_diskon: reservasi.idDiskon,
      tanggal_reservasi: tanggal_reservasi,
      jam_mulai,
      jam_selesai: jamSelesai,
      durasi_jam: reservasi.durasiJam,
      harga_per_jam: reservasi.hargaPerJam,
      total_harga_awal: reservasi.totalHargaAwal,
      potongan_diskon: reservasi.potonganDiskon,
      total_bayar: reservasi.totalBayar,
      status: reservasi.status,
      created_at: reservasi.createdAt,
    },
  });
});

const my = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const member = req.user.member;
  if (!member) throw new AppError(403, 'Hanya member yang memiliki data reservasi!', 'Forbidden');

  const rows = await prisma.reservasi.findMany({
    where: { makerId, idMember: member.id },
    include: { space: true },
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
      total_bayar: r.totalBayar,
      status: r.status,
      space: { id: r.space.id, nama_space: r.space.namaSpace, tipe: r.space.tipe },
    })),
  });
});

const myHistory = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const member = req.user.member;
  if (!member) throw new AppError(403, 'Hanya member yang memiliki histori reservasi!', 'Forbidden');

  const now = new Date();
  const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
  const year = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError(400, 'Parameter month harus antara 1-12!', 'Bad Request');
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const rows = await prisma.reservasi.findMany({
    where: { makerId, idMember: member.id, tanggalReservasi: { gte: start, lt: end } },
    include: { space: true },
    orderBy: { tanggalReservasi: 'desc' },
  });

  const totalPengeluaran = rows
    .filter((r) => r.status !== 'dibatalkan')
    .reduce((sum, r) => sum + r.totalBayar, 0);

  return success(res, {
    data: {
      month,
      year,
      total_reservasi: rows.length,
      total_pengeluaran: totalPengeluaran,
      items: rows.map((r) => ({
        id: r.id,
        kode_booking: r.kodeBooking,
        tanggal_reservasi: r.tanggalReservasi.toISOString().slice(0, 10),
        jam_mulai: formatTime(r.jamMulai),
        jam_selesai: formatTime(r.jamSelesai),
        durasi_jam: r.durasiJam,
        total_bayar: r.totalBayar,
        status: r.status,
        space_name: r.space.namaSpace,
      })),
    },
  });
});

// Shared ownership guard: a member may only touch their own bookings;
// an admin_space may touch any booking belonging to their location.
async function findReservasiForUser(req, id) {
  const makerId = req.makerId;
  const where = { id, makerId };

  if (req.user.role === 'member') {
    if (!req.user.member) throw new AppError(403, 'Akses ditolak!', 'Forbidden');
    where.idMember = req.user.member.id;
  } else if (req.user.role === 'admin_space') {
    if (!req.user.spaceOwner) throw new AppError(403, 'Akses ditolak!', 'Forbidden');
    where.idOwner = req.user.spaceOwner.id;
  }

  const reservasi = await prisma.reservasi.findFirst({
    where,
    include: { space: true, member: true, diskon: true, owner: true },
  });
  if (!reservasi) throw new AppError(404, 'Reservasi dengan ID tersebut tidak ditemukan!', 'Not Found');
  return reservasi;
}

const detail = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Reservasi');
  const r = await findReservasiForUser(req, id);

  return success(res, {
    data: {
      id: r.id,
      kode_booking: r.kodeBooking,
      id_member: r.idMember,
      id_space: r.idSpace,
      tanggal_reservasi: r.tanggalReservasi.toISOString().slice(0, 10),
      jam_mulai: formatTime(r.jamMulai),
      jam_selesai: formatTime(r.jamSelesai),
      durasi_jam: r.durasiJam,
      total_bayar: r.totalBayar,
      status: r.status,
      member: { nama_member: r.member.namaMember, telp: r.member.telp },
      space: { nama_space: r.space.namaSpace, harga_per_jam: r.space.hargaPerJam },
    },
  });
});

const eTicket = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'ID Reservasi');
  const r = await findReservasiForUser(req, id);

  const diskonLabel = r.diskon
    ? `${Number(r.diskon.persentaseDiskon)}% (${r.diskon.namaDiskon})`
    : null;

  return success(res, {
    message: 'E-Ticket berhasil dimuat',
    data: {
      e_ticket_number: generateETicketNumber(r.owner.namaCoworking, r.tanggalReservasi, Number(r.id)),
      kode_booking: r.kodeBooking,
      coworking_space: { nama: r.owner.namaCoworking, telepon: r.owner.telp },
      member: { nama: r.member.namaMember, instansi: r.member.instansi, telp: r.member.telp },
      space: {
        nama: r.space.namaSpace,
        tipe: TIPE_LABELS[r.space.tipe] || r.space.tipe,
        harga_per_jam: r.space.hargaPerJam,
      },
      jadwal: {
        tanggal: r.tanggalReservasi.toISOString().slice(0, 10),
        jam_mulai: formatTime(r.jamMulai),
        jam_selesai: formatTime(r.jamSelesai),
        durasi: `${r.durasiJam} Jam`,
      },
      rincian_pembayaran: {
        tarif_kotor: r.totalHargaAwal,
        diskon_promo: diskonLabel,
        potongan: r.potonganDiskon,
        total_dibayar: r.totalBayar,
      },
      status_reservasi: r.status,
      qr_code_payload: generateQrPayload(Number(r.id), req.maker ? req.maker.appKey : ''),
    },
  });
});

const cancel = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const member = req.user.member;
  if (!member) throw new AppError(403, 'Hanya member yang dapat membatalkan reservasi!', 'Forbidden');

  const id = parseId(req.params.id, 'ID Reservasi');
  const existing = await prisma.reservasi.findFirst({ where: { id, makerId, idMember: member.id } });
  if (!existing) throw new AppError(404, 'Reservasi dengan ID tersebut tidak ditemukan!', 'Not Found');

  if (existing.status === 'dibatalkan') {
    throw new AppError(400, 'Reservasi ini sudah dibatalkan sebelumnya!', 'Bad Request');
  }
  if (['aktif', 'selesai'].includes(existing.status)) {
    throw new AppError(400, 'Reservasi yang sudah check-in atau selesai tidak dapat dibatalkan!', 'Bad Request');
  }

  const updated = await prisma.reservasi.update({ where: { id }, data: { status: 'dibatalkan' } });

  return success(res, {
    message: 'Reservasi berhasil dibatalkan oleh pengguna',
    data: { id: updated.id, status: updated.status, updated_at: updated.updatedAt },
  });
});

module.exports = { create, my, myHistory, detail, eTicket, cancel, findReservasiForUser, BLOCKING_STATUSES };
