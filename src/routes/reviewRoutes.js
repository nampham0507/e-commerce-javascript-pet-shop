const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const { uploadReviewImages } = require("../middlewares/upload");
const { verifyPurchase, isReviewOwner } = require("../middlewares/reviewAuth");
const {
  validateCreateReview,
  validateUpdateReview,
  validateReply,
} = require("../middlewares/reviewValidators");

const reviewController = require("../controllers/reviewController");
const replyController = require("../controllers/replyController");

// Public: lấy danh sách đánh giá + thống kê của 1 sản phẩm
router.get("/product/:productId", reviewController.getProductReviews);

// Auth: kiểm tra quyền đánh giá (đã mua & nhận hàng, đã đánh giá chưa)
router.get(
  "/:productId/eligibility",
  authMiddleware,
  reviewController.checkEligibility
);

// Auth + đã mua & nhận hàng: tạo đánh giá mới
router.post(
  "/",
  authMiddleware,
  uploadReviewImages,
  validateCreateReview,
  verifyPurchase,
  reviewController.createReview
);

// Auth + chủ sở hữu: sửa đánh giá
router.put(
  "/:id",
  authMiddleware,
  isReviewOwner,
  uploadReviewImages,
  validateUpdateReview,
  reviewController.updateReview
);

// Auth + chủ sở hữu: xóa đánh giá
router.delete(
  "/:id",
  authMiddleware,
  isReviewOwner,
  reviewController.deleteReview
);

// Auth: trả lời đánh giá hoặc trả lời 1 phản hồi khác (nested)
router.post(
  "/:id/replies",
  authMiddleware,
  validateReply,
  replyController.createReply
);

module.exports = router;
