// Product review & threaded reply system - frontend logic
import { isAuthenticated, getUserInfo } from "/js/auth.js";
import {
  renderPagination,
  renderPaginationSummary,
  scrollToTableTop,
} from "/js/pagination.js";

const API_BASE = "/api";
const MAX_REPLY_DEPTH = 3;
const MAX_IMAGES = 5;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const escapeHtml = (str = "") =>
  String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "";

const currentUserId = (user) => user?.id || user?._id || null;

// ───────────────────────────────────────────────────────────────────────────
// API calls
// ───────────────────────────────────────────────────────────────────────────

const getProductReviews = async (productId, { page, limit, rating } = {}) => {
  const params = new URLSearchParams();
  if (page) params.set("page", page);
  if (limit) params.set("limit", limit);
  if (rating) params.set("rating", rating);
  const query = params.toString();
  const res = await fetch(
    `${API_BASE}/reviews/product/${productId}${query ? `?${query}` : ""}`
  );
  return res.json();
};

const getEligibility = async (productId) => {
  const res = await fetch(`${API_BASE}/reviews/${productId}/eligibility`, {
    headers: authHeaders(),
  });
  return { status: res.status, data: await res.json() };
};

const submitReview = async (formData) => {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return { status: res.status, data: await res.json() };
};

const editReview = async (reviewId, formData) => {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: formData,
  });
  return { status: res.status, data: await res.json() };
};

const removeReview = async (reviewId) => {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return { status: res.status, data: await res.json() };
};

const submitReply = async (reviewId, content, parentReplyId) => {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}/replies`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ content, parentReplyId: parentReplyId || null }),
  });
  return { status: res.status, data: await res.json() };
};

const editReply = async (replyId, content) => {
  const res = await fetch(`${API_BASE}/replies/${replyId}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
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

const REVIEWS_PAGE_SIZE = 10;

