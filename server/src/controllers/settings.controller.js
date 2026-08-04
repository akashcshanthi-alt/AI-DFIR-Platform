const Settings = require('../models/Settings');
const response = require('../utils/response');

/**
 * GET /api/settings
 * Fetches the global configuration document. If none exists, creates and saves default baselines.
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }
    return response.success(res, settings, 'Global security settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings
 * Updates configurations across category blocks and returns updated values.
 */
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      // Overwrite sub-documents or root fields safely
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'object' && req.body[key] !== null) {
          settings[key] = { ...settings[key], ...req.body[key] };
        } else {
          settings[key] = req.body[key];
        }
      });
    }

    await settings.save();
    return response.success(res, settings, 'Global security settings updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
