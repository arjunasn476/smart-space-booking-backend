// types, availability, list, detail — public/user space catalog.
// Matches Kontrak API §III "Space Coworking (Katalog & Ketersediaan)".
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const parseId = require('../../utils/parseId');
const { addHoursToTime, isOverlap, formatTime, crossesMidnight } = require('../../utils/dateTime');
const { buildFotoUrl } = require('../../utils/fotoUrl');

const SPACE_TYPES = [
  { tipe: 'desk', label: 'Personal Desk', deskripsi: 'Meja kerja individual yang nyaman dengan fasilitas colokan listrik, WiFi kencang, dan air minum.' },
  { tipe: 'meeting_room', label: 'Meeting Room', deskripsi: 'Ruang rapat tertutup dengan fasilitas proyektor/TV LED, whiteboard, sound system, dan AC dingin.' },
  { tipe: 'private_office', label: 'Private Office', deskripsi: 'Ruang kantor privat eksklusif untuk tim kecil hingga menengah dengan akses fleksibel dan keamanan 24 jam.' },
];

const types = asyncHandler(async (req, res) => success(res, { data: SPACE_TYPES }));

const availability = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { id_space, tanggal, jam_mulai, durasi_jam } = req.query;

  if (!id_space || !tanggal || !jam_mulai || !durasi_jam) {
    throw new AppError(400, 'Parameter id_space, tanggal, jam_mulai, dan durasi_jam wajib diisi!', 'Bad Request');
  }

  const spaceId = parseId(id_space, 'id_space');
  const space = await prisma.space.findFirst({ where: { id: spaceId, makerId } });
  if (!space) throw new AppError(404, 'Space dengan ID tersebut tidak ditemukan!', 'Not Found');

    const durasi = parseInt(durasi_jam, 10);
  if (!Number.isInteger(durasi) || durasi < 1) {
    throw new AppError(400, 'durasi_jam harus berupa bilangan bulat minimal 1!', 'Bad Request');
  }
  if (crossesMidnight(jam_mulai, durasi)) {
    throw new AppError(400, 'Reservasi tidak boleh melewati tengah malam (00:00)! Pilih jam_mulai atau durasi_jam yang lebih pendek.', 'Bad Request');
  }
  const jamSelesai = addHoursToTime(jam_mulai, durasi);

  const existing = await prisma.reservasi.findMany({
    where: {
      makerId,
      idSpace: spaceId,
      tanggalReservasi: new Date(tanggal),
      status: { in: ['belum_dikonfirm', 'disetujui', 'aktif'] },
    },
  });

  const bentrok = existing.some((r) => isOverlap(jam_mulai, jamSelesai, formatTime(r.jamMulai), formatTime(r.jamSelesai)));
  if (bentrok) {
    throw new AppError(400, 'Maaf, space sudah terisi atau dibooking pada jam tersebut!', 'Bad Request');
  }

  return success(res, {
    message: 'Space tersedia untuk dipesan pada jadwal yang diminta',
    data: {
      available: true,
      id_space: space.id,
      nama_space: space.namaSpace,
      tanggal,
      jam_mulai,
      jam_selesai: jamSelesai,
      durasi_jam: durasi,
      harga_per_jam: space.hargaPerJam,
      estimasi_total: space.hargaPerJam * durasi,
    },
  });
});

const list = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const { tipe, search } = req.query;

  const where = { makerId };
  if (tipe) where.tipe = tipe;
  if (search) {
    where.OR = [
      { namaSpace: { contains: search, mode: 'insensitive' } },
      { deskripsi: { contains: search, mode: 'insensitive' } },
    ];
  }

  const spaces = await prisma.space.findMany({ where, include: { owner: true }, orderBy: { id: 'asc' } });

  return success(res, {
    data: spaces.map((s) => ({
      id: s.id,
      nama_space: s.namaSpace,
      harga_per_jam: s.hargaPerJam,
      tipe: s.tipe,
      kapasitas: s.kapasitas,
      foto: s.foto,
      deskripsi: s.deskripsi,
      id_owner: s.idOwner,
      owner: { nama_coworking: s.owner.namaCoworking, nama_pemilik: s.owner.namaPemilik, telp: s.owner.telp },
      foto_url: buildFotoUrl(req, 'spaces', s.foto),
    })),
  });
});

const detail = asyncHandler(async (req, res) => {
  const makerId = req.makerId;
  const id = parseId(req.params.id, 'ID Space');

  const space = await prisma.space.findFirst({ where: { id, makerId }, include: { owner: true } });
  if (!space) throw new AppError(404, 'Space dengan ID tersebut tidak ditemukan!', 'Not Found');

  return success(res, {
    data: {
      id: space.id,
      nama_space: space.namaSpace,
      harga_per_jam: space.hargaPerJam,
      tipe: space.tipe,
      kapasitas: space.kapasitas,
      foto: space.foto,
      deskripsi: space.deskripsi,
      id_owner: space.idOwner,
      owner: { id: space.owner.id, nama_coworking: space.owner.namaCoworking, nama_pemilik: space.owner.namaPemilik, telp: space.owner.telp },
      foto_url: buildFotoUrl(req, 'spaces', space.foto),
    },
  });
});

module.exports = { types, availability, list, detail };
