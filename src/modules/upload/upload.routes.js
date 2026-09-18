// Mounts /image, /spaces, /members under /api/upload.
//
// NOTE — reconciliation: the endpoint summary table (Kontrak API §III.1
// row 49) labels /api/upload/spaces & /members as "Admin Space" only,
// but the DETAILED "Auth:" line documented for all 3 upload endpoints
// explicitly says "Tidak diperlukan / Header x-maker-key" — no Bearer
// requirement. The detailed technical line wins here (same
// reconciliation principle used for the DB schema): only x-maker-key
// is required, matching what Postman will actually test.
const router = require('express').Router();
const resolveMaker = require('../../middlewares/makerAuth');
const { uploadGeneral, uploadSpaces, uploadMembers } = require('../../middlewares/upload');
const controller = require('./upload.controller');

router.post('/image', resolveMaker, uploadGeneral.single('file'), controller.uploadImage);
router.post('/spaces', resolveMaker, uploadSpaces.single('file'), controller.uploadSpaceFoto);
router.post('/members', resolveMaker, uploadMembers.single('file'), controller.uploadMemberFoto);

module.exports = router;
