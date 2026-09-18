// zod schemas matching CreateReservasiDto / UpdateReservasiStatusDto
// (Kontrak API §III.2).
const { z } = require('zod');

const createReservasiSchema = z.object({
  id_space: z.number().int('id_space harus bilangan bulat').positive('id_space tidak valid'),
  tanggal_reservasi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  jam_mulai: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm (24 jam)'),
  durasi_jam: z.number().int('durasi_jam harus bilangan bulat').min(1, 'Durasi minimal 1 jam'),
  id_diskon: z.number().int().positive().optional().nullable(),
  kode_promo: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'], {
    errorMap: () => ({ message: "status harus salah satu dari: 'belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan'" }),
  }),
});

module.exports = { createReservasiSchema, updateStatusSchema };
