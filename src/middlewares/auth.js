const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra user còn tồn tại trong DB không (tránh stale token sau khi seed)
    const user = await User.findById(decoded.userId).select("_id role");
    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại. Vui lòng đăng nhập lại." });
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

module.exports = authMiddleware;
