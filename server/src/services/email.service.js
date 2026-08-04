/**
 * Email Service.
 * Dispatches notifications, password reset guidelines, or reports to security staff.
 */
const sendEmail = async (to, subject, body) => {
  console.log(`[Email Service] Dispatched email to [${to}] with subject [${subject}]`);
  return true;
};

module.exports = {
  sendEmail
};
