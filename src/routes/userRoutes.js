const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/auth");

const ALLOWED_DELETABLE_FIELDS = ["phone", "gender", "dateOfBirth", "address"];

// Strong password: min 8 chars, at least 1 lowercase, 1 uppercase, 1 digit, 1 special char
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// Vietnamese mobile phone number
const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2589]|7[06789]|8[1-9]|9\d)\d{7}$/;

router.use(authMiddleware);

// Get current user's profile
router.get("/profile", profileController.getProfile);

// Create/Update profile information
router.put(
  "/profile",
  [
    body("fullName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Họ tên không được để trống")
      .isLength({ min: 2, max: 100 })
      .withMessage("Họ tên phải từ 2-100 ký tự"),
    body("phone")
      .optional({ checkFalsy: true })
      .matches(VN_PHONE_REGEX)
      .withMessage("Số điện thoại không hợp lệ"),
    body("gender")
      .optional({ checkFalsy: true })
      .isIn(["male", "female", "other"])
      .withMessage("Giới tính không hợp lệ"),
    body("dateOfBirth")
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage("Ngày sinh không hợp lệ")
      .custom((value) => {
        const dob = new Date(value);
        const now = new Date();
        if (dob > now) {
          throw new Error("Ngày sinh không được ở tương lai");
        }
        const age = (now - dob) / (1000 * 60 * 60 * 24 * 365.25);
        if (age > 120) {
          throw new Error("Ngày sinh không hợp lệ");
        }
        return true;
      }),
    body("address")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 250 })
      .withMessage("Địa chỉ tối đa 250 ký tự"),
  ],
  profileController.updateProfile
);

// Delete optional profile fields
router.delete(
  "/profile",
  [
    body("fields")
      .isArray({ min: 1 })
      .withMessage("Vui lòng chọn ít nhất một trường để xóa"),
    body("fields.*")
      .isIn(ALLOWED_DELETABLE_FIELDS)
      .withMessage("Trường không hợp lệ hoặc không thể xóa"),
  ],
  profileController.deleteProfileFields
);

// Change password
router.put(
  "/change-password",
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Vui lòng nhập mật khẩu hiện tại"),
    body("newPassword")
      .matches(STRONG_PASSWORD_REGEX)
      .withMessage(
        "Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
      ),
    body("confirmNewPassword")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Mật khẩu xác nhận không khớp"),
  ],
  profileController.changePassword
);

module.exports = router;
