const wishlistToastManager = new ToastNotificationManager();

function getProductIdFromHandle(productHandle) {
  const productDetails = window.allShopifyProducts?.[productHandle];
  return productDetails?.id || null;
}

async function addToWishlist(productHandle, productId) {
  const response = await fetch(`/apps/${APP_SUB_PATH}/customer/wishlist/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productHandle, productId }),
  });
  const result = await response.json();
  if (result.success) {
    wishlistToastManager.show("Added to wishlist", "success");
  } else if (result.alreadyExists) {
    wishlistToastManager.show("Already in wishlist", "success");
  } else {
    wishlistToastManager.show("Failed to add to wishlist", "error");
  }
  return result;
}

async function removeFromWishlist(productHandle, productId) {
  try {
    const response = await fetch(
      `/apps/${APP_SUB_PATH}/customer/wishlist/remove`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productHandle, productId }),
      }
    );
    const result = await response.json();
    if (!result.success) {
      wishlistToastManager.show("Failed to remove from wishlist", "error");
    }
    return result;
  } catch (error) {
    console.error("Remove from wishlist failed:", error);
    wishlistToastManager.show("An error occurred. Please try again.", "error");
    return null;
  }
}

function updateAllWishlistButtons() {
  const wishlist = window.theme?.wishlistHandles || new Set();
  const allButtons = document.querySelectorAll(
    ".wishlist-btn[data-product-handle]"
  );

  allButtons.forEach((button) => {
    const productHandle = button.dataset.productHandle;
    const iconDefault = button.querySelector(".wishlist-icon-default");
    const iconActive = button.querySelector(".wishlist-icon-active");
    if (!iconDefault || !iconActive) return;

    if (wishlist.has(productHandle)) {
      iconDefault.classList.add("hidden");
      iconActive.classList.remove("hidden");
    } else {
      iconDefault.classList.remove("hidden");
      iconActive.classList.add("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("click", async (e) => {
    const button = e.target.closest(".wishlist-btn");
    if (!button) return;

    e.preventDefault();
    const productHandle = button.dataset.productHandle;
    const productId = getProductIdFromHandle(productHandle);

    if (!productHandle || !productId) {
      console.error("Product handle or ID not found for button:", button);
      return;
    }
    if (!window.theme?.wishlistHandles) {
      console.error("Wishlist state is not initialized.");
      return;
    }

    button.disabled = true;

    try {
      if (window.theme.wishlistHandles.has(productHandle)) {
        const result = await removeFromWishlist(productHandle, productId);
        if (result && result.success) {
          window.theme.wishlistHandles.delete(productHandle);
          toastManager.show("Product removed from wishlist", "success");
        }
      } else {
        const result = await addToWishlist(productHandle, productId);
        if (result && (result.success || result.alreadyExists)) {
          window.theme.wishlistHandles.add(productHandle);
        }
      }
    } catch (error) {
      console.error("Wishlist action failed:", error);
      toastManager.show("Something went wrong. Please try again.", "error");
    } finally {
      updateAllWishlistButtons();
      button.disabled = false;
    }
  });
});
