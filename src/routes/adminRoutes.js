const express = require("express");
const router = express.Router();

// Controllers
const adminController = require("../controllers/adminController");
const productAdminController = require("../controllers/productAdminController");
const orderAdminController = require("../controllers/orderAdminController");
const customerAdminController = require("../controllers/customerAdminController");
const dashboardController = require("../controllers/dashboardController");
const reportController = require("../controllers/reportController");

// Middlewares
const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/admin");
const uploadMiddleware = require("../middlewares/upload");

// ===== Dashboard =====
router.get("/dashboard", authMiddleware, adminMiddleware, dashboardController.getDashboardStats);

// ===== Xuất báo cáo Excel =====
router.get("/reports/export/excel", authMiddleware, adminMiddleware, reportController.exportExcelReport);

// ===== Quản lý người dùng =====
router.post("/create-admin", authMiddleware, adminMiddleware, adminController.createAdmin);
router.get("/users", authMiddleware, adminMiddleware, adminController.getAllUsers);
router.put("/update-role", authMiddleware, adminMiddleware, adminController.updateUserRole);
router.delete("/delete-user/:userId", authMiddleware, adminMiddleware, adminController.deleteUser);

// ===== Quản lý sản phẩm =====
router.get("/products", authMiddleware, adminMiddleware, productAdminController.getProductsAdmin);
router.post("/products", authMiddleware, adminMiddleware, uploadMiddleware, productAdminController.createProduct);
router.put("/products/:productId", authMiddleware, adminMiddleware, uploadMiddleware, productAdminController.updateProduct);
router.delete("/products/:productId", authMiddleware, adminMiddleware, productAdminController.deleteProduct);
router.get("/products/stats/all", authMiddleware, adminMiddleware, productAdminController.getProductStats);

// ===== Quản lý đơn hàng =====
router.get("/orders", authMiddleware, adminMiddleware, orderAdminController.getAllOrders);
router.get("/orders/:orderId", authMiddleware, adminMiddleware, orderAdminController.getOrderDetail);
router.put("/orders/:orderId", authMiddleware, adminMiddleware, orderAdminController.updateOrderStatus);
router.delete("/orders/:orderId", authMiddleware, adminMiddleware, orderAdminController.deleteOrder);
router.get("/orders/stats/all", authMiddleware, adminMiddleware, orderAdminController.getOrderStats);

// ===== Quản lý khách hàng =====
router.get("/customers", authMiddleware, adminMiddleware, customerAdminController.getAllCustomers);
router.get("/customers/:customerId", authMiddleware, adminMiddleware, customerAdminController.getCustomerDetail);
router.get("/customers/stats/all", authMiddleware, adminMiddleware, customerAdminController.getCustomerStats);

module.exports = router;
