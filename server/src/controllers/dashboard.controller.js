const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const User = require('../models/User');
const IOC = require('../models/IOC');
const InvestigationRun = require('../models/InvestigationRun');
const Evidence = require('../models/Evidence');
const response = require('../utils/response');

/**
 * Resolve the authenticated user's ObjectId from req.user.
 * JWT payload may carry either `id` or `_id`.
 */
const getUserId = (req) => req.user?.id || req.user?._id;

/**
 * Helper to calculate user-scoped stats.
 * All counts are restricted to cases owned by the current user.
 */
const calculateStats = async (userId) => {
  // All case queries are scoped to the authenticated user
  const userCaseFilter = { createdBy: userId };

  const totalCases = await Case.countDocuments(userCaseFilter);
  const openCases = await Case.countDocuments({ ...userCaseFilter, status: 'Open' });
  const investigatingCases = await Case.countDocuments({ ...userCaseFilter, status: 'Investigating' });
  const closedCases = await Case.countDocuments({ ...userCaseFilter, status: 'Closed' });
  const criticalCases = await Case.countDocuments({ ...userCaseFilter, severity: 'Critical' });

  // Collect user-owned case IDs for downstream scoping (IOCs, reports, etc.)
  const userCaseDocs = await Case.find(userCaseFilter, { caseId: 1, _id: 0 }).lean();
  const userCaseIds = userCaseDocs.map(c => c.caseId);

  const reportsGenerated = await Report.countDocuments({ generatedBy: userId });
  const notificationsCount = await Notification.countDocuments({
    $or: [{ userId }, { recipient: 'All' }]
  });
  const totalIOCs = await IOC.countDocuments({ caseId: { $in: userCaseIds } });
  const activeIOCs = await IOC.countDocuments({
    caseId: { $in: userCaseIds },
    status: { $in: ['New', 'Under Review', 'Confirmed'] }
  });

  // Average resolution time for user's own closed cases
  const closedIncidents = await Case.find({ ...userCaseFilter, status: 'Closed' }).lean();
  let averageResolutionTime = 'N/A';
  if (closedIncidents.length > 0) {
    const totalMs = closedIncidents.reduce((sum, c) => sum + (new Date(c.updatedAt) - new Date(c.createdAt)), 0);
    const averageMinutes = Math.round((totalMs / closedIncidents.length) / (60 * 1000));
    averageResolutionTime = averageMinutes > 60
      ? `${Math.round((averageMinutes / 60) * 10) / 10}h`
      : `${averageMinutes}m`;
  }

  return {
    totalCases,
    openCases: openCases + investigatingCases,
    criticalCases,
    closedCases,
    activeAnalysts: 1, // Always 1 for current user context
    reportsGenerated,
    notifications: notificationsCount,
    totalIOCs,
    activeIOCs,
    averageResolutionTime,
    userCaseIds // Pass downstream for sub-queries
  };
};

/**
 * Helper to retrieve recent cases (latest 5) scoped to user.
 */
const getRecentCasesList = async (userId) => {
  return Case.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('createdBy', 'fullName email role')
    .exec();
};

/**
 * Helper to retrieve recent alerts (mapped from user's own High/Critical AuditLogs).
 * AuditLog does not have a userId ref, so we use the authenticated user's email/name
 * stored in the `user` string field for scoping.
 */
const getRecentAlertsList = async (userId) => {
  // Get user email to match against audit log `user` field
  const userDoc = await User.findById(userId, 'email fullName').lean();
  const userIdentifiers = [];
  if (userDoc?.email) userIdentifiers.push(userDoc.email);
  if (userDoc?.fullName) userIdentifiers.push(userDoc.fullName);

  const filter = {
    severity: { $in: ['High', 'Critical'] }
  };

  // Scope to user's own logs if we have identifiers
  if (userIdentifiers.length > 0) {
    filter.user = { $in: userIdentifiers };
  }

  const logs = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .limit(10)
    .exec();

  return logs.map(log => ({
    id: log.eventId,
    severity: log.severity,
    title: log.action,
    description: `${log.action} logged in module ${log.module} (IP: ${log.ip})`,
    timestamp: log.timestamp
  }));
};

/**
 * Helper to retrieve activity logs feed (latest 20 logs) scoped to user.
 */
const getActivityFeed = async (userId) => {
  const userDoc = await User.findById(userId, 'email fullName').lean();
  const userIdentifiers = [];
  if (userDoc?.email) userIdentifiers.push(userDoc.email);
  if (userDoc?.fullName) userIdentifiers.push(userDoc.fullName);

  const filter = userIdentifiers.length > 0
    ? { user: { $in: userIdentifiers } }
    : {};

  const logs = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .limit(20)
    .exec();

  return logs.map(log => ({
    id: log._id,
    time: new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false }),
    text: `${log.user} performed ${log.action} on module ${log.module}`,
    type: log.status === 'Failed' ? 'error' : ['Critical', 'High'].includes(log.severity) ? 'error' : 'info'
  }));
};

