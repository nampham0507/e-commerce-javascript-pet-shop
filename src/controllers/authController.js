const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, fullName, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Email đã được đăng ký",
      });
    }

    // Create new user
    user = new User({
      fullName,
      email,
      password,
      role: role || "customer",
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tìm thấy",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Google OAuth Callback - Generate JWT after Google authentication
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Xác thực Google thất bại",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return token - can be redirected with token as query param
    res.redirect(
      `/auth/success?token=${token}&userId=${user._id}&email=${user.email}&fullName=${user.fullName}`
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Get Google auth success page
exports.googleSuccess = (req, res) => {
  const { token, userId, email, fullName } = req.query;

  // Return a simple HTML page that saves token to localStorage and redirects
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Đăng nhập thành công</title>
    </head>
    <body>
      <script>
        // Save token and user info to localStorage using correct keys for auth.js
        localStorage.setItem('token', '${token}');
        
        // Save user info as JSON object
        const userInfo = {
          id: '${userId}',
          email: '${email}',
          fullName: '${fullName}'
        };
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        // Redirect to homepage
        window.location.href = '/';
      </script>
      Đang chuyển hướng...
    </body>
    </html>
  `);
};

// Get Google auth failure page
exports.googleFailure = (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Đăng nhập thất bại</title>
    </head>
    <body>
      <h1>Đăng nhập Google thất bại</h1>
      <p>Vui lòng thử lại</p>
      <a href="/auth/login">Quay lại đăng nhập</a>
    </body>
    </html>
  `);
};

// Logout
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: "Đăng xuất thành công",
  });
};
