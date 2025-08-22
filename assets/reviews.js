document.addEventListener("DOMContentLoaded", function () {
  const mobileCardContainer = document.querySelector(".review-mobile-view");
  const desktopTableBody = document.getElementById(
    "customer-review-items-desktop"
  );
  const paginationControls = document.getElementById("pagination-controls");
  const allProducts = window.allProductsData || {};
  const purchasedProducts = window.customerPurchasedProducts || [];

  let currentPage = 1;
  const itemsPerPage = 1;
  let totalPages = 1;
  let allCombinedItems = [];

  const clearContent = () => {
    desktopTableBody.innerHTML = "";
    mobileCardContainer.innerHTML = "";
  };

  const renderReviews = (items) => {
    clearContent();
    items.forEach((item, index) => {
      const serial = (currentPage - 1) * itemsPerPage + index + 1;
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

  const renderPagination = () => {
    paginationControls.innerHTML = "";
    if (totalPages <= 1) return;

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
        if (pageNum) {
          currentPage = pageNum;
          displayCurrentPage();
        }
      });
      return button;
    };

    const prevBtn = createButton(
      leftArrowSvg,
      currentPage - 1,
      currentPage <= 1
    );
    paginationControls.appendChild(prevBtn);

    let lastPageAdded = 0;
    for (let i = 1; i <= totalPages; i++) {
      const showPage =
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1);
      if (showPage) {
        if (i > lastPageAdded + 1) {
          const ellipsis = document.createElement("span");
          ellipsis.className = "pagination-ellipsis";
          ellipsis.textContent = "...";
          paginationControls.appendChild(ellipsis);
        }
        const pageBtn = createButton(i, i, false, i === currentPage);
        paginationControls.appendChild(pageBtn);
        lastPageAdded = i;
      }
    }

    const nextBtn = createButton(
      rightArrowSvg,
      currentPage + 1,
      currentPage >= totalPages
    );
    paginationControls.appendChild(nextBtn);
  };

  const displayCurrentPage = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = allCombinedItems.slice(startIndex, endIndex);
    renderReviews(currentItems);
    renderPagination();
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
      totalPages = Math.ceil(allCombinedItems.length / itemsPerPage);

      if (allCombinedItems.length > 0) {
        displayCurrentPage();
        document.querySelector(".review-desktop-view").removeAttribute("style");
        document.querySelector(".review-mobile-view").removeAttribute("style");
        if (totalPages > 1) {
          paginationControls.style.display = "flex";
        }
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

  fetchAndDisplayReviews();
});
