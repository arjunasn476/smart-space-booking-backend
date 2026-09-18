// zod schemas for App Maker endpoints, matching RegisterMakerDto and
// LoginMakerDto field-by-field (Kontrak API §III.2).
const { z } = require('zod');

const registerMakerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const loginMakerSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username atau email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

module.exports = { registerMakerSchema, loginMakerSchema };
