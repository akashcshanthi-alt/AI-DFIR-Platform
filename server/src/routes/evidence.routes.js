const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../config/multer');

router.post('/upload', authenticate, upload.any(), evidenceController.uploadEvidence);
router.get('/', authenticate, evidenceController.getEvidence);
router.get('/:id', authenticate, evidenceController.getEvidenceById);
router.get('/:id/download', authenticate, evidenceController.downloadEvidence);
router.put('/:id', authenticate, evidenceController.updateEvidence);
router.delete('/:id', authenticate, evidenceController.deleteEvidence);
router.get('/case/:caseId', authenticate, evidenceController.getEvidenceByCase);

module.exports = router;