const state = {
  productId: null,
  currentUser: null,
  reviews: [],
  stats: { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
  ratingStatistics: { all: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  ratingFilter: "", // "" = Tất cả, otherwise "5".."1"
  pagination: { page: 1, limit: REVIEWS_PAGE_SIZE, total: 0, pages: 1 },
  eligibility: { eligible: false, alreadyReviewed: false, review: null },
  editingReviewId: null,
  editingReplyId: null,
  openReplyFormKey: null, // "review:<id>" or "reply:<id>"
};

let notify = (msg) => alert(msg);

// ───────────────────────────────────────────────────────────────────────────
// Star helpers
// ───────────────────────────────────────────────────────────────────────────

const starsDisplayHtml = (rating) =>
  [1, 2, 3, 4, 5]
    .map(
      (i) =>
        `<span class="material-symbols-outlined text-yellow-400 text-[16px]" style="font-variation-settings:'FILL' ${rating >= i ? 1 : 0}">star</span>`
    )
    .join("");

const starPickerHtml = (selected = 0) =>
  [1, 2, 3, 4, 5]
    .map(
      (i) =>
        `<span class="material-symbols-outlined text-[28px] cursor-pointer star-btn ${i <= selected ? "text-yellow-400" : "text-outline-variant"}" data-val="${i}" style="font-variation-settings:'FILL' ${i <= selected ? 1 : 0}">star</span>`
    )
    .join("");

const bindStarPicker = (pickerEl, hiddenInputEl) => {
  const stars = pickerEl.querySelectorAll(".star-btn");
  const setFilled = (val) => {
    stars.forEach((s, idx) => {
      const filled = idx < val;
      s.style.fontVariationSettings = `'FILL' ${filled ? 1 : 0}`;
      s.classList.toggle("text-yellow-400", filled);
      s.classList.toggle("text-outline-variant", !filled);
    });
  };
  stars.forEach((star) => {
    star.addEventListener("mouseover", () =>
      setFilled(parseInt(star.dataset.val))
    );
    star.addEventListener("mouseleave", () =>
      setFilled(parseInt(hiddenInputEl.value) || 0)
    );
    star.addEventListener("click", () => {
      hiddenInputEl.value = star.dataset.val;
      setFilled(parseInt(star.dataset.val));
    });
  });
};

// ───────────────────────────────────────────────────────────────────────────
// Rendering: stats
// ───────────────────────────────────────────────────────────────────────────

const renderStats = () => {
  const avgEl = document.getElementById("avgRatingDisplay");
  const starsEl = document.getElementById("avgStarsDisplay");
  const totalEl = document.getElementById("totalReviewsDisplay");
  const tabEl = document.getElementById("reviewCountTab");
  const barsEl = document.getElementById("ratingBars");

  const { average, total, distribution } = state.stats;

  if (avgEl) avgEl.textContent = total === 0 ? "—" : average.toFixed(1);
  if (starsEl) starsEl.innerHTML = starsDisplayHtml(average);
  if (totalEl) totalEl.textContent = `${total} đánh giá`;
  if (tabEl) tabEl.textContent = total > 0 ? `(${total})` : "";

  if (barsEl) {
    const max = Math.max(...Object.values(distribution), 1);
    barsEl.innerHTML = [5, 4, 3, 2, 1]
      .map((star) => {
        const count = distribution[star] || 0;
        return `
          <div class="flex items-center gap-sm">
            <span class="text-label-sm w-4 text-on-surface-variant">${star}</span>
            <span class="material-symbols-outlined text-yellow-400 text-[14px]" style="font-variation-settings:'FILL' 1">star</span>
            <div class="flex-1 bg-outline-variant/30 rounded-full h-2 overflow-hidden">
              <div class="bg-yellow-400 h-2 rounded-full transition-all" style="width:${(count / max) * 100}%"></div>
            </div>
            <span class="text-label-sm w-4 text-on-surface-variant">${count}</span>
          </div>
        `;
      })
      .join("");
  }
};

// ───────────────────────────────────────────────────────────────────────────
// Rendering: review form (create)
// ───────────────────────────────────────────────────────────────────────────

const renderFormSection = () => {
  const loginPrompt = document.getElementById("reviewLoginPrompt");
  const notEligible = document.getElementById("reviewNotEligible");
  const alreadyReviewed = document.getElementById("reviewAlreadyReviewed");
  const form = document.getElementById("reviewForm");

  [loginPrompt, notEligible, alreadyReviewed, form].forEach((el) =>
    el?.classList.add("hidden")
  );

  if (!state.currentUser) {
    loginPrompt?.classList.remove("hidden");
    return;
  }

  if (state.eligibility.alreadyReviewed) {
    alreadyReviewed?.classList.remove("hidden");
    return;
  }

  if (!state.eligibility.eligible) {
    notEligible?.classList.remove("hidden");
    return;
  }

  form?.classList.remove("hidden");
  const picker = document.getElementById("starPicker");
  const ratingInput = document.getElementById("selectedRating");
  if (picker && ratingInput) {
    picker.innerHTML = starPickerHtml(0);
    ratingInput.value = "0";
    bindStarPicker(picker, ratingInput);
  }
  const titleInput = document.getElementById("reviewTitle");
  const contentInput = document.getElementById("reviewContent");
  const imagesInput = document.getElementById("reviewImagesInput");
  const preview = document.getElementById("reviewImagePreview");
  if (titleInput) titleInput.value = "";
  if (contentInput) contentInput.value = "";
  if (imagesInput) imagesInput.value = "";
  if (preview) preview.innerHTML = "";
};

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

// ───────────────────────────────────────────────────────────────────────────
// Rendering: review list
// ───────────────────────────────────────────────────────────────────────────

const formKeyForReview = (reviewId) => `review:${reviewId}`;
const formKeyForReply = (replyId) => `reply:${replyId}`;

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

const replyFormHtml = (reviewId, parentReplyId) => `
  <form data-form="reply" data-review-id="${reviewId}" data-parent-id="${parentReplyId || ""}" class="mt-sm space-y-2">
    <textarea required maxlength="1000" rows="2" placeholder="Viết phản hồi..."
      class="w-full text-body-md p-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary bg-surface resize-none"></textarea>
    <div class="flex gap-sm">
      <button type="submit" class="text-label-sm bg-primary text-on-primary px-md py-1.5 rounded-md hover:opacity-90">Gửi</button>
      <button type="button" data-action="cancel-reply" class="text-label-sm bg-surface-container-high text-on-surface-variant px-md py-1.5 rounded-md hover:opacity-90">Hủy</button>
    </div>
  </form>
`;

const editReviewFormHtml = (review) => `
  <form data-form="edit-review" data-review-id="${review._id}" class="space-y-md mt-sm">
    <div class="flex items-center gap-sm">
      <span class="text-on-surface-variant text-label-md">Số sao:</span>
      <div class="star-picker flex gap-1 cursor-pointer">${starPickerHtml(review.rating)}</div>
      <input type="hidden" class="rating-input" value="${review.rating}">
    </div>
    <input type="text" class="title-input w-full border border-outline-variant rounded-xl px-md py-2 text-body-md focus:outline-none focus:border-primary bg-surface"
      maxlength="120" required value="${escapeHtml(review.title)}" placeholder="Tiêu đề đánh giá">
    <textarea class="content-input w-full border border-outline-variant rounded-xl px-md py-3 text-body-md focus:outline-none focus:border-primary bg-surface resize-none"
      rows="3" maxlength="2000" required>${escapeHtml(review.content)}</textarea>
    <div>
      <div class="existing-images flex gap-2 flex-wrap mb-2" data-existing-images='${JSON.stringify(review.images || []).replace(/'/g, "&#39;")}'>
        ${(review.images || [])
          .map(
            (src) => `
          <div class="relative" data-existing-image-item="${escapeHtml(src)}">
            <img src="${escapeHtml(src)}" class="w-16 h-16 object-cover rounded-lg border border-outline-variant" />
            <button type="button" data-action="remove-existing-image" data-src="${escapeHtml(src)}"
              class="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-error text-on-error text-[12px] leading-none">×</button>
          </div>`
          )
          .join("")}
      </div>
      <input type="file" class="images-input text-label-sm" accept="image/*" multiple>
    </div>
    <div class="flex gap-sm">
      <button type="submit" class="bg-primary-container text-on-primary-container px-lg py-2 rounded-full font-label-md hover:scale-105 transition-transform active:scale-95">Lưu</button>
      <button type="button" data-action="cancel-edit-review" class="bg-surface-container-high text-on-surface-variant px-lg py-2 rounded-full font-label-md hover:opacity-90">Hủy</button>
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

const renderReplyItem = (reply, reviewId, depth) => {
  const myId = currentUserId(state.currentUser);
  const isOwner = myId && String(reply.user?._id) === String(myId);
  const displayName = reply.user?.fullName || "Người dùng";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const canReply = !!state.currentUser && depth < MAX_REPLY_DEPTH;

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
  const myId = currentUserId(state.currentUser);
  const isOwner = myId && String(review.user?._id) === String(myId);
  const displayName = review.user?.fullName || "Khách hàng";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  if (state.editingReviewId === review._id) {
    return `
      <div class="bg-surface-container-lowest rounded-[20px] p-lg border border-outline-variant/30" data-review-id="${review._id}">
        <div class="flex items-center gap-sm mb-sm">
          <div class="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-md">${avatarLetter}</div>
          <div class="font-label-md text-on-surface">${escapeHtml(displayName)}</div>
        </div>
        ${editReviewFormHtml(review)}
      </div>
    `;
  }

  const stars = starsDisplayHtml(review.rating);
  const imagesHtml = (review.images || []).length
    ? `<div class="flex gap-2 flex-wrap mt-sm">${(review.images || [])
        .map(
          (src) =>
            `<img src="${escapeHtml(src)}" data-action="view-image" data-src="${escapeHtml(src)}" class="w-20 h-20 object-cover rounded-lg border border-outline-variant cursor-pointer hover:opacity-80 transition-opacity" />`
        )
        .join("")}</div>`
    : "";

  const ownerActions = isOwner
    ? `
      <button data-action="edit-review" data-id="${review._id}" class="flex items-center gap-1 text-primary text-label-sm hover:opacity-70 transition-opacity">
        <span class="material-symbols-outlined text-[16px]">edit</span>Sửa
      </button>
      <button data-action="delete-review" data-id="${review._id}" class="flex items-center gap-1 text-error text-label-sm hover:opacity-70 transition-opacity">
        <span class="material-symbols-outlined text-[16px]">delete</span>Xóa
      </button>
    `
    : "";

  const replyBtn = state.currentUser
    ? `<button data-action="show-reply-form" data-key="${formKeyForReview(review._id)}" data-review-id="${review._id}" data-parent-id="" class="text-label-sm text-primary hover:underline">Trả lời</button>`
    : "";

  const formHtml =
    state.openReplyFormKey === formKeyForReview(review._id)
      ? replyFormHtml(review._id, null)
      : "";

  const repliesHtml = (review.replies || [])
    .map((reply) => renderReplyItem(reply, review._id, 1))
    .join("");

  return `
    <div class="bg-surface-container-lowest rounded-[20px] p-lg border border-outline-variant/30" data-review-id="${review._id}">
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
      <div class="flex items-center gap-md mt-sm">${replyBtn}${ownerActions}</div>
      ${formHtml}
      ${repliesHtml ? `<div class="mt-md pl-lg border-l border-outline-variant/30 space-y-md">${repliesHtml}</div>` : ""}
    </div>
  `;
};

const renderReviewList = () => {
  const list = document.getElementById("reviewList");
  if (!list) return;

  if (state.reviews.length === 0) {
    list.innerHTML = `<div class="text-on-surface-variant text-center py-xl">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>`;
    return;
  }

  list.innerHTML = state.reviews.map(renderReviewCard).join("");

  // Bind star pickers inside any open edit-review forms
  list.querySelectorAll('form[data-form="edit-review"]').forEach((form) => {
    const picker = form.querySelector(".star-picker");
    const ratingInput = form.querySelector(".rating-input");
    if (picker && ratingInput) bindStarPicker(picker, ratingInput);
  });
};

// ───────────────────────────────────────────────────────────────────────────
// Rendering: rating filter chips + pagination
// ───────────────────────────────────────────────────────────────────────────

const RATING_FILTER_LABELS = [
  { value: "", label: "Tất cả" },
  { value: "5", label: "5 sao" },
  { value: "4", label: "4 sao" },
  { value: "3", label: "3 sao" },
  { value: "2", label: "2 sao" },
  { value: "1", label: "1 sao" },
];

const setRatingFilter = (value) => {
  if (state.ratingFilter === value) return;
  state.ratingFilter = value;
  state.pagination.page = 1;
  loadAndRenderReviews();
};

const renderRatingFilterChips = () => {
  const container = document.getElementById("reviewRatingFilter");
  if (!container) return;

  const countFor = (value) =>
    value === "" ? state.ratingStatistics.all : state.ratingStatistics[value];

  container.innerHTML = RATING_FILTER_LABELS.map(({ value, label }) => {
    const isActive = state.ratingFilter === value;
    return `<button type="button" data-rating-filter="${value}" class="px-md py-1.5 rounded-full text-label-sm font-label-md border transition-colors ${
      isActive
        ? "bg-primary text-on-primary border-primary"
        : "bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
    }">${label} (${countFor(value)})</button>`;
  }).join("");

  container.querySelectorAll("[data-rating-filter]").forEach((btn) => {
    btn.addEventListener("click", () =>
      setRatingFilter(btn.dataset.ratingFilter)
    );
  });
};

