// zod schemas for user auth endpoints, matching RegisterMemberDto,
// RegisterAdminSpaceDto, and LoginDto (Kontrak API §III.2).
const { z } = require('zod');

const registerMemberSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  nama_member: z.string().min(1, 'Nama member wajib diisi'),
  instansi: z.string().min(1, 'Instansi wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  telp: z.string().min(1, 'Telepon wajib diisi'),
  foto: z.string().optional(),
});

const registerAdminSpaceSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  nama_coworking: z.string().min(1, 'Nama coworking wajib diisi'),
  nama_pemilik: z.string().min(1, 'Nama pemilik wajib diisi'),
  telp: z.string().min(1, 'Telepon wajib diisi'),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

module.exports = { registerMemberSchema, registerAdminSpaceSchema, loginSchema };
