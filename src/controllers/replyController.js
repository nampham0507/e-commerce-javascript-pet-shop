const mongoose = require("mongoose");
const Review = require("../models/Review");
const replyService = require("../services/replyService");

/**
 * POST /api/reviews/:id/replies
 * Tạo phản hồi cho đánh giá hoặc cho 1 phản hồi khác (nested, tối đa 3 cấp)
 * Cho phép: khách hàng đã đăng nhập và admin
 */
exports.createReply = async (req, res) => {
  try {
    const { id: reviewId } = req.params;
    const { content, parentReplyId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID đánh giá không hợp lệ" });
    }
    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập nội dung phản hồi" });
    }
    if (parentReplyId && !mongoose.Types.ObjectId.isValid(parentReplyId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID phản hồi cha không hợp lệ" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    const reply = await replyService.createReply({
      reviewId,
      userId: req.userId,
      role: req.role === "admin" ? "admin" : "customer",
      content: content.trim(),
      parentReplyId: parentReplyId || null,
    });

    res.status(201).json({
      success: true,
      message: "Đã gửi phản hồi",
      reply: { ...reply, replies: [] },
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi server" });
  }
};

/**
 * PUT /api/replies/:id
 * Cập nhật phản hồi (chỉ chủ sở hữu - isReplyOwner middleware)
 */
exports.updateReply = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập nội dung phản hồi" });
    }

    const reply = await replyService.updateReply(req.reply, content.trim());

    res.json({ success: true, message: "Đã cập nhật phản hồi", reply });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi server" });
  }
};

/**
 * DELETE /api/replies/:id
 * Xóa phản hồi (chỉ chủ sở hữu - isReplyOwner middleware), cascade xóa các phản hồi con
 */
exports.deleteReply = async (req, res) => {
  try {
    const result = await replyService.deleteReply(req.reply);
    res.json({
      success: true,
      message: "Đã xóa phản hồi",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Lỗi server" });
  }
};
