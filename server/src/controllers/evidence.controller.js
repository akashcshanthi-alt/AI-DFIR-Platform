const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Evidence = require('../models/Evidence');
const User = require('../models/User');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const { calculateHashes } = require('../utils/hashGenerator');
const { parseEvidenceFile } = require('../services/forensicParser.service');

// Configurable batch and file size limits
const MAX_BATCH_FILES = parseInt(process.env.MAX_BATCH_FILES || '100', 10);

/**
 * Resolve the authenticated user's ID from the JWT payload.
 */
const getUserId = (req) => req.user?.id || req.user?._id;

/**
 * Verifies that the given caseId is owned by userId.
 * Returns the case document or null.
 */
const findUserOwnedCase = (caseId, userId) =>
  Case.findOne({ caseId, createdBy: userId }).lean();

/**
 * Sanitizes relative paths to prevent path traversal attacks.
 * Strips drive letters, leading slashes, and resolves '..' and '.' path components.
 */
function sanitizeRelativePath(rawPath, originalName) {
  const fallback = path.basename(originalName || 'evidence.bin');
  if (!rawPath || typeof rawPath !== 'string') return fallback;

  // Normalize Windows separators to forward slash
  let normalized = rawPath.replace(/\\/g, '/');
  // Strip drive letters (e.g. C:)
  normalized = normalized.replace(/^[a-zA-Z]:/, '');
  // Strip leading slashes
  normalized = normalized.replace(/^\/+/, '');
  // Split into components and filter out '.', '..', and empty strings
  const segments = normalized.split('/').filter(seg => seg && seg !== '.' && seg !== '..');
  if (segments.length === 0) return fallback;
  return segments.join('/');
}

/**
 * Parses relative paths input from req.body (supports array, JSON string, or single string)
 */
function parseRelativePathsInput(rawInput) {
  if (!rawInput) return [];
  if (Array.isArray(rawInput)) return rawInput;
  if (typeof rawInput === 'string') {
    try {
      const parsed = JSON.parse(rawInput);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [rawInput];
    }
  }
  return [];
}

/**
 * POST /api/evidence/upload
 * Handles single-file, multi-file, and folder-based forensic evidence uploads.
 */
