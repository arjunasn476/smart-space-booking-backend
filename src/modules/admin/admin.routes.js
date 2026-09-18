// Mounts every /api/admin/* route. The three guards below apply to the
// whole router: tenant resolution, user auth, then admin_space role.
const router = require('express').Router();
const resolveMaker = require('../../middlewares/makerAuth');
const requireAuth = require('../../middlewares/jwtAuth');
const requireRole = require('../../middlewares/roleGuard');
const validate = require('../../middlewares/validate');

const {
  updateProfileSchema,
  createMemberAdminSchema,
  updateMemberAdminSchema,
} = require('../../validators/admin.validator');
const { createSpaceSchema, updateSpaceSchema } = require('../../validators/space.validator');
const { createDiskonSchema, updateDiskonSchema } = require('../../validators/diskon.validator');
const { updateStatusSchema } = require('../../validators/reservasi.validator');

const profileCtrl = require('./admin.profile.controller');
const membersCtrl = require('./admin.members.controller');
const spacesCtrl = require('./admin.spaces.controller');
const diskonCtrl = require('./admin.diskon.controller');
const reservasiCtrl = require('./admin.reservasi.controller');
const reportsCtrl = require('./admin.reports.controller');

router.use(resolveMaker, requireAuth, requireRole('admin_space'));

// Profil lokasi coworking
router.get('/profile', profileCtrl.getProfile);
router.put('/profile', validate(updateProfileSchema), profileCtrl.updateProfile);

// CRUD member
router.get('/members', membersCtrl.list);
router.post('/members', validate(createMemberAdminSchema), membersCtrl.create);
router.get('/members/:id', membersCtrl.detail);
router.put('/members/:id', validate(updateMemberAdminSchema), membersCtrl.update);
router.delete('/members/:id', membersCtrl.remove);

// CRUD space
router.get('/spaces', spacesCtrl.list);
router.post('/spaces', validate(createSpaceSchema), spacesCtrl.create);
router.get('/spaces/:id', spacesCtrl.detail);
router.put('/spaces/:id', validate(updateSpaceSchema), spacesCtrl.update);
router.delete('/spaces/:id', spacesCtrl.remove);

// CRUD diskon
router.get('/diskon', diskonCtrl.list);
router.post('/diskon', validate(createDiskonSchema), diskonCtrl.create);
router.get('/diskon/:id', diskonCtrl.detail);
router.put('/diskon/:id', validate(updateDiskonSchema), diskonCtrl.update);
router.delete('/diskon/:id', diskonCtrl.remove);

// Reservasi & check-in/check-out
router.get('/reservasi', reservasiCtrl.list);
router.patch('/reservasi/:id/status', validate(updateStatusSchema), reservasiCtrl.updateStatus);
router.post('/reservasi/:id/check-in', reservasiCtrl.checkIn);
router.post('/reservasi/:id/check-out', reservasiCtrl.checkOut);

// Laporan pendapatan
router.get('/reports/monthly', reportsCtrl.monthly);
router.get('/reports/income', reportsCtrl.income);

module.exports = router;
