// Admin review management - frontend logic
import { getAdminReviews } from "/js/admin.js";
import { getUserInfo } from "/js/auth.js";
import {
  renderPagination,
  renderPaginationSummary,
  scrollToTableTop,
} from "/js/pagination.js";

const API_BASE = "/api";
const MAX_REPLY_DEPTH = 3;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const escapeHtml = (str = "") =>
  String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]
  );

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");

const currentUserId = (user) => user?.id || user?._id || null;

// ───────────────────────────────────────────────────────────────────────────
// API calls (replies reuse the shared review/reply endpoints)
// ───────────────────────────────────────────────────────────────────────────

const submitReply = async (reviewId, content, parentReplyId) => {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}/replies`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content, parentReplyId: parentReplyId || null }),
  });
  return { status: res.status, data: await res.json() };
};

const editReply = async (replyId, content) => {
  const res = await fetch(`${API_BASE}/replies/${replyId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  return { status: res.status, data: await res.json() };
};

const removeReply = async (replyId) => {
  const res = await fetch(`${API_BASE}/replies/${replyId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return { status: res.status, data: await res.json() };
};

// ───────────────────────────────────────────────────────────────────────────
// State
// ───────────────────────────────────────────────────────────────────────────

const state = {
  currentUser: null,
  reviews: [],
  pagination: { total: 0, page: 1, limit: 10, pages: 1 },
  rating: "",
  keyword: "",
  ratingStatistics: { all: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  editingReplyId: null,
  openReplyFormKey: null, // "review:<id>" or "reply:<id>"
};

let notify = (msg) => alert(msg);

// ───────────────────────────────────────────────────────────────────────────
// Render helpers
// ───────────────────────────────────────────────────────────────────────────

const starsDisplayHtml = (rating) =>
  [1, 2, 3, 4, 5]
    .map(
      (i) =>
        `<span class="material-symbols-outlined text-yellow-400 text-[16px]" style="font-variation-settings:'FILL' ${rating >= i ? 1 : 0}">star</span>`
    )
    .join("");

const verifiedBadgeHtml = (isVerified) =>
  isVerified
    ? `<span class="inline-flex items-center gap-1 text-label-sm text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1">verified</span>Đã mua hàng</span>`
    : "";

const roleBadgeHtml = (role) =>
  role === "admin"
    ? `<span class="text-label-sm bg-primary text-on-primary px-2 py-0.5 rounded-full">Quản trị viên</span>`
    : `<span class="text-label-sm bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">Khách hàng</span>`;

const editedNoteHtml = (createdAt, updatedAt) =>
  updatedAt && new Date(updatedAt).getTime() !== new Date(createdAt).getTime()
    ? ` <span class="italic">(đã chỉnh sửa ${formatDate(updatedAt)})</span>`
    : "";

const formKeyForReview = (reviewId) => `review:${reviewId}`;
const formKeyForReply = (replyId) => `reply:${replyId}`;

const replyFormHtml = (reviewId, parentReplyId) => `
  <form data-form="reply" data-review-id="${reviewId}" data-parent-id="${parentReplyId || ""}" class="mt-sm space-y-2">
    <textarea required maxlength="1000" rows="2" placeholder="Viết phản hồi với vai trò Quản trị viên..."
      class="w-full text-body-md p-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary bg-surface resize-none"></textarea>
    <div class="flex gap-sm">
      <button type="submit" class="text-label-sm bg-primary text-on-primary px-md py-1.5 rounded-md hover:opacity-90">Gửi</button>
      <button type="button" data-action="cancel-reply" class="text-label-sm bg-surface-container-high text-on-surface-variant px-md py-1.5 rounded-md hover:opacity-90">Hủy</button>
    </div>
  </form>
`;

const editReplyFormHtml = (reply) => `
  <form data-form="edit-reply" data-reply-id="${reply._id}" class="mt-sm space-y-2">
    <textarea required maxlength="1000" rows="2"
      class="w-full text-body-md p-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary bg-surface resize-none">${escapeHtml(reply.content)}</textarea>
    <div class="flex gap-sm">
      <button type="submit" class="text-label-sm bg-primary text-on-primary px-md py-1.5 rounded-md hover:opacity-90">Lưu</button>
      <button type="button" data-action="cancel-edit-reply" class="text-label-sm bg-surface-container-high text-on-surface-variant px-md py-1.5 rounded-md hover:opacity-90">Hủy</button>
    </div>
  </form>
`;

// ───────────────────────────────────────────────────────────────────────────
// Image lightbox
// ───────────────────────────────────────────────────────────────────────────

const ensureImageLightbox = () => {
  let lb = document.getElementById("reviewImageLightbox");
  if (lb) return lb;

  lb = document.createElement("div");
  lb.id = "reviewImageLightbox";
  lb.className =
    "fixed inset-0 bg-black/80 z-[100] hidden items-center justify-center p-lg";
  lb.innerHTML = `
    <button id="reviewImageLightboxClose" type="button" class="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10 transition-colors">
      <span class="material-symbols-outlined text-[32px]">close</span>
    </button>
    <img id="reviewImageLightboxImg" src="" alt="" class="max-w-full max-h-full rounded-lg object-contain" />
  `;
  document.body.appendChild(lb);

  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target.closest("#reviewImageLightboxClose")) {
      lb.classList.add("hidden");
      lb.classList.remove("flex");
    }
  });

  return lb;
};

const openImageLightbox = (src) => {
  const lb = ensureImageLightbox();
  lb.querySelector("#reviewImageLightboxImg").src = src;
  lb.classList.remove("hidden");
  lb.classList.add("flex");
};

const renderReplyItem = (reply, reviewId, depth) => {
  const myId = currentUserId(state.currentUser);
  const isOwner =
    myId && reply.role === "admin" && String(reply.user?._id) === String(myId);
  const displayName = reply.user?.fullName || "Người dùng";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const canReply = depth < MAX_REPLY_DEPTH;

  if (state.editingReplyId === reply._id) {
    return `
      <div class="reply-item" data-reply-id="${reply._id}">
        <div class="flex items-center gap-sm">
          <div class="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-label-sm">${avatarLetter}</div>
          <span class="font-label-md text-on-surface">${escapeHtml(displayName)}</span>
          ${roleBadgeHtml(reply.role)}
        </div>
        ${editReplyFormHtml(reply)}
      </div>
    `;
  }

  const ownerActions = isOwner
    ? `
      <button data-action="edit-reply" data-id="${reply._id}" class="text-label-sm text-primary hover:underline">Sửa</button>
      <button data-action="delete-reply" data-id="${reply._id}" class="text-label-sm text-error hover:underline">Xóa</button>
    `
    : "";

  const replyBtn = canReply
    ? `<button data-action="show-reply-form" data-key="${formKeyForReply(reply._id)}" data-review-id="${reviewId}" data-parent-id="${reply._id}" class="text-label-sm text-primary hover:underline">Trả lời</button>`
    : "";

  const formHtml =
    state.openReplyFormKey === formKeyForReply(reply._id)
      ? replyFormHtml(reviewId, reply._id)
      : "";

  const childrenHtml = (reply.replies || [])
    .map((child) => renderReplyItem(child, reviewId, depth + 1))
    .join("");

  return `
    <div class="reply-item" data-reply-id="${reply._id}">
      <div class="flex items-center gap-sm flex-wrap">
        <div class="w-7 h-7 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-label-sm">${avatarLetter}</div>
        <span class="font-label-md text-on-surface">${escapeHtml(displayName)}</span>
        ${roleBadgeHtml(reply.role)}
        <span class="text-label-sm text-on-surface-variant">${formatDate(reply.createdAt)}${editedNoteHtml(reply.createdAt, reply.updatedAt)}</span>
      </div>
      <p class="text-body-md text-on-surface-variant mt-1">${escapeHtml(reply.content)}</p>
      <div class="flex items-center gap-md mt-1">${replyBtn}${ownerActions}</div>
      ${formHtml}
      ${childrenHtml ? `<div class="mt-sm pl-lg border-l border-outline-variant/30 space-y-md">${childrenHtml}</div>` : ""}
    </div>
  `;
};

const renderReviewCard = (review) => {
  const displayName = review.user?.fullName || "Khách hàng";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const stars = starsDisplayHtml(review.rating);

  const imagesHtml = (review.images || []).length
    ? `<div class="flex gap-2 flex-wrap mt-sm">${(review.images || [])
        .map(
          (src) =>
            `<img src="${escapeHtml(src)}" data-action="view-image" data-src="${escapeHtml(src)}" class="w-20 h-20 object-cover rounded-lg border border-outline-variant cursor-pointer hover:opacity-80 transition-opacity" />`
        )
        .join("")}</div>`
    : "";

  const productThumb = review.product?.image
    ? `<img src="${escapeHtml(review.product.image)}" class="w-10 h-10 object-cover rounded-lg border border-outline-variant" />`
    : `<div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center"><span class="material-symbols-outlined text-on-surface-variant text-[20px]">inventory_2</span></div>`;

  const replyBtn = `<button data-action="show-reply-form" data-key="${formKeyForReview(review._id)}" data-review-id="${review._id}" data-parent-id="" class="text-label-sm text-primary hover:underline">Trả lời</button>`;

  const formHtml =
    state.openReplyFormKey === formKeyForReview(review._id)
      ? replyFormHtml(review._id, null)
      : "";

  const repliesHtml = (review.replies || [])
    .map((reply) => renderReplyItem(reply, review._id, 1))
    .join("");

  return `
    <div class="bg-white rounded-[20px] p-lg border border-outline-variant soft-shadow" data-review-id="${review._id}">
      <div class="flex items-center gap-sm mb-sm flex-wrap">
        ${productThumb}
        <span class="font-label-md text-on-surface">${escapeHtml(review.product?.name || "Sản phẩm đã xóa")}</span>
      </div>
      <div class="flex items-center gap-sm mb-sm flex-wrap">
        <div class="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-md">${avatarLetter}</div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-label-md text-on-surface">${escapeHtml(displayName)}</span>
            ${verifiedBadgeHtml(review.isVerifiedPurchase)}
          </div>
          <div class="text-label-sm text-on-surface-variant">${formatDate(review.createdAt)}${editedNoteHtml(review.createdAt, review.updatedAt)}</div>
        </div>
        <div class="ml-auto flex items-center gap-sm">${stars}</div>
      </div>
      <h5 class="font-label-md text-on-surface font-bold mt-sm">${escapeHtml(review.title)}</h5>
      <p class="text-body-md text-on-surface-variant mt-1">${escapeHtml(review.content)}</p>
      ${imagesHtml}
      <div class="flex items-center gap-md mt-sm">${replyBtn}</div>
      ${formHtml}
      ${repliesHtml ? `<div class="mt-md pl-lg border-l border-outline-variant/30 space-y-md">${repliesHtml}</div>` : ""}
    </div>
  `;
};

const renderReviewList = () => {
  const list = document.getElementById("adminReviewList");
  if (!list) return;

  if (state.reviews.length === 0) {
    list.innerHTML = `<div class="text-on-surface-variant text-center py-xl">Không có đánh giá nào</div>`;
    return;
  }

  list.innerHTML = state.reviews.map(renderReviewCard).join("");
};

const renderReviewPagination = () => {
  const container = document.getElementById("paginationControls");
  if (!container) return;

  const { page, pages, total, limit } = state.pagination;

  renderPaginationSummary(document.getElementById("reviewPaginationSummary"), {
    page,
    limit,
    total,
    itemLabel: "đánh giá",
  });

  renderPagination(container, {
    page,
    pages,
    onChange: (targetPage) => {
      state.pagination.page = targetPage;
      loadReviews();
      scrollToTableTop(document.getElementById("adminReviewList"));
    },
  });
};

// ───────────────────────────────────────────────────────────────────────────
// Rating filter chips (Tất cả / 5 sao / 4 sao / ... with live counts)
// ───────────────────────────────────────────────────────────────────────────

const RATING_FILTER_LABELS = [
  { value: "", label: "Tất cả" },
  { value: "5", label: "5 sao" },
  { value: "4", label: "4 sao" },
  { value: "3", label: "3 sao" },
  { value: "2", label: "2 sao" },
  { value: "1", label: "1 sao" },
];

const renderAdminRatingFilterChips = () => {
  const container = document.getElementById("reviewRatingFilter");
  if (!container) return;

  const countFor = (value) =>
    value === "" ? state.ratingStatistics.all : state.ratingStatistics[value];

  container.innerHTML = RATING_FILTER_LABELS.map(({ value, label }) => {
    const isActive = state.rating === value;
    return `<button type="button" data-admin-rating-filter="${value}" class="px-md py-1.5 rounded-full text-label-sm font-label-md border transition-colors ${
      isActive
        ? "bg-primary text-on-primary border-primary"
        : "bg-surface-container-low border-transparent text-on-surface-variant hover:bg-surface-container-high"
    }">${label} (${countFor(value)})</button>`;
  }).join("");

  container.querySelectorAll("[data-admin-rating-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.adminRatingFilter;
      if (state.rating === value) return;
      // Keep the current page if it's still valid for the new filter — the
      // backend clamps it down to the nearest valid page when it isn't.
      state.rating = value;
      loadReviews();
    });
  });
};

