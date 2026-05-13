const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Get dashboard stats (admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const pendingOrders = await Order.countDocuments({ status: "pending" });

    // Revenue by month
    const revenueByMonth = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    // Recent activities
    const recentOrders = await Order.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select("fullName email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          admins: totalAdmins,
        },
        products: {
          total: totalProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          revenue: totalRevenue[0]?.total || 0,
        },
        revenueByMonth,
        recentOrders,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
