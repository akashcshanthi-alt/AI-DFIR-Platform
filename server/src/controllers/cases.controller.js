const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const response = require('../utils/response');
const mongoose = require('mongoose');

/**
 * Resolve the authenticated user's ObjectId string from req.user.
 * JWT payload may carry either `id` or `_id`.
 */
const getUserId = (req) => req.user?.id || req.user?._id;

/**
 * Get cases list with search, filter, pagination, and sorting features.
 * Results are always scoped to the authenticated user (createdBy).
 */
const getCases = async (req, res, next) => {
  try {
    const {
      search,
      q,
      status,
      severity,
      analyst,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Mandatory ownership filter — never omitted
    const query = { createdBy: getUserId(req) };

    // Filters
    if (status && status !== 'All' && status !== 'Status') {
      query.status = status;
    }
    if (severity && severity !== 'All' && severity !== 'Severity') {
      query.severity = severity;
    }
    if (analyst && analyst !== 'All' && analyst !== 'Analyst') {
      query.assignedAnalyst = new RegExp(analyst.trim(), 'i');
    }

    // Search matches
    const searchVal = q || search;
    if (searchVal && searchVal.trim()) {
      const searchRegex = new RegExp(searchVal.trim(), 'i');
      query.$or = [
        { caseId: searchRegex },
        { title: searchRegex },
        { incidentType: searchRegex },
        { description: searchRegex },
        { assignedAnalyst: searchRegex },
        { sourceIP: searchRegex },
        { destinationIP: searchRegex },
        { targetHost: searchRegex }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'fullName email role')
      .exec();

    const pages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      message: 'Cases retrieved successfully',
      data: cases,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single Case by MongoDB _id or sequential caseId.
 * Enforces ownership — a user can only read their own cases (prevents IDOR).
 */
const getCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const idFilter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { caseId: id }] }
      : { caseId: id };

    // Merge ownership filter — user MUST own this case
    const query = { ...idFilter, createdBy: userId };

    const caseObj = await Case.findOne(query)
      .populate('createdBy', 'fullName email role')
      .exec();

    if (!caseObj) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Case with reference [${id}] was not found.`,
          status: 404
        }
      });
    }

    return response.success(res, caseObj, 'Case retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate a new Incident Case workspace.
 * createdBy is always set from the verified JWT — never from the request body.
 */
const createCase = async (req, res, next) => {
  try {
    const {
      title,
      incidentType = 'General Security Incident',
      description = '',
      severity = 'High',
      status = 'Open',
      assignedAnalyst = 'Unassigned',
      sourceIP = '',
      destinationIP = '',
      evidenceCount = 0,
      targetHost = 'N/A'
    } = req.body;

    const newCase = new Case({
      title,
      incidentType,
      description,
      severity,
      status,
      assignedAnalyst,
      sourceIP,
      destinationIP,
      evidenceCount,
      targetHost,
      // Always use the authenticated user's ID — never trust request body for ownership
      createdBy: getUserId(req)
    });

    await newCase.save();

    const populated = await newCase.populate('createdBy', 'fullName email role');

    try {
      const actorEmail = populated.createdBy?.email || req.user?.email || 'Operator';
      await AuditLog.create({
        user: actorEmail,
        role: populated.createdBy?.role || req.user?.role || 'Investigator',
        action: 'CREATE_CASE',
        module: 'CASE_MANAGEMENT',
        resource: `Case ${newCase.caseId}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        status: 'Success',
        severity: 'Low',
        description: `Investigation Case [${newCase.caseId}] "${newCase.title}" created.`
      });
    } catch (auditErr) {
      console.warn('[Audit Log Warning] Failed to log case creation:', auditErr.message);
    }

    return response.success(res, populated, 'Investigation Case successfully initiated', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update case parameters.
 * Enforces ownership — a user can only update their own cases (prevents IDOR).
 */
const updateCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const updateData = { ...req.body };

    const idFilter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { caseId: id }] }
      : { caseId: id };

    // Sanitization: restrict immutable / privileged system parameters
    delete updateData.createdBy;
    delete updateData.caseId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Merge ownership filter — user MUST own this case to update it
    const query = { ...idFilter, createdBy: userId };

    const updatedCase = await Case.findOneAndUpdate(query, updateData, { new: true, runValidators: true })
      .populate('createdBy', 'fullName email role')
      .exec();

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Case with reference [${id}] was not found.`,
          status: 404
        }
      });
    }

    try {
      const actorEmail = req.user?.email || updatedCase.createdBy?.email || 'Operator';
      await AuditLog.create({
        user: actorEmail,
        role: req.user?.role || 'Investigator',
        action: 'UPDATE_CASE',
        module: 'CASE_MANAGEMENT',
        resource: `Case ${updatedCase.caseId}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        status: 'Success',
        severity: 'Low',
        description: `Case [${updatedCase.caseId}] details updated.`
      });
    } catch (auditErr) {
      console.warn('[Audit Log Warning] Failed to log case update:', auditErr.message);
    }

    return response.success(res, updatedCase, 'Case details successfully updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a Case workspace.
 * Enforces ownership — a user can only delete their own cases (prevents IDOR).
 */
const deleteCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const idFilter = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { caseId: id }] }
      : { caseId: id };

    // Merge ownership filter — user MUST own this case to delete it
    const query = { ...idFilter, createdBy: userId };

    const deletedCase = await Case.findOneAndDelete(query).exec();

    if (!deletedCase) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Case with reference [${id}] was not found.`,
          status: 404
        }
      });
    }

    try {
      const actorEmail = req.user?.email || 'Operator';
      await AuditLog.create({
        user: actorEmail,
        role: req.user?.role || 'Investigator',
        action: 'DELETE_CASE',
        module: 'CASE_MANAGEMENT',
        resource: `Case ${deletedCase.caseId}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        status: 'Success',
        severity: 'Medium',
        description: `Case [${deletedCase.caseId}] archived/deleted.`
      });
    } catch (auditErr) {
      console.warn('[Audit Log Warning] Failed to log case deletion:', auditErr.message);
    }

    return response.success(res, null, `Investigation case [${deletedCase.caseId}] successfully archived.`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase
};
