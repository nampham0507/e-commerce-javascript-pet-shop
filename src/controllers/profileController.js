const User = require("../models/User");
const { validationResult } = require("express-validator");

const ALLOWED_DELETABLE_FIELDS = ["phone", "gender", "dateOfBirth", "address"];

// Get current user's profile
exports.getProfile = async (req, res) => {
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

// Create/Update profile information
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { fullName, phone, gender, dateOfBirth, address } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tìm thấy",
      });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    }
    if (address !== undefined) user.address = address;

    await user.save();

    const updatedUser = await User.findById(req.userId).select("-password");

    res.json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Delete optional profile fields
exports.deleteProfileFields = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const fieldsToDelete = (req.body.fields || []).filter((field) =>
      ALLOWED_DELETABLE_FIELDS.includes(field)
    );

    if (fieldsToDelete.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có trường hợp lệ để xóa",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tìm thấy",
      });
    }

    fieldsToDelete.forEach((field) => {
      user[field] = undefined;
    });

    await user.save();

    const updatedUser = await User.findById(req.userId).select("-password");

    res.json({
      success: true,
      message: "Đã xóa thông tin thành công",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu xác nhận không khớp",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tìm thấy",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "Tài khoản này đăng nhập bằng Google, không thể đổi mật khẩu",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
