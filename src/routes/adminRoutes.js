const express = require("express");
const router = express.Router();

// Controllers
const adminController = require("../controllers/adminController");
const productAdminController = require("../controllers/productAdminController");
const orderAdminController = require("../controllers/orderAdminController");
const customerAdminController = require("../controllers/customerAdminController");
const dashboardController = require("../controllers/dashboardController");
const reportController = require("../controllers/reportController");
const categoryAdminController = require("../controllers/categoryAdminController");
const reviewController = require("../controllers/reviewController");

// Middlewares
const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/admin");
const uploadMiddleware = require("../middlewares/upload");

// ===== Dashboard =====
router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  dashboardController.getDashboardStats
);

// ===== Thống kê báo cáo =====
router.get(
  "/reports/stats",
  authMiddleware,
  adminMiddleware,
  reportController.getReportStats
);

// ===== Xuất báo cáo Excel =====
router.get(
  "/reports/export/excel",
  authMiddleware,
  adminMiddleware,
  reportController.exportExcelReport
);

// ===== Quản lý người dùng =====
router.post(
  "/create-admin",
  authMiddleware,
  adminMiddleware,
  adminController.createAdmin
);
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  adminController.getAllUsers
);
router.put(
  "/update-role",
  authMiddleware,
  adminMiddleware,
  adminController.updateUserRole
);
router.put(
  "/users/:userId",
  authMiddleware,
  adminMiddleware,
  adminController.updateUser
);
router.delete(
  "/delete-user/:userId",
  authMiddleware,
  adminMiddleware,
  adminController.deleteUser
);

// ===== Quản lý sản phẩm =====
router.get(
  "/products",
  authMiddleware,
  adminMiddleware,
  productAdminController.getProductsAdmin
);
router.post(
  "/products",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware,
  productAdminController.createProduct
);
router.put(
  "/products/:productId",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware,
  productAdminController.updateProduct
);
router.delete(
  "/products/:productId",
  authMiddleware,
  adminMiddleware,
  productAdminController.deleteProduct
);
router.get(
  "/products/stats/all",
  authMiddleware,
  adminMiddleware,
  productAdminController.getProductStats
);

// ===== Quản lý danh mục =====
router.get(
  "/categories",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.getCategoriesAdmin
);
router.post(
  "/categories",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.createCategory
);
router.put(
  "/categories/:categoryId",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.updateCategory
);
router.delete(
  "/categories/:categoryId",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.deleteCategory
);

// ===== Quản lý thương hiệu =====
router.get(
  "/brands",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.getBrandsAdmin
);
router.post(
  "/brands",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.createBrand
);
router.put(
  "/brands/:brandId",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.updateBrand
);
router.delete(
  "/brands/:brandId",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.deleteBrand
);

// ===== Quản lý đơn hàng =====
router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  orderAdminController.getAllOrders
);
router.post(
  "/orders",
  authMiddleware,
  adminMiddleware,
  orderAdminController.createOrderAdmin
);
router.get(
  "/orders/:orderId",
  authMiddleware,
  adminMiddleware,
  orderAdminController.getOrderDetail
);
router.put(
  "/orders/:orderId",
  authMiddleware,
  adminMiddleware,
  orderAdminController.updateOrderStatus
);
router.delete(
  "/orders/:orderId",
  authMiddleware,
  adminMiddleware,
  orderAdminController.deleteOrder
);
router.get(
  "/orders/stats/all",
  authMiddleware,
  adminMiddleware,
  orderAdminController.getOrderStats
);

// ===== Quản lý khách hàng =====
router.get(
  "/customers",
  authMiddleware,
  adminMiddleware,
  customerAdminController.getAllCustomers
);
router.get(
  "/customers/:customerId",
  authMiddleware,
  adminMiddleware,
  customerAdminController.getCustomerDetail
);
router.get(
  "/customers/stats/all",
  authMiddleware,
  adminMiddleware,
  customerAdminController.getCustomerStats
);

// ===== Quản lý đánh giá =====
router.get(
  "/reviews",
  authMiddleware,
  adminMiddleware,
  reviewController.getAllReviewsAdmin
);

module.exports = router;
