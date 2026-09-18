// Mounts POST /register, /login, GET /me, /stats, /list under /api/maker.
const router = require('express').Router();
const validate = require('../../middlewares/validate');
const { registerMakerSchema, loginMakerSchema } = require('../../validators/maker.validator');
const requireMakerBearer = require('../../middlewares/makerBearerAuth');
const makerFlexibleAuth = require('../../middlewares/makerFlexibleAuth');
const controller = require('./maker.controller');

router.post('/register', validate(registerMakerSchema), controller.register);
router.post('/login', validate(loginMakerSchema), controller.login);
router.get('/me', requireMakerBearer, controller.me);
router.get('/stats', makerFlexibleAuth, controller.stats);
router.get('/list', controller.list);

module.exports = router;
