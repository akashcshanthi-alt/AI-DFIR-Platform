const mongoose = require('mongoose');
const TimelineEvent = require('../models/TimelineEvent');
const Case = require('../models/Case');
const response = require('../utils/response');
const { generateCaseTimeline } = require('../services/timeline.service');

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
 * POST /api/timeline/generate
 * Generates or refreshes the deterministic forensic timeline for a case.
 */
const generateTimeline = async (req, res, next) => {
  try {
    const caseId = req.body.caseId || req.params.caseId;
    if (!caseId) {
      return response.badRequest(res, 'caseId is required to generate a timeline.');
    }

    const userId = getUserId(req);
    const caseDoc = await findUserOwnedCase(caseId, userId);
    if (!caseDoc) {
      return response.notFound(res, `Case [${caseId}] was not found or access unauthorized.`);
    }

    const result = await generateCaseTimeline(caseId, { user: req.user });

    return response.success(res, result, `Forensic timeline generated successfully for case ${caseId}.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timeline
 * Retrieves paginated timeline events with multi-dimensional filtering.
 */
const getTimelineEvents = async (req, res, next) => {
  try {
    const {
      caseId = req.params.caseId,
      from,
      to,
      eventType,
      severity,
      evidenceId,
      iocId,
      search,
      includeUndated = 'false',
      page = 1,
      limit = 50,
      sortOrder = 'asc'
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

    // Chronological date range filter
    if (from || to) {
      filter.timestamp = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) filter.timestamp.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) filter.timestamp.$lte = toDate;
      }
    }

    // Undated handling: default is to exclude undated events from chronological sequence
    if (includeUndated !== 'true' && includeUndated !== true) {
      filter.isUndated = false;
    }

    if (eventType && eventType !== 'all') {
      filter.eventType = eventType.toUpperCase();
    }

    if (severity && severity !== 'all') {
      filter.severity = severity;
    }

    if (evidenceId && evidenceId !== 'all') {
      filter['source.evidenceId'] = evidenceId;
    }

    if (iocId && iocId !== 'all') {
      filter['relatedIocs.iocId'] = iocId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { eventId: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { rawExcerpt: { $regex: q, $options: 'i' } },
        { 'source.fileName': { $regex: q, $options: 'i' } },
        { 'source.relativePath': { $regex: q, $options: 'i' } },
        { 'relatedIocs.normalizedValue': { $regex: q, $options: 'i' } },
        { 'ruleMatches.ruleName': { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Default chronological sorting (oldest first)
    const sort = { timestamp: sortOrder === 'desc' ? -1 : 1, _id: 1 };

    const [items, total] = await Promise.all([
      TimelineEvent.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('case', 'caseId title severity status')
        .lean(),
      TimelineEvent.countDocuments(filter)
    ]);

    return response.success(res, {
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Timeline events retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timeline/stats
 * Aggregate metrics for a case's forensic timeline.
 */
const getTimelineStats = async (req, res, next) => {
  try {
    const caseId = req.query.caseId || req.params.caseId;
    if (!caseId) {
      return response.badRequest(res, 'caseId is required.');
    }

    const filter = { caseId };

    const [
      total,
      datedCount,
      undatedCount,
      bySeverity,
      byType,
      earliest,
      latest
    ] = await Promise.all([
      TimelineEvent.countDocuments(filter),
      TimelineEvent.countDocuments({ ...filter, isUndated: false }),
      TimelineEvent.countDocuments({ ...filter, isUndated: true }),
      TimelineEvent.aggregate([
        { $match: filter },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      TimelineEvent.aggregate([
        { $match: filter },
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]),
      TimelineEvent.findOne({ ...filter, isUndated: false }, { timestamp: 1 }).sort({ timestamp: 1 }),
      TimelineEvent.findOne({ ...filter, isUndated: false }, { timestamp: 1 }).sort({ timestamp: -1 })
    ]);

    const severityMap = { Informational: 0, Low: 0, Medium: 0, High: 0, Critical: 0 };
    bySeverity.forEach(s => { if (s._id in severityMap) severityMap[s._id] = s.count; });

    const typeMap = {};
    byType.forEach(t => { typeMap[t._id] = t.count; });

    return response.success(res, {
      total,
      dated: datedCount,
      undated: undatedCount,
      severity: severityMap,
      types: typeMap,
      timeSpan: {
        earliest: earliest?.timestamp || null,
        latest: latest?.timestamp || null
      }
    }, 'Timeline statistics compiled successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timeline/:id
 * Retrieve details for a specific timeline event with full evidence provenance.
 */
const getTimelineEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let eventDoc = null;

    if (id.startsWith('TLE-')) {
      eventDoc = await TimelineEvent.findOne({ eventId: id });
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      eventDoc = await TimelineEvent.findById(id);
    }

    if (!eventDoc) {
      return response.notFound(res, `Timeline Event [${id}] not found.`);
    }

    await eventDoc.populate('case', 'caseId title severity status');
    await eventDoc.populate('source.evidence', 'originalName relativePath fileSize md5Hash sha1Hash sha256Hash');

    return response.success(res, eventDoc, 'Timeline event details retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateTimeline,
  getTimelineEvents,
  getTimelineStats,
  getTimelineEventById
};