const renderReviewPagination = () => {
  const summaryEl = document.getElementById("reviewPaginationSummary");
  const controlsEl = document.getElementById("reviewPaginationControls");
  const { page, limit, total, pages } = state.pagination;

  renderPaginationSummary(summaryEl, {
    page,
    limit,
    total,
    itemLabel: "đánh giá",
  });

  renderPagination(controlsEl, {
    page,
    pages,
    onChange: (targetPage) => {
      state.pagination.page = targetPage;
      loadAndRenderReviews();
      scrollToTableTop(document.getElementById("reviewRatingFilter"));
    },
  });
};

const renderAll = () => {
  renderStats();
  renderRatingFilterChips();
  renderFormSection();
  renderReviewList();
  renderReviewPagination();
};

// ───────────────────────────────────────────────────────────────────────────
// Data loading
// ───────────────────────────────────────────────────────────────────────────

const loadReviews = async () => {
  const data = await getProductReviews(state.productId, {
    page: state.pagination.page,
    limit: state.pagination.limit,
    rating: state.ratingFilter,
  });
  if (data.success) {
    state.reviews = data.reviews;
    state.stats = data.stats;
    state.ratingStatistics = data.ratingStatistics;
    state.pagination = data.pagination;
  }
};

// Refresh only the review list/filters/pagination (rating filter or page change) —
// no need to re-check eligibility or reload the create-review form state.
const loadAndRenderReviews = async () => {
  await loadReviews();
  renderStats();
  renderRatingFilterChips();
  renderReviewList();
  renderReviewPagination();
};

