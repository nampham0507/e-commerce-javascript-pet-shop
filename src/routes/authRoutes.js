const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth");
const passport = require("passport");

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
  authController.register
);

// Login
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  authController.login
);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure",
    session: false,
  }),
  authController.googleCallback
);

router.get("/google/success", authController.googleSuccess);
router.get("/google/failure", authController.googleFailure);

// Success/Failure routes (also available without /google prefix)
router.get("/success", authController.googleSuccess);
router.get("/failure", authController.googleFailure);

// Get current user
router.get("/me", authMiddleware, authController.getCurrentUser);

// Logout
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
