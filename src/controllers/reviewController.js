const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const reviewService = require("../services/reviewService");
const replyService = require("../services/replyService");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const collectImagePaths = (files) =>
  (files || []).map((file) => "/uploads/" + file.filename);

/**
 * GET /api/reviews/product/:productId
 * Lấy danh sách đánh giá (kèm phản hồi dạng cây) + thống kê của 1 sản phẩm (public)
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "productId không hợp lệ" });
    }

    const { page, limit, rating } = req.query;
    const { reviews, stats, ratingStatistics, pagination } =
      await reviewService.getProductReviewsWithStats(productId, {
        page,
        limit,
        rating,
      });

    res.json({
      success: true,
      reviews,
      stats,
      ratingStatistics,
      pagination,
      totalReviews: pagination.total,
      totalPages: pagination.pages,
      currentPage: pagination.page,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/**
 * GET /api/reviews/:productId/eligibility
 * Kiểm tra user hiện tại có được phép viết đánh giá cho sản phẩm không
 */
exports.checkEligibility = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "productId không hợp lệ" });
    }

    const result = await reviewService.checkEligibility(req.userId, productId);

    res.json({ success: true, ...result });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/**
 * POST /api/reviews
 * Tạo đánh giá mới (chỉ khách hàng đã mua & nhận sản phẩm - verifyPurchase middleware)
 */
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, content } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Số sao phải từ 1 đến 5" });
    }
    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tiêu đề đánh giá" });
    }
    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập nội dung đánh giá" });
    }

    const review = await reviewService.createReview({
      userId: req.userId,
      productId,
      orderId: req.eligibleOrderId,
      rating: Number(rating),
      title: title.trim(),
      content: content.trim(),
      images: collectImagePaths(req.files),
    });

    res.status(201).json({
      success: true,
      message: "Đã gửi đánh giá thành công",
      review: { ...review, replies: [] },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Bạn đã đánh giá sản phẩm này rồi" });
    }
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/**
 * PUT /api/reviews/:id
 * Cập nhật đánh giá (chỉ chủ sở hữu - isReviewOwner middleware)
 */
exports.updateReview = async (req, res) => {
  try {
    const { rating, title, content, existingImages } = req.body;

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ success: false, message: "Số sao phải từ 1 đến 5" });
    }
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề đánh giá không được để trống",
      });
    }
    if (content !== undefined && !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nội dung đánh giá không được để trống",
      });
    }

    const newImages = collectImagePaths(req.files);
    let images;
    if (existingImages !== undefined || newImages.length > 0) {
      const kept = Array.isArray(existingImages)
        ? existingImages
        : existingImages
          ? [existingImages]
          : [];
      images = [...kept, ...newImages].slice(0, 5);
    }

    const review = await reviewService.updateReview(req.review, {
      rating: rating !== undefined ? Number(rating) : undefined,
      title: title !== undefined ? title.trim() : undefined,
      content: content !== undefined ? content.trim() : undefined,
      images,
    });

    const repliesByReview = await replyService.getRepliesForReviews([
      review._id,
    ]);

    res.json({
      success: true,
      message: "Đã cập nhật đánh giá",
      review: {
        ...review,
        replies: repliesByReview[review._id.toString()] || [],
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/**
 * DELETE /api/reviews/:id
 * Xóa đánh giá (chỉ chủ sở hữu - isReviewOwner middleware)
 */
exports.deleteReview = async (req, res) => {
  try {
    await reviewService.deleteReview(req.review);
    res.json({ success: true, message: "Đã xóa đánh giá" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/**
 * GET /api/admin/reviews
 * Admin: xem toàn bộ đánh giá trên hệ thống (phân trang, lọc theo sản phẩm)
 */
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, productId, rating, keyword } = req.query;
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    // Base scope (productId + keyword) used both for the review list AND for
    // the ratingStatistics counts, so the star-filter counts stay accurate
    // for the current search regardless of which star is selected.
    const baseQuery = {};
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      baseQuery.product = productId;
    }

    const trimmedKeyword = (keyword || "").trim();
    if (trimmedKeyword) {
      const regex = new RegExp(escapeRegex(trimmedKeyword), "i");
      const matchingProducts = await Product.find({ name: regex })
        .select("_id")
        .lean();
      const matchingProductIds = matchingProducts.map((p) => p._id);

      baseQuery.$or = [
        { title: regex },
        { content: regex },
        ...(matchingProductIds.length
          ? [{ product: { $in: matchingProductIds } }]
          : []),
      ];
    }

    const distributionAgg = await Review.aggregate([
      { $match: baseQuery },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);
    const ratingStatistics = { all: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distributionAgg.forEach(({ _id, count }) => {
      if (ratingStatistics[_id] !== undefined) ratingStatistics[_id] = count;
      ratingStatistics.all += count;
    });

    const query = { ...baseQuery };
    if (rating) query.rating = Number(rating);

    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.max(Math.ceil(totalReviews / limitNum), 1);
    // Nếu trang yêu cầu vượt phạm vi sau khi lọc, tự động lùi về trang hợp lệ gần nhất.
    const currentPage = Math.min(pageNum, totalPages);

    const reviews = await Review.find(query)
      .populate("user", "fullName email")
      .populate("product", "name image")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const reviewIds = reviews.map((r) => r._id);
    const repliesByReview = await replyService.getRepliesForReviews(reviewIds);

    const reviewsWithReplies = reviews.map((review) => ({
      ...review,
      replies: repliesByReview[review._id.toString()] || [],
    }));

    res.json({
      success: true,
      reviews: reviewsWithReplies,
      ratingStatistics,
      totalReviews,
      totalPages,
      currentPage,
      pagination: {
        total: totalReviews,
        page: currentPage,
        limit: limitNum,
        pages: totalPages,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};
