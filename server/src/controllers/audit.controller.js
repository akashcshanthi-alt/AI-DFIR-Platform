const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const response = require('../utils/response');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Resolve the authenticated user's ID from req.user.
 */
const getUserId = (req) => req.user?.id || req.user?._id;

/**
 * Helper to retrieve user identifiers and check RBAC clearance.
 */
const getUserAuthContext = async (req) => {
  const userId = getUserId(req);
  let userDoc = null;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    userDoc = await User.findById(userId, 'email fullName userId role').lean();
  }

  const role = req.user?.role || userDoc?.role || 'Investigator';
  const isPrivilegedAdmin = ['Super Admin', 'Admin'].includes(role);

  const identifiers = [];
  if (userDoc?.email) identifiers.push(userDoc.email.toLowerCase());
  if (userDoc?.fullName) identifiers.push(userDoc.fullName);
  if (userDoc?.userId) identifiers.push(userDoc.userId);
  if (userId) identifiers.push(String(userId));
  if (req.user?.email && !identifiers.includes(req.user.email.toLowerCase())) {
    identifiers.push(req.user.email.toLowerCase());
  }
  if (req.user?.userId && !identifiers.includes(req.user.userId)) {
    identifiers.push(req.user.userId);
  }

  return {
    userId,
    userDoc,
    role,
    isPrivilegedAdmin,
    identifiers
  };
};

/**
 * GET /api/audit-logs
 * List audit logs with server-side pagination, search, sorting, and user-scoped authorization.
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { isPrivilegedAdmin, identifiers } = await getUserAuthContext(req);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const {
      search,
      user: targetUser,
      status,
      severity,
      module: modFilter,
      startDate,
      endDate,
      sortBy,
      sortOrder
    } = req.query;

    const andConditions = [];

    // 1. User scoping: Non-admins can ONLY see their own audit records
    if (!isPrivilegedAdmin) {
      andConditions.push({ user: { $in: identifiers } });
    } else if (targetUser && targetUser !== 'All') {
      // Privileged admin filtering by user
      andConditions.push({ user: targetUser });
    }

    // 2. Search across indexed fields
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      andConditions.push({
        $or: [
          { logId: regex },
          { eventId: regex },
          { user: regex },
          { action: regex },
          { module: regex },
          { ipAddress: regex },
          { description: regex },
          { resource: regex }
        ]
      });
    }

    // 3. Exact status, severity, and module filters
    if (status && status !== 'All') {
      andConditions.push({ status });
    }
    if (severity && severity !== 'All') {
      andConditions.push({ severity });
    }
    if (modFilter && modFilter !== 'All') {
      andConditions.push({ module: modFilter });
    }

    // 4. Date range filters
    if (startDate || endDate) {
      const dateRange = {};
      if (startDate) dateRange.$gte = new Date(startDate);
      if (endDate) dateRange.$lte = new Date(endDate);
      andConditions.push({ timestamp: dateRange });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    // 5. Sort execution
    const sort = {};
    const field = sortBy || 'timestamp';
    const order = sortOrder === 'asc' ? 1 : -1;
    sort[field] = order;

    // 6. Query execution
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    // Distinct dropdown values scoped appropriately
    const distinctScope = !isPrivilegedAdmin ? { user: { $in: identifiers } } : {};
    const users = await AuditLog.distinct('user', distinctScope);
    const modules = await AuditLog.distinct('module', distinctScope);

    return response.success(res, {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      },
      filters: {
        users,
        modules
      }
    }, 'Audit logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/audit-logs/:id
 * Retrieve a specific audit log by its logId or ObjectId, strictly verifying authorization.
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const { isPrivilegedAdmin, identifiers } = await getUserAuthContext(req);
    const id = req.params.id;

    const idCondition = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { logId: id }, { eventId: id }] }
      : { $or: [{ logId: id }, { eventId: id }] };

    const andConditions = [idCondition];
    if (!isPrivilegedAdmin) {
      andConditions.push({ user: { $in: identifiers } });
    }

    const log = await AuditLog.findOne({ $and: andConditions }).exec();

    if (!log) {
      return response.notFound(res, 'Audit log entry not found or access unauthorized.');
    }

    return response.success(res, log, 'Audit log retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/audit-logs/:id
 * Delete a specific audit log by logId or ObjectId, strictly verifying authorization.
 */
