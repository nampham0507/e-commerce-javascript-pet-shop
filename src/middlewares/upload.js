const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, "../views/uploads/");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

/**
 * Middleware xử lý upload ảnh sản phẩm
 * Bọc multer để lỗi upload không block request
 */
const uploadMiddleware = (req, res, next) => {
  upload.single("imageFile")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
    }
    next();
  });
};

/**
 * Middleware xử lý upload ảnh đánh giá (tối đa 5 ảnh)
 * Bọc multer để lỗi upload không block request
 */
const uploadReviewImages = (req, res, next) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
    }
    next();
  });
};

module.exports = uploadMiddleware;
module.exports.uploadReviewImages = uploadReviewImages;
