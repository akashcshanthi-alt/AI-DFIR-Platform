const mongoose = require('mongoose');
const MitreMapping = require('../models/MitreMapping');
const Case = require('../models/Case');
const response = require('../utils/response');
const {
  generateCaseMappings,
  updateMappingStatus: updateStatusService,
  getCaseMappingStats
} = require('../services/mitreMapping.service');
const {
  getCatalogProvenance,
  getAllTactics,
  getTechniqueMetadata
} = require('../services/mitreCatalog.service');

/**
 * Resolve the authenticated user's ID from the JWT payload.
 */
const getUserId = (req) => req.user?.id || req.user?._id;

/**
 * Verify that a caseId is owned by the given userId.
 */
const findUserOwnedCase = (caseId, userId) =>
  Case.findOne({ caseId, createdBy: userId }).lean();

/**
 * POST /api/mitre/generate
 * Deterministically generates or refreshes MITRE ATT&CK candidate mappings for a case.
 */
const generateMappings = async (req, res, next) => {
  try {
    const caseId = req.body.caseId || req.params.caseId;
    if (!caseId) {
      return response.badRequest(res, 'caseId is required to generate MITRE ATT&CK mappings.');
    }

    const userId = getUserId(req);
    const caseDoc = await findUserOwnedCase(caseId, userId);
    if (!caseDoc) {
      return response.notFound(res, `Case [${caseId}] was not found or access unauthorized.`);
    }

    const result = await generateCaseMappings(caseId, { user: req.user });

    return response.success(res, result, `MITRE ATT&CK candidate mappings generated successfully for case ${caseId}.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mitre
 * Retrieves paginated MITRE mappings with multi-dimensional filtering.
 */
const getMappings = async (req, res, next) => {
  try {
    const {
      caseId = req.params.caseId,
      status,
      tactic,
      confidence,
      detectionType,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    if (!caseId) {
      return response.badRequest(res, 'caseId parameter is required.');
    }

    const userId = getUserId(req);
    const caseDoc = await findUserOwnedCase(caseId, userId);
    if (!caseDoc) {
      return response.notFound(res, `Case [${caseId}] was not found or access unauthorized.`);
    }

    const filter = { caseId };

    if (status && status !== 'all') {
      filter.mappingStatus = status.toLowerCase();
    }

    if (tactic && tactic !== 'all') {
      filter.$or = [
        { 'tactics.tacticId': tactic.toUpperCase() },
        { 'tactics.tacticName': { $regex: tactic, $options: 'i' } }
      ];
    }

    if (confidence && confidence !== 'all') {
      filter['confidence.level'] = confidence;
    }

    if (detectionType && detectionType !== 'all') {
      filter.detectionType = detectionType.toLowerCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchOr = [
        { techniqueId: { $regex: q, $options: 'i' } },
        { techniqueName: { $regex: q, $options: 'i' } },
        { 'matchedRules.ruleName': { $regex: q, $options: 'i' } },
        { 'matchedRules.rationale': { $regex: q, $options: 'i' } },
        { 'evidenceReferences.fileName': { $regex: q, $options: 'i' } }
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    if (sortBy === 'confidence') {
      sortOption['confidence.score'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'techniqueId') {
      sortOption.techniqueId = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const [items, total] = await Promise.all([
      MitreMapping.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MitreMapping.countDocuments(filter)
    ]);

    return response.success(res, {
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      caseId
    }, 'MITRE ATT&CK technique mappings retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mitre/:id
 * Retrieves a single MITRE technique mapping with complete provenance.
 */
const getMappingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = { mappingId: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ mappingId: id }, { _id: id }] };
    }

    const mapping = await MitreMapping.findOne(query)
      .populate('case', 'caseId title severity status')
      .populate('timelineEvents', 'eventId timestamp eventType description severity rawExcerpt source')
      .lean();

    if (!mapping) {
      return response.notFound(res, `MITRE technique mapping [${id}] was not found.`);
    }

    // Attach verified catalog metadata
    const catalogInfo = getTechniqueMetadata(mapping.techniqueId);

    return response.success(res, {
      ...mapping,
      catalogInfo
    }, `Retrieved details for mapping ${mapping.mappingId} (${mapping.techniqueId}).`);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/mitre/:id/status
 * Updates mapping review status (analyst confirm/reject/review).
 */
const updateMappingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return response.badRequest(res, 'New status is required (candidate, analyst_review, confirmed, or rejected).');
    }

    const updated = await updateStatusService(id, status, {
      notes,
      user: req.user
    });

    return response.success(res, updated, `Mapping [${updated.mappingId}] transitioned to ${updated.mappingStatus}.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mitre/stats
 * Retrieves case-level MITRE ATT&CK statistics and matrix breakdown.
 */
const getMappingStats = async (req, res, next) => {
  try {
    const caseId = req.query.caseId || req.params.caseId;
    if (!caseId) {
      return response.badRequest(res, 'caseId parameter is required.');
    }

    const userId = getUserId(req);
    const caseDoc = await findUserOwnedCase(caseId, userId);
    if (!caseDoc) {
      return response.notFound(res, `Case [${caseId}] was not found or access unauthorized.`);
    }

    const stats = await getCaseMappingStats(caseId);

    return response.success(res, stats, `MITRE ATT&CK metrics retrieved for case ${caseId}.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mitre/catalog
 * Returns verified MITRE catalog provenance metadata and all standard tactics.
 */
const getCatalogInfo = async (req, res, next) => {
  try {
    const provenance = getCatalogProvenance();
    const tactics = getAllTactics();

    return response.success(res, {
      provenance,
      tactics
    }, 'Verified MITRE ATT&CK Enterprise catalog metadata retrieved.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateMappings,
  getMappings,
  getMappingById,
  updateMappingStatus,
  getMappingStats,
  getCatalogInfo
};