// ───────────────────────────────────────────────────────────────────────────
// Data loading
// ───────────────────────────────────────────────────────────────────────────

const loadReviews = async () => {
  const list = document.getElementById("adminReviewList");
  if (list) {
    list.innerHTML = `<div class="text-on-surface-variant text-center py-xl">Đang tải đánh giá...</div>`;
  }

  const params = { page: state.pagination.page, limit: state.pagination.limit };
  if (state.rating) params.rating = state.rating;
  if (state.keyword) params.keyword = state.keyword;

  const data = await getAdminReviews(params);
  if (data.success) {
    state.reviews = data.reviews;
    state.pagination = data.pagination;
    state.ratingStatistics = data.ratingStatistics;
    renderAdminRatingFilterChips();
    renderReviewList();
    renderReviewPagination();
  } else if (list) {
    list.innerHTML = `<div class="text-center py-xl text-error">${escapeHtml(data.message || "Lỗi tải đánh giá")}</div>`;
  }
};

// ───────────────────────────────────────────────────────────────────────────
// Event handling
// ───────────────────────────────────────────────────────────────────────────

const handleListClick = async (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  switch (action) {
    case "view-image":
      openImageLightbox(target.dataset.src);
      break;

    case "show-reply-form":
      state.editingReplyId = null;
      state.openReplyFormKey =
        state.openReplyFormKey === target.dataset.key ? null : target.dataset.key;
      renderReviewList();
      break;

    case "cancel-reply":
      state.openReplyFormKey = null;
      renderReviewList();
      break;

    case "edit-reply":
      state.openReplyFormKey = null;
      state.editingReplyId = target.dataset.id;
      renderReviewList();
      break;

    case "cancel-edit-reply":
      state.editingReplyId = null;
      renderReviewList();
      break;

    case "delete-reply": {
      if (!confirm("Bạn có chắc muốn xóa phản hồi này?")) return;
      const { status, data } = await removeReply(target.dataset.id);
      if (status === 200 && data.success) {
        await loadReviews();
      } else {
        notify(data.message || "Lỗi xóa phản hồi");
      }
      break;
    }
  }
};

