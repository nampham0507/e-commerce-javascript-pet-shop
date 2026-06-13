const mongoose = require("mongoose");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Reply = require("../models/Reply");

/**
 * Tìm đơn hàng đã giao thành công gần nhất chứa sản phẩm của user
 * Dùng để xác định quyền viết đánh giá (Verified Purchase)
 */
const findDeliveredOrderForProduct = (userId, productId) => {
  return Order.findOne({
    user: userId,
    status: "delivered",
    "products.product": productId,
  }).sort({ updatedAt: -1 });
};

/**
 * Middleware: chỉ khách hàng đã mua và nhận sản phẩm mới được tạo đánh giá
 * POST /api/reviews
 */
const verifyPurchase = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "productId không hợp lệ" });
    }

    const existingReview = await Review.findOne({
      product: productId,
      user: req.userId,
    });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "Bạn đã đánh giá sản phẩm này rồi",
      });
    }

    const order = await findDeliveredOrderForProduct(req.userId, productId);
    if (!order) {
      return res.status(403).json({
        success: false,
        message:
          "Bạn cần mua và nhận sản phẩm này thành công trước khi đánh giá",
      });
    }

    req.eligibleOrderId = order._id;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/**
 * Middleware: chỉ chủ sở hữu đánh giá mới có quyền sửa/xóa
 * PUT/DELETE /api/reviews/:id
 */
const isReviewOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID đánh giá không hợp lệ" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    if (review.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    req.review = review;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/**
 * Middleware: chỉ chủ sở hữu phản hồi mới có quyền sửa/xóa
 * PUT/DELETE /api/replies/:id
 */
const isReplyOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID phản hồi không hợp lệ" });
    }

    const reply = await Reply.findById(id);
    if (!reply) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phản hồi" });
    }

    if (reply.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    req.reply = reply;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  findDeliveredOrderForProduct,
  verifyPurchase,
  isReviewOwner,
  isReplyOwner,
};