const uploadEvidence = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No evidence files uploaded.', status: 400 }
      });
    }

    if (files.length > MAX_BATCH_FILES) {
      // Remove uploaded files exceeding batch limit
      files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) {}
      });
      return res.status(400).json({
        success: false,
        error: {
          message: `Batch file limit exceeded. Maximum allowed: ${MAX_BATCH_FILES} files. Received: ${files.length}.`,
          status: 400
        }
      });
    }

    const { caseId, fileType, notes, tags } = req.body;
    if (!caseId) {
      // Clean up uploaded files if caseId is missing
      files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) {}
      });
      return res.status(400).json({
        success: false,
        error: { message: 'Target caseId is required for evidence upload.', status: 400 }
      });
    }

    // Verify the requesting user owns the target case (prevents cross-user evidence injection)
    const userId = getUserId(req);
    const ownedCase = await findUserOwnedCase(caseId, userId);
    if (!ownedCase) {
      files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) {}
      });
      return res.status(404).json({
        success: false,
        error: { message: `Case [${caseId}] was not found or you do not have access.`, status: 404 }
      });
    }

    // Assign or validate unique batchId
    const batchId = req.body.batchId && typeof req.body.batchId === 'string' && req.body.batchId.trim()
      ? req.body.batchId.trim()
      : `BATCH-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Relative paths mapping from folder selection
    const relPathsList = parseRelativePathsInput(req.body.relativePaths);

    // Retrieve operator details
    const user = await User.findById(userId);
    const operatorName = user ? user.fullName : 'Security Analyst';

    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    // Safely pre-calculate sequential evidence ID start counter
    const lastEvidence = await Evidence.findOne({}, { evidenceId: 1 }, { sort: { evidenceId: -1 } });
    let currentSequence = 1001;
    if (lastEvidence && lastEvidence.evidenceId) {
      const match = lastEvidence.evidenceId.match(/EVD-(\d+)/);
      if (match) {
        currentSequence = parseInt(match[1], 10) + 1;
      }
    }

    const createdEvidence = [];
    const failedFiles = [];

    // Process each uploaded file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const rawRelPath = relPathsList[i] || file.originalname;
      const sanitizedRelPath = sanitizeRelativePath(rawRelPath, file.originalname);

      try {
        // 1. Calculate cryptographic checksum hashes
        const hashes = await calculateHashes(file.path);

        // 2. Deterministic forensic parsing
        const parsingResult = await parseEvidenceFile(file.path, file.originalname);

        // 3. Chain of Custody logging
        const chainOfCustody = [
          {
            action: 'Ingested',
            performedBy: operatorName,
            notes: `Forensic evidence ingested (Batch: ${batchId}, Path: ${sanitizedRelPath}). Hashes computed.`,
            ipAddress: req.ip || '127.0.0.1',
            timestamp: new Date()
          },
          {
            action: 'Forensic Parsing',
            performedBy: 'TRACE Forensic Parser',
            notes: `Parser ${parsingResult.parserType} completed with status: ${parsingResult.status}. Discovered ${parsingResult.recordCount} records.`,
            ipAddress: '127.0.0.1',
            timestamp: new Date()
          }
        ];

        // 4. Create separate evidence document
        const assignedEvidenceId = `EVD-${currentSequence++}`;

        const evidenceDoc = new Evidence({
          evidenceId: assignedEvidenceId,
          caseId,
          fileName: file.filename, // safe unique basename on server disk
          originalName: path.basename(file.originalname),
          relativePath: sanitizedRelPath,
          batchId,
          fileType: fileType || 'Other',
          mimeType: file.mimetype || 'application/octet-stream',
          fileSize: file.size,
          uploadedBy: req.user.id,
          md5Hash: hashes.md5,
          sha1Hash: hashes.sha1,
          sha256Hash: hashes.sha256,
          tags: parsedTags,
          notes: notes || '',
          chainOfCustody,
          status: 'Active',
          parsing: parsingResult
        });

        await evidenceDoc.save();
        createdEvidence.push(evidenceDoc);

      } catch (fileErr) {
        console.error(`[Evidence Upload] Failed to process file ${file.originalname}:`, fileErr.message);
        failedFiles.push({
          originalName: file.originalname,
          relativePath: sanitizedRelPath,
          error: fileErr.message
        });
        // Remove corrupted or failed upload file from server disk
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
    }

    // Synchronize Case model evidenceCount
    if (createdEvidence.length > 0) {
      try {
        await Case.updateOne({ caseId }, { $inc: { evidenceCount: createdEvidence.length } });
      } catch (caseErr) {
        console.warn(`[Evidence] Could not increment evidenceCount on case ${caseId}:`, caseErr.message);
      }
    }

    // Total failure
    if (createdEvidence.length === 0 && failedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        batchId,
        error: {
          message: 'All files in batch failed to process.',
          details: failedFiles
        }
      });
    }

    // Partial failure
    if (failedFiles.length > 0) {
      return res.status(207).json({
        success: true,
        partial: true,
        message: `${createdEvidence.length} of ${files.length} items ingested successfully. ${failedFiles.length} item(s) failed.`,
        batchId,
        summary: {
          total: files.length,
          success: createdEvidence.length,
          failed: failedFiles.length
        },
        data: createdEvidence,
        failedFiles
      });
    }

    // Record AuditLog
    try {
      const actorEmail = req.user?.email || 'Operator';
      await AuditLog.create({
        user: actorEmail,
        role: req.user?.role || 'Investigator',
        action: 'UPLOAD_EVIDENCE',
        module: 'EVIDENCE',
        resource: `Case ${caseId}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        status: 'Success',
        severity: 'Low',
        description: `Ingested and parsed ${createdEvidence.length} evidence file(s) for Case [${caseId}]. Batch: ${batchId}.`
      });
    } catch (auditErr) {
      console.warn('[Audit Log Warning] Failed to log evidence upload:', auditErr.message);
    }

    // Complete success
    return res.status(201).json({
      success: true,
      message: `${createdEvidence.length} forensic items ingested and parsed successfully.`,
      batchId,
      summary: {
        total: files.length,
        success: createdEvidence.length,
        failed: 0
      },
      data: createdEvidence.length === 1 ? createdEvidence[0] : createdEvidence
    });

  } catch (error) {
    // Clean up uploaded files in case of unhandled error
    if (req.files) {
      req.files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) {}
      });
    } else if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(error);
  }
};

