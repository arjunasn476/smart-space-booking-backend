// Mounts /active, /check, /:id under /api/diskon.
const router = require('express').Router();
const resolveMaker = require('../../middlewares/makerAuth');
const validate = require('../../middlewares/validate');
const { checkPromoSchema } = require('../../validators/diskon.validator');
const controller = require('./diskon.controller');

router.get('/active', resolveMaker, controller.active);
router.post('/check', resolveMaker, validate(checkPromoSchema), controller.check);
router.get('/:id', resolveMaker, controller.detail);

module.exports = router;