const handleListSubmit = async (e) => {
  const form = e.target.closest("form[data-form]");
  if (!form) return;
  e.preventDefault();
  const formType = form.dataset.form;

  if (formType === "reply") {
    const reviewId = form.dataset.reviewId;
    const parentReplyId = form.dataset.parentId || null;
    const content = form.querySelector("textarea").value.trim();
    if (!content) return notify("Vui lòng nhập nội dung phản hồi");

    const { status, data } = await submitReply(reviewId, content, parentReplyId);
    if (status === 201 && data.success) {
      state.openReplyFormKey = null;
      await loadReviews();
    } else {
      notify(data.message || "Lỗi gửi phản hồi");
    }
    return;
  }

  if (formType === "edit-reply") {
    const replyId = form.dataset.replyId;
    const content = form.querySelector("textarea").value.trim();
    if (!content) return notify("Nội dung không được để trống");

    const { status, data } = await editReply(replyId, content);
    if (status === 200 && data.success) {
      state.editingReplyId = null;
      await loadReviews();
    } else {
      notify(data.message || "Lỗi cập nhật phản hồi");
    }
  }
};

// ───────────────────────────────────────────────────────────────────────────
// Public init
// ───────────────────────────────────────────────────────────────────────────

export const initAdminReviews = (options = {}) => {
  state.currentUser = getUserInfo();
  if (typeof options.notify === "function") notify = options.notify;

  const searchInput = document.getElementById("reviewSearchInput");
  let searchDebounce = null;
  searchInput?.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.keyword = searchInput.value.trim();
      state.pagination.page = 1;
      loadReviews();
    }, 300);
  });

  const list = document.getElementById("adminReviewList");
  list?.addEventListener("click", handleListClick);
  list?.addEventListener("submit", handleListSubmit);

  loadReviews();
};
