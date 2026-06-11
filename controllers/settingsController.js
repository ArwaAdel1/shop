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
      return res.json(settings);
    }

    // ── Top-level scalar fields ──────────────────────────────────
    const scalarFields = [
      "siteName_ar","siteName_en","heroTitle_ar","heroSubtitle_ar",
      "heroImage","logo","aboutUs_ar","footerText_ar",
    ];
    scalarFields.forEach(f => {
      if (f in req.body) settings[f] = req.body[f];
    });

    // ── contact: merge key by key ────────────────────────────────
    if (req.body.contact) {
      const c = req.body.contact;
      Object.keys(c).forEach(k => {
        settings.contact[k] = c[k];
      });
      settings.markModified("contact");
    }

    // ── payment: merge each method's fields individually ─────────
    // هنا جوهر الإصلاح — كل وسيلة بتتعمل merge على حدة
    // عشان isActive:false متمسحش الـ number والـ name
    if (req.body.payment) {
      const p = req.body.payment;
      const methods = ["vodafoneCash","etisalatCash","fawry","instaPay","cashOnDelivery"];
      methods.forEach(method => {
        if (p[method] !== undefined) {
          // existing sub-doc كـ plain object
          const existing = settings.payment?.[method]?.toObject
            ? settings.payment[method].toObject()
            : (settings.payment?.[method] || {});
          // merge — القيم الجديدة بتكتب فوق القديمة، الباقي بيفضل
          settings.payment[method] = { ...existing, ...p[method] };
        }
      });
      settings.markModified("payment");
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getSettings, updateSettings };