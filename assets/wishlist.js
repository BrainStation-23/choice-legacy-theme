async function removeFromWishlist(productHandle, variantId = null) {
  const response = await fetch(
    `/apps/${APP_SUB_PATH}/customer/wishlist/remove`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productHandle: productHandle,
        variantId: variantId,
      }),
    }
  );
  return await response.json();
}

document.addEventListener("DOMContentLoaded", function () {
  const toastManager = new ToastNotificationManager();
  const desktopTable = document.querySelector(".wishlist-desktop-view");
  const desktopTableBody = document.getElementById(
    "customer-wishlist-items-desktop"
  );
  const mobileCardContainer = document.getElementById(
    "customer-wishlist-items-mobile"
  );
  const loader = document.getElementById("wishlist-loader");
  const emptyMessage = document.getElementById("empty-wishlist-message");

  let wishlistPagination;
  let allWishlistItems = [];

  const initializePagination = () => {
    wishlistPagination = new PaginationManager({
      containerId: "wishlist-pagination-controls",
      itemsPerPage: 10,
      onPageChange: (items) => renderWishlist(items),
    });
  };

  const clearContent = () => {
    desktopTableBody.innerHTML = "";
    mobileCardContainer.innerHTML = "";
  };

  const renderWishlist = (items) => {
    clearContent();

    items.forEach((item) => {
      const imageUrl =
        item.images.edges.length > 0
          ? item.images.edges[0].node.src
          : "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";
      const price =
        item.variants.edges.length > 0
          ? parseFloat(item.variants.edges[0].node.price.amount).toFixed(2)
          : "N/A";
      const currencySymbol = "৳";
      const uniqueId = item.id;

      const removeButtonHTML = `
        <button 
          class="remove-wishlist-button bg-transparent w-full text-brand border-none fw-600 fs-14-lh-16-ls-0 cursor-pointer" 
          data-product-handle="${item.handle}"
          data-item-id="${uniqueId}"
        >
          Remove
        </button>
      `;
      const addToCartButtonHTML = `<button class="button button--solid cursor-pointer w-full p-11">Add to cart</button>`;

      const row = document.createElement("tr");
      row.id = `wishlist-desktop-${uniqueId}`;
      row.innerHTML = `
        <td>
          <img src="${imageUrl}" alt="${item.title}" class="product-image w-32 h-32">
        </td>
        <td class="product-name fw-400 fs-16-lh-24-ls-0">${item.title}</td>
        <td class="product-price fw-400 fs-16-lh-24-ls-0 min-w-85">${currencySymbol}${price}</td>
        <td class="wishlist-actions text-right flex justify-end items-center gap-16 md:flex-wrap slg:flex-wrap">
          ${removeButtonHTML}
          ${addToCartButtonHTML}
        </td>
      `;
      desktopTableBody.appendChild(row);

      const mobileCard = document.createElement("div");
      mobileCard.id = `wishlist-mobile-${uniqueId}`;
      mobileCard.className =
        "border border-solid border-color rounded-12 flex flex-col";
      mobileCard.innerHTML = `
        <div class="items-start flex justify-between items-start pt-10 pl-16 pb-10 pr-16">
          <div class="flex justify-between border-b border-b-color border-b-solid w-full pb-10">
            <img src="${imageUrl}" alt="${item.title}" class="w-32 h-32 object-contain">
            <div class="flex items-center">
              <span class="product-name ff-general-sans fw-400 fs-16-lh-24-ls-0 text-secondary">${currencySymbol}${price}</span>
            </div>
          </div>
        </div>
        <div class="product-name ff-general-sans fw-400 fs-16-lh-24-ls-0 pb-8 pl-12 pr-12 border-b border-b-color border-b-solid text-secondary">${item.title}</div>
        <div class="flex justify-end items-center gap-24 pt-12 pb-12 pl-24 pr-24">
          ${removeButtonHTML}
          ${addToCartButtonHTML}
        </div>
      `;
      mobileCardContainer.appendChild(mobileCard);
    });
  };

  const fetchAndDisplayWishlist = async () => {
    try {
      const response = await fetch(
        `/apps/${APP_SUB_PATH}/customer/wishlist/fetch`
      );
      const data = await response.json();

      if (data.success && data.wishlist.length > 0) {
        allWishlistItems = data.wishlist;
        wishlistPagination.init(allWishlistItems);
        desktopTable.classList.remove("hidden");
      } else {
        emptyMessage.classList.remove("hidden");
        desktopTable.classList.add("hidden");
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      emptyMessage.innerText =
        "Could not load wishlist. Please try again later.";
      emptyMessage.classList.remove("hidden");
    } finally {
      loader.classList.add("hidden");
    }
  };

  // Initialize pagination manager
  initializePagination();

  fetchAndDisplayWishlist();

  document.addEventListener("click", async (e) => {
    if (e.target.matches(".remove-wishlist-button")) {
      const button = e.target;
      const productHandle = button.dataset.productHandle;
      const itemId = button.dataset.itemId;

      button.disabled = true;
      button.textContent = "Removing...";

      try {
        const result = await removeFromWishlist(productHandle);

        if (result.success) {
          toastManager.show("Product removed from wishlist", "success");

          // Remove item from allWishlistItems array
          allWishlistItems = allWishlistItems.filter(
            (item) => item.id !== itemId
          );

          // Update pagination with new data
          if (allWishlistItems.length > 0) {
            wishlistPagination.init(allWishlistItems);
          } else {
            // Show empty message if no items left
            clearContent();
            emptyMessage.classList.remove("hidden");
            desktopTable.classList.add("hidden");
            document.getElementById(
              "wishlist-pagination-controls"
            ).style.display = "none";
          }
        } else {
          toastManager.show("Failed to remove from wishlist", "error");
          button.disabled = false;
          button.textContent = "Remove";
        }
      } catch (error) {
        console.error("Remove error:", error);
        toastManager.show("Something went wrong. Please try again.", "error");
        button.disabled = false;
        button.textContent = "Remove";
      }
    }
  });
});
