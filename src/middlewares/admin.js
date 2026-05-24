const authMiddleware = require("./auth");

const adminMiddleware = (req, res, next) => {
  try {
    authMiddleware(req, res, () => {
      if (req.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền truy cập",
        });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Lỗi xác thực",
      error: error.message,
    });
  }
};

module.exports = adminMiddleware;