const loadEligibility = async () => {
  if (!state.currentUser) return;
  const { status, data } = await getEligibility(state.productId);
  if (status === 401) {
    state.currentUser = null;
    return;
  }
  if (data.success) {
    state.eligibility = {
      eligible: data.eligible,
      alreadyReviewed: data.alreadyReviewed,
      review: data.review,
    };
  }
};

const loadAll = async () => {
  state.currentUser = isAuthenticated() ? getUserInfo() : null;
  await Promise.all([loadReviews(), loadEligibility()]);
  renderAll();
};

// ───────────────────────────────────────────────────────────────────────────
// Event handling
// ───────────────────────────────────────────────────────────────────────────

const buildReviewFormData = ({ rating, title, content, files, existingImages }) => {
  const formData = new FormData();
  if (rating !== undefined) formData.append("rating", rating);
  if (title !== undefined) formData.append("title", title);
  if (content !== undefined) formData.append("content", content);
  if (existingImages) {
    existingImages.forEach((src) => formData.append("existingImages", src));
  }
  if (files) {
    Array.from(files)
      .slice(0, MAX_IMAGES)
      .forEach((file) => formData.append("images", file));
  }
  return formData;
};

const handleCreateReviewSubmit = async (e) => {
  e.preventDefault();
  const rating = parseInt(document.getElementById("selectedRating").value);
  const title = document.getElementById("reviewTitle").value.trim();
  const content = document.getElementById("reviewContent").value.trim();
  const files = document.getElementById("reviewImagesInput").files;

  if (!rating) return notify("Vui lòng chọn số sao!");
  if (!title) return notify("Vui lòng nhập tiêu đề đánh giá!");
  if (!content) return notify("Vui lòng nhập nội dung đánh giá!");
  if (files.length > MAX_IMAGES) return notify(`Chỉ được tải tối đa ${MAX_IMAGES} ảnh`);

  const formData = new FormData();
  formData.append("productId", state.productId);
  formData.append("rating", rating);
  formData.append("title", title);
  formData.append("content", content);
  Array.from(files).forEach((file) => formData.append("images", file));

  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalText = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi...";
  }

  try {
    const { status, data } = await submitReview(formData);
    if (status === 201 && data.success) {
      await loadAll();
      notify("Đã gửi đánh giá thành công!");
    } else {
      notify(data.message || "Lỗi gửi đánh giá");
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
};

const handleImagePreview = () => {
  const input = document.getElementById("reviewImagesInput");
  const preview = document.getElementById("reviewImagePreview");
  if (!input || !preview) return;
  preview.innerHTML = "";
  Array.from(input.files)
    .slice(0, MAX_IMAGES)
    .forEach((file) => {
      const url = URL.createObjectURL(file);
      preview.innerHTML += `<img src="${url}" class="w-16 h-16 object-cover rounded-lg border border-outline-variant" />`;
    });
};

const handleListClick = async (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  switch (action) {
    case "view-image":
      openImageLightbox(target.dataset.src);
      break;

    case "edit-review":
      state.editingReviewId = target.dataset.id;
      state.openReplyFormKey = null;
      renderReviewList();
      break;

    case "cancel-edit-review":
      state.editingReviewId = null;
      renderReviewList();
      break;

    case "delete-review": {
      if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
      const { status, data } = await removeReview(target.dataset.id);
      if (status === 200 && data.success) {
        await loadAll();
      } else {
        notify(data.message || "Lỗi xóa đánh giá");
      }
      break;
    }

    case "remove-existing-image": {
      const container = target.closest(".existing-images");
      const existing = JSON.parse(container.dataset.existingImages || "[]");
      const updated = existing.filter((src) => src !== target.dataset.src);
      container.dataset.existingImages = JSON.stringify(updated);
      target.closest("[data-existing-image-item]")?.remove();
      break;
    }

    case "show-reply-form":
      state.editingReviewId = null;
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
        await loadAll();
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

  if (formType === "edit-review") {
    const reviewId = form.dataset.reviewId;
    const rating = form.querySelector(".rating-input").value;
    const title = form.querySelector(".title-input").value.trim();
    const content = form.querySelector(".content-input").value.trim();
    const existingImages = JSON.parse(
      form.querySelector(".existing-images").dataset.existingImages || "[]"
    );
    const files = form.querySelector(".images-input").files;

    if (!title) return notify("Tiêu đề không được để trống");
    if (!content) return notify("Nội dung không được để trống");

    const formData = buildReviewFormData({ rating, title, content, files, existingImages });
    const { status, data } = await editReview(reviewId, formData);
    if (status === 200 && data.success) {
      state.editingReviewId = null;
      await loadAll();
    } else {
      notify(data.message || "Lỗi cập nhật đánh giá");
    }
    return;
  }

  if (formType === "reply") {
    const reviewId = form.dataset.reviewId;
    const parentReplyId = form.dataset.parentId || null;
    const content = form.querySelector("textarea").value.trim();
    if (!content) return notify("Vui lòng nhập nội dung phản hồi");

    const { status, data } = await submitReply(reviewId, content, parentReplyId);
    if (status === 201 && data.success) {
      state.openReplyFormKey = null;
      await loadAll();
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
      await loadAll();
    } else {
      notify(data.message || "Lỗi cập nhật phản hồi");
    }
  }
};

// ───────────────────────────────────────────────────────────────────────────
// Public init
// ───────────────────────────────────────────────────────────────────────────

export const initReviewSection = (productId, options = {}) => {
  state.productId = productId;
  if (typeof options.notify === "function") notify = options.notify;

  const createForm = document.getElementById("reviewForm");
  createForm?.addEventListener("submit", handleCreateReviewSubmit);

  const imagesInput = document.getElementById("reviewImagesInput");
  imagesInput?.addEventListener("change", handleImagePreview);

  const list = document.getElementById("reviewList");
  list?.addEventListener("click", handleListClick);
  list?.addEventListener("submit", handleListSubmit);

  loadAll();
};
