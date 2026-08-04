const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate } = require('../middleware/auth');
const { validateExportAuditLogs } = require('../validators/audit.validator');

router.get('/', authenticate, auditController.getAuditLogs);
router.post('/export', authenticate, validateExportAuditLogs, auditController.exportAuditLogs);
router.get('/:id', authenticate, auditController.getAuditLogById);
router.delete('/:id', authenticate, auditController.deleteAuditLog);

module.exports = router;
