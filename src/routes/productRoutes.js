const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const productAdminController = require("../controllers/productAdminController");

// ===== PUBLIC ROUTES (Không cần đăng nhập) =====

// Lấy tất cả sản phẩm
router.get("/public", productAdminController.getPublicProducts);

// Lấy sản phẩm theo ID
router.get("/:id", productController.getProductById);

// Lấy sản phẩm theo danh mục
router.get("/category/:category", productController.getProductsByCategory);

module.exports = router;
