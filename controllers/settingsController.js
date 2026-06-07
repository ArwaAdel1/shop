const SiteSettings = require("../models/SiteSettings");

// GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create(req.body);
    } else {
      // Deep merge nested objects
      const fields = ["contact", "payment"];
      for (const field of fields) {
        if (req.body[field]) {
          settings[field] = { ...settings[field]?.toObject(), ...req.body[field] };
          delete req.body[field];
        }
      }
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getSettings, updateSettings };
