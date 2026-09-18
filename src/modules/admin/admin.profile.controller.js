// getProfile, updateProfile — coworking location profile (Panel Admin).
const prisma = require('../../lib/prisma');
const { success } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

function serializeOwner(o) {
  return { id: o.id, nama_coworking: o.namaCoworking, nama_pemilik: o.namaPemilik, telp: o.telp };
}

const getProfile = asyncHandler(async (req, res) =>
  success(res, { data: serializeOwner(req.user.spaceOwner) })
);

const updateProfile = asyncHandler(async (req, res) => {
  const { nama_coworking, nama_pemilik, telp } = req.validated;
  const updated = await prisma.spaceOwner.update({
    where: { id: req.user.spaceOwner.id },
    data: { namaCoworking: nama_coworking, namaPemilik: nama_pemilik, telp },
  });
  return success(res, {
    message: 'Profil Coworking Space berhasil diperbarui!',
    data: serializeOwner(updated),
  });
});

module.exports = { getProfile, updateProfile };
