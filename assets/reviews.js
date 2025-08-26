document.addEventListener("DOMContentLoaded", function () {
  const mobileCardContainer = document.querySelector(".review-mobile-view");
  const desktopTableBody = document.getElementById(
    "customer-review-items-desktop"
  );
  const allProducts = window.allProductsData || {};
  const purchasedProducts = window.customerPurchasedProducts || [];

  let reviewPagination;
  let allCombinedItems = [];

  const initializePagination = () => {
    reviewPagination = new PaginationManager({
      containerId: "pagination-controls",
      itemsPerPage: 1,
      onPageChange: (items) => renderReviews(items),
    });
  };

  const clearContent = () => {
    desktopTableBody.innerHTML = "";
    mobileCardContainer.innerHTML = "";
  };

  const renderReviews = (items) => {
    clearContent();
    items.forEach((item, index) => {
      const serial =
        (reviewPagination.getCurrentPage() - 1) *
          reviewPagination.itemsPerPage +
        index +
        1;
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
      const ratingDisplay = item.rating ? item.rating : "Review";
      const actionButton = `<a href="${productUrl}" class="button button--solid cursor-pointer no-underline block w-65 h-32 flex items-center justify-center">View</a>`;

      const tableRow = document.createElement("tr");
      tableRow.innerHTML = `
        <td class="fw-600 fs-14-lh-16-ls-0 text-brand">#${serial}</td>
        <td class="flex items-center gap-38">
          <img src="${imageUrl}" alt="${productTitle}" class="w-32 h-32 object-contain">
          <span class="product-name fw-400 fs-16-lh-24-ls-0 text-secondary">${productTitle}</span>
        </td>
        <td class="fw-600 fs-14-lh-16-ls-0 text-center text-brand">${ratingDisplay}</td>
        <td class="text-right relative">
          <div class="flex justify-end">${actionButton}</div>
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
              <span class="ff-general-sans fw-600 fs-14-lh-16-ls-0 text-brand">#${serial}</span>
              <span class="ff-general-sans fw-400 fs-16-lh-24-ls-0 text-secondary">Rating: ${ratingDisplay}</span>
            </div>
            <img src="${imageUrl}" alt="${productTitle}" class="w-32 h-32 object-contain">
          </div>
        </div>
        <div class="product-name ff-general-sans fw-400 fs-16-lh-24-ls-0 pb-8 pl-12 pr-12 border-b border-b-color border-b-solid text-secondary">${productTitle}</div>
        <div class="flex justify-end items-center pt-12 pb-12 pl-24 pr-24">${actionButton.replace(
          "w-65 h-32",
          "w-142 h-40"
        )}</div>
      `;
      mobileCardContainer.appendChild(mobileCard);
    });
  };

  const fetchAndDisplayReviews = async () => {
    try {
      const response = await fetch(
        `/apps/${APP_SUB_PATH}/customer/product-review/all`
      );
      const data = await response.json();
      let reviewedProducts = [];
      const reviewedProductIds = new Set();

      if (data.success && data.reviews) {
        data.reviews.forEach((productGroup) => {
          const priceInfo = productGroup.variants?.edges[0]?.node?.price;
          productGroup.customerWithReviews.forEach((review) => {
            reviewedProducts.push({
              ...review,
              productId: productGroup.productId,
              productHandle: productGroup.productHandle,
              productPrice: priceInfo,
            });
            reviewedProductIds.add(productGroup.productId);
          });
        });
      }

      let unreviewedProducts = [];
      purchasedProducts.forEach((purchasedProduct) => {
        if (!reviewedProductIds.has(purchasedProduct.productId)) {
          unreviewedProducts.push({
            productId: purchasedProduct.productId,
            productHandle: purchasedProduct.productHandle,
            rating: null,
          });
        }
      });

      const uniqueUnreviewed = unreviewedProducts.filter(
        (product, index, self) =>
          index === self.findIndex((p) => p.productId === product.productId)
      );

      allCombinedItems = [...reviewedProducts, ...uniqueUnreviewed];

      if (allCombinedItems.length > 0) {
        reviewPagination.init(allCombinedItems);
        document.querySelector(".review-desktop-view").removeAttribute("style");
        document.querySelector(".review-mobile-view").removeAttribute("style");
      } else {
        document.getElementById("empty-review-message").style.display = "block";
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      const emptyMessage = document.getElementById("empty-review-message");
      emptyMessage.innerText =
        "Could not load reviews. Please try again later.";
      emptyMessage.style.display = "block";
    } finally {
      document.getElementById("review-loader").style.display = "none";
    }
  };

  // Initialize pagination manager
  initializePagination();

  // Fetch and display reviews
  fetchAndDisplayReviews();
});
