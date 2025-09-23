(function () {
  const productPageReviewsToastManager = new ToastNotificationManager();

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-write-review-btn]");

    if (!trigger) {
      return;
    }

    const sectionId = trigger.dataset.sectionId;
    const reviewModal = document.querySelector(`#review-modal-${sectionId}`);
    if (!reviewModal) return;

    const API_BASE_URL = `/apps/${APP_SUB_PATH}/customer/product-review`;

    const modalCloseBtn = reviewModal.querySelector(
      `#review-modal-close-${sectionId}`
    );
    const reviewForm = reviewModal.querySelector(
      `#review-submission-form-${sectionId}`
    );
    const formMessage = reviewModal.querySelector(`#form-message-${sectionId}`);
    const submitButton = reviewModal.querySelector(
      `#submit-review-btn-${sectionId}`
    );
    const ratingStarsContainer = reviewModal.querySelector(
      `#form-star-rating-${sectionId}`
    );
    const ratingValueInput = reviewModal.querySelector(
      `#rating-value-${sectionId}`
    );
    const reviewImageInput = reviewModal.querySelector(
      `#reviewImage-${sectionId}`
    );
    const reviewTextInput = reviewModal.querySelector(
      `#reviewText-${sectionId}`
    );
    const imagePreview = reviewModal.querySelector(
      `#image-preview-${sectionId}`
    );
    const previewImg = reviewModal.querySelector(`#preview-img-${sectionId}`);

    const container = trigger.closest(
      ".review-extension-container, .review-page-container"
    );
    const starColorFilled = container?.dataset.starFilledColor || "#FB6F92";
    const starColorEmpty = container?.dataset.starEmptyColor || "#CBD3D7";

    let currentRating = 0;
    let uploadedImageUrl = null;
    let isUploadingImage = false;

    function openModal() {
      reviewModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      reviewModal.classList.add("hidden");
      document.body.style.overflow = "";
      resetForm();
    }

    if (reviewModal.dataset.initialized === "true") {
      openModal();
      return;
    }
    reviewModal.dataset.initialized = "true";

    modalCloseBtn.addEventListener("click", closeModal);
    reviewModal.addEventListener("click", (e) => {
      if (e.target === reviewModal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !reviewModal.hasAttribute("hidden"))
        closeModal();
    });

    function resetForm() {
      if (reviewForm) reviewForm.reset();
      currentRating = 0;
      uploadedImageUrl = null;
      hideAllFieldErrors();

      ratingValueInput.value = "";
      ratingStarsContainer.querySelectorAll(".star").forEach((s) => {
        s.style.color = starColorEmpty;
        s.classList.remove("filled");
      });

      imagePreview.style.display = "none";
      previewImg.src = "";
      if (formMessage) formMessage.style.display = "none";
    }

    function showFieldError(fieldName, message) {
      const errorDiv = reviewModal.querySelector(
        `#${fieldName}-error-${sectionId}`
      );
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "flex";
      }
    }

    function hideFieldError(fieldName) {
      const errorDiv = reviewModal.querySelector(
        `#${fieldName}-error-${sectionId}`
      );
      if (errorDiv) errorDiv.style.display = "none";
    }

    function hideAllFieldErrors() {
      ["reviewImage", "rating", "reviewText"].forEach(hideFieldError);
    }

    function validateForm() {
      let isValid = true;
      hideAllFieldErrors();
      if (currentRating === 0) {
        showFieldError("rating", "Please select a rating");
        isValid = false;
      }
      if (!reviewTextInput || reviewTextInput.value.trim() === "") {
        showFieldError("reviewText", "Review text is required");
        isValid = false;
      }
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
          if (fieldMap[fieldName]) showFieldError(fieldMap[fieldName], message);
        }
      });
    }

    reviewTextInput.addEventListener("input", function () {
      if (this.value.trim() !== "") hideFieldError("reviewText");
    });

    const stars = ratingStarsContainer.querySelectorAll(".star");
    stars.forEach((s) => (s.style.color = starColorEmpty));

    stars.forEach((star) => {
      star.addEventListener("click", function () {
        currentRating = parseInt(this.dataset.value);
        ratingValueInput.value = currentRating;
        hideFieldError("rating");
        updateStarDisplay(stars, currentRating);
      });
      star.addEventListener("mouseover", function () {
        updateStarDisplay(stars, parseInt(this.dataset.value));
      });
    });
    ratingStarsContainer.addEventListener("mouseout", () =>
      updateStarDisplay(stars, currentRating)
    );

    function updateStarDisplay(starElements, rating) {
      starElements.forEach((s) => {
        s.style.color =
          parseInt(s.dataset.value) <= rating
            ? starColorFilled
            : starColorEmpty;
      });
    }

    reviewImageInput.addEventListener("change", async function () {
      const file = this.files[0];
      if (!file) {
        uploadedImageUrl = null;
        imagePreview.style.display = "none";
        return;
      }
      const maxSize = 5 * 1024 * 1024;
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

      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);

      isUploadingImage = true;
      submitButton.disabled = true;

      const imageFormData = new FormData();
      imageFormData.append("image", file);
      imageFormData.append("type", "review");

      try {
        const response = await fetch(
          `/apps/${APP_SUB_PATH}/customer/image-upload`,
          {
            method: "POST",
            body: imageFormData,
          }
        );
        if (!response.ok)
          throw new Error(
            (await response.json()).message || "Image upload failed"
          );
        const result = await response.json();
        uploadedImageUrl = result.imageUrl;
      } catch (error) {
        showFieldError("reviewImage", error.message);
        uploadedImageUrl = null;
        this.value = "";
        imagePreview.style.display = "none";
      } finally {
        isUploadingImage = false;
        submitButton.disabled = false;
      }
    });

    if (reviewForm) {
      reviewForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!validateForm()) return;
        if (isUploadingImage) {
          productPageReviewsToastManager.show(
            "Please wait, image is still uploading...",
            "error",
            4000
          );
          return;
        }

        submitButton.disabled = true;
        const currentProductId = reviewModal.dataset.productId;

        const reviewData = {
          reviewText: reviewTextInput.value.trim(),
          rating: currentRating,
          productId: currentProductId,
          reviewImage: uploadedImageUrl,
        };

        try {
          const response = await fetch(`${API_BASE_URL}/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reviewData),
          });
          const result = await response.json();
          if (!response.ok) {
            if (result.details) parseBackendErrors(result.details);
            throw new Error(result.message || "Could not submit review");
          }
          productPageReviewsToastManager.show(
            result.message || "Review submitted successfully!",
            "success"
          );
          setTimeout(() => {
            closeModal();
            document.dispatchEvent(new CustomEvent("review:submitted"));
          }, 1500);
        } catch (error) {
          productPageReviewsToastManager.show(
            `Error: ${error.message}`,
            "error",
            4000
          );
          submitButton.disabled = false;
        }
      });
    }

    openModal();
  });
})();
