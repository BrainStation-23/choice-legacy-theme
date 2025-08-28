document.addEventListener("DOMContentLoaded", function () {
  const mobileCardContainer = document.querySelector(".review-mobile-view");
  const desktopTableBody = document.getElementById(
    "customer-review-items-desktop"
  );
  const allProducts = window.allProductsData || {};
  const purchasedProducts = window.customerPurchasedProducts || [];

  const ITEMS_PER_PAGE = 10;

  const reviewPagination = new PaginationManager({
    containerId: "pagination-controls",
    mode: "backend",
    onPageChange: (newPage) => {
      fetchAndDisplayReviews(newPage);
    },
  });

  const clearContent = () => {
    desktopTableBody.innerHTML = "";
    mobileCardContainer.innerHTML = "";
  };

  const renderReviews = (items) => {
    clearContent();
    items.forEach((item) => {
      const productInfo = allProducts[item.productHandle];
      const productTitle = productInfo
        ? productInfo.title
        : `Product (ID: ${item.productId})`;
      const imageUrl = productInfo
        ? productInfo.image
        : "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";
      const productUrl = item.productHandle
        ? `/products/${item.productHandle}`
        : "#";
      const ratingDisplay = item.rating;
      const viewButtonDesktop = `<a href="${productUrl}" class="button button--solid cursor-pointer no-underline block w-65 h-32 flex items-center justify-center">View</a>`;
      const viewButtonMobile = viewButtonDesktop.replace(
        "w-65 h-32",
        item.rating ? "w-50pct h-40" : "w-full h-40"
      );

      let mobileActionHTML = "";
      if (item.rating === null) {
        const reviewButtonMobile = `<div class="block w-full h-40 fw-600 fs-14-lh-16-ls-0 text-center text-brand flex items-center justify-center">Review</div>`;
        mobileActionHTML = `
          <div class="flex justify-between items-center gap-24 pt-12 pb-12 pl-24 pr-24">
            ${reviewButtonMobile}
            ${viewButtonMobile}
          </div>
        `;
      } else {
        mobileActionHTML = `
          <div class="flex justify-end items-center pt-12 pb-12 pl-24 pr-24">
            ${viewButtonMobile}
          </div>
        `;
      }

      const tableRow = document.createElement("tr");
      tableRow.innerHTML = `
        <td class="flex items-center gap-38">
          <img src="${imageUrl}" alt="${productTitle}" class="w-32 h-32 object-contain">
          <span class="product-name fw-400 fs-16-lh-24-ls-0 text-secondary">${productTitle}</span>
        </td>
        <td class="fw-600 fs-14-lh-16-ls-0 text-center text-brand">${ratingDisplay}</td>
        <td class="text-right relative">
          <div class="flex justify-end">${viewButtonDesktop}</div>
        </td>
      `;
      desktopTableBody.appendChild(tableRow);

      const mobileCard = document.createElement("div");
      mobileCard.className =
        "border border-solid border-color rounded-12 flex flex-col";
      mobileCard.innerHTML = `
        <div class="items-start flex justify-between items-start pt-10 pl-16 pb-10 pr-16">
          <div class="flex justify-between border-b border-b-color border-b-solid w-full pb-10">
            <div class="flex gap-6 items-center">
              ${
                ratingDisplay
                  ? `<span class="ff-general-sans fw-400 fs-16-lh-24-ls-0 text-secondary">Rating: ${ratingDisplay}</span>`
                  : ""
              }

            </div>
            <img src="${imageUrl}" alt="${productTitle}" class="w-32 h-32 object-contain">
          </div>
        </div>
        <div class="product-name ff-general-sans fw-400 fs-16-lh-24-ls-0 pb-8 pl-12 pr-12 border-b border-b-color border-b-solid text-secondary">${productTitle}</div>
        ${mobileActionHTML}
      `;
      mobileCardContainer.appendChild(mobileCard);
    });
  };

  const fetchAndDisplayReviews = async (page = 1) => {
    document.getElementById("review-loader").style.display = "block";
    document.querySelector(".review-desktop-view").style.display = "none";
    document.querySelector(".review-mobile-view").style.display = "none";
    document.getElementById("empty-review-message").style.display = "none";
    document.getElementById("pagination-controls").style.display = "none";

    try {
      const customerId = window.customerId;

      if (!customerId) {
        document.getElementById("empty-review-message").style.display = "block";
        document.getElementById("review-loader").style.display = "none";
        return;
      }

      const url = `/apps/${APP_SUB_PATH}/customer/product-review/all?page=${page}&limit=${ITEMS_PER_PAGE}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ purchasedProducts: purchasedProducts }),
      });

      const data = await response.json();

      if (data.success && data.reviews && data.reviews.length > 0) {
        renderReviews(data.reviews);
        reviewPagination.update(data.pagination);
        document.querySelector(".review-desktop-view").removeAttribute("style");
        document.querySelector(".review-mobile-view").removeAttribute("style");
      } else {
        document.getElementById("empty-review-message").style.display = "block";
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      if (document.getElementById("review-loader")) {
        document.getElementById("review-loader").style.display = "none";
      }
    }
  };

  fetchAndDisplayReviews(1);
});
