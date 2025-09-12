// MAKE THE MAIN FUNCTION GLOBALLY AVAILABLE
window.initializeWishlistPage = (wishlistHandles) => {
  const desktopTable = document.querySelector(".wishlist-desktop-view");
  const mobileCardContainer = document.getElementById(
    "customer-wishlist-items-mobile"
  );
  const loader = document.getElementById("wishlist-loader");
  const emptyMessage = document.getElementById("empty-wishlist-message");
  const paginationControls = document.getElementById(
    "wishlist-pagination-controls"
  );
  let allWishlistItems = [];

  const clearContent = () => {
    const desktopBody = document.getElementById(
      "customer-wishlist-items-desktop"
    );
    if (desktopBody) desktopBody.innerHTML = "";
    if (mobileCardContainer) mobileCardContainer.innerHTML = "";
  };

  const createProductForm = (item) => {
    const variantId = item.variantId || item.id;
    return `
      <product-form class="product-form w-full">
        <form action="/cart/add" method="post" enctype="multipart/form-data" class="form">
          <input type="hidden" name="id" value="${variantId}">
          <button type="submit" name="add" class="button button--solid cursor-pointer w-full p-11">
            Add to cart
          </button>
        </form>
      </product-form>
    `;
  };

  const renderWishlist = (items) => {
    clearContent();
    const desktopBody = document.getElementById(
      "customer-wishlist-items-desktop"
    );
    items.forEach((item) => {
      const imageUrl =
        item.imageUrl ||
        "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";
      const price = item.price || "N/A";
      const uniqueId = item.id;

      const removeButtonHTML = `<button class="remove-wishlist-button bg-transparent w-full text-brand border-none fw-600 fs-14-lh-16-ls-0 cursor-pointer" data-product-handle="${item.handle}" data-item-id="${uniqueId}">Remove</button>`;
      const addToCartFormHTML = createProductForm(item);

      if (desktopBody) {
        const row = document.createElement("tr");
        row.id = `wishlist-item-${uniqueId}`;
        row.innerHTML = `
          <td><a href="${item.url}"><img src="${imageUrl}" alt="${item.title}" class="product-image w-32 h-32"></a></td>
          <td class="product-name fw-400 fs-16-lh-24-ls-0"><a href="${item.url}" class="text-brand">${item.title}</a></td>
          <td class="product-price fw-400 fs-16-lh-24-ls-0 min-w-85">${price}</td>
          <td class="wishlist-actions text-right flex justify-end items-center gap-16 md:flex-wrap slg:flex-wrap">${removeButtonHTML}${addToCartFormHTML}</td>
        `;
        desktopBody.appendChild(row);
      }

      if (mobileCardContainer) {
        const mobileCard = document.createElement("div");
        mobileCard.id = `wishlist-item-mobile-${uniqueId}`;
        mobileCard.className =
          "border border-solid border-color rounded-12 flex flex-col";
        mobileCard.innerHTML = `
          <div class="items-start flex justify-between items-start pt-10 pl-16 pb-10 pr-16">
            <div class="flex justify-between border-b border-b-color border-b-solid w-full pb-10">
              <a href="${item.url}"><img src="${imageUrl}" alt="${item.title}" class="w-32 h-32 object-contain" /></a>
              <div class="flex items-center"><span class="product-name ff-general-sans fw-400 fs-16-lh-24-ls-0 text-secondary">${price}</span></div>
            </div>
          </div>
          <a href="${item.url}" class="product-name ff-general-sans fw-400 fs-16-lh-24-ls-0 pb-8 pl-12 pr-12 border-b border-b-color border-b-solid text-brand">${item.title}</a>
          <div class="flex justify-end items-center gap-24 pt-12 pb-12 pl-24 pr-24">${removeButtonHTML}${addToCartFormHTML}</div>
        `;
        mobileCardContainer.appendChild(mobileCard);
      }
    });
  };

  try {
    if (wishlistHandles && wishlistHandles.length > 0) {
      allWishlistItems = wishlistHandles
        .map((handle) => ({ handle, ...window.allShopifyProducts[handle] }))
        .filter((item) => item.title);

      const wishlistPagination = new PaginationManager({
        containerId: "wishlist-pagination-controls",
        itemsPerPage: 10,
        onPageChange: (items) => renderWishlist(items),
      });
      wishlistPagination.init(allWishlistItems);

      if (window.matchMedia("(min-width: 768px)").matches) {
        if (desktopTable) desktopTable.classList.remove("hidden");
      } else {
        if (mobileCardContainer) mobileCardContainer.classList.remove("hidden");
      }
      if (paginationControls) paginationControls.style.display = "flex";
    } else {
      if (emptyMessage) emptyMessage.classList.remove("hidden");
      if (desktopTable) desktopTable.classList.add("hidden");
      if (mobileCardContainer) mobileCardContainer.classList.add("hidden");
      if (paginationControls) paginationControls.style.display = "none";
    }
  } catch (error) {
    console.error("Failed to render wishlist:", error);
    if (emptyMessage) {
      emptyMessage.innerText =
        "Could not load wishlist. Please try again later.";
      emptyMessage.classList.remove("hidden");
    }
  } finally {
    if (loader) {
      loader.classList.add("hidden");
    }
  }
};

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("click", async (e) => {
    if (e.target.matches(".remove-wishlist-button")) {
      const button = e.target;
      const productHandle = button.dataset.productHandle;
      const itemId = button.dataset.itemId;
      const productId = getProductIdFromHandle(productHandle);
      const toastManager = new ToastNotificationManager();

      button.disabled = true;
      button.textContent = "Removing...";

      try {
        const result = await removeFromWishlist(productHandle, productId);
        if (result.success) {
          toastManager.show("Product removed from wishlist", "success");

          window.updateStateFromApiResponse(result);

          // Re-render the wishlist with the updated list from the API response
          if (typeof window.initializeWishlistPage === "function") {
            const newHandles = result.wishlist.map((p) => p.productHandle);
            window.initializeWishlistPage(newHandles);
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