const deleteAuditLog = async (req, res, next) => {
  try {
    const { isPrivilegedAdmin, identifiers } = await getUserAuthContext(req);
    const id = req.params.id;

    const idCondition = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { logId: id }, { eventId: id }] }
      : { $or: [{ logId: id }, { eventId: id }] };

    const andConditions = [idCondition];
    if (!isPrivilegedAdmin) {
      andConditions.push({ user: { $in: identifiers } });
    }

    const result = await AuditLog.findOneAndDelete({ $and: andConditions }).exec();

    if (!result) {
      return response.notFound(res, 'Audit log entry not found for deletion or access unauthorized.');
    }

    return response.success(res, null, 'Audit log entry deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/audit-logs/export
 * Export authorized audit logs as CSV or PDF documents.
 */
const exportAuditLogs = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { isPrivilegedAdmin, identifiers } = await getUserAuthContext(req);

    const {
      format,
      search,
      user: targetUser,
      status,
      severity,
      module: modFilter,
      startDate,
      endDate
    } = req.body;

    const andConditions = [];

    if (!isPrivilegedAdmin) {
      andConditions.push({ user: { $in: identifiers } });
    } else if (targetUser && targetUser !== 'All') {
      andConditions.push({ user: targetUser });
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      andConditions.push({
        $or: [
          { logId: regex },
          { eventId: regex },
          { user: regex },
          { action: regex },
          { module: regex },
          { ipAddress: regex },
          { description: regex },
          { resource: regex }
        ]
      });
    }

    if (status && status !== 'All') {
      andConditions.push({ status });
    }
    if (severity && severity !== 'All') {
      andConditions.push({ severity });
    }
    if (modFilter && modFilter !== 'All') {
      andConditions.push({ module: modFilter });
    }

    if (startDate || endDate) {
      const dateRange = {};
      if (startDate) dateRange.$gte = new Date(startDate);
      if (endDate) dateRange.$lte = new Date(endDate);
      andConditions.push({ timestamp: dateRange });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).exec();

    // 1. CSV EXPORT
    if (format === 'csv') {
      const headers = ['Timestamp', 'Log ID', 'User', 'Role', 'Action', 'Module', 'Resource', 'IP Address', 'Device', 'Browser', 'Status', 'Severity', 'Description'];
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const row = [
          log.timestamp ? log.timestamp.toISOString() : new Date().toISOString(),
          log.logId || log.eventId || '',
          log.user || '',
          log.role || '',
          `"${(log.action || '').replace(/"/g, '""')}"`,
          log.module || '',
          log.resource || '',
          log.ipAddress || log.ip || '',
          log.device || '',
          log.browser || '',
          log.status || '',
          log.severity || '',
          `"${(log.description || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      return res.send(csvString);
    }

    // 2. PDF EXPORT
    if (format === 'pdf') {
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.pdf');
        doc.pipe(res);

        // Header Title
        doc.fillColor('#0b132b').fontSize(16).text('TRACE AI DFIR Platform - Audit Trail Logs', { align: 'center' });
        doc.fontSize(10).fillColor('#64748b').text(`Generated at: ${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown();

        // Print summary
        doc.fillColor('#1e293b').fontSize(10).text('Export Parameters:', { underline: true });
        doc.text(`Search: ${search || 'N/A'} | Status: ${status || 'All'} | Severity: ${severity || 'All'} | Total Records: ${logs.length}`);
        doc.moveDown(1.5);

        // Table headers layout
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
        doc.text('Timestamp', 30, doc.y, { width: 110, continued: true });
        doc.text('User', 140, doc.y, { width: 100, continued: true });
        doc.text('Action', 240, doc.y, { width: 130, continued: true });
        doc.text('Module', 370, doc.y, { width: 90, continued: true });
        doc.text('IP Address', 460, doc.y, { width: 65, continued: true });
        doc.text('Status', 525, doc.y, { width: 45 });
        doc.moveDown(0.5);
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
        doc.moveDown(0.5);

        // Table body list
        doc.font('Helvetica');
        logs.slice(0, 100).forEach(log => {
          if (doc.y > 750) {
            doc.addPage();
            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
            doc.text('Timestamp', 30, doc.y, { width: 110, continued: true });
            doc.text('User', 140, doc.y, { width: 100, continued: true });
            doc.text('Action', 240, doc.y, { width: 130, continued: true });
            doc.text('Module', 370, doc.y, { width: 90, continued: true });
            doc.text('IP Address', 460, doc.y, { width: 65, continued: true });
            doc.text('Status', 525, doc.y, { width: 45 });
            doc.moveDown(0.5);
            doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
            doc.moveDown(0.5);
            doc.font('Helvetica');
          }

          const timestampStr = log.timestamp ? new Date(log.timestamp).toISOString().slice(0, 16).replace('T', ' ') : 'N/A';
          doc.fillColor('#334155').fontSize(8);
          doc.text(timestampStr, 30, doc.y, { width: 110, continued: true });
          doc.text(log.user || '', 140, doc.y, { width: 100, continued: true });
          doc.text(log.action || '', 240, doc.y, { width: 130, continued: true });
          doc.text(log.module || '', 370, doc.y, { width: 90, continued: true });
          doc.text(log.ipAddress || log.ip || '', 460, doc.y, { width: 65, continued: true });
          
          const isFailed = log.status === 'Failed';
          doc.fillColor(isFailed ? '#ef4444' : '#10b981');
          doc.text(log.status || 'Success', 525, doc.y, { width: 45 });
          doc.moveDown(0.5);
        });

        if (logs.length > 100) {
          doc.moveDown();
          doc.fillColor('#64748b').fontSize(8).text(`* Output truncated to first 100 logs. Total matched records: ${logs.length}`, { align: 'center', italic: true });
        }

        doc.end();
      } catch (pdfErr) {
        console.error('Failed to generate PDF via pdfkit:', pdfErr);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs-export.txt');
        let textString = `TRACE AI Audit Logs Export - Generated ${new Date().toISOString()}\n\n`;
        logs.forEach(log => {
          textString += `[${log.timestamp ? log.timestamp.toISOString() : ''}] LOG_ID: ${log.logId} | USER: ${log.user} | ACTION: ${log.action} | MODULE: ${log.module} | STATUS: ${log.status} | IP: ${log.ipAddress}\n`;
        });
        return res.send(textString);
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  deleteAuditLog,
  exportAuditLogs
};
