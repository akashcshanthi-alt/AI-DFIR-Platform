const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const response = require('../utils/response');

/**
 * Sign JWT Access Token (Valid for 15 minutes).
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, userId: user.userId, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'fallback-secret-key-12345',
    { expiresIn: '15m' }
  );
};

/**
 * Sign JWT Refresh Token (Valid for 7 days).
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key-12345',
    { expiresIn: '7d' }
  );
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, department, phone, profileImage } = req.body;

    // Check email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'An operator with this email address is already registered.',
          status: 400
        }
      });
    }

    const newUser = new User({
      fullName,
      email,
      password,
      role,
      department,
      phone,
      profileImage
    });

    await newUser.save();

    const userProfile = {
      id: newUser._id,
      userId: newUser.userId,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      phone: newUser.phone,
      profileImage: newUser.profileImage,
      emailVerified: newUser.emailVerified,
      accountStatus: newUser.accountStatus,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    return response.success(res, userProfile, 'User registered successfully', 201);
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

    const user = await User.findOne({ email });
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

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userProfile = {
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
    };

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

    const user = await User.findOne({ email });
    if (!user) {
      // Avoid leaking registration state; return ambiguous success
      return response.success(res, null, 'If an operator account exists with this email address, a password reset link has been generated.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour validity

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiry;
    await user.save();

    console.log(`\n======================================================`);
    console.log(`[Email Service Mock] Password Reset Requested!`);
    console.log(`Recipient: ${email}`);
    console.log(`Reset link: http://localhost:5000/api/auth/reset-password?token=${token}`);
    console.log(`======================================================\n`);

    return response.success(res, null, 'If an operator account exists with this email address, a password reset link has been generated.');
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

    const user = await User.findOne({
      resetPasswordToken: token,
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
 */
const googleLogin = async (req, res, next) => {
  try {
    const { email, fullName, profileImage } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Operator email address is required.', status: 400 }
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Create user if they do not exist
      user = new User({
        fullName: fullName || email.split('@')[0],
        email: email,
        role: 'Analyst',
        department: 'Google SSO',
        emailVerified: true,
        password: crypto.randomBytes(16).toString('hex'), // satisfies Mongoose required key
        profileImage: profileImage || ''
      });
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

    // Automatically set emailVerified = true if it wasn't
    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userProfile = {
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
    };

    return res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
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
  login,
  logout,
  forgotPassword,
  resetPassword,
  googleLogin
};
