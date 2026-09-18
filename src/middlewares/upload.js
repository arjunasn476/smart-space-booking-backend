// multer disk-storage instances for the 3 upload endpoints. Each saves
// to its own /uploads/<subfolder> so express.static (mounted in app.js)
// can serve them back at the exact URL shape Ketentuan Global §III.5
// specifies.
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('../utils/AppError');

function makeUploader(subfolder) {
  const dest = path.join(__dirname, '..', '..', 'uploads', subfolder);
  fs.mkdirSync(dest, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      // Matches the Contract's example filename shape:
      // "1787799592972-544446318.jpeg" (timestamp-random.ext)
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
      const allowedExt = /\.(jpg|jpeg|png|webp)$/i;
      const allowedMime = /^image\/(jpeg|png|webp)$/;
      if (allowedExt.test(file.originalname) && allowedMime.test(file.mimetype)) {
        return cb(null, true);
      }
      // Must be an AppError (not a plain Error) so errorHandler
      // returns a clean 400 instead of falling through to a 500.
      cb(new AppError(400, 'Format file harus .jpg, .jpeg, .png, atau .webp', 'Bad Request'));
    },
  });
}

module.exports = {
  uploadGeneral: makeUploader('general'),
  uploadSpaces: makeUploader('spaces'),
  uploadMembers: makeUploader('members'),
};