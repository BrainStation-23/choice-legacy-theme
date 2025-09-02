// products-review.js - Fixed version without premature validation
(function () {
  const reviewAppContainers = document.querySelectorAll(
    ".review-extension-container"
  );

  // Initialize Toast Manager
  const toastManager = new ToastNotificationManager();

  reviewAppContainers.forEach((container) => {
    const sectionId = container.dataset.sectionId;
    const productId = container.dataset.productId;
    const productHandle = container.dataset.productHandle;
    const shopDomain = container.dataset.shopDomain;
    const starColorFilled = container.dataset.starFilledColor || "#FFD700";
    const starColorEmpty = container.dataset.starEmptyColor || "#CCCCCC";
    const showEmptyReviewsSetting = container.dataset.showEmpty === "true";
    const loadMoreBtn = container.querySelector(`#load-more-btn-${sectionId}`);
    const loadMoreContainer = container.querySelector(
      `#load-more-container-${sectionId}`
    );

    const API_BASE_URL = `/apps/${APP_SUB_PATH}/customer/product-review`;

    // Modal elements
    const writeReviewBtn = container.querySelector(
      `#write-review-btn-${sectionId}`
    );
    const reviewModal = container.querySelector(`#review-modal-${sectionId}`);
    const modalCloseBtn = container.querySelector(
      `#review-modal-close-${sectionId}`
    );

    // Form elements
    const reviewForm = container.querySelector(
      `#review-submission-form-${sectionId}`
    );
    const reviewListContainer = container.querySelector(
      `#reviews-list-${sectionId}`
    );
    const formMessage = container.querySelector(`#form-message-${sectionId}`);
    const submitButton = container.querySelector(
      `#submit-review-btn-${sectionId}`
    );
    const ratingStarsContainer = container.querySelector(
      `#form-star-rating-${sectionId}`
    );
    const ratingValueInput = container.querySelector(
      `#rating-value-${sectionId}`
    );
    const ratingText = container.querySelector(`#rating-text-${sectionId}`);
    const reviewsSpinner = container.querySelector(
      `#reviews-spinner-${sectionId}`
    );
    const reviewSummaryContainer = container.querySelector(
      `#review-summary-${sectionId}`
    );
    const reviewImageInput = container.querySelector(
      `#reviewImage-${sectionId}`
    );
    const reviewTextInput = container.querySelector(`#reviewText-${sectionId}`);
    const imagePreview = container.querySelector(`#image-preview-${sectionId}`);
    const previewImg = container.querySelector(`#preview-img-${sectionId}`);
    const removeImageBtn = container.querySelector(
      `#remove-image-${sectionId}`
    );

    let currentRating = 0;
    let uploadedImageUrl = null;
    let isUploadingImage = false;
    let allProductReviews = [];
    let currentPage = 1;
    let totalPages = 1;
    let isLoadingMore = false;
    let hasMoreReviews = false;

    // Rating text mapping
    const ratingTexts = {
      0: "No rating",
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };

    // Modal functionality
    function openModal() {
      if (reviewModal) {
        reviewModal.classList.add("show");
        document.body.style.overflow = "hidden";
      }
    }

    function closeModal() {
      if (reviewModal) {
        reviewModal.classList.remove("show");
        document.body.style.overflow = "";
        resetForm();
      }
    }

    function resetForm() {
      if (reviewForm) {
        reviewForm.reset();
        currentRating = 0;
        uploadedImageUrl = null;
        hideAllFieldErrors();

        // Reset rating display
        if (ratingValueInput) ratingValueInput.value = "";
        if (ratingText) ratingText.textContent = ratingTexts[0];

        // Reset stars
        if (ratingStarsContainer) {
          ratingStarsContainer.querySelectorAll(".star").forEach((s) => {
            s.style.color = starColorEmpty;
            s.classList.remove("filled");
          });
        }

        // Reset image preview
        if (imagePreview) imagePreview.style.display = "none";
        if (previewImg) previewImg.src = "";

        // Hide form message
        if (formMessage) formMessage.style.display = "none";
      }
    }

    // Event listeners for modal
    if (writeReviewBtn) {
      writeReviewBtn.addEventListener("click", openModal);
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", closeModal);
    }

    // Close modal when clicking outside
    if (reviewModal) {
      reviewModal.addEventListener("click", function (e) {
        if (e.target === reviewModal) {
          closeModal();
        }
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", async function () {
        if (!isLoadingMore && hasMoreReviews) {
          isLoadingMore = true;
          await fetchReviews(currentPage + 1, true);
          isLoadingMore = false;
        }
      });
    }

    // Close modal with Escape key
    document.addEventListener("keydown", function (e) {
      if (
        e.key === "Escape" &&
        reviewModal &&
        reviewModal.classList.contains("show")
      ) {
        closeModal();
      }
    });

    // Image preview functionality
    if (removeImageBtn) {
      removeImageBtn.addEventListener("click", function () {
        if (reviewImageInput) reviewImageInput.value = "";
        uploadedImageUrl = null;
        if (imagePreview) imagePreview.style.display = "none";
        if (previewImg) previewImg.src = "";
        hideFieldError("reviewImage");
      });
    }

    // Validation functions
    function showFieldError(fieldName, message) {
      const errorDiv = container.querySelector(
        `#${fieldName}-error-${sectionId}`
      );
      const formGroup = errorDiv?.closest(".form-group");

      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "flex";
        formGroup?.classList.add("has-error");
      }
    }

    function hideFieldError(fieldName) {
      const errorDiv = container.querySelector(
        `#${fieldName}-error-${sectionId}`
      );
      const formGroup = errorDiv?.closest(".form-group");

      if (errorDiv) {
        errorDiv.style.display = "none";
        formGroup?.classList.remove("has-error");
      }
    }

    function hideAllFieldErrors() {
      ["reviewImage", "rating", "reviewText"].forEach((fieldName) => {
        hideFieldError(fieldName);
      });
    }

    function validateForm() {
      let isValid = true;
      hideAllFieldErrors();

      // Validate rating
      if (currentRating === 0) {
        showFieldError("rating", "Please select a rating");
        isValid = false;
      }

      // Validate review text
      if (!reviewTextInput || reviewTextInput.value.trim() === "") {
        showFieldError("reviewText", "Review text is required");
        isValid = false;
      }

      // Validate image (if required)
      if (!reviewImageInput || !uploadedImageUrl) {
        showFieldError("reviewImage", "Please upload an image");
        isValid = false;
      }

      return isValid;
    }

    function parseBackendErrors(errorDetails) {
      if (!errorDetails || !Array.isArray(errorDetails)) return;

      errorDetails.forEach((error) => {
        const match = error.match(/^"([^"]+)": "?(.+)"?$/);
        if (match) {
          const fieldName = match[1];
          const message = match[2].replace(/^"|"$/g, "");

          const fieldMap = {
            rating: "rating",
            reviewText: "reviewText",
            reviewImage: "reviewImage",
          };

          if (fieldMap[fieldName]) {
            showFieldError(fieldMap[fieldName], message);
          }
        }
      });
    }

    // Real-time validation - FIXED: Only clear errors when user types, don't show new ones
    if (reviewTextInput) {
      reviewTextInput.addEventListener("input", function () {
        // Only hide error if user has typed something
        if (this.value.trim() !== "") {
          hideFieldError("reviewText");
        }
      });

      // REMOVED: The blur event listener that was showing premature validation
      // The validation will now only happen when the form is submitted
    }

    // Initialize stars
    if (ratingStarsContainer) {
      ratingStarsContainer
        .querySelectorAll(".star")
        .forEach((s) => (s.style.color = starColorEmpty));
    }

    // Star Rating Logic for Form
    if (ratingStarsContainer) {
      const stars = ratingStarsContainer.querySelectorAll(".star");

      stars.forEach((star) => {
        star.addEventListener("click", function () {
          currentRating = parseInt(this.dataset.value);
          if (ratingValueInput) ratingValueInput.value = currentRating;
          if (ratingText) ratingText.textContent = ratingTexts[currentRating];
          hideFieldError("rating");

          updateStarDisplay(stars, currentRating);
        });

        star.addEventListener("mouseover", function () {
          const hoverValue = parseInt(this.dataset.value);
          updateStarDisplay(stars, hoverValue);
        });
      });

      ratingStarsContainer.addEventListener("mouseout", function () {
        updateStarDisplay(stars, currentRating);
      });
    }

    function updateStarDisplay(stars, rating) {
      stars.forEach((s) => {
        const sValue = parseInt(s.dataset.value);
        if (sValue <= rating) {
          s.style.color = starColorFilled;
          s.classList.add("filled");
        } else {
          s.style.color = starColorEmpty;
          s.classList.remove("filled");
        }
      });
    }

    // Image upload functionality
    if (reviewImageInput) {
      reviewImageInput.addEventListener("change", async function () {
        const file = this.files[0];
        if (!file) {
          uploadedImageUrl = null;
          if (imagePreview) imagePreview.style.display = "none";
          return;
        }

        // Frontend validation for image
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
        ];

        if (file.size > maxSize) {
          showFieldError("reviewImage", "Image size must be less than 5MB");
          this.value = "";
          return;
        }

        if (!allowedTypes.includes(file.type)) {
          showFieldError(
            "reviewImage",
            "Only JPEG, PNG, and GIF images are allowed"
          );
          this.value = "";
          return;
        }

        hideFieldError("reviewImage");

        // Show preview
        const reader = new FileReader();
        reader.onload = function (e) {
          if (previewImg) previewImg.src = e.target.result;
          if (imagePreview) imagePreview.style.display = "block";
        };
        reader.readAsDataURL(file);

        // Upload image
        isUploadingImage = true;
        if (submitButton) submitButton.disabled = true;

        const imageFormData = new FormData();
        imageFormData.append("reviewImage", file);

        try {
          const response = await fetch(`${API_BASE_URL}/image-upload`, {
            method: "POST",
            body: imageFormData,
          });

          if (response?.status === 413) {
            throw new Error("Image is too large. Try a smaller file.");
          } else if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              message: "Image upload failed with status: " + response.status,
            }));
            throw new Error(
              errorData.message || `HTTP error! status: ${response.status}`
            );
          }

          const result = await response.json();
          uploadedImageUrl = result.reviewImage;
        } catch (error) {
          console.error("Error uploading image:", error);
          showFieldError("reviewImage", `${error.message}`);
          uploadedImageUrl = null;
          this.value = "";
          if (imagePreview) imagePreview.style.display = "none";
        } finally {
          isUploadingImage = false;
          if (submitButton) submitButton.disabled = false;
        }
      });
    }

    // Handle Review Submission
    if (reviewForm) {
      reviewForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Frontend validation - This is where validation should happen
        if (!validateForm()) {
          return;
        }

        if (isUploadingImage) {
          toastManager.show(
            "Please wait, image is still uploading...",
            "error",
            4000
          );
          return;
        }

        // Disable submit button to prevent double submission
        if (submitButton) submitButton.disabled = true;

        const reviewData = {
          reviewText: reviewTextInput.value.trim(),
          rating: currentRating,
          productId: productId,
          productHandle: productHandle,
          reviewImage: uploadedImageUrl,
        };

        try {
          const response = await fetch(`${API_BASE_URL}/add`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(reviewData),
          });

          const result = await response.json();

          if (!response.ok) {
            if (result.details && Array.isArray(result.details)) {
              parseBackendErrors(result.details);
              toastManager.show(
                result.message || "Please fix the errors above",
                "error",
                4000
              );
            } else {
              throw new Error(
                result.message || `HTTP error! status: ${response.status}`
              );
            }
          } else {
            // Success
            toastManager.show(
              result.message || "Review submitted successfully!",
              "success",
              3000
            );

            // Close modal and refresh reviews
            setTimeout(() => {
              closeModal();
              fetchReviews();
            }, 1500);
          }
        } catch (error) {
          console.error("Error submitting review:", error);
          toastManager.show(
            `Error: ${error.message || "Could not submit review."}`,
            "error",
            4000
          );
        }
      });
    }

    function createStarRating(rating) {
      let starsHtml = "";
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          starsHtml += `<span class="text-brand" style="font-size: 20px">★</span>`;
        } else {
          starsHtml += `<span class="text-bg" style="font-size: 20px;">★</span>`;
        }
      }
      return starsHtml;
    }

    function formatDate(dateString) {
      const date = new Date(dateString);
      const options = { year: "numeric", month: "short", day: "numeric" };
      return date.toLocaleDateString("en-US", options);
    }

    function getProductTitle(productId) {
      if (!window.allShopifyProducts || !productId) return "Product Title";

      // Find product by ID since the API returns productId
      const product = Object.values(window.allShopifyProducts).find(
        (p) => p.id === productId
      );
      return product ? product.title : "Product Title";
    }

    // Fetch and Display Reviews
    async function fetchReviews(page = 1, append = false) {
      if (!reviewListContainer || !productId) return;

      if (!append) {
        if (reviewsSpinner) reviewsSpinner.style.display = "flex";
        if (reviewListContainer) reviewListContainer.innerHTML = "";
        allProductReviews = [];
      } else {
        if (loadMoreBtn) {
          loadMoreBtn.disabled = true;
          loadMoreBtn.textContent = "Loading...";
        }
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/list/${productId}?page=${page}&limit=10`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: "Failed to fetch reviews with status: " + response.status,
          }));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const reviewResponse = await response?.json();
        const newReviews = reviewResponse?.data || [];
        const pagination = reviewResponse?.pagination || {};

        currentPage = pagination.currentPage || page;
        totalPages = pagination.totalPages || 1;
        hasMoreReviews = pagination.hasNextPage || false;

        if (append) {
          allProductReviews = [...allProductReviews, ...newReviews];
          // Only append new reviews to slideshow, don't rebuild entire thing
          appendReviewsToSlideshow(newReviews);
          // Still need to update desktop grid completely
          const gridContainer = reviewListContainer.querySelector(
            ".product-reviews-grid"
          );
          if (gridContainer) {
            renderDesktopGrid(allProductReviews, gridContainer);
          }
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

      console.log("Update load more button:", {
        hasMoreReviews,
        reviewsCount: allProductReviews.length,
      }); // Debug log

      if (hasMoreReviews) {
        loadMoreContainer.style.display = "flex";
      } else {
        loadMoreContainer.style.display = "none";
      }
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
          <div class="fs-21-lh-24-ls-1_2pct ff-bebas-neue fw-400">
            ${productTitle}
          </div>
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

      if (!reviewsArray || reviewsArray.length === 0) {
        if (showEmptyReviewsSetting) {
          reviewListContainer.innerHTML =
            '<p class="no-reviews">Be the first to review this product!</p>';
        } else {
          reviewListContainer.innerHTML = "";
        }
        return;
      }

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
        <div class="fs-21-lh-24-ls-1_2pct ff-bebas-neue fw-400">
          ${productTitle}
        </div>
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
          <div class="fs-21-lh-24-ls-1_2pct ff-bebas-neue fw-400">
            ${productTitle}
          </div>
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

    // Initialize the app
    if (productId && productHandle && shopDomain) {
      fetchReviews();
    } else {
      console.warn(
        `[Product Reviews App ${sectionId}]: Missing productId, productHandle, or shopDomain. Cannot fetch reviews.`
      );
      if (reviewsSpinner) reviewsSpinner.style.display = "none";
    }
  });
})();
