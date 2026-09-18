// Mounts /register/member, /register/admin-space, /login, /profile
// under /api/auth. Every route requires x-maker-key (resolveMaker);
// /profile additionally requires a Bearer user token (requireAuth).
const router = require('express').Router();
const resolveMaker = require('../../middlewares/makerAuth');
const requireAuth = require('../../middlewares/jwtAuth');
const validate = require('../../middlewares/validate');
const { registerMemberSchema, registerAdminSpaceSchema, loginSchema } = require('../../validators/auth.validator');
const controller = require('./auth.controller');

router.post('/register/member', resolveMaker, validate(registerMemberSchema), controller.registerMember);
router.post('/register/admin-space', resolveMaker, validate(registerAdminSpaceSchema), controller.registerAdminSpace);
router.post('/login', resolveMaker, validate(loginSchema), controller.login);
router.get('/profile', resolveMaker, requireAuth, controller.profile);

module.exports = router;
