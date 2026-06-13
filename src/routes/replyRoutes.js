const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const { isReplyOwner } = require("../middlewares/reviewAuth");
const { validateReply } = require("../middlewares/reviewValidators");
const replyController = require("../controllers/replyController");

// Auth + chủ sở hữu: sửa phản hồi của chính mình
router.put(
  "/:id",
  authMiddleware,
  isReplyOwner,
  validateReply,
  replyController.updateReply
);

// Auth + chủ sở hữu: xóa phản hồi của chính mình (cascade xóa phản hồi con)
router.delete(
  "/:id",
  authMiddleware,
  isReplyOwner,
  replyController.deleteReply
);

module.exports = router;
