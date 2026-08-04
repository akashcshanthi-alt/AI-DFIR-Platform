const Case = require('../models/Case');
const response = require('../utils/response');
const mongoose = require('mongoose');

/**
 * Get cases list with search, filter, pagination, and sorting features.
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

    const query = {};

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
 */
const getCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { caseId: id }] }
      : { caseId: id };

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
 */
const createCase = async (req, res, next) => {
  try {
    const {
      title,
      description,
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
      description,
      severity,
      status,
      assignedAnalyst,
      sourceIP,
      destinationIP,
      evidenceCount,
      targetHost,
      createdBy: req.user.id || req.user._id
    });

    await newCase.save();
    
    const populated = await newCase.populate('createdBy', 'fullName email role');

    return response.success(res, populated, 'Investigation Case successfully initiated', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update case parameters.
 */
const updateCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { caseId: id }] }
      : { caseId: id };

    // Sanitization: restrict system parameters
    delete updateData.createdBy;
    delete updateData.caseId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

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

    return response.success(res, updatedCase, 'Case details successfully updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a Case workspace.
 */
const deleteCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { caseId: id }] }
      : { caseId: id };

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

