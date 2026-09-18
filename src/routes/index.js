// Mounts every module router onto the main Express router.
// Sesi 7: all 50 endpoints are now live (system + maker + auth +
// spaces + diskon + reservasi + admin + upload).
const router = require('express').Router();

router.use(require('./system.routes'));
router.use('/api/maker', require('../modules/maker/maker.routes'));
router.use('/api/auth', require('../modules/auth/auth.routes'));
router.use('/api/spaces', require('../modules/spaces/spaces.routes'));
router.use('/api/diskon', require('../modules/diskon/diskon.routes'));
router.use('/api/reservasi', require('../modules/reservasi/reservasi.routes'));
router.use('/api/admin', require('../modules/admin/admin.routes'));
router.use('/api/upload', require('../modules/upload/upload.routes'));

module.exports = router;
