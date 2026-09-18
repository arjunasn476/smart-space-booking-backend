// zod schemas matching UpdateCoworkingProfileDto / CreateMemberAdminDto
// / UpdateMemberAdminDto (Kontrak API §III.2).
const { z } = require('zod');

const updateProfileSchema = z.object({
  nama_coworking: z.string().min(1, 'Nama coworking wajib diisi'),
  nama_pemilik: z.string().min(1, 'Nama pemilik wajib diisi'),
  telp: z.string().min(1, 'Telepon wajib diisi'),
});

const createMemberAdminSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  nama_member: z.string().min(1, 'Nama member wajib diisi'),
  instansi: z.string().min(1, 'Instansi wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  telp: z.string().min(1, 'Telepon wajib diisi'),
  foto: z.string().optional(),
});

const updateMemberAdminSchema = z.object({
  nama_member: z.string().min(1).optional(),
  instansi: z.string().min(1).optional(),
  alamat: z.string().min(1).optional(),
  telp: z.string().min(1).optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  foto: z.string().optional(),
});

module.exports = { updateProfileSchema, createMemberAdminSchema, updateMemberAdminSchema };
