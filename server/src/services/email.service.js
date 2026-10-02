const nodemailer = require('nodemailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const EMAIL_FROM = process.env.EMAIL_FROM || '"TRACE AI Security" <no-reply@trace.ai>';

let cachedTransporter = null;

/**
 * Obtain configured Nodemailer transporter or null if unconfigured.
 */
const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10) || 587,
      secure: SMTP_SECURE === 'true' || SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS || ''
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    return cachedTransporter;
  }

  return null;
};

/**
 * Dispatch verification email to newly registered operator.
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} rawToken - Out-of-band verification token
 */
const sendVerificationEmail = async (to, name, rawToken) => {
  const verifyUrl = `${FRONTEND_URL}/verify?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(to)}`;
  const transporter = getTransporter();

  const subject = '[TRACE AI] Verify Your Security Clearance Account';
  const html = `
    <div style="background-color: #050814; color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #47FAF3; margin: 0; font-size: 24px; letter-spacing: 1px;">TRACE AI // INCIDENT RESPONSE</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">OPERATOR VERIFICATION CLEARANCE</p>
      </div>
      <div style="background-color: rgba(255,255,255,0.03); padding: 24px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 24px;">
        <p style="font-size: 15px; margin-top: 0;">Greetings Analyst <strong>${name || 'Operator'}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Your profile has been provisioned on the TRACE AI Digital Forensics & Incident Response Platform. 
          To activate your credentials and access the SOC investigation console, confirm your email address:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background-color: #0284c7; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 0.5px; display: inline-block;">
            VERIFY SECURITY CLEARANCE
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <span style="color: #38bdf8; word-break: break-all;">${verifyUrl}</span>
        </p>
      </div>
      <div style="color: #64748b; font-size: 11px; text-align: center; line-height: 1.4;">
        This clearance link expires in 24 hours. If you did not initiate this registration, please disregard.
      </div>
    </div>
  `;

  const text = `TRACE AI - OPERATOR VERIFICATION CLEARANCE\n\nGreetings ${name || 'Operator'},\n\nPlease verify your account by visiting the link below:\n${verifyUrl}\n\nThis clearance link will expire in 24 hours.`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html
      });
      console.log(`[Email Service] Verification dispatch succeeded to [${to}]`);
      return true;
    } catch (err) {
      console.error(`[Email Service] SMTP dispatch error to [${to}]:`, err.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to dispatch verification email via SMTP provider.');
      }
    }
  }

  // Fallback when SMTP credentials are not configured
  console.warn(`[Email Service] Verification email omitted for [${to}]: SMTP credentials are not configured in environment.`);
  return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
};

/**
 * Dispatch password reset email.
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} rawToken - Out-of-band password reset token
 */
const sendPasswordResetEmail = async (to, name, rawToken) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const transporter = getTransporter();

  const subject = '[TRACE AI] Password Reset Clearance Request';
  const html = `
    <div style="background-color: #050814; color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ef4444; margin: 0; font-size: 24px; letter-spacing: 1px;">TRACE AI // SECURITY COMMAND</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">CLEARANCE KEY RESET REQUEST</p>
      </div>
      <div style="background-color: rgba(255,255,255,0.03); padding: 24px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 24px;">
        <p style="font-size: 15px; margin-top: 0;">Greetings Analyst <strong>${name || 'Operator'}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          A password reset request was initiated for your TRACE AI DFIR operator account. 
          Click the clearance link below to define a new password:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #ef4444; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 0.5px; display: inline-block;">
            RESET CLEARANCE KEY
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
          If the button does not work, copy and paste this link into your browser:<br>
          <span style="color: #f87171; word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
      <div style="color: #64748b; font-size: 11px; text-align: center; line-height: 1.4;">
        This reset token expires in 1 hour and can only be used once. If you did not request this, please review SOC access logs immediately.
      </div>
    </div>
  `;

  const text = `TRACE AI - CLEARANCE KEY RESET\n\nGreetings ${name || 'Operator'},\n\nPlease reset your password by visiting the link below:\n${resetUrl}\n\nThis link expires in 1 hour and is single-use.`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html
      });
      console.log(`[Email Service] Password reset dispatch succeeded to [${to}]`);
      return { sent: true };
    } catch (err) {
      console.error(`[Email Service] SMTP dispatch error to [${to}]:`, err.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to dispatch password reset email via SMTP provider.');
      }
    }
  }

  // Fallback when SMTP credentials are not configured
  console.warn(`[Email Service] Password reset email omitted for [${to}]: SMTP credentials are not configured in environment.`);
  return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
};

/**
 * Checks whether SMTP provider is fully configured in current environment.
 */
const isConfigured = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
};

module.exports = {
  isConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail
};
