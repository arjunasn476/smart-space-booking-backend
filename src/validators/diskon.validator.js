// zod schemas matching CreateDiskonDto / UpdateDiskonDto / CheckPromoDto
// (Kontrak API §III.2).
const { z } = require('zod');

const createDiskonSchema = z.object({
  nama_diskon: z.string().min(1, 'Nama diskon wajib diisi'),
  persentase_diskon: z.number().min(1, 'Persentase minimal 1').max(100, 'Persentase maksimal 100'),
  tanggal_awal: z.string().min(1, 'Tanggal awal wajib diisi'),
  tanggal_akhir: z.string().min(1, 'Tanggal akhir wajib diisi'),
});

const updateDiskonSchema = createDiskonSchema.partial();

const checkPromoSchema = z.object({
  nama_diskon: z.string().min(1, 'Nama diskon wajib diisi'),
});

module.exports = { createDiskonSchema, updateDiskonSchema, checkPromoSchema };
