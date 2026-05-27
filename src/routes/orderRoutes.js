const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const orderController = require("../controllers/orderController");

// Lấy danh sách đơn hàng của khách
router.get("/", authMiddleware, orderController.getOrders);

// Lấy chi tiết đơn hàng
router.get("/:orderId", authMiddleware, orderController.getOrderDetail);

// Tạo đơn hàng mới
router.post("/", authMiddleware, orderController.createOrder);

// Hủy đơn hàng
router.patch("/:orderId/cancel", authMiddleware, orderController.cancelOrder);

module.exports = router;
