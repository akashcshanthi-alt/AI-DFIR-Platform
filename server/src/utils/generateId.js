/**
 * Simple identifier token generator for security objects (e.g. cases, audit logs).
 */
const generateId = (prefix = 'CASE') => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
};

module.exports = generateId;
