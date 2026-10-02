const IOC = require('../models/IOC');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const response = require('../utils/response');
const { runCaseDetection } = require('../services/iocDetection.service');

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
 * POST /api/ioc/detect
 * Runs IOC Detection across forensic evidence for a specific case.
 */
const detectIOCs = async (req, res, next) => {
  try {
    const caseId = req.body.caseId || req.params.caseId;
    const batchId = req.body.batchId || null;

    if (!caseId) {
      return response.badRequest(res, 'caseId is required to run IOC detection.');
    }

    // Verify the user owns the target case before running detection
    const userId = getUserId(req);
    const caseDoc = await findUserOwnedCase(caseId, userId);
    if (!caseDoc) {
      return response.notFound(res, `Case [${caseId}] was not found or you do not have access.`);
    }

    // Execute detection engine
    const detectionResult = await runCaseDetection(caseId, {
      batchId,
      user: req.user
    });

    // Record audit event
    try {
      await AuditLog.create({
        action: 'RUN_IOC_DETECTION',
        module: 'IOC_ENGINE',
        user: req.user?.username || req.user?.email || 'Authenticated Analyst',
        details: `Ran IOC Detection on Case [${caseId}]. Scanned: ${detectionResult.totalEvidenceScanned} files, Total IOCs: ${detectionResult.totalDetected}, New: ${detectionResult.newIndicators}, Updated: ${detectionResult.updatedIndicators}.`,
        ip: req.ip || '127.0.0.1',
        severity: 'Low',
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[Audit Log Warning] Failed to log IOC detection audit entry:', auditErr.message);
    }

    return response.success(res, detectionResult, `IOC detection completed successfully for case ${caseId}.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ioc
 * Lists and filters detected IOCs with pagination.
 */
const getIOCs = async (req, res, next) => {
  try {
    const {
      caseId,
      batchId,
      type,
      indicatorType,
      severity,
      status,
      ipClassification,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = getUserId(req);
    // Resolve user-owned case IDs to scope IOC queries
    const userCaseDocs = await Case.find({ createdBy: userId }, { caseId: 1, _id: 0 }).lean();
    const userCaseIds = userCaseDocs.map(c => c.caseId);

    // Base filter: only IOCs from cases the user owns
    const filter = { caseId: { $in: userCaseIds } };

    // If caller requests a specific caseId, ensure it belongs to the user
    if (caseId) {
      if (!userCaseIds.includes(caseId)) {
        return response.success(res, { items: [], pagination: { total: 0, page: 1, limit: 50, pages: 0 } }, 'Indicators of compromise retrieved successfully.');
      }
      filter.caseId = caseId;
    }
    if (batchId) filter.batchId = batchId;

    const targetType = type || indicatorType;
    if (targetType && targetType !== 'all') {
      filter.indicatorType = targetType.toLowerCase();
    }

    if (severity && severity !== 'all') {
      filter.severity = severity;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (ipClassification && ipClassification !== 'all') {
      filter.ipClassification = ipClassification;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { iocId: { $regex: q, $options: 'i' } },
        { normalizedValue: { $regex: q, $options: 'i' } },
        { value: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
        { 'ruleMatches.ruleName': { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      IOC.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate('case', 'caseId title severity status')
        .populate('reviewedBy', 'fullName email role')
        .lean(),
      IOC.countDocuments(filter)
    ]);

    return response.success(res, {
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Indicators of compromise retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ioc/stats
 * Aggregate metrics for a case's IOC findings.
 */
const getIOCStats = async (req, res, next) => {
  try {
    const { caseId } = req.query;
    const userId = getUserId(req);

    let filter = {};
    if (caseId) {
      // Verify ownership of the specified case
      const ownedCase = await findUserOwnedCase(caseId, userId);
      if (!ownedCase) {
        // Return zero-stats for unauthorized case
        return response.success(res, {
          total: 0,
          severity: { Informational: 0, Low: 0, Medium: 0, High: 0, Critical: 0 },
          status: { 'New': 0, 'Under Review': 0, 'Confirmed': 0, 'False Positive': 0, 'Dismissed': 0 },
          types: {},
          ipClassification: {}
        }, 'IOC summary statistics compiled successfully.');
      }
      filter = { caseId };
    } else {
      // Scope to all user-owned cases
      const userCaseDocs = await Case.find({ createdBy: userId }, { caseId: 1, _id: 0 }).lean();
      filter = { caseId: { $in: userCaseDocs.map(c => c.caseId) } };
    }

    const [
      total,
      bySeverity,
      byStatus,
      byType,
      byIpClassification
    ] = await Promise.all([
      IOC.countDocuments(filter),
      IOC.aggregate([
        { $match: filter },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      IOC.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      IOC.aggregate([
        { $match: filter },
        { $group: { _id: '$indicatorType', count: { $sum: 1 } } }
      ]),
      IOC.aggregate([
        { $match: { ...filter, indicatorType: 'ipv4' } },
        { $group: { _id: '$ipClassification', count: { $sum: 1 } } }
      ])
    ]);

    const severityMap = { Informational: 0, Low: 0, Medium: 0, High: 0, Critical: 0 };
    bySeverity.forEach(s => { if (s._id in severityMap) severityMap[s._id] = s.count; });

    const statusMap = { 'New': 0, 'Under Review': 0, 'Confirmed': 0, 'False Positive': 0, 'Dismissed': 0 };
    byStatus.forEach(s => { if (s._id in statusMap) statusMap[s._id] = s.count; });

    const typeMap = {};
    byType.forEach(t => { typeMap[t._id] = t.count; });

    const ipMap = {};
    byIpClassification.forEach(i => { ipMap[i._id] = i.count; });

    return response.success(res, {
      total,
      severity: severityMap,
      status: statusMap,
      types: typeMap,
      ipClassification: ipMap
    }, 'IOC summary statistics compiled successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ioc/:id
 * Retrieve details for a specific IOC finding.
 */
const getIOCById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    let iocDoc = null;

    if (id.startsWith('IOC-')) {
      iocDoc = await IOC.findOne({ iocId: id });
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      iocDoc = await IOC.findById(id);
    }

    if (!iocDoc) {
      return response.notFound(res, `Indicator of Compromise [${id}] not found.`);
    }

    // IDOR check — verify user owns the parent case
    const ownedCase = await findUserOwnedCase(iocDoc.caseId, userId);
    if (!ownedCase) {
      return response.notFound(res, `Indicator of Compromise [${id}] not found.`);
    }

    await iocDoc.populate('case', 'caseId title severity status');
    await iocDoc.populate('reviewedBy', 'fullName email role');

    return response.success(res, iocDoc, 'IOC details retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/ioc/:id/status
 * Update investigation status and review notes for an IOC.
 */
const updateIOCStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = getUserId(req);

    const allowedStatuses = ['New', 'Under Review', 'Confirmed', 'False Positive', 'Dismissed'];
    if (!status || !allowedStatuses.includes(status)) {
      return response.badRequest(res, `Invalid status. Must be one of: ${allowedStatuses.join(', ')}.`);
    }

    let iocDoc = null;
    if (id.startsWith('IOC-')) {
      iocDoc = await IOC.findOne({ iocId: id });
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      iocDoc = await IOC.findById(id);
    }

    if (!iocDoc) {
      return response.notFound(res, `Indicator of Compromise [${id}] not found.`);
    }

    // IDOR check — verify user owns the parent case before allowing status update
    const ownedCase = await findUserOwnedCase(iocDoc.caseId, userId);
    if (!ownedCase) {
      return response.notFound(res, `Indicator of Compromise [${id}] not found.`);
    }

    const previousStatus = iocDoc.status;
    iocDoc.status = status;
    if (notes !== undefined) {
      iocDoc.notes = notes;
    }
    iocDoc.reviewedBy = req.user?._id || req.user?.id || null;
    iocDoc.reviewedAt = new Date();

    await iocDoc.save();

    // Audit log entry
    try {
      await AuditLog.create({
        action: 'UPDATE_IOC_STATUS',
        module: 'IOC_ENGINE',
        user: req.user?.username || req.user?.email || 'Authenticated Analyst',
        details: `Updated IOC [${iocDoc.iocId}] status from '${previousStatus}' to '${status}'. Value: ${iocDoc.normalizedValue}. Notes: ${notes || 'N/A'}.`,
        ip: req.ip || '127.0.0.1',
        severity: status === 'Confirmed' ? 'High' : 'Low',
        status: 'Success'
      });
    } catch (auditErr) {
      console.warn('[Audit Log Warning] Failed to log IOC status change:', auditErr.message);
    }

    return response.success(res, iocDoc, `Indicator status updated to '${status}' successfully.`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  detectIOCs,
  getIOCs,
  getIOCStats,
  getIOCById,
  updateIOCStatus
};
