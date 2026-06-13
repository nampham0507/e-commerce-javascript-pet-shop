const Review = require("../models/Review");
const Product = require("../models/Product");
const { findDeliveredOrderForProduct } = require("../middlewares/reviewAuth");
const replyService = require("./replyService");

const REVIEWER_FIELDS = "fullName email";

/**
 * Tính lại rating trung bình của sản phẩm và cập nhật vào Product
 */
const recalcProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId }).select("rating");
  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
  });

  return { average: Math.round(avg * 10) / 10, total: reviews.length };
};

/**
 * Tính phân bố số sao (5 -> 1) cho thanh rating bar
 */
const getRatingDistribution = (reviews) => {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (distribution[r.rating] !== undefined) distribution[r.rating] += 1;
  });
  return distribution;
};

/**
 * Lấy danh sách đánh giá của 1 sản phẩm kèm thống kê và phản hồi (threaded)
 */
const getProductReviewsWithStats = async (productId) => {
  const reviews = await Review.find({ product: productId })
    .populate("user", REVIEWER_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  const reviewIds = reviews.map((r) => r._id);
  const repliesByReview = await replyService.getRepliesForReviews(reviewIds);

  const reviewsWithReplies = reviews.map((review) => ({
    ...review,
    replies: repliesByReview[review._id.toString()] || [],
  }));

  const stats = {
    average:
      reviews.length === 0
        ? 0
        : Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) *
              10
          ) / 10,
    total: reviews.length,
    distribution: getRatingDistribution(reviews),
  };

  return { reviews: reviewsWithReplies, stats };
};

/**
 * Kiểm tra quyền đánh giá của user đối với 1 sản phẩm
 * (đã mua + đã nhận hàng, và chưa từng đánh giá sản phẩm này)
 */
const checkEligibility = async (userId, productId) => {
  const existingReview = await Review.findOne({
    product: productId,
    user: userId,
  })
    .populate("user", REVIEWER_FIELDS)
    .lean();

  if (existingReview) {
    return { eligible: false, alreadyReviewed: true, review: existingReview };
  }

  const order = await findDeliveredOrderForProduct(userId, productId);
  return {
    eligible: !!order,
    alreadyReviewed: false,
    review: null,
  };
};

/**
 * Tạo đánh giá mới (chỉ gọi sau khi đã verifyPurchase)
 */
const createReview = async ({
  userId,
  productId,
  orderId,
  rating,
  title,
  content,
  images,
}) => {
  const review = await Review.create({
    product: productId,
    user: userId,
    order: orderId,
    rating,
    title,
    content,
    images: images || [],
    isVerifiedPurchase: true,
  });

  await recalcProductRating(productId);

  return Review.findById(review._id).populate("user", REVIEWER_FIELDS).lean();
};

/**
 * Cập nhật đánh giá (chỉ chủ sở hữu)
 */
const updateReview = async (review, { rating, title, content, images }) => {
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (content !== undefined) review.content = content;
  if (images !== undefined) review.images = images;

  await review.save();
  await recalcProductRating(review.product);

  return Review.findById(review._id).populate("user", REVIEWER_FIELDS).lean();
};

/**
 * Xóa đánh giá (chỉ chủ sở hữu) - cascade xóa toàn bộ phản hồi liên quan
 */
const deleteReview = async (review) => {
  await replyService.deleteRepliesForReview(review._id);
  await Review.findByIdAndDelete(review._id);
  await recalcProductRating(review.product);
};

module.exports = {
  recalcProductRating,
  getProductReviewsWithStats,
  checkEligibility,
  createReview,
  updateReview,
  deleteReview,
};
