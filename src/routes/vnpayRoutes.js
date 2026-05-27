const express = require("express");
const router = express.Router();
const vnpayController = require("../controllers/vnpayController");

// Tạo URL thanh toán VNPAY
router.post("/vnpay/create", vnpayController.createPayment);

// Xử lý kết quả trả về từ VNPAY
router.get("/vnpay/return", vnpayController.vnpayReturn);

module.exports = router;
