(function () {
  const reviewAppContainers = document.querySelectorAll(
    ".review-extension-container"
  );

  reviewAppContainers.forEach((container) => {
    const sectionId = container.dataset.sectionId;
    const productId = container.dataset.productId;
    const productHandle = container.dataset.productHandle;
    const shopDomain = container.dataset.shopDomain;
    const starColorFilled = container.dataset.starFilledColor || "#FFD700";
    const starColorEmpty = container.dataset.starEmptyColor || "#CCCCCC";
    const loadMoreBtn = container.querySelector(`#load-more-btn-${sectionId}`);
    const loadMoreContainer = container.querySelector(
      `#load-more-container-${sectionId}`
    );
    const reviewListContainer = container.querySelector(
      `#reviews-list-${sectionId}`
    );
    const reviewsSpinner = container.querySelector(
      `#reviews-spinner-${sectionId}`
    );
    const reviewSummaryContainer = container.querySelector(
      `#review-summary-${sectionId}`
    );

    const API_BASE_URL = `/apps/${APP_SUB_PATH}/customer/product-review`;

    let allProductReviews = [];
    let currentPage = 1;
    let totalPages = 1;
    let isLoadingMore = false;
    let hasMoreReviews = false;

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", async function () {
        if (!isLoadingMore && hasMoreReviews) {
          isLoadingMore = true;
          await fetchReviews(currentPage + 1, true);
          isLoadingMore = false;
        }
      });
    }

    function createStarRating(rating) {
      let starsHtml = "";
      for (let i = 1; i <= 5; i++) {
        starsHtml +=
          i <= rating
            ? `<span class="text-brand" style="font-size: 20px">★</span>`
            : `<span class="text-bg" style="font-size: 20px;">★</span>`;
      }
      return starsHtml;
    }

    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    function getProductTitle(productId) {
      if (!window.allShopifyProducts || !productId) return "Product Title";
      const product = Object.values(window.allShopifyProducts).find(
        (p) => p.id === productId
      );
      return product ? product.title : "Product Title";
    }

    async function fetchReviews(page = 1, append = false) {
      if (!reviewListContainer || !productId) return;

      if (!append) {
        if (reviewsSpinner) reviewsSpinner.style.display = "flex";
        if (reviewListContainer) reviewListContainer.innerHTML = "";
        allProductReviews = [];
      } else if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = "Loading...";
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/list/${productId}?page=${page}&limit=10`
        );
        if (!response.ok)
          throw new Error(
            (await response.json()).message || "Failed to fetch reviews"
          );

        const reviewResponse = await response.json();
        const newReviews = reviewResponse?.data || [];
        const pagination = reviewResponse?.pagination || {};

        currentPage = pagination.currentPage || page;
        totalPages = pagination.totalPages || 1;
        hasMoreReviews = pagination.hasNextPage || false;

        if (append) {
          allProductReviews = [...allProductReviews, ...newReviews];
          appendReviewsToSlideshow(newReviews);
          const gridContainer = reviewListContainer.querySelector(
            ".product-reviews-grid"
          );
          if (gridContainer)
            renderDesktopGrid(allProductReviews, gridContainer);
        } else {
          allProductReviews = newReviews;
          renderReviews(allProductReviews);
        }
        calculateAndRenderSummary(allProductReviews);
        updateLoadMoreButton();
      } catch (error) {
        console.error("Error fetching reviews:", error);
        if (!append) {
          allProductReviews = [];
          calculateAndRenderSummary(allProductReviews);
        }
      } finally {
        if (!append && reviewsSpinner) reviewsSpinner.style.display = "none";
        if (append && loadMoreBtn) {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = "Load More Reviews";
        }
      }
    }

    function updateLoadMoreButton() {
      if (!loadMoreContainer || !loadMoreBtn) return;
      loadMoreContainer.style.display = hasMoreReviews ? "flex" : "none";
    }

    function calculateAndRenderSummary(reviewsArray) {
      if (!reviewSummaryContainer) return;

      if (!reviewsArray || reviewsArray.length === 0) {
        return;
      }

      const totalReviews = reviewsArray.length;
      const sumOfRatings = reviewsArray.reduce(
        (sum, review) => sum + (review.rating || 0),
        0
      );
      const averageRating = totalReviews > 0 ? sumOfRatings / totalReviews : 0;

      const fullStars = Math.floor(averageRating);
      const decimalPart = averageRating - fullStars;
      const hasHalfStar = decimalPart >= 0.25 && decimalPart < 0.75;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

      let starsHTML = "";

      for (let i = 0; i < fullStars; i++) {
        starsHTML += `<span class="star" style="color:${starColorFilled}; font-size: 1.2em;">&#9733;</span>`;
      }

      if (hasHalfStar) {
        starsHTML += `<span class="star half-star" style="position: relative; display: inline-block; font-size: 1.2em;">
                    <span style="color:${starColorEmpty};">&#9734;</span>
                    <span style="color:${starColorFilled}; position: absolute; overflow: hidden; width: 50%; top: 0; left: 0;">&#9733;</span>
                </span>`;
      }

      for (let i = 0; i < emptyStars; i++) {
        starsHTML += `<span class="star" style="font-size: 24px;">&#9734;</span>`;
      }
    }

    function appendReviewsToSlideshow(newReviews) {
      const slideshowElement = reviewListContainer.querySelector(
        "slideshow-component"
      );
      if (!slideshowElement) return;

      const swiperWrapper = slideshowElement.querySelector(".swiper-wrapper");
      if (!swiperWrapper) return;

      newReviews.forEach((review) => {
        const productTitle = getProductTitle(review.productId);
        const reviewDate = review.reviewPlacedAt
          ? formatDate(review.reviewPlacedAt)
          : "N/A";
        const ratingStarsHTML = createStarRating(review.rating);
        const imageHtml = review.reviewImage
          ? `<img src="${review.reviewImage}" class="w-full h-full" alt="${productTitle}" loading="lazy">`
          : `<div></div>`;

        const mobileReviewItem = document.createElement("div");
        mobileReviewItem.className = "swiper-slide w-auto";
        mobileReviewItem.style.boxSizing = "border-box";
        mobileReviewItem.innerHTML = `
      <div class="p-8 box-shadow flex flex-col gap-16 w-300">
        <div class="relative flex justify-center h-220">
          ${imageHtml}
          <div class="absolute bottom-16 bg-brand-2 pt-8 pr-10 pb-8 pl-10 flex gap-4_8 rounded-100">
            ${ratingStarsHTML}
          </div>
        </div>
        <div class="flex flex-col gap-8">
          <div class="ff-general-sans fs-14-lh-20-ls-0 fw-400 text-secondary">
            ${escapeHTML(review.reviewText || "")}
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <span class="fs-12-lh-16-ls-0_6pct ff-general-sans fw-400 text-label">
            ${reviewDate}
          </span>
          <span class="fs-12-lh-16-ls-0_6pct ff-general-sans fw-400 text-label">
            By ${review.customerName || "Anonymous"}
          </span>
        </div>
      </div>
    `;

        swiperWrapper.appendChild(mobileReviewItem);
      });
    }

    function renderReviews(reviewsArray) {
      if (!reviewListContainer) return;
      reviewListContainer.innerHTML = "";

      // Create slideshow component wrapper for mobile
      const slideshowComponent = document.createElement("slideshow-component");
      slideshowComponent.setAttribute("data-autoplay", "false");
      slideshowComponent.setAttribute("data-autoplay-delay", "5000");
      slideshowComponent.setAttribute("data-pause-on-hover", "true");
      slideshowComponent.setAttribute("data-enable-carousel", "true");
      slideshowComponent.setAttribute("data-show-progress-bar", "false");
      slideshowComponent.setAttribute("data-nav-loop", "false");
      slideshowComponent.className =
        "flex-col gap-16 hidden md:hidden lg:hidden sm:flex";

      // Create swiper container for mobile
      const swiperContainer = document.createElement("div");
      swiperContainer.className =
        "swiper-container overflow-hidden pt-10 pr-4 pb-10 pl-4";

      const swiperWrapper = document.createElement("div");
      swiperWrapper.className = "swiper-wrapper flex";

      // Create grid container for desktop
      const gridContainer = document.createElement("div");
      gridContainer.className =
        "product-reviews-grid grid sm:hidden grid-cols-5 lg:grid-cols-4 md:grid-cols-3 gap-24 md:gap-16";

      reviewsArray.forEach((review) => {
        const productTitle = getProductTitle(review.productId);
        const reviewDate = review.reviewPlacedAt
          ? formatDate(review.reviewPlacedAt)
          : "N/A";
        const ratingStarsHTML = createStarRating(review.rating);
        const imageHtml = review.reviewImage
          ? `<img src="${review.reviewImage}" class="w-full h-full" alt="${productTitle}" loading="lazy">`
          : `<div></div>`;

        // Desktop grid item
        const desktopReviewItem = document.createElement("div");
        desktopReviewItem.className = "p-8 box-shadow flex flex-col gap-16";
        desktopReviewItem.innerHTML = `
      <div class="relative flex justify-center h-220">
        ${imageHtml}
        <div class="absolute bottom-16 bg-brand-2 pt-8 pr-10 pb-8 pl-10 flex gap-4_8 rounded-100">
          ${ratingStarsHTML}
        </div>
      </div>
      <div class="flex flex-col gap-8">
        <div class="ff-general-sans fs-14-lh-20-ls-0 fw-400 text-secondary">
          ${escapeHTML(review.reviewText || "")}
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <span class="fs-12-lh-16-ls-0_6pct ff-general-sans fw-400 text-label">
          ${reviewDate}
        </span>
        <span class="fs-12-lh-16-ls-0_6pct ff-general-sans fw-400 text-label">
          By ${review.customerName || "Anonymous"}
        </span>
      </div>
    `;

        // Mobile swiper slide
        const mobileReviewItem = document.createElement("div");
        mobileReviewItem.className = "swiper-slide w-auto";
        mobileReviewItem.style.boxSizing = "border-box";
        mobileReviewItem.innerHTML = `
      <div class="p-8 box-shadow flex flex-col gap-16 w-300">
        <div class="relative flex justify-center h-220">
          ${imageHtml}
          <div class="absolute bottom-16 bg-brand-2 pt-8 pr-10 pb-8 pl-10 flex gap-4_8 rounded-100">
            ${ratingStarsHTML}
          </div>
        </div>
        <div class="flex flex-col gap-8">
          <div class="ff-general-sans fs-14-lh-20-ls-0 fw-400 text-secondary">
            ${escapeHTML(review.reviewText || "")}
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <span class="fs-12-lh-16-ls-0_6pct ff-general-sans fw-400 text-label">
            ${reviewDate}
          </span>
          <span class="fs-12-lh-16-ls-0_6pct ff-general-sans fw-400 text-label">
            By ${review.customerName || "Anonymous"}
          </span>
        </div>
      </div>
    `;

        // Add to respective containers
        gridContainer.appendChild(desktopReviewItem);
        swiperWrapper.appendChild(mobileReviewItem);
      });

      // Assemble mobile slideshow
      swiperContainer.appendChild(swiperWrapper);
      slideshowComponent.appendChild(swiperContainer);

      // Add both containers to the review list
      reviewListContainer.appendChild(slideshowComponent);
      reviewListContainer.appendChild(gridContainer);

      setTimeout(() => {
        const slideshowElement = reviewListContainer.querySelector(
          "slideshow-component"
        );
        if (slideshowElement && slideshowElement.swiper) {
          // Listen for when swiper reaches the end
          slideshowElement.swiper.on("reachEnd", async () => {
            if (!isLoadingMore && hasMoreReviews) {
              isLoadingMore = true;

              // Store the current slide index before fetching more
              const currentSlideIndex = slideshowElement.swiper.activeIndex;

              try {
                await fetchReviews(currentPage + 1, true);

                // After new reviews are added, update swiper and maintain position
                if (slideshowElement.swiper) {
                  slideshowElement.swiper.update();
                  // Stay at the current slide position
                  slideshowElement.swiper.slideTo(currentSlideIndex, 0); // 0 = no animation
                }
              } finally {
                isLoadingMore = false;
              }
            }
          });
        }
      }, 500);
    }

    function escapeHTML(str) {
      if (str === null || typeof str === "undefined") return "";
      return str
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Initialize and listen for refresh events
    if (productId && productHandle && shopDomain) {
      fetchReviews();
      // Listen for the custom event dispatched by the form script
      document.addEventListener("review:submitted", () => fetchReviews());
    } else {
      console.warn(
        `[Product Reviews App ${sectionId}]: Missing data. Cannot fetch reviews.`
      );
      if (reviewsSpinner) reviewsSpinner.style.display = "none";
    }
  });
})();