/**
 * GET /api/evidence
 * Retrieves evidence catalog with search, filters, pagination, and sorting.
 */
const getEvidence = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    // Scope to user-owned case IDs only
    const userCaseDocs = await Case.find({ createdBy: userId }, { caseId: 1, _id: 0 }).lean();
    const userCaseIds = userCaseDocs.map(c => c.caseId);

    // Base filter: evidence only for cases the user owns
    const query = { caseId: { $in: userCaseIds } };

    // Search query
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { originalName: searchRegex },
        { relativePath: searchRegex },
        { batchId: searchRegex },
        { caseId: searchRegex },
        { md5Hash: searchRegex },
        { sha1Hash: searchRegex },
        { sha256Hash: searchRegex }
      ];
    }

    // Specific filters
    if (req.query.fileType) {
      query.fileType = req.query.fileType;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.caseId) {
      // Ensure caller can only filter within their own cases
      if (userCaseIds.includes(req.query.caseId)) {
        query.caseId = req.query.caseId;
      } else {
        // caseId doesn't belong to user — return empty result safely
        return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
      }
    }
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    if (req.query.batchId) {
      query.batchId = req.query.batchId;
    }
    if (req.query.parserStatus) {
      query['parsing.status'] = req.query.parserStatus;
    }
    if (req.query.parserType) {
      query['parsing.parserType'] = req.query.parserType;
    }

    // Sorting parameters
    const sortBy = req.query.sortBy || 'uploadedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Evidence.find(query).populate('uploadedBy', 'fullName email').sort(sort).skip(skip).limit(limit),
      Evidence.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        pages: totalPages
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/evidence/:id
 * Retrieves a single evidence metadata by ObjectId or sequential ID.
 */
const getEvidenceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const item = await Evidence.findOne({
      $or: [
        isObjectId ? { _id: id } : { _id: null },
        { evidenceId: id }
      ]
    }).populate('uploadedBy', 'fullName email');

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Forensic evidence item not found.', status: 404 }
      });
    }

    // Verify the evidence's parent case belongs to the requesting user (IDOR check)
    const ownedCase = await findUserOwnedCase(item.caseId, userId);
    if (!ownedCase) {
      return res.status(404).json({
        success: false,
        error: { message: 'Forensic evidence item not found.', status: 404 }
      });
    }

    return res.status(200).json({
      success: true,
      data: item
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/evidence/batch/:batchId
 * Retrieves all evidence files for a specific upload batch along with summary statistics.
 */
const getEvidenceByBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const userId = getUserId(req);

    // Fetch items in batch, then filter to user-owned cases
    const allItems = await Evidence.find({ batchId })
      .populate('uploadedBy', 'fullName email')
      .sort({ relativePath: 1, uploadedAt: -1 });

    // Collect unique caseIds present in this batch
    const batchCaseIds = [...new Set(allItems.map(i => i.caseId))];
    // Verify which of those belong to the user
    const ownedCases = await Case.find(
      { caseId: { $in: batchCaseIds }, createdBy: userId },
      { caseId: 1, _id: 0 }
    ).lean();
    const ownedCaseIdSet = new Set(ownedCases.map(c => c.caseId));
    // Only return items from cases the user owns
    const items = allItems.filter(i => ownedCaseIdSet.has(i.caseId));

    const totalSize = items.reduce((acc, item) => acc + (item.fileSize || 0), 0);
    const parsedCount = items.filter(i => i.parsing && i.parsing.status === 'Parsed').length;
    const unsupportedCount = items.filter(i => i.parsing && i.parsing.status === 'Unsupported').length;
    const failedCount = items.filter(i => i.parsing && i.parsing.status === 'Failed').length;

    return res.status(200).json({
      success: true,
      data: {
        batchId,
        totalFiles: items.length,
        totalSize,
        parsedCount,
        unsupportedCount,
        failedCount,
        items
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/evidence/:id/download
 * Securely streams file downloads.
 */
const downloadEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const item = await Evidence.findOne({
      $or: [
        isObjectId ? { _id: id } : { _id: null },
        { evidenceId: id }
      ]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Forensic evidence file record not found.', status: 404 }
      });
    }

    // IDOR check — verify user owns the parent case
    const ownedCase = await findUserOwnedCase(item.caseId, userId);
    if (!ownedCase) {
      return res.status(404).json({
        success: false,
        error: { message: 'Forensic evidence file record not found.', status: 404 }
      });
    }

    const absolutePath = path.resolve(__dirname, '../../uploads/evidence', item.fileName);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        error: { message: 'Physical evidence file is missing from server storage disk.', status: 404 }
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename=${item.originalName}`);
    return res.download(absolutePath, item.originalName);

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/evidence/:id
 * Updates tags, notes, status, and appends to Chain of Custody.
 */
const updateEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tags, notes, status, chainAction } = req.body;
    const userId = getUserId(req);

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const item = await Evidence.findOne({
      $or: [
        isObjectId ? { _id: id } : { _id: null },
        { evidenceId: id }
      ]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Evidence item not found.', status: 404 }
      });
    }

    // IDOR check — verify user owns the parent case before allowing mutation
    const ownedCase = await findUserOwnedCase(item.caseId, userId);
    if (!ownedCase) {
      return res.status(404).json({
        success: false,
        error: { message: 'Evidence item not found.', status: 404 }
      });
    }

    const user = await User.findById(userId);
    const operatorName = user ? user.fullName : 'Security Analyst';

    const updatedFields = [];

    if (tags !== undefined) {
      item.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
      updatedFields.push('tags');
    }
    if (notes !== undefined) {
      item.notes = notes;
      updatedFields.push('notes');
    }
    if (status !== undefined) {
      item.status = status;
      updatedFields.push('status');
    }

    // Append entry to Chain of Custody timeline log
    if (updatedFields.length > 0) {
      item.chainOfCustody.push({
        action: chainAction || 'Metadata Updated',
        performedBy: operatorName,
        notes: `Telemetry modifications made: ${updatedFields.join(', ')}`,
        ipAddress: req.ip || '127.0.0.1',
        timestamp: new Date()
      });
    }

    await item.save();

    return res.status(200).json({
      success: true,
      message: 'Forensic evidence telemetry updated successfully.',
      data: item
    });

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/evidence/:id
 * Unlinks physical file, decrements Case evidence count, and deletes document.
 */
const deleteEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const item = await Evidence.findOne({
      $or: [
        isObjectId ? { _id: id } : { _id: null },
        { evidenceId: id }
      ]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Evidence not found or already deleted.', status: 404 }
      });
    }

    // IDOR check — verify user owns the parent case before allowing deletion
    const ownedCase = await findUserOwnedCase(item.caseId, userId);
    if (!ownedCase) {
      return res.status(404).json({
        success: false,
        error: { message: 'Evidence not found or already deleted.', status: 404 }
      });
    }

    // Unlink the physical file
    const absolutePath = path.resolve(__dirname, '../../uploads/evidence', item.fileName);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.warn(`[Evidence] Could not delete physical file at ${absolutePath}:`, err.message);
      }
    }

    await Evidence.deleteOne({ _id: item._id });

    // Decrement case evidence count if positive
    if (item.caseId) {
      try {
        await Case.updateOne({ caseId: item.caseId, evidenceCount: { $gt: 0 } }, { $inc: { evidenceCount: -1 } });
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      message: 'Evidence document and physical file deleted successfully.'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/evidence/case/:caseId
 * Lists all evidence files for a case.
 */
const getEvidenceByCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const userId = getUserId(req);

    // Verify user owns this case before listing its evidence
    const ownedCase = await findUserOwnedCase(caseId, userId);
    if (!ownedCase) {
      return res.status(404).json({
        success: false,
        error: { message: `Case [${caseId}] was not found or you do not have access.`, status: 404 }
      });
    }

    const items = await Evidence.find({ caseId })
      .populate('uploadedBy', 'fullName email')
      .sort({ uploadedAt: -1 });

    return res.status(200).json({
      success: true,
      data: items
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadEvidence,
  getEvidence,
  getEvidenceById,
  getEvidenceByBatch,
  downloadEvidence,
  updateEvidence,
  deleteEvidence,
  getEvidenceByCase,
  sanitizeRelativePath
};
