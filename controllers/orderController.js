const Order = require("../models/Order");

// POST /api/orders — create order from storefront
const createOrder = async (req, res) => {
  try {
    const { items, total, paymentMethod, paymentMethodName, customerName, customerPhone, notes } = req.body;
    if (!items?.length) return res.status(400).json({ message: "السلة فارغة" });
    const order = await Order.create({ items, total, paymentMethod, paymentMethodName, customerName, customerPhone, notes });
    res.status(201).json({ orderId: order._id, orderNumber: order.orderNumber });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/orders — admin: get all orders
const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/stats
const getOrderStats = async (req, res) => {
  try {
    const [total, newOrders, paid, shipped, done] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "جديد" }),
      Order.countDocuments({ status: "تم الدفع" }),
      Order.countDocuments({ status: "تم الشحن" }),
      Order.countDocuments({ status: "مكتمل" }),
    ]);
    const revenue = await Order.aggregate([
      { $match: { status: { $in: ["تم الدفع", "تم الشحن", "مكتمل"] } } },
      { $group: { _id: null, sum: { $sum: "$total" } } },
    ]);
    res.json({ total, new: newOrders, paid, shipped, done, revenue: revenue[0]?.sum || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/orders/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "الطلب مش موجود" });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "تم حذف الطلب" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, getOrders, getOrderStats, updateStatus, deleteOrder };