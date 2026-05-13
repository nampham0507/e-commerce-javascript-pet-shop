const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const productAdminController = require("../controllers/productAdminController");
const orderAdminController = require("../controllers/orderAdminController");
const customerAdminController = require("../controllers/customerAdminController");
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

// Dashboard
router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  dashboardController.getDashboardStats,
);

// User Management
router.post(
  "/create-admin",
  authMiddleware,
  adminMiddleware,
  adminController.createAdmin,
);
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  adminController.getAllUsers,
);
router.put(
  "/update-role",
  authMiddleware,
  adminMiddleware,
  adminController.updateUserRole,
);
router.delete(
  "/delete-user/:userId",
  authMiddleware,
  adminMiddleware,
  adminController.deleteUser,
);

// Product Management
router.get(
  "/products",
  authMiddleware,
  adminMiddleware,
  productAdminController.getProductsAdmin,
);
router.post(
  "/products",
  authMiddleware,
  adminMiddleware,
  productAdminController.createProduct,
);
router.put(
  "/products/:productId",
  authMiddleware,
  adminMiddleware,
  productAdminController.updateProduct,
);
router.delete(
  "/products/:productId",
  authMiddleware,
  adminMiddleware,
  productAdminController.deleteProduct,
);
router.get(
  "/products/stats/all",
  authMiddleware,
  adminMiddleware,
  productAdminController.getProductStats,
);

// Order Management
router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  orderAdminController.getAllOrders,
);
router.get(
  "/orders/:orderId",
  authMiddleware,
  adminMiddleware,
  orderAdminController.getOrderDetail,
);
router.put(
  "/orders/:orderId",
  authMiddleware,
  adminMiddleware,
  orderAdminController.updateOrderStatus,
);
router.delete(
  "/orders/:orderId",
  authMiddleware,
  adminMiddleware,
  orderAdminController.deleteOrder,
);
router.get(
  "/orders/stats/all",
  authMiddleware,
  adminMiddleware,
  orderAdminController.getOrderStats,
);

// Customer Management
router.get(
  "/customers",
  authMiddleware,
  adminMiddleware,
  customerAdminController.getAllCustomers,
);
router.get(
  "/customers/:customerId",
  authMiddleware,
  adminMiddleware,
  customerAdminController.getCustomerDetail,
);
router.get(
  "/customers/stats/all",
  authMiddleware,
  adminMiddleware,
  customerAdminController.getCustomerStats,
);

module.exports = router;
