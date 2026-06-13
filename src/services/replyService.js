const Reply = require("../models/Reply");

const REVIEWER_FIELDS = "fullName email";

// Số cấp phản hồi tối đa được hỗ trợ (root reply = cấp 1)
const MAX_DEPTH = 3;

const serviceError = (statusCode, message) =>
  Object.assign(new Error(message), { statusCode });

/**
 * Tính độ sâu (cấp) hiện tại của 1 phản hồi - root reply = cấp 1
 */
const computeDepth = async (replyId) => {
  let depth = 1;
  let current = await Reply.findById(replyId).select("parentReply").lean();
  while (current && current.parentReply) {
    depth += 1;
    current = await Reply.findById(current.parentReply)
      .select("parentReply")
      .lean();
  }
  return depth;
};

/**
 * Dựng cây phản hồi (threaded) từ danh sách phẳng đã sort theo createdAt
 */
const buildReplyTree = (replies) => {
  const map = new Map();
  replies.forEach((r) => {
    map.set(r._id.toString(), { ...r, replies: [] });
  });

  const roots = [];
  map.forEach((reply) => {
    const parentId = reply.parentReply ? reply.parentReply.toString() : null;
    if (parentId && map.has(parentId)) {
      map.get(parentId).replies.push(reply);
    } else {
      roots.push(reply);
    }
  });

  return roots;
};

/**
 * Lấy toàn bộ phản hồi (dạng cây) cho 1 danh sách review, gom theo reviewId
 */
const getRepliesForReviews = async (reviewIds) => {
  const result = {};
  reviewIds.forEach((id) => {
    result[id.toString()] = [];
  });

  if (reviewIds.length === 0) return result;

  const replies = await Reply.find({ review: { $in: reviewIds } })
    .populate("user", REVIEWER_FIELDS)
    .sort({ createdAt: 1 })
    .lean();

  const grouped = {};
  replies.forEach((r) => {
    const key = r.review.toString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  Object.keys(grouped).forEach((key) => {
    result[key] = buildReplyTree(grouped[key]);
  });

  return result;
};

/**
 * Tạo phản hồi mới cho 1 đánh giá hoặc 1 phản hồi khác
 */
const createReply = async ({
  reviewId,
  userId,
  role,
  content,
  parentReplyId,
}) => {
  if (parentReplyId) {
    const parent = await Reply.findById(parentReplyId);
    if (!parent) {
      throw serviceError(404, "Không tìm thấy phản hồi cha");
    }
    if (parent.review.toString() !== reviewId.toString()) {
      throw serviceError(400, "Phản hồi cha không thuộc đánh giá này");
    }

    const parentDepth = await computeDepth(parentReplyId);
    if (parentDepth >= MAX_DEPTH) {
      throw serviceError(400, `Chỉ hỗ trợ tối đa ${MAX_DEPTH} cấp phản hồi`);
    }
  }

  const reply = await Reply.create({
    review: reviewId,
    parentReply: parentReplyId || null,
    user: userId,
    role,
    content,
  });

  return Reply.findById(reply._id).populate("user", REVIEWER_FIELDS).lean();
};

/**
 * Cập nhật nội dung phản hồi (chỉ chủ sở hữu)
 */
const updateReply = async (reply, content) => {
  reply.content = content;
  await reply.save();
  return Reply.findById(reply._id).populate("user", REVIEWER_FIELDS).lean();
};

/**
 * Thu thập id của toàn bộ phản hồi con (đệ quy)
 */
const collectDescendantIds = async (replyId) => {
  const children = await Reply.find({ parentReply: replyId }).select("_id");
  let ids = children.map((c) => c._id);
  for (const child of children) {
    const childIds = await collectDescendantIds(child._id);
    ids = ids.concat(childIds);
  }
  return ids;
};

/**
 * Xóa phản hồi (chỉ chủ sở hữu) - cascade xóa toàn bộ phản hồi con
 */
const deleteReply = async (reply) => {
  const descendantIds = await collectDescendantIds(reply._id);
  await Reply.deleteMany({ _id: { $in: [reply._id, ...descendantIds] } });
  return { deletedCount: descendantIds.length + 1 };
};

/**
 * Xóa toàn bộ phản hồi của 1 đánh giá (khi đánh giá bị xóa)
 */
const deleteRepliesForReview = async (reviewId) => {
  await Reply.deleteMany({ review: reviewId });
};

module.exports = {
  MAX_DEPTH,
  computeDepth,
  buildReplyTree,
  getRepliesForReviews,
  createReply,
  updateReply,
  deleteReply,
  deleteRepliesForReview,
};
