document.addEventListener("DOMContentLoaded", function () {
  const table = document.querySelector(".review-table");
  const tableBody = document.getElementById("customer-review-items");
  const loader = document.getElementById("review-loader");
  const emptyMessage = document.getElementById("empty-review-message");
  const allProducts = window.allProductsData || {};

  const renderReviews = (reviews) => {
    reviews.forEach((review, index) => {
      const row = document.createElement("tr");
      const serial = index + 1;

      // Look up product info from the Liquid object using the handle
      const productInfo = allProducts[review.productHandle];

      const productTitle = productInfo
        ? productInfo.title
        : `Product (ID: ${review.productId})`;
      const imageUrl = productInfo
        ? productInfo.image
        : "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";
      const productUrl = review.productHandle
        ? `/products/${review.productHandle}`
        : "#";

      row.innerHTML = `
        <td class="fw-500 fs-14-lh-16-ls-0">#${serial}</td>
        <td class="flex items-center gap-12">
          <img src="${imageUrl}" alt="${productTitle}" class="w-32 h-32 object-contain">
          <span class="product-name fw-400 fs-16-lh-24-ls-0">${productTitle}</span>
        </td>
        <td class="fw-500 fs-14-lh-16-ls-0 text-center">${review.rating}</td>
        <td class="text-right relative">
          <div class="flex justify-end">
            <a href="${productUrl}" class="button button--solid cursor-pointer no-underline block w-65 h-32 flex items-center justify-center">View</a> 
          </div>
        </td>
      `;

      tableBody.appendChild(row);
    });
  };

  const fetchAndDisplayReviews = async () => {
    try {
      const response = await fetch(
        `/apps/${APP_SUB_PATH}/customer/product-review/all`
      );
      const data = await response.json();

      let allReviews = [];
      if (data.success && data.reviews) {
        data.reviews.forEach((productGroup) => {
          productGroup.customerWithReviews.forEach((review) => {
            allReviews.push({
              ...review,
              productId: productGroup.productId,
              productHandle: productGroup.productHandle,
            });
          });
        });
      }

      if (allReviews.length > 0) {
        renderReviews(allReviews);
        table.style.display = "table";
      } else {
        emptyMessage.style.display = "block";
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      emptyMessage.innerText =
        "Could not load reviews. Please try again later.";
      emptyMessage.style.display = "block";
    } finally {
      loader.style.display = "none";
    }
  };

  fetchAndDisplayReviews();
});
