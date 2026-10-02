const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const response = require('../utils/response');
const emailService = require('../services/email.service');

/**
 * Validate and retrieve JWT_SECRET from environment.
 * Fails closed if the secret is missing.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing. Authentication service cannot sign tokens.');
  }
  return secret;
};

/**
 * Validate and retrieve JWT_REFRESH_SECRET from environment.
 * Fails closed if the secret is missing.
 */
const getJwtRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is missing. Authentication service cannot sign refresh tokens.');
  }
  return secret;
};

/**
 * Sign JWT Access Token (Valid for 7 days in development, 15m in production unless specified).
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, userId: user.userId, role: user.role, email: user.email },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '15m' : '7d') }
  );
};

/**
 * Sign JWT Refresh Token (Valid for 7 days).
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    getJwtRefreshSecret(),
    { expiresIn: '7d' }
  );
};

/**
 * Build sanitized user profile object for client responses.
 */
const sanitizeUserProfile = (user) => ({
  id: user._id,
  userId: user.userId,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  department: user.department,
  phone: user.phone,
  profileImage: user.profileImage,
  emailVerified: user.emailVerified,
  accountStatus: user.accountStatus,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, department, phone, profileImage } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    // Check email uniqueness
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'An operator with this email address is already registered.',
          status: 400
        }
      });
    }

    // Generate cryptographically secure email verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role: role || 'Investigator',
      department: department ? department.trim() : '',
      phone: phone ? phone.trim() : '',
      profileImage: profileImage || '',
      emailVerified: false,
      verificationToken: hashedVerificationToken,
      verificationTokenExpires: verificationExpiry
    });

    await newUser.save();

    // Dispatch verification email out-of-band with the unhashed raw token
    try {
      await emailService.sendVerificationEmail(newUser.email, newUser.fullName, rawVerificationToken);
    } catch (emailErr) {
      console.error('[Auth Controller] Error dispatching verification email:', emailErr.message);
    }

    const userProfile = sanitizeUserProfile(newUser);

    return response.success(
      res,
      userProfile,
      'Operator account created successfully. A verification link has been dispatched to your email.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST or GET /api/auth/verify-email
 * Verifies email using cryptographic token.
 */
const verifyEmail = async (req, res, next) => {
  try {
    const token = req.body?.token || req.query?.token;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Verification token is required.',
          status: 400
        }
      });
    }

    // Hash the token to compare against stored hash
    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Verification token is invalid or has expired.',
          status: 400
        }
      });
    }

    // Mark as verified and invalidate token (single-use)
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return response.success(
      res,
      { email: user.email, emailVerified: true },
      'Operator email verified successfully. You can now login.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-verification
 * Resends verification email with rate-limiting/cooldown.
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email address is required.',
          status: 400
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && !user.emailVerified) {
      // Cooldown check: 60 seconds
      if (user.lastVerificationResend) {
        const elapsed = Date.now() - new Date(user.lastVerificationResend).getTime();
        if (elapsed < 60000) {
          const remainingSecs = Math.ceil((60000 - elapsed) / 1000);
          return res.status(429).json({
            success: false,
            error: {
              message: `Please wait ${remainingSecs}s before requesting another verification email.`,
              status: 429
            }
          });
        }
      }

      // Generate new token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.verificationToken = hashedToken;
      user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.lastVerificationResend = new Date();
      await user.save();

      try {
        await emailService.sendVerificationEmail(user.email, user.fullName, rawToken);
      } catch (err) {
        console.error('[Auth Controller] Error resending verification email:', err.message);
      }
    }

    // Always return generic response to prevent user enumeration
    return response.success(
      res,
      null,
      'If an unverified operator account exists with this email address, a verification link has been dispatched.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password.',
          status: 401
        }
      });
    }

    // Verify account status
    if (user.accountStatus !== 'Active') {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Operator account status is ${user.accountStatus}.`,
          status: 403
        }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password.',
          status: 401
        }
      });
    }

    // Enforce email verification before login
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Email address has not been verified. Please verify your email before logging in.',
          code: 'EMAIL_NOT_VERIFIED',
          status: 403
        }
      });
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userProfile = sanitizeUserProfile(user);

    // Record login audit event
    try {
      await AuditLog.create({
        user: user.email,
        role: user.role,
        action: 'LOGIN_SUCCESS',
        module: 'AUTH',
        resource: 'User Session',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        status: 'Success',
        severity: 'Low',
        description: `Operator ${user.fullName} (${user.email}) logged in successfully.`
      });
    } catch (auditErr) {
      console.warn('[Audit Log Warning] Failed to log login event:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: userProfile,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    try {
      if (req.user?.email || req.body?.email) {
        await AuditLog.create({
          user: req.user?.email || req.body?.email || 'Operator',
          role: req.user?.role || 'Investigator',
          action: 'LOGOUT_SUCCESS',
          module: 'AUTH',
          resource: 'User Session',
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
          status: 'Success',
          severity: 'Low',
          description: `Operator logged out.`
        });
      }
    } catch (auditErr) {
      console.warn('[Audit Log Warning] Failed to log logout event:', auditErr.message);
    }
    return response.success(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email address is required.',
          status: 400
        }
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Cooldown check: 60 seconds
      if (user.lastPasswordResetRequest) {
        const elapsed = Date.now() - new Date(user.lastPasswordResetRequest).getTime();
        if (elapsed < 60000) {
          // Return generic success to avoid leaking timing details
          return response.success(
            res,
            null,
            'If an operator account exists with this email address, a password reset link has been dispatched.'
          );
        }
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiry = new Date(Date.now() + 3600000); // 1 hour validity

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = expiry;
      user.lastPasswordResetRequest = new Date();
      await user.save();

      try {
        await emailService.sendPasswordResetEmail(user.email, user.fullName, rawToken);
      } catch (err) {
        console.error('[Auth Controller] Error dispatching password reset email:', err.message);
      }
    }

    // Always return ambiguous generic response
    return response.success(
      res,
      null,
      'If an operator account exists with this email address, a password reset link has been dispatched.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Token and new password are required.',
          status: 400
        }
      });
    }

    // Hash the token to compare against stored hash
    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password reset token is invalid or has expired.',
          status: 400
        }
      });
    }

    // Set new password (will trigger user schema pre-save hashing)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return response.success(res, null, 'Clearance password reset successfully. You can now login.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/google
 * Handles Google OAuth authenticated users.
 * Cryptographic token verification is strictly required. Arbitrary email-only authentication is prohibited.
 */
// Cache for Google's public certificates (TTL: 1 hour)
let cachedGoogleCerts = null;
let cachedGoogleCertsExpiry = 0;

const fetchGooglePublicCerts = async () => {
  const now = Date.now();
  if (cachedGoogleCerts && cachedGoogleCertsExpiry > now) {
    return cachedGoogleCerts;
  }
  try {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    if (res.ok) {
      cachedGoogleCerts = await res.json();
      cachedGoogleCertsExpiry = now + 3600000;
      return cachedGoogleCerts;
    }
  } catch (err) {
    console.warn('[Google SSO] Error fetching Google public certs:', err.message);
  }
  return null;
};

/**
 * Cryptographically verify Google OAuth or Firebase ID token.
 * Returns verified profile or null if token is forged, expired, or unverified.
 */
const verifyGoogleOrFirebaseToken = async (token) => {
  if (!token || typeof token !== 'string') return null;

  // 1. Try Google OAuth tokeninfo verification (for Google OAuth ID tokens)
  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
    if (googleRes.ok) {
      const payload = await googleRes.json();
      const isEmailVerified = payload.email_verified === 'true' || payload.email_verified === true;
      if (payload.email && isEmailVerified) {
        return {
          email: payload.email.toLowerCase(),
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture || ''
        };
      }
    }
  } catch (networkErr) {
    console.warn('[Google SSO] Google tokeninfo verification network error:', networkErr.message);
  }

  // 2. Cryptographic Firebase ID Token verification using Google's public x509 certificates
  try {
    const decodedComplete = jwt.decode(token, { complete: true });
    if (decodedComplete && decodedComplete.header && decodedComplete.header.kid) {
      const kid = decodedComplete.header.kid;
      const certs = await fetchGooglePublicCerts();
      if (certs && certs[kid]) {
        const cert = certs[kid];
        const projectId = process.env.FIREBASE_PROJECT_ID || 'ai-dfir-platform';
        const verified = jwt.verify(token, cert, {
          algorithms: ['RS256'],
          audience: projectId,
          issuer: `https://securetoken.google.com/${projectId}`
        });
        if (verified && verified.email && verified.email_verified) {
          return {
            email: verified.email.toLowerCase(),
            name: verified.name || verified.email.split('@')[0],
            picture: verified.picture || ''
          };
        }
      }
    }
  } catch (jwtErr) {
    console.warn('[Google SSO] Cryptographic token verification failed:', jwtErr.message);
  }

  // Fails closed if verification fails
  return null;
};

