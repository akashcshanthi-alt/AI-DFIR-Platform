const express = require('express');
const router = express.Router();
const mitreController = require('../controllers/mitre.controller');
const { authenticate } = require('../middleware/auth');

/**
 * MITRE ATT&CK Mapping Engine Routes
 */

// Generate or refresh candidate mappings for a case
router.post('/generate', authenticate, mitreController.generateMappings);

// List mappings with pagination, search, and multi-dimensional filters
router.get('/', authenticate, mitreController.getMappings);

// Case-level stats and matrix coverage
router.get('/stats', authenticate, mitreController.getMappingStats);

// Verified catalog provenance and standard tactics catalog
router.get('/catalog', authenticate, mitreController.getCatalogInfo);

// Retrieve detailed mapping by ID (with evidence references & timeline events)
router.get('/:id', authenticate, mitreController.getMappingById);

// Update review status (confirm, reject, analyst_review)
router.patch('/:id/status', authenticate, mitreController.updateMappingStatus);

module.exports = router;
