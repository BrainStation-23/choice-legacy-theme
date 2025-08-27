// pagination-utils.js - Common pagination utility

class PaginationManager {
  constructor(config) {
    this.containerId = config.containerId;
    this.itemsPerPage = config.itemsPerPage || 10;
    this.onPageChange = config.onPageChange;
    this.currentPage = 1;
    this.totalPages = 1;
    this.allItems = [];

    this.paginationContainer = document.getElementById(this.containerId);
  }

  setData(items) {
    this.allItems = items;
    this.totalPages = Math.ceil(items.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  getCurrentPageItems() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.allItems.slice(startIndex, endIndex);
  }

  goToPage(pageNum) {
    if (pageNum >= 1 && pageNum <= this.totalPages) {
      this.currentPage = pageNum;
      this.renderPagination();
      if (this.onPageChange) {
        this.onPageChange(this.getCurrentPageItems(), this.currentPage);
      }
    }
  }

  renderPagination() {
    if (!this.paginationContainer) return;

    this.paginationContainer.innerHTML = "";

    if (this.totalPages <= 1) {
      this.paginationContainer.style.display = "none";
      return;
    }

    this.paginationContainer.style.display = "flex";

    const leftArrowSvg = `
      <svg width="20" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15,18 9,12 15,6"></polyline>
      </svg>
    `;

    const rightArrowSvg = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9,18 15,12 9,6"></polyline>
      </svg>
    `;

    const createButton = (
      content,
      pageNum,
      isDisabled = false,
      isActive = false
    ) => {
      const button = document.createElement("button");
      button.innerHTML = content;
      button.className =
        "pagination-btn w-40 h-40 rounded-6 flex items-center justify-center border-1 border-solid border-color cursor-pointer transition-transform bg-bg fw-500 fs-14-lh-20-ls-0_1";

      if (isActive) button.classList.add("active");
      button.disabled = isDisabled;

      button.addEventListener("click", () => {
        if (pageNum && !isDisabled) {
          this.goToPage(pageNum);
        }
      });

      return button;
    };

    // Previous button
    const prevBtn = createButton(
      leftArrowSvg,
      this.currentPage - 1,
      this.currentPage <= 1
    );
    this.paginationContainer.appendChild(prevBtn);

    // Page numbers with ellipsis logic
    let lastPageAdded = 0;
    for (let i = 1; i <= this.totalPages; i++) {
      const showPage =
        i === 1 ||
        i === this.totalPages ||
        (i >= this.currentPage - 1 && i <= this.currentPage + 1);

      if (showPage) {
        if (i > lastPageAdded + 1) {
          const ellipsis = document.createElement("span");
          ellipsis.className = "pagination-ellipsis px-8 fs-14-lh-20-ls-0_1";
          ellipsis.textContent = "...";
          this.paginationContainer.appendChild(ellipsis);
        }

        const pageBtn = createButton(i, i, false, i === this.currentPage);
        this.paginationContainer.appendChild(pageBtn);
        lastPageAdded = i;
      }
    }

    // Next button
    const nextBtn = createButton(
      rightArrowSvg,
      this.currentPage + 1,
      this.currentPage >= this.totalPages
    );
    this.paginationContainer.appendChild(nextBtn);
  }

  init(items) {
    this.setData(items);
    this.renderPagination();
    if (this.onPageChange) {
      this.onPageChange(this.getCurrentPageItems(), this.currentPage);
    }
  }

  refresh() {
    this.renderPagination();
    if (this.onPageChange) {
      this.onPageChange(this.getCurrentPageItems(), this.currentPage);
    }
  }

  getTotalPages() {
    return this.totalPages;
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getTotalItems() {
    return this.allItems.length;
  }
}

// Export for use in other files
window.PaginationManager = PaginationManager;
