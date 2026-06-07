const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
  name_ar: { type: String, required: true },
  name_en: { type: String },
  slug: { type: String, required: true },
});

const categorySchema = new mongoose.Schema(
  {
    name_ar: { type: String, required: true },
    name_en: { type: String },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: "📦" },
    subcategories: [subcategorySchema],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
