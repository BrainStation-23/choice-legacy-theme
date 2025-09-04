// reviews.js
document.addEventListener("DOMContentLoaded", function () {
  const mobileCardContainer = document.querySelector(".review-mobile-view");
  const desktopTableBody = document.getElementById(
    "customer-review-items-desktop"
  );
  const reviewedTab = document.getElementById("reviewed-tab");
  const toReviewTab = document.getElementById("to-review-tab");
  const ratingHeader = document.getElementById("rating-header");
  const purchasedProducts = window.customerPurchasedProducts || [];
  const ITEMS_PER_PAGE = 10;
  let activeTab = "to_review";

  const reviewPagination = new PaginationManager({
    containerId: "pagination-controls",
    mode: "backend",
    onPageChange: (newPage) => {
      fetchAndDisplayReviews(activeTab, newPage);
    },
  });

  const clearContent = () => {
    desktopTableBody.innerHTML = "";
    mobileCardContainer.innerHTML = "";
  };

  const renderReviews = (items) => {
    clearContent();
    items.forEach((item) => {
      const productInfo = window.allShopifyProducts[item.productHandle];
      const productTitle = productInfo
        ? productInfo.title
        : `Product (ID: ${item.productId})`;
      const imageUrl = productInfo
        ? productInfo.imageUrl
        : "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";
      const productUrl = item.productHandle
        ? `/products/${item.productHandle}`
        : "#";

      const ratingDisplay = item.rating ? item.rating : "";
      const hasRating = item.rating !== null;

      // Determine content for the middle column based on the active tab
      const reviewColumnContent =
        activeTab === "reviewed" ? ratingDisplay : "Review";

      let desktopActionHTML = `<a href="${productUrl}"><svg width="28" height="17" viewBox="0 0 28 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.9785 16.8535C6.08789 16.8535 0.658203 10.418 0.658203 8.44531C0.658203 6.46289 6.09766 0.0273438 13.9785 0.0273438C21.957 0.0273438 27.2891 6.46289 27.2891 8.44531C27.2891 10.418 21.9668 16.8535 13.9785 16.8535ZM13.9785 13.709C16.8984 13.709 19.2715 11.3066 19.2715 8.44531C19.2715 5.50586 16.8984 3.18164 13.9785 3.18164C11.0391 3.18164 8.68555 5.50586 8.68555 8.44531C8.68555 11.3066 11.0391 13.709 13.9785 13.709ZM13.9785 10.4473C12.8652 10.4473 11.957 9.53906 11.957 8.44531C11.957 7.3418 12.8652 6.43359 13.9785 6.43359C15.082 6.43359 16 7.3418 16 8.44531C16 9.53906 15.082 10.4473 13.9785 10.4473Z" fill="#FB6F92"/></svg></a>`;

      let mobileActionHTML = "";
      if (hasRating) {
        const viewButtonMobile = `<a href="${productUrl}"><svg width="28" height="17" viewBox="0 0 28 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.9785 16.8535C6.08789 16.8535 0.658203 10.418 0.658203 8.44531C0.658203 6.46289 6.09766 0.0273438 13.9785 0.0273438C21.957 0.0273438 27.2891 6.46289 27.2891 8.44531C27.2891 10.418 21.9668 16.8535 13.9785 16.8535ZM13.9785 13.709C16.8984 13.709 19.2715 11.3066 19.2715 8.44531C19.2715 5.50586 16.8984 3.18164 13.9785 3.18164C11.0391 3.18164 8.68555 5.50586 8.68555 8.44531C8.68555 11.3066 11.0391 13.709 13.9785 13.709ZM13.9785 10.4473C12.8652 10.4473 11.957 9.53906 11.957 8.44531C11.957 7.3418 12.8652 6.43359 13.9785 6.43359C15.082 6.43359 16 7.3418 16 8.44531C16 9.53906 15.082 10.4473 13.9785 10.4473Z" fill="#FB6F92"/></svg></a>`;
        const ratingTextMobile = `<span class="ff-general-sans fw-600 fs-16-lh-24-ls-0 w-50pct text-center text-brand">${ratingDisplay} star</span>`;
        mobileActionHTML = `
          <div class="flex justify-between items-center pt-12 pb-12 pl-24 pr-24">
            ${ratingTextMobile}
            ${viewButtonMobile}
          </div>
        `;
      } else {
        const viewButtonMobile = `<a href="${productUrl}"><svg width="28" height="17" viewBox="0 0 28 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.9785 16.8535C6.08789 16.8535 0.658203 10.418 0.658203 8.44531C0.658203 6.46289 6.09766 0.0273438 13.9785 0.0273438C21.957 0.0273438 27.2891 6.46289 27.2891 8.44531C27.2891 10.418 21.9668 16.8535 13.9785 16.8535ZM13.9785 13.709C16.8984 13.709 19.2715 11.3066 19.2715 8.44531C19.2715 5.50586 16.8984 3.18164 13.9785 3.18164C11.0391 3.18164 8.68555 5.50586 8.68555 8.44531C8.68555 11.3066 11.0391 13.709 13.9785 13.709ZM13.9785 10.4473C12.8652 10.4473 11.957 9.53906 11.957 8.44531C11.957 7.3418 12.8652 6.43359 13.9785 6.43359C15.082 6.43359 16 7.3418 16 8.44531C16 9.53906 15.082 10.4473 13.9785 10.4473Z" fill="#FB6F92"/></svg></a>`;
        const reviewButtonMobile = `<p class="fw-600 w-50pct fs-14-lh-16-ls-0 text-center text-brand">Review</p>`;
        mobileActionHTML = `
          <div class="flex justify-between items-center gap-12 pt-12 pb-12 pl-24 pr-24">
            ${reviewButtonMobile}
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
        <td class="fw-600 fs-14-lh-16-ls-0 text-center text-brand">${reviewColumnContent}</td>
        <td class="text-right relative">
          <div class="flex justify-end">
            ${desktopActionHTML}
          </div>
        </td>
      `;
      desktopTableBody.appendChild(tableRow);

      const mobileCard = document.createElement("div");
      mobileCard.className =
        "border border-solid border-color rounded-12 flex flex-col";
      mobileCard.innerHTML = `
        <div class="items-start flex justify-end items-start pt-10 pl-16 pb-10 pr-16">
          <div class="flex justify-end border-b border-b-color border-b-solid w-full pb-10">
            <img src="${imageUrl}" alt="${productTitle}" class="w-32 h-32 object-contain">
          </div>
        </div>
        <div class="product-name ff-general-sans fw-400 fs-16-lh-24-ls-0 pb-8 pl-12 pr-12 border-b border-b-color border-b-solid text-secondary">${productTitle}</div>
        ${mobileActionHTML}
      `;
      mobileCardContainer.appendChild(mobileCard);
    });
  };

  const fetchAndDisplayReviews = async (tab, page = 1) => {
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

      const url = `/apps/${APP_SUB_PATH}/customer/product-review/all?page=${page}&limit=${ITEMS_PER_PAGE}&tab=${tab}`;

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

  const handleTabClick = (tabType) => {
    activeTab = tabType;
    if (tabType === "reviewed") {
      reviewedTab.classList.add("active-tab");
      toReviewTab.classList.remove("active-tab");
      ratingHeader.textContent = "Rating"; // Change header text
    } else {
      toReviewTab.classList.add("active-tab");
      reviewedTab.classList.remove("active-tab");
      ratingHeader.textContent = "Review"; // Change header text
    }
    fetchAndDisplayReviews(activeTab, 1);
  };

  reviewedTab.addEventListener("click", () => handleTabClick("reviewed"));
  toReviewTab.addEventListener("click", () => handleTabClick("to_review"));

  // Set initial header text
  ratingHeader.textContent = "Review";
  fetchAndDisplayReviews(activeTab, 1);
});
