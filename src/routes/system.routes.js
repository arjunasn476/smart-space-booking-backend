// Public root & health-check endpoints — no auth, no x-maker-key needed.
// Response shape matches the exact example in Kontrak API §III
// (Root & Health Check Service).
const router = require('express').Router();
const { success } = require('../utils/response');

router.get('/', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  return success(res, {
    data: {
      name: 'Coworking Space Backend API - UKK RPL Paket B',
      version: '1.0.0',
      status: 'online',
      swagger_docs: '/docs',
      description:
        'Backend service untuk menunjang kelas frontend dalam ujian UKK dengan multi-tenancy App Maker.',
      documentation_links: {
        swagger: `${base}/docs`,
        swagger_json: `${base}/docs-json`,
      },
    },
  });
});

router.get('/health', (req, res) => {
  return success(res, { data: { status: 'ok', timestamp: new Date().toISOString() } });
});

module.exports = router;
