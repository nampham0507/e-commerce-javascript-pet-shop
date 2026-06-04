const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const reviewController = require("../controllers/reviewController");
const adminMiddleware = require("../middlewares/admin");

// Public: lấy đánh giá
router.get("/:productId", reviewController.getReviews);

// Cần đăng nhập: tạo / xóa
router.post("/:productId", authMiddleware, reviewController.createReview);
router.delete("/:productId", authMiddleware, reviewController.deleteReview);

// Admin: Trả lời đánh giá & Xóa phản hồi
router.post("/:productId/:reviewId/reply", authMiddleware, adminMiddleware, reviewController.replyReview);
router.delete("/:productId/:reviewId/reply", authMiddleware, adminMiddleware, reviewController.deleteReply);

module.exports = router;
