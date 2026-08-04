const AuditLog = require('../models/AuditLog');
const response = require('../utils/response');
const { validationResult } = require('express-validator');

/**
 * GET /api/audit-logs
 * List audit logs with server-side pagination, search, sorting, and filters.
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const {
      search,
      user,
      status,
      severity,
      module: modFilter,
      startDate,
      endDate,
      sortBy,
      sortOrder
    } = req.query;

    const query = {};

    // 1. Regex search across indexed fields
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { logId: regex },
        { eventId: regex },
        { user: regex },
        { action: regex },
        { module: regex },
        { ipAddress: regex },
        { description: regex },
        { resource: regex }
      ];
    }

    // 2. Exact filters
    if (user && user !== 'All') {
      query.user = user;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (severity && severity !== 'All') {
      query.severity = severity;
    }
    if (modFilter && modFilter !== 'All') {
      query.module = modFilter;
    }

    // 3. Date range filters
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // 4. Sort execution
    const sort = {};
    const field = sortBy || 'timestamp';
    const order = sortOrder === 'asc' ? 1 : -1;
    sort[field] = order;

    // 5. Query execution
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    // Compile distinct filters for front-end dropdown lists
    const users = await AuditLog.distinct('user');
    const modules = await AuditLog.distinct('module');

    return response.success(res, {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
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
 * Retrieve a specific audit log by its logId or ObjectId.
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const id = req.params.id;
    let log = await AuditLog.findOne({ logId: id }).exec();
    if (!log) {
      log = await AuditLog.findById(id).exec();
    }

    if (!log) {
      return response.notFound(res, 'Audit log entry not found');
    }

    return response.success(res, log, 'Audit log retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/audit-logs/:id
 * Delete a specific audit log by logId or ObjectId.
 */
const deleteAuditLog = async (req, res, next) => {
  try {
    const id = req.params.id;
    let result = await AuditLog.findOneAndDelete({ logId: id }).exec();
    if (!result) {
      result = await AuditLog.findByIdAndDelete(id).exec();
    }

    if (!result) {
      return response.notFound(res, 'Audit log entry not found for deletion');
    }

    return response.success(res, null, 'Audit log entry deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/audit-logs/export
 * Export audit logs as CSV or PDF documents based on query filters.
 */
const exportAuditLogs = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      format,
      search,
      user,
      status,
      severity,
      module: modFilter,
      startDate,
      endDate
    } = req.body;

    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { logId: regex },
        { eventId: regex },
        { user: regex },
        { action: regex },
        { module: regex },
        { ipAddress: regex },
        { description: regex },
        { resource: regex }
      ];
    }

    if (user && user !== 'All') {
      query.user = user;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (severity && severity !== 'All') {
      query.severity = severity;
    }
    if (modFilter && modFilter !== 'All') {
      query.module = modFilter;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).exec();

    // 1. CSV EXPORT
    if (format === 'csv') {
      const headers = ['Timestamp', 'Log ID', 'User', 'Role', 'Action', 'Module', 'Resource', 'IP Address', 'Device', 'Browser', 'Status', 'Severity', 'Description'];
      const csvRows = [headers.join(',')];
      
      logs.forEach(log => {
        const row = [
          log.timestamp.toISOString(),
          log.logId || log.eventId,
          log.user,
          log.role || '',
          `"${log.action.replace(/"/g, '""')}"`,
          log.module || '',
          log.resource || '',
          log.ipAddress || log.ip || '',
          log.device || '',
          log.browser || '',
          log.status,
          log.severity,
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

        // Print search/filters summary
        doc.fillColor('#1e293b').fontSize(10).text('Export Parameters:', { underline: true });
        doc.text(`Search Term: ${search || 'N/A'} | Operator: ${user || 'All'} | Status: ${status || 'All'} | Severity: ${severity || 'All'}`);
        doc.text(`Timeline Scope: ${startDate || 'Earliest'} to ${endDate || 'Latest'} | Record Volume: ${logs.length}`);
        doc.moveDown(1.5);

        // Table headers layout
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
        doc.text('Timestamp', 30, doc.y, { width: 100, continued: true });
        doc.text('User', 130, doc.y, { width: 80, continued: true });
        doc.text('Action', 210, doc.y, { width: 150, continued: true });
        doc.text('Module', 360, doc.y, { width: 80, continued: true });
        doc.text('IP Address', 440, doc.y, { width: 80, continued: true });
        doc.text('Status', 520, doc.y, { width: 45 });
        doc.moveDown(0.5);
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
        doc.moveDown(0.5);

        // Table body list
        doc.font('Helvetica');
        logs.slice(0, 100).forEach(log => {
          if (doc.y > 750) {
            doc.addPage();
            // Re-render headers on new page
            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
            doc.text('Timestamp', 30, doc.y, { width: 100, continued: true });
            doc.text('User', 130, doc.y, { width: 80, continued: true });
            doc.text('Action', 210, doc.y, { width: 150, continued: true });
            doc.text('Module', 360, doc.y, { width: 80, continued: true });
            doc.text('IP Address', 440, doc.y, { width: 80, continued: true });
            doc.text('Status', 520, doc.y, { width: 45 });
            doc.moveDown(0.5);
            doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
            doc.moveDown(0.5);
            doc.font('Helvetica');
          }

          const timestampStr = new Date(log.timestamp).toISOString().slice(0, 16).replace('T', ' ');
          doc.fillColor('#334155').fontSize(8);
          doc.text(timestampStr, 30, doc.y, { width: 100, continued: true });
          doc.text(log.user || '', 130, doc.y, { width: 80, continued: true });
          doc.text(log.action || '', 210, doc.y, { width: 150, continued: true });
          doc.text(log.module || '', 360, doc.y, { width: 80, continued: true });
          doc.text(log.ipAddress || log.ip || '', 440, doc.y, { width: 80, continued: true });
          
          const isFailed = log.status === 'Failed';
          doc.fillColor(isFailed ? '#ef4444' : '#10b981');
          doc.text(log.status || '', 520, doc.y, { width: 45 });
          doc.moveDown(0.5);
        });

        if (logs.length > 100) {
          doc.moveDown();
          doc.fillColor('#64748b').fontSize(8).text(`* Output truncated to first 100 logs. Total matched records: ${logs.length}`, { align: 'center', italic: true });
        }

        doc.end();
      } catch (pdfErr) {
        console.error('Failed to generate PDF via pdfkit:', pdfErr);
        // Fallback to text file in case of native build error
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs-export.txt');
        let textString = `TRACE AI Audit Logs Export - Generated ${new Date().toISOString()}\n\n`;
        logs.forEach(log => {
          textString += `[${log.timestamp.toISOString()}] LOG_ID: ${log.logId} | USER: ${log.user} (${log.role}) | ACTION: ${log.action} | MODULE: ${log.module} | STATUS: ${log.status} | IP: ${log.ipAddress}\n`;
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
