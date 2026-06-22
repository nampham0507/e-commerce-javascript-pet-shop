// Shared pagination component used by every admin "manage*" page.
// Renders "Previous | 1 ... n | Next" with ellipsis for large page counts,
// collapses to "Previous | Trang X/Y | Next" on mobile (no horizontal scroll),
// and exposes a one-line "Hiển thị X-Y trong Z ..." summary helper.

const DOTS = "...";

// Builds a bounded list of page numbers with ellipsis markers, e.g.
// [1,2,3,4,5,DOTS,23] / [1,DOTS,8,9,10,11,12,DOTS,23] / [1,DOTS,19,20,21,22,23]
export function buildPageList(current, total, windowSize = 5) {
  const totalPages = Math.max(total || 0, 0);
  if (totalPages <= 0) return [];
  if (totalPages <= windowSize + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(windowSize / 2);
  let start = current - half;
  let end = current + half;

  if (start < 1) {
    end += 1 - start;
    start = 1;
  }
  if (end > totalPages) {
    start -= end - totalPages;
    end = totalPages;
  }
  start = Math.max(start, 1);
  end = Math.min(end, totalPages);

  const pages = [];
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push(DOTS);
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push(DOTS);
    pages.push(totalPages);
  }
  return pages;
}

// Updates a one-line "Hiển thị X-Y trong Z <label>" summary element.
export function renderPaginationSummary(el, { page, limit, total, itemLabel = "mục" }) {
  if (!el) return;

  if (!total) {
    el.textContent = `Không có ${itemLabel} nào`;
    return;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  el.textContent = `Hiển thị ${start}-${end} trong ${total} ${itemLabel}`;
}

// Renders the Previous / page-numbers / Next control into `container` and
// wires up click handlers. `onChange(targetPage)` is called with a page
// number already clamped to [1, pages].
export function renderPagination(container, { page, pages, onChange }) {
  if (!container) return;

  const totalPages = Math.max(pages || 1, 1);
  const currentPage = Math.min(Math.max(page || 1, 1), totalPages);

  const pageNumbers = buildPageList(currentPage, totalPages);

  const numberButtonsHtml = pageNumbers
    .map((p) => {
      if (p === DOTS) {
        return `<span class="px-1.5 text-on-surface-variant select-none">…</span>`;
      }
      const isActive = p === currentPage;
      return `<button type="button" data-page="${p}" aria-current="${isActive ? "page" : "false"}" class="pagination-btn min-w-[2.25rem] h-9 px-2 rounded-full font-label-md text-label-sm transition-colors ${
        isActive
          ? "bg-primary text-on-primary"
          : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
      }">${p}</button>`;
    })
    .join("");

  container.innerHTML = `
    <nav class="flex items-center gap-1 sm:gap-2" aria-label="Phân trang">
      <button type="button" data-page="prev" class="pagination-btn h-9 px-2 sm:px-3 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center gap-1 shrink-0" ${currentPage <= 1 ? "disabled" : ""}>
        <span class="material-symbols-outlined text-[18px]">chevron_left</span>
        <span class="hidden sm:inline text-label-sm">Trước</span>
      </button>

      <div class="hidden sm:flex items-center gap-1">
        ${numberButtonsHtml}
      </div>

      <div class="sm:hidden flex items-center px-2 font-label-sm text-on-surface-variant whitespace-nowrap">
        Trang ${currentPage}/${totalPages}
      </div>

      <button type="button" data-page="next" class="pagination-btn h-9 px-2 sm:px-3 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center gap-1 shrink-0" ${currentPage >= totalPages ? "disabled" : ""}>
        <span class="hidden sm:inline text-label-sm">Sau</span>
        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </nav>
  `;

  container.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      const value = btn.dataset.page;
      let target = currentPage;
      if (value === "prev") target = currentPage - 1;
      else if (value === "next") target = currentPage + 1;
      else target = parseInt(value, 10);

      if (!target || target < 1 || target > totalPages || target === currentPage) {
        return;
      }
      onChange(target);
    });
  });
}

// Scrolls a reference element (typically the table/list container) back
// into view after a page change, per UX requirement.
export function scrollToTableTop(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
