const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

// Create admin (admin only)
router.post(
  "/create-admin",
  authMiddleware,
  adminMiddleware,
  [(req, res, next) => next()],
  adminController.createAdmin,
);

// Get all users (admin only)
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  adminController.getAllUsers,
);

// Update user role (admin only)
router.put(
  "/update-role",
  authMiddleware,
  adminMiddleware,
  adminController.updateUserRole,
);

// Delete user (admin only)
router.delete(
  "/delete-user/:userId",
  authMiddleware,
  adminMiddleware,
  adminController.deleteUser,
);

module.exports = router;
