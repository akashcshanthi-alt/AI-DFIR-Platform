/**
 * Shared platform constraints, roles, and status enums.
 */
const ROLES = {
  ADMIN: 'Admin',
  ANALYST: 'Analyst',
  INVESTIGATOR: 'Investigator'
};

const CASE_STATUS = {
  QUEUED: 'Queued',
  TRIAGE: 'Triage',
  ANALYSIS: 'Analysis',
  CONTAINMENT: 'Containment',
  CLOSED: 'Closed'
};

const SEVERITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

module.exports = {
  ROLES,
  CASE_STATUS,
  SEVERITIES
};
