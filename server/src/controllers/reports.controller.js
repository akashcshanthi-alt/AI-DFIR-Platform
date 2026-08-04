const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Report = require('../models/Report');
const Case = require('../models/Case');
const User = require('../models/User');
const { generatePDF, generateCSV } = require('../services/reportGenerator');

/**
 * POST /api/reports/generate
 */
const generateReport = async (req, res, next) => {
  try {
    const { title, caseId, format, reportType } = req.body;

    if (!caseId || !format || !reportType) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'caseId, format, and reportType are required fields.',
          status: 400
        }
      });
    }

    if (!['PDF', 'CSV'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Format must be either PDF or CSV.',
          status: 400
        }
      });
    }

    // 1. Fetch case details
    const isObjectId = mongoose.Types.ObjectId.isValid(caseId);
    const activeCase = await Case.findOne({
      $or: [
        isObjectId ? { _id: caseId } : { _id: null },
        { caseId }
      ]
    });

    if (!activeCase) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Related incident case not found.',
          status: 404
        }
      });
    }

    // 2. Fetch operator details
    const user = await User.findById(req.user.id);

    // 3. Setup directories & file path
    const reportsDir = path.join(__dirname, '../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Calculate sequential reportId ahead of pre-save for insertion in document text
    const lastReport = await Report.findOne({}, { reportId: 1 }, { sort: { createdAt: -1 } });
    let nextNum = 1001;
    if (lastReport && lastReport.reportId) {
      const match = lastReport.reportId.match(/REP-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const reportId = `REP-${nextNum}`;

    const fileName = `${reportId}_${Date.now()}.${format.toLowerCase()}`;
    const filePath = path.join(reportsDir, fileName);

    const reportData = {
      reportId,
      title: title || `Forensic Report - Case ${activeCase.caseId}`,
      caseId: activeCase.caseId,
      caseTitle: activeCase.title,
      caseDescription: activeCase.description,
      severity: activeCase.severity,
      status: activeCase.status,
      sourceIP: activeCase.sourceIP,
      destinationIP: activeCase.destinationIP,
      evidenceCount: activeCase.evidenceCount,
      targetHost: activeCase.targetHost,
      operatorName: user ? user.fullName : 'Security Analyst',
      operatorEmail: user ? user.email : 'analyst@trace.ai',
      reportType,
      createdAt: new Date()
    };

    // 4. Generate the physical file
    if (format === 'PDF') {
      await generatePDF(filePath, reportData);
    } else {
      await generateCSV(filePath, reportData);
    }

    // 5. Stat file size
    const fileSize = fs.statSync(filePath).size;

    // 6. Save model document to MongoDB
    const report = new Report({
      reportId, // Provide manually calculated ID so it matches the generated file
      title: title || `Forensic Report - Case ${activeCase.caseId}`,
      caseId: activeCase.caseId,
      generatedBy: req.user.id,
      format,
      reportType,
      filePath: `/uploads/reports/${fileName}`,
      fileSize
    });

    await report.save();

    return res.status(201).json({
      success: true,
      message: 'Report synthesized successfully.',
      data: report
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports
 */
const getReports = async (req, res, next) => {
  try {
    const query = {};

    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { caseId: searchRegex }
      ];
    }

    // Specific filters
    if (req.query.format) {
      query.format = req.query.format;
    }
    if (req.query.reportType) {
      query.reportType = req.query.reportType;
    }
    if (req.query.caseId) {
      query.caseId = req.query.caseId;
    }

    // Sorting parameters
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(query).populate('generatedBy', 'fullName email').sort(sort).skip(skip).limit(limit),
      Report.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: reports,
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
 * GET /api/reports/:id
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const report = await Report.findOne({
      $or: [
        isObjectId ? { _id: id } : { _id: null },
        { reportId: id }
      ]
    }).populate('generatedBy', 'fullName email');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Forensic report not found.',
          status: 404
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/:id/download
 */
const downloadReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const report = await Report.findOne({
      $or: [
        isObjectId ? { _id: id } : { _id: null },
        { reportId: id }
      ]
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Forensic report file record not found.',
          status: 404
        }
      });
    }

    // Resolve the document's path on server relative to backend root
    const absolutePath = path.resolve(__dirname, '..', '.' + report.filePath);
    
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Report file was deleted or is missing from server storage disk.',
          status: 404
        }
      });
    }

    const downloadName = path.basename(absolutePath);
    res.setHeader('Content-Disposition', `attachment; filename=${downloadName}`);
    return res.download(absolutePath, downloadName);

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reports/:id
 */
const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const report = await Report.findOne({
      $or: [
        isObjectId ? { _id: id } : { _id: null },
        { reportId: id }
      ]
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Report not found or already deleted.',
          status: 404
        }
      });
    }

    // Attempt to unlink local file from disk storage
    const absolutePath = path.resolve(__dirname, '..', '.' + report.filePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.warn(`[Reports] Could not delete file at ${absolutePath}:`, err.message);
      }
    }

    // Remove DB document
    await Report.deleteOne({ _id: report._id });

    return res.status(200).json({
      success: true,
      message: 'Forensic report and matching file deleted successfully.'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReport,
  getReports,
  getReportById,
  downloadReport,
  deleteReport
};
