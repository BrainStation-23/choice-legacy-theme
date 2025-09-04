document.addEventListener("DOMContentLoaded", function () {
  const desktopTable = document.querySelector(".wishlist-desktop-view");
  const desktopTableBody = document.getElementById(
    "customer-wishlist-items-desktop"
  );
  const mobileCardContainer = document.getElementById(
    "customer-wishlist-items-mobile"
  );
  const loader = document.getElementById("wishlist-loader");
  const emptyMessage = document.getElementById("empty-wishlist-message");
  const paginationControls = document.getElementById(
    "wishlist-pagination-controls"
  );

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
        item.imageUrl ||
        "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";
      const price = item.price || "N/A";
      const url = item.url;
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
      row.id = `wishlist-item-${uniqueId}`;
      row.innerHTML = `
        <td><a href="${url}"><img src="${imageUrl}" alt="${item.title}" class="product-image w-32 h-32"></a></td>
        <td class="product-name fw-400 fs-16-lh-24-ls-0"><a href="${url}" class="text-primary">${item.title}</a></td>
        <td class="product-price fw-400 fs-16-lh-24-ls-0 min-w-85">${price}</td>
        <td class="wishlist-actions text-right flex justify-end items-center gap-16 md:flex-wrap slg:flex-wrap">
          ${removeButtonHTML}
          ${addToCartButtonHTML}
        </td>
      `;
      desktopTableBody.appendChild(row);

      const mobileCard = document.createElement("div");
      mobileCard.id = `wishlist-item-mobile-${uniqueId}`;
      mobileCard.className =
        "border border-solid border-color rounded-12 flex flex-col";
      mobileCard.innerHTML = `
        <div class="items-start flex justify-between items-start pt-10 pl-16 pb-10 pr-16">
          <div class="flex justify-between border-b border-b-color border-b-solid w-full pb-10">
            <a href="${url}"><img src="${imageUrl}" alt="${item.title}" class="w-32 h-32 object-contain" /></a>
            <div class="flex items-center">
              <span class="product-name ff-general-sans fw-400 fs-16-lh-24-ls-0 text-secondary">${price}</span>
            </div>
          </div>
        </div>
        <a href="${url}" class="product-name ff-general-sans fw-400 fs-16-lh-24-ls-0 pb-8 pl-12 pr-12 border-b border-b-color border-b-solid text-secondary">${item.title}</a>
        <div class="flex justify-end items-center gap-24 pt-12 pb-12 pl-24 pr-24">
          ${removeButtonHTML}
          ${addToCartButtonHTML}
        </div>
      `;
      mobileCardContainer.appendChild(mobileCard);
    });
  };

  const initializeWishlistPage = async () => {
    try {
      await window.theme.profilePromise;

      const wishlistHandles = Array.from(window.theme.wishlistHandles || []);

      if (wishlistHandles.length > 0) {
        allWishlistItems = wishlistHandles
          .map((handle) => {
            const details = window.allShopifyProducts[handle];
            return { handle, ...details };
          })
          .filter((item) => item.title);

        wishlistPagination.init(allWishlistItems);

        if (window.matchMedia("(min-width: 768px)").matches) {
          desktopTable.classList.remove("hidden");
          mobileCardContainer.classList.add("hidden");
        } else {
          desktopTable.classList.add("hidden");
          mobileCardContainer.classList.remove("hidden");
        }

        paginationControls.style.display = "flex";
      } else {
        emptyMessage.classList.remove("hidden");
        desktopTable.classList.add("hidden");
        mobileCardContainer.classList.add("hidden");
        paginationControls.style.display = "none";
      }
    } catch (error) {
      console.error("Failed to initialize wishlist:", error);
      emptyMessage.innerText =
        "Could not load wishlist. Please try again later.";
      emptyMessage.classList.remove("hidden");
    } finally {
      loader.classList.add("hidden");
    }
  };

  initializePagination();
  initializeWishlistPage();

  document.addEventListener("click", async (e) => {
    if (e.target.matches(".remove-wishlist-button")) {
      const button = e.target;
      const productHandle = button.dataset.productHandle;
      const productId = getProductIdFromHandle(productHandle);
      const itemId = button.dataset.itemId;

      const toastManager = new ToastNotificationManager();

      button.disabled = true;
      button.textContent = "Removing...";

      try {
        const result = await removeFromWishlist(productHandle, productId);

        if (result.success) {
          toastManager.show("Product removed from wishlist", "success");

          window.theme.wishlistHandles.delete(productHandle);
          updateAllWishlistButtons();

          allWishlistItems = allWishlistItems.filter(
            (item) => item.id.toString() !== itemId.toString()
          );

          if (allWishlistItems.length > 0) {
            wishlistPagination.init(allWishlistItems);
          } else {
            clearContent();
            emptyMessage.classList.remove("hidden");
            desktopTable.classList.add("hidden");
            mobileCardContainer.classList.add("hidden");
            paginationControls.style.display = "none";
          }
        } else {
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
