const { body, validationResult } = require("express-validator");

/**
 * Middleware kiểm tra kết quả validate, trả lỗi 400 nếu có
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/reviews
 */
const validateCreateReview = [
  body("productId")
    .notEmpty()
    .withMessage("productId là bắt buộc")
    .isMongoId()
    .withMessage("productId không hợp lệ"),
  body("rating")
    .notEmpty()
    .withMessage("Vui lòng chọn số sao")
    .isInt({ min: 1, max: 5 })
    .withMessage("Số sao phải từ 1 đến 5"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Vui lòng nhập tiêu đề đánh giá")
    .isLength({ max: 120 })
    .withMessage("Tiêu đề tối đa 120 ký tự"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Vui lòng nhập nội dung đánh giá")
    .isLength({ max: 2000 })
    .withMessage("Nội dung tối đa 2000 ký tự"),
  handleValidationErrors,
];

/**
 * PUT /api/reviews/:id
 */
const validateUpdateReview = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Số sao phải từ 1 đến 5"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề không được để trống")
    .isLength({ max: 120 })
    .withMessage("Tiêu đề tối đa 120 ký tự"),
  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nội dung không được để trống")
    .isLength({ max: 2000 })
    .withMessage("Nội dung tối đa 2000 ký tự"),
  handleValidationErrors,
];

/**
 * POST /api/reviews/:id/replies, PUT /api/replies/:id
 */
const validateReply = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Vui lòng nhập nội dung phản hồi")
    .isLength({ max: 1000 })
    .withMessage("Nội dung tối đa 1000 ký tự"),
  body("parentReplyId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("parentReplyId không hợp lệ"),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateCreateReview,
  validateUpdateReview,
  validateReply,
};