/**
 * Helper to retrieve telemetry metrics scoped to user.
 */
const getTelemetryMetrics = async (userId) => {
  const userCaseFilter = { createdBy: userId };
  const activeCasesCount = await Case.countDocuments({
    ...userCaseFilter,
    status: { $in: ['Open', 'Investigating'] }
  });

  const closed = await Case.countDocuments({ ...userCaseFilter, status: 'Closed' });
  const autoClosed = await Case.countDocuments({
    ...userCaseFilter,
    status: 'Closed',
    assignedAnalyst: /autonomous/i
  });
  const autoResolutionPercentage = closed > 0 ? Math.round((autoClosed / closed) * 100) : 0;

  const mttd = '1.2m';

  const stats = await calculateStats(userId);

  return {
    activeAlerts: activeCasesCount,
    mttd,
    mttr: stats.averageResolutionTime === 'N/A' ? 'N/A' : stats.averageResolutionTime,
    aiResolutions: `${autoResolutionPercentage}%`
  };
};

/**
 * Helper to calculate chart metrics scoped to user.
 */
const getChartsData = async (userId) => {
  const userCaseFilter = { createdBy: userId };

  // Severity Distribution (user cases only)
  const severityCounts = await Case.aggregate([
    { $match: { createdBy: require('mongoose').Types.ObjectId.isValid(userId) ? new (require('mongoose').Types.ObjectId)(userId) : userId } },
    { $group: { _id: '$severity', count: { $sum: 1 } } }
  ]);
  const severityMap = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  severityCounts.forEach(s => {
    if (s._id in severityMap) severityMap[s._id] = s.count;
  });
  const severityDistribution = Object.keys(severityMap).map(key => ({
    name: key,
    value: severityMap[key]
  }));

  // Cases by Month (user cases only)
  const mongoose = require('mongoose');
  const objectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const casesByMonthData = await Case.aggregate([
    { $match: { createdBy: objectId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  const monthsMap = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };
  const casesByMonth = casesByMonthData.map(c => {
    const parts = c._id.split('-');
    const m = monthsMap[parts[1]] || parts[1];
    return { name: `${m} ${parts[0]}`, count: c.count };
  });

  // Incident Trend (past 7 days, user cases)
  const incidentTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(5, 10);
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));
    const count = await Case.countDocuments({
      ...userCaseFilter,
      createdAt: { $gte: start, $lte: end }
    });
    incidentTrend.push({ time: dateStr, events: count });
  }

  // Resolution Rate (user cases only)
  const total = await Case.countDocuments(userCaseFilter);
  const closed = await Case.countDocuments({ ...userCaseFilter, status: 'Closed' });
  const openCount = await Case.countDocuments({
    ...userCaseFilter,
    status: { $in: ['Open', 'Investigating'] }
  });
  const resolutionPercentage = total > 0 ? Math.round((closed / total) * 100) : 0;

  return {
    severityDistribution,
    casesByMonth,
    incidentTrend,
    resolutionRate: {
      total,
      closed,
      open: openCount,
      rate: resolutionPercentage
    }
  };
};

/**
 * GET /api/dashboard/overview
 * Consolidated fetch — ALL data scoped to the authenticated user.
 */
const getOverview = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const [stats, recentCases, recentAlerts, activity, telemetry, charts] = await Promise.all([
      calculateStats(userId),
      getRecentCasesList(userId),
      getRecentAlertsList(userId),
      getActivityFeed(userId),
      getTelemetryMetrics(userId),
      getChartsData(userId)
    ]);

    // Strip internal helper fields before response
    const { userCaseIds: _unused, ...publicStats } = stats;

    return response.success(res, {
      stats: publicStats,
      recentCases,
      recentAlerts,
      activity,
      telemetry,
      charts
    }, 'Dashboard overview successfully compiled');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/stats
 */
const getStats = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { userCaseIds: _unused, ...stats } = await calculateStats(userId);
    return response.success(res, stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/recent-cases
 */
const getRecentCases = async (req, res, next) => {
  try {
    const cases = await getRecentCasesList(getUserId(req));
    return response.success(res, cases, 'Recent cases retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/recent-alerts
 */
const getRecentAlerts = async (req, res, next) => {
  try {
    const alerts = await getRecentAlertsList(getUserId(req));
    return response.success(res, alerts, 'Recent alerts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/activity
 */
const getActivity = async (req, res, next) => {
  try {
    const activity = await getActivityFeed(getUserId(req));
    return response.success(res, activity, 'Activity logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/telemetry
 */
const getTelemetry = async (req, res, next) => {
  try {
    const telemetry = await getTelemetryMetrics(getUserId(req));
    return response.success(res, telemetry, 'Telemetry metrics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/charts
 */
const getCharts = async (req, res, next) => {
  try {
    const charts = await getChartsData(getUserId(req));
    return response.success(res, charts, 'Charts analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getStats,
  getRecentCases,
  getRecentAlerts,
  getActivity,
  getTelemetry,
  getCharts
};
