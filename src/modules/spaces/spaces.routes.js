// Mounts /types, /availability, /, /:id under /api/spaces.
// All routes are public/user-level (only x-maker-key required).
const router = require('express').Router();
const resolveMaker = require('../../middlewares/makerAuth');
const controller = require('./spaces.controller');

router.get('/types', resolveMaker, controller.types);
router.get('/availability', resolveMaker, controller.availability);
router.get('/', resolveMaker, controller.list);
router.get('/:id', resolveMaker, controller.detail);

module.exports = router;
