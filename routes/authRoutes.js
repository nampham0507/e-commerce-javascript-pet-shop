const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// Register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải ít nhất 6 ký tự"),
    body("fullName").notEmpty().withMessage("Tên không được để trống"),
  ],
  authController.register,
);

// Login
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  authController.login,
);

// Get current user
router.get("/me", authMiddleware, authController.getCurrentUser);

// Logout
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
