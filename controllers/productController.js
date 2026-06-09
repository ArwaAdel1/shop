const Product = require("../models/Product");

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, subcategory, featured, search, page = 1, limit = 12, active, priceMin, priceMax, sortBy, sortOrder, inStock } = req.query;
    const query = {};

    if (category) query.category = category;
    if (subcategory) query.subcategorySlug = subcategory;
    if (featured === "true") query.isFeatured = true;
    if (active !== undefined) query.isActive = active === "true";
    // فلتر: عرض المنتجات المتاحة فقط (stock > 0 لو trackStock=true)
    if (inStock === "true") {
      query.$or = [{ trackStock: false }, { trackStock: true, stock: { $gt: 0 } }];
    }
    if (search) {
      query.$or = [
        { name_ar: { $regex: search, $options: "i" } },
        { name_en: { $regex: search, $options: "i" } },
        { description_ar: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // Price filter
    if (priceMin) query.price = { ...query.price, $gte: Number(priceMin) };
    if (priceMax) query.price = { ...query.price, $lte: Number(priceMax) };

    // Sort
    let sortObj = { createdAt: -1 };
    if (sortBy) sortObj = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("category", "name_ar name_en slug icon")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ message: "المنتج مش موجود" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: parse booleans from FormData strings
const parseBools = (body) => {
  const result = { ...body };
  ["isFeatured", "isActive"].forEach((key) => {
    if (key in result) result[key] = result[key] === "true" || result[key] === true;
  });
  return result;
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const images = req.files ? req.files.map((f) => `/uploads/products/${f.filename}`) : [];
    const product = await Product.create({ ...parseBools(req.body), images });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج مش موجود" });

    const newImages = req.files ? req.files.map((f) => `/uploads/products/${f.filename}`) : [];
    const keepImages = req.body.keepImages ? JSON.parse(req.body.keepImages) : product.images;

    Object.assign(product, parseBools(req.body));
    product.images = [...keepImages, ...newImages];
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج مش موجود" });
    res.json({ message: "تم حذف المنتج" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/products/:id/toggle
const toggleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج مش موجود" });
    product.isActive = !product.isActive;
    await product.save();
    res.json({ isActive: product.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleProduct };