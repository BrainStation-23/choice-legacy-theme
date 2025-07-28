// products-review.js
(function () {
  const reviewAppContainers = document.querySelectorAll(
    ".review-extension-container"
  );
  reviewAppContainers.forEach((container) => {
    const sectionId = container.dataset.sectionId;
    const productId = container.dataset.productId;
    const shopDomain = container.dataset.shopDomain;
    const customerName = container.dataset.customerName || "Anonymous";
    const starColorFilled = container.dataset.starFilledColor || "#FFD700";
    const starColorEmpty = container.dataset.starEmptyColor || "#CCCCCC";
    const showEmptyReviewsSetting = container.dataset.showEmpty === "true";

    const API_BASE_URL = `/apps/${APP_SUB_PATH}/customer/product-review`;

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

    // Error display elements
    const imageErrorDiv = container.querySelector(
      `#reviewImage-error-${sectionId}`
    );
    const ratingErrorDiv = container.querySelector(
      `#rating-error-${sectionId}`
    );
    const reviewTextErrorDiv = container.querySelector(
      `#reviewText-error-${sectionId}`
    );

    let currentRating = 0;
    let uploadedImageUrl = null;
    let isUploadingImage = false;
    let allProductReviews = [];

    // Validation functions
    function showFieldError(fieldName, message) {
      const errorDiv = container.querySelector(
        `#${fieldName}-error-${sectionId}`
      );
      const formGroup = errorDiv?.closest(".form-group");

      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
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
      console.log(reviewImageInput, uploadedImageUrl);
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
        // Parse error format: "\"fieldName\": "Error message"
        const match = error.match(/^"([^"]+)": "?(.+)"?$/);
        if (match) {
          const fieldName = match[1];
          const message = match[2].replace(/^"|"$/g, ""); // Remove quotes from message

          // Map backend field names to frontend field names
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

    // Real-time validation
    if (reviewTextInput) {
      reviewTextInput.addEventListener("input", function () {
        if (this.value.trim() !== "") {
          hideFieldError("reviewText");
        }
      });

      reviewTextInput.addEventListener("blur", function () {
        if (this.value.trim() === "") {
          showFieldError("reviewText", "Review text is required");
        }
      });
    }

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
          hideFieldError("rating"); // Hide error when rating is selected

          stars.forEach((s) => {
            const sValue = parseInt(s.dataset.value);
            s.innerHTML = sValue <= currentRating ? "&#9733;" : "&#9734;";
            s.style.color =
              sValue <= currentRating ? starColorFilled : starColorEmpty;
          });
        });
        star.addEventListener("mouseover", function () {
          const hoverValue = parseInt(this.dataset.value);
          stars.forEach((s) => {
            const sValue = parseInt(s.dataset.value);
            s.innerHTML = sValue <= hoverValue ? "&#9733;" : "&#9734;";
            s.style.color =
              sValue <= hoverValue ? starColorFilled : starColorEmpty;
          });
        });
      });
      ratingStarsContainer.addEventListener("mouseout", function () {
        stars.forEach((s) => {
          const sValue = parseInt(s.dataset.value);
          s.innerHTML = sValue <= currentRating ? "&#9733;" : "&#9734;";
          s.style.color =
            sValue <= currentRating ? starColorFilled : starColorEmpty;
        });
      });
    }

    if (reviewImageInput) {
      reviewImageInput.addEventListener("change", async function () {
        const file = this.files[0];
        if (!file) {
          uploadedImageUrl = null;
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
        isUploadingImage = true;
        if (submitButton) submitButton.disabled = true;

        const imageFormData = new FormData();
        imageFormData.append("reviewImage", file);

        try {
          const response = await fetch(`${API_BASE_URL}/image-upload`, {
            method: "POST",
            body: imageFormData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              message: "Image upload failed with status: " + response.status,
            }));
            throw new Error(
              errorData.message || `HTTP error! status: ${response.status}`
            );
          }

          const result = await response.json();
          uploadedImageUrl = result.reviewImage;

          if (formMessage) {
            formMessage.textContent = "Image uploaded successfully!";
            formMessage.style.color = "green";
            formMessage.style.display = "block";
            setTimeout(() => {
              if (formMessage) formMessage.style.display = "none";
            }, 3000);
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          showFieldError("reviewImage", `Upload failed: ${error.message}`);
          uploadedImageUrl = null;
          this.value = "";
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

        // Frontend validation
        if (!validateForm()) {
          return;
        }

        if (isUploadingImage) {
          if (formMessage) {
            formMessage.style.display = "block";
            formMessage.textContent =
              "Please wait, image is still uploading...";
            formMessage.style.color = "orange";
          }
          return;
        }

        if (submitButton) submitButton.disabled = true;
        if (formMessage) {
          formMessage.style.display = "block";
          formMessage.textContent = "Submitting review...";
          formMessage.style.color = "blue";
        }

        const reviewData = {
          reviewText: reviewTextInput.value.trim(),
          rating: currentRating,
          productId: productId,
          customerName: customerName,
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
              // Handle backend validation errors
              parseBackendErrors(result.details);
              if (formMessage) {
                formMessage.textContent =
                  result.message || "Please fix the errors above";
                formMessage.style.color = "red";
              }
            } else {
              throw new Error(
                result.message || `HTTP error! status: ${response.status}`
              );
            }
          } else {
            // Success
            if (formMessage) {
              formMessage.textContent =
                result.message || "Review submitted successfully!";
              formMessage.style.color = "green";
            }

            // Reset form
            this.reset();
            currentRating = 0;
            uploadedImageUrl = null;
            hideAllFieldErrors();

            if (ratingValueInput) ratingValueInput.value = "";
            if (ratingStarsContainer) {
              ratingStarsContainer.querySelectorAll(".star").forEach((s) => {
                s.innerHTML = "&#9734;";
                s.style.color = starColorEmpty;
              });
            }
            fetchReviews();
          }
        } catch (error) {
          console.error("Error submitting review:", error);
          if (formMessage) {
            formMessage.textContent = `Error: ${
              error.message || "Could not submit review."
            }`;
            formMessage.style.color = "red";
          }
        } finally {
          if (submitButton) submitButton.disabled = false;
          setTimeout(() => {
            if (formMessage) formMessage.style.display = "none";
          }, 5000);
        }
      });
    }

    // Fetch and Display Reviews
    async function fetchReviews() {
      if (!reviewListContainer || !productId) return;
      if (reviewsSpinner) reviewsSpinner.style.display = "flex";
      if (reviewListContainer) reviewListContainer.innerHTML = "";

      try {
        const response = await fetch(`${API_BASE_URL}/list/${productId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: "Failed to fetch reviews with status: " + response.status,
          }));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }
        const reviewResponse = await response?.json();
        console.log("Product review data:", reviewResponse?.data);
        allProductReviews = reviewResponse?.data || [];
        renderReviews(allProductReviews);
        calculateAndRenderSummary(allProductReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        allProductReviews = [];
        if (reviewListContainer) {
          reviewListContainer.innerHTML = `<p class="reviews-message">Could not load reviews. ${error.message}</p>`;
        }
        calculateAndRenderSummary(allProductReviews);
      } finally {
        if (reviewsSpinner) reviewsSpinner.style.display = "none";
      }
    }

    function calculateAndRenderSummary(reviewsArray) {
      if (!reviewSummaryContainer) return;

      if (!reviewsArray || reviewsArray.length === 0) {
        reviewSummaryContainer.innerHTML = `<p>No reviews yet.</p>`;
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
        starsHTML += `<span class="star" style="color:${starColorEmpty}; font-size: 1.2em;">&#9734;</span>`;
      }

      reviewSummaryContainer.innerHTML = `
                <div class="summary-average-rating">
                  ${starsHTML} (${totalReviews})
                </div>
            `;
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

      reviewsArray.forEach((review) => {
        const reviewItem = document.createElement("div");
        reviewItem.className = "review-item";

        const ratingStarsHTML = Array(5)
          .fill(0)
          .map((_, i) => {
            const isFilled = i < review.rating;
            return `<span class="star" style="color:${
              isFilled ? starColorFilled : starColorEmpty
            };">${isFilled ? "&#9733;" : "&#9734;"}</span>`;
          })
          .join("");

        const reviewDate = review.reviewPlacedAt
          ? new Date(review.reviewPlacedAt).toLocaleDateString()
          : "N/A";

        reviewItem.innerHTML = `
                    <div class="review-header">
                        <span class="reviewer-name">${escapeHTML(
                          review.customerName || "Anonymous"
                        )}</span>
                        <span class="review-date">${reviewDate}</span>
                    </div>
                    <div class="review-rating">${ratingStarsHTML}</div>
                    <p class="review-text">${escapeHTML(
                      review.reviewText || ""
                    )}</p>
                    ${
                      review.reviewImage
                        ? `<a href="${review.reviewImage}" target="_blank" rel="noopener noreferrer" class="review-image-link">
         <img src="${review.reviewImage}" alt="Review Image" class="review-uploaded-image" loading="lazy">
       </a>`
                        : ""
                    }
                `;
        reviewListContainer.appendChild(reviewItem);
      });
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

    if (productId && shopDomain) {
      fetchReviews();
    } else {
      console.warn(
        `[Product Reviews App ${sectionId}]: Missing productId or shopDomain. Cannot fetch reviews.`
      );
      if (reviewListContainer)
        reviewListContainer.innerHTML =
          '<p class="reviews-message">Configuration error (missing product/store data).</p>';
      if (reviewSummaryContainer)
        reviewSummaryContainer.innerHTML =
          "<p>Could not load review summary due to configuration error.</p>";
      if (reviewsSpinner) reviewsSpinner.style.display = "none";
    }
  });
})();
