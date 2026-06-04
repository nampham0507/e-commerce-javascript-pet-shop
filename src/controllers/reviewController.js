const Review = require("../models/Review");
const Product = require("../models/Product");

// Hàm tính lại rating trung bình và cập nhật vào Product
const recalcProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
  });
};

// GET /api/reviews/:productId  – lấy đánh giá của 1 sản phẩm
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/reviews/:productId  – thêm / cập nhật đánh giá (cần auth)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Số sao phải từ 1 đến 5" });
    }

    // Upsert: nếu user đã đánh giá thì cập nhật
    await Review.findOneAndUpdate(
      { product: productId, user: req.userId },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await recalcProductRating(productId);

    const updated = await Review.find({ product: productId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });

    const product = await Product.findById(productId).select("rating");
    res.json({ success: true, reviews: updated, avgRating: product.rating });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/reviews/:productId  – xóa đánh giá của chính mình
exports.deleteReview = async (req, res) => {
  try {
    await Review.findOneAndDelete({
      product: req.params.productId,
      user: req.userId,
    });
    await recalcProductRating(req.params.productId);
    res.json({ success: true, message: "Đã xóa đánh giá" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/reviews/:productId/:reviewId/reply - Admin trả lời đánh giá
exports.replyReview = async (req, res) => {
  try {
    const { adminReply } = req.body;
    const { productId, reviewId } = req.params;

    if (!adminReply) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung trả lời" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    review.adminReply = adminReply;
    review.adminReplyAt = new Date();
    await review.save();

    const updated = await Review.find({ product: productId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });

    res.json({ success: true, message: "Đã gửi phản hồi", reviews: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/reviews/:productId/:reviewId/reply - Admin xóa phản hồi
exports.deleteReply = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    review.adminReply = undefined;
    review.adminReplyAt = undefined;
    await review.save();

    const updated = await Review.find({ product: productId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });

    res.json({ success: true, message: "Đã xóa phản hồi", reviews: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
