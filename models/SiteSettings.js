const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    siteName_ar: { type: String, default: "متجرنا" },
    siteName_en: { type: String, default: "Our Store" },
    logo: { type: String },
    heroTitle_ar: { type: String },
    heroSubtitle_ar: { type: String },
    heroImage: { type: String },

    contact: {
      phone: { type: String },
      whatsapp: { type: String },
      email: { type: String },
      address_ar: { type: String },
      facebook: { type: String },
      instagram: { type: String },
      tiktok: { type: String },
    },

    payment: {
      vodafoneCash: { number: String, name: String, isActive: { type: Boolean, default: true } },
      etisalatCash: { number: String, name: String, isActive: { type: Boolean, default: true } },
      fawry: { code: String, instructions_ar: String, isActive: { type: Boolean, default: true } },
      instaPay: { username: String, instructions_ar: String, isActive: { type: Boolean, default: true } },
    },

    aboutUs_ar: { type: String },
    footerText_ar: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
