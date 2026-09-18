// uploadImage, uploadSpaceFoto, uploadMemberFoto — handles the file
// AFTER multer has already saved it to disk; this just shapes the
// baku response per Kontrak API §III "Upload Berkas & Gambar (Media)".
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/AppError');

function buildUrl(req, subfolder, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${subfolder}/${filename}`;
}

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'File gambar wajib diunggah!', 'Bad Request');
  return success(res, {
    statusCode: 201,
    message: 'File berhasil diupload',
    data: {
      filename: req.file.filename,
      original_name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: buildUrl(req, 'general', req.file.filename),
    },
  });
});

const uploadSpaceFoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'File foto ruangan wajib diunggah!', 'Bad Request');
  return success(res, {
    statusCode: 201,
    message: 'Foto space berhasil diupload',
    data: { filename: req.file.filename, url: buildUrl(req, 'spaces', req.file.filename) },
  });
});

const uploadMemberFoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'File foto member wajib diunggah!', 'Bad Request');
  return success(res, {
    statusCode: 201,
    message: 'Foto member berhasil diupload',
    data: { filename: req.file.filename, url: buildUrl(req, 'members', req.file.filename) },
  });
});

module.exports = { uploadImage, uploadSpaceFoto, uploadMemberFoto };
