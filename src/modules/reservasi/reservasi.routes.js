// Mounts the Member booking flow under /api/reservasi.
// NOTE: /my and /my/history are declared BEFORE /:id so Express doesn't
// mistake the literal "my" for an :id param.
const router = require('express').Router();
const resolveMaker = require('../../middlewares/makerAuth');
const requireAuth = require('../../middlewares/jwtAuth');
const requireRole = require('../../middlewares/roleGuard');
const validate = require('../../middlewares/validate');
const { createReservasiSchema } = require('../../validators/reservasi.validator');
const controller = require('./reservasi.controller');

router.post('/', resolveMaker, requireAuth, requireRole('member'), validate(createReservasiSchema), controller.create);
router.get('/my/history', resolveMaker, requireAuth, requireRole('member'), controller.myHistory);
router.get('/my', resolveMaker, requireAuth, requireRole('member'), controller.my);
router.get('/:id/e-ticket', resolveMaker, requireAuth, controller.eTicket);
router.get('/:id', resolveMaker, requireAuth, controller.detail);
router.patch('/:id/cancel', resolveMaker, requireAuth, requireRole('member'), controller.cancel);

module.exports = router;
