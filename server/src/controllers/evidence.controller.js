const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Evidence = require('../models/Evidence');
const User = require('../models/User');
const { calculateHashes } = require('../utils/hashGenerator');

/**
 * POST /api/evidence/upload
 * Handles single or multiple forensic file uploads.
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

    // Retrieve operator details
    const user = await User.findById(req.user.id);
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

    const createdEvidence = [];

    for (const file of files) {
      // Calculate cryptographic hashes
      const hashes = await calculateHashes(file.path);

      // Initial Chain of Custody log
      const chainOfCustody = [{
        action: 'Ingested',
        performedBy: operatorName,
        notes: `Forensic evidence ingested. SHA-256 integrity hash calculated.`,
        ipAddress: req.ip || '127.0.0.1',
        timestamp: new Date()
      }];

      const evidenceDoc = new Evidence({
        caseId,
        fileName: file.filename,
        originalName: file.originalname,
        fileType: fileType || 'Other',
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user.id,
        md5Hash: hashes.md5,
        sha1Hash: hashes.sha1,
        sha256Hash: hashes.sha256,
        tags: parsedTags,
        notes: notes || '',
        chainOfCustody,
        status: 'Active'
      });

      await evidenceDoc.save();
      createdEvidence.push(evidenceDoc);
    }

    return res.status(201).json({
      success: true,
      message: `${createdEvidence.length} forensic items ingested successfully.`,
      data: createdEvidence.length === 1 ? createdEvidence[0] : createdEvidence
    });

  } catch (error) {
    // Attempt cleanup of uploaded files if an exception is thrown
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
    const query = {};

    // Search query
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { originalName: searchRegex },
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
      query.caseId = req.query.caseId;
    }
    if (req.query.tag) {
      query.tags = req.query.tag;
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

    return res.status(200).json({
      success: true,
      data: item
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

    const user = await User.findById(req.user.id);
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
 * Unlinks physical file and deletes document.
 */
const deleteEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    const items = await Evidence.find({ caseId }).populate('uploadedBy', 'fullName email').sort({ uploadedAt: -1 });

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
  downloadEvidence,
  updateEvidence,
  deleteEvidence,
  getEvidenceByCase
};
