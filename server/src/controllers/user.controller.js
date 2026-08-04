const User = require('../models/User');
const response = require('../utils/response');
const mongoose = require('mongoose');

/**
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'Analyst user profile not found.', status: 404 }
      });
    }

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

    return response.success(res, userProfile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, department, profileImage } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'Analyst user profile not found.', status: 404 }
      });
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

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

    return response.success(res, userProfile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile/password
 * Changes the current user's password.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current and new clearance keys are required.', status: 400 }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'Operator not found.', status: 404 }
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: { message: 'Incorrect current clearance key.', status: 400 }
      });
    }

    user.password = newPassword;
    await user.save();

    return response.success(res, null, 'Clearance password changed successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users
 * Returns list of users with search, role/status filters, and pagination.
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    const query = {};

    // 1. Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { userId: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex },
        { department: searchRegex }
      ];
    }

    // 2. Exact matches
    if (role && role !== 'All') {
      query.role = role;
    }
    if (status && status !== 'All') {
      query.accountStatus = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-password')
      .exec();

    const pages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      message: 'Operators retrieved successfully',
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    const user = await User.findOne(query).select('-password').exec();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: `Operator [${id}] not found.`, status: 404 }
      });
    }

    return response.success(res, user, 'Operator retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, department, profileImage } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: `Operator [${id}] not found.`, status: 404 }
      });
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    const updated = await User.findById(user._id).select('-password');
    return response.success(res, updated, 'Operator details updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    const deleted = await User.findOneAndDelete(query).exec();
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: `Operator [${id}] not found for deletion.`, status: 404 }
      });
    }

    return response.success(res, null, 'Operator account successfully removed');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id/role
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: { message: 'Role parameter is required.', status: 400 }
      });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: `Operator [${id}] not found.`, status: 404 }
      });
    }

    user.role = role;
    await user.save();

    const updated = await User.findById(user._id).select('-password');
    return response.success(res, updated, 'Operator role updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id/status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Status parameter is required.', status: 400 }
      });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: `Operator [${id}] not found.`, status: 404 }
      });
    }

    user.accountStatus = status;
    await user.save();

    const updated = await User.findById(user._id).select('-password');
    return response.success(res, updated, 'Operator status updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus
};
