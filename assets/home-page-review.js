document.addEventListener("DOMContentLoaded", function () {
  const reviewsContent = document.getElementById("homepage-product-review__reviews-content");
  const reviewLimit = window.homepageReviewLimit;

  const allProducts = window.homepageReviewProducts;

  function createStarRating(rating) {
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        starsHtml += '<span class="homepage-product-review__star">★</span>';
      } else {
        starsHtml += '<span class="homepage-product-review__star homepage-product-review__star--empty">★</span>';
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
    const product = allProducts[productId];
    return product ? product.title : "Title is not available";
  }

  async function fetchReviews() {
    try {
      const response = await fetch(`/apps/generic-name/customer/product-review/show-home?limit=${reviewLimit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        displayReviews(data.data);
      } else {
        displayNoReviews();
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      displayError();
    }
  }

  function displayReviews(reviews) {
    const reviewsHtml = reviews
      .map((review) => {
        const productTitle = getProductTitle(review.productId);
        const imageHtml = review.reviewImage
          ? `<img src="${review.reviewImage}" alt="${productTitle}" class="homepage-product-review__image" loading="lazy">`
          : `<div class="homepage-product-review__image" style="background: linear-gradient(45deg, #f0f0f0, #e0e0e0); display: flex; align-items: center; justify-content: center; color: #999; font-size: 0.8rem;">No Image</div>`;

        return `
        <div class="homepage-product-review__card gap-16">
          <div class="homepage-product-review__image-container homepage-product-review__content-top">
            ${imageHtml}
            <div class="homepage-product-review__rating">
              ${createStarRating(review.rating)}
            </div>
          </div>
          <div class="homepage-product-review__content-middle gap-8">
            <div class="homepage-product-review__product-title fs-21-lh-24-ls-1_2pct ff-bebas-neue fw-400">
              ${productTitle}
            </div>
            <div class="homepage-product-review__text ff-general-sans fs-14-lh-20-ls-0 fw-400">
              ${review.reviewText}
            </div>
          </div>
          <div class="homepage-product-review__content-bottom gap-8">
            <span class="homepage-product-review__review-date fs-12-lh-16-ls-0_6pct ff-general-sans fw-400">
              ${formatDate(review.reviewPlacedAt)}
            </span>
            <span class="homepage-product-review__customer-name fs-12-lh-16-ls-0_6pct ff-general-sans fw-400">
              ${window.translationBy || "By"} ${review.customerName}
            </span>
          </div>
        </div>
      `;
      })
      .join("");

    reviewsContent.innerHTML = `<div class="homepage-product-review__grid gap-16">${reviewsHtml}</div>`;
  }

  function displayNoReviews() {
    reviewsContent.innerHTML = '<div class="homepage-product-review__empty">No reviews available at the moment.</div>';
  }

  function displayError() {
    reviewsContent.innerHTML =
      '<div class="homepage-product-review__error">Unable to load reviews. Please try again later.</div>';
  }

  fetchReviews();
});
