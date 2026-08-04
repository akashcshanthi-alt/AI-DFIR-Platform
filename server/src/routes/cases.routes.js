const express = require('express');
const router = express.Router();
const casesController = require('../controllers/cases.controller');
const { validateCreateCase, validateUpdateCase } = require('../validators/case.validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, casesController.getCases);
router.post('/', authenticate, validateCreateCase, validate, casesController.createCase);
router.get('/:id', authenticate, casesController.getCaseById);
router.put('/:id', authenticate, validateUpdateCase, validate, casesController.updateCase);
router.delete('/:id', authenticate, casesController.deleteCase);

module.exports = router;

