// zod schemas matching CreateSpaceDto / UpdateSpaceDto (Kontrak API §III.2).
const { z } = require('zod');

const tipeEnum = z.enum(['desk', 'meeting_room', 'private_office'], {
  errorMap: () => ({ message: "tipe harus salah satu dari: 'desk', 'meeting_room', 'private_office'" }),
});

const createSpaceSchema = z.object({
  nama_space: z.string().min(1, 'Nama space wajib diisi'),
  harga_per_jam: z.number().int('harga_per_jam harus bilangan bulat').positive('harga_per_jam harus lebih dari 0'),
  tipe: tipeEnum,
  kapasitas: z.number().int('kapasitas harus bilangan bulat').positive('kapasitas harus lebih dari 0'),
  deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
  foto: z.string().optional(),
});

const updateSpaceSchema = createSpaceSchema.partial();

module.exports = { createSpaceSchema, updateSpaceSchema, tipeEnum };