/**
 * POST /api/auth/google
 * Handles Google OAuth authenticated users.
 * Cryptographic token verification is strictly required. Arbitrary email-only authentication is prohibited.
 */
const googleLogin = async (req, res, next) => {
  try {
    const { idToken, credential } = req.body;
    const token = idToken || credential;

    // Reject insecure arbitrary email authentication requests
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cryptographic identity token (idToken) is required for Google SSO. Insecure email-only authentication is prohibited.',
          status: 400
        }
      });
    }

    const verifiedProfile = await verifyGoogleOrFirebaseToken(token);

    // Fail closed if cryptographic verification failed
    if (!verifiedProfile || !verifiedProfile.email) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Google SSO verification failed. Invalid, unverified, or expired identity token.',
          status: 401
        }
      });
    }

    const { email: verifiedEmail, name: verifiedName, picture: verifiedPicture } = verifiedProfile;

    // Find or create operator account
    let user = await User.findOne({ email: verifiedEmail });
    if (!user) {
      user = new User({
        fullName: verifiedName,
        email: verifiedEmail,
        role: 'Investigator',
        department: 'TRACE Security Command',
        emailVerified: true, // Verified by Google identity provider
        password: crypto.randomBytes(24).toString('hex'), // satisfies Mongoose required key
        profileImage: verifiedPicture
      });
      await user.save();
    } else {
      if (!user.emailVerified) {
        user.emailVerified = true;
      }
      if (verifiedPicture && !user.profileImage) {
        user.profileImage = verifiedPicture;
      }
      if (verifiedName && (!user.fullName || user.fullName === 'Security Analyst')) {
        user.fullName = verifiedName;
      }
      await user.save();
    }

    // Verify account status
    if (user.accountStatus !== 'Active') {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Operator account status is ${user.accountStatus}.`,
          status: 403
        }
      });
    }

    const appToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userProfile = sanitizeUserProfile(user);

    try {
      await AuditLog.create({
        user: user.email,
        role: user.role,
        action: 'GOOGLE_LOGIN_SUCCESS',
        module: 'AUTH',
        resource: 'User Session',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        status: 'Success',
        severity: 'Low',
        description: `Operator ${user.fullName} (${user.email}) authenticated via Google SSO.`
      });
    } catch (auditErr) {
      console.warn('[Audit Log Warning] Failed to log Google SSO login event:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Google federated login successful',
      token: appToken,
      refreshToken,
      user: userProfile,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  forgotPassword,
  resetPassword,
  googleLogin
};
