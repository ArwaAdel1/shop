const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name_ar: { type: String, required: true, trim: true },
    name_en: { type: String, trim: true },
    description_ar: { type: String },
    description_en: { type: String },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategorySlug: { type: String },
    brand: { type: String },
    sku: { type: String, unique: true, sparse: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    specs: [{ key: String, value: String }],
  },
  { timestamps: true }
);

productSchema.index({ name_ar: "text", name_en: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
