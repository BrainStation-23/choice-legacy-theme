const toastManager = new ToastNotificationManager();

function updateAllWishlistButtons() {
  const wishlist = window.theme?.wishlistHandles || new Set();
  const allButtons = document.querySelectorAll(
    ".wishlist-btn[data-product-handle]"
  );

  allButtons.forEach((button) => {
    const productHandle = button.dataset.productHandle;
    const iconDefault = button.querySelector(".wishlist-icon-default");
    const iconActive = button.querySelector(".wishlist-icon-active");

    if (!iconDefault || !iconActive) {
      return;
    }

    if (wishlist.has(productHandle)) {
      iconDefault.classList.remove("inline-block");
      iconDefault.classList.add("hidden");
      iconActive.classList.remove("hidden");
      iconActive.classList.add("inline-block");
    } else {
      iconDefault.classList.remove("hidden");
      iconDefault.classList.add("inline-block");
      iconActive.classList.remove("inline-block");
      iconActive.classList.add("hidden");
    }
  });
}

async function addToWishlist(productHandle, variantId = null) {
  const response = await fetch(`/apps/${APP_SUB_PATH}/customer/wishlist/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productHandle: productHandle,
      variantId: variantId,
    }),
  });

  const result = await response.json();

  if (result.success) {
    toastManager.show("Added to wishlist", "success");
  } else if (result.alreadyExists) {
    toastManager.show("Already in wishlist", "success");
  } else {
    toastManager.show("Failed to add to wishlist", "error");
  }

  return result;
}

async function removeFromWishlist(productHandle, variantId = null) {
  try {
    const response = await fetch(
      `/apps/${APP_SUB_PATH}/customer/wishlist/remove`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productHandle, variantId }),
      }
    );
    const result = await response.json();

    if (result.success) {
      toastManager.show("Product removed from wishlist", "success");
    } else {
      toastManager.show("Failed to remove from wishlist", "error");
    }

    return result;
  } catch (error) {
    toastManager.show(error.message, "error");
    return null;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("click", async (e) => {
    if (
      e.target.matches(".wishlist-btn") ||
      e.target.closest(".wishlist-btn")
    ) {
      e.preventDefault();
      const button = e.target.closest(".wishlist-btn");
      const productHandle = button.dataset.productHandle;
      const variantId = button.dataset.variantId || null;

      if (!productHandle) {
        console.error("Product handle not found on the button.");
        return;
      }

      if (!window.theme?.wishlistHandles) {
        console.error(
          "Wishlist state (window.theme.wishlistHandles) is not initialized."
        );
        return;
      }

      button.disabled = true;

      try {
        if (window.theme.wishlistHandles.has(productHandle)) {
          const result = await removeFromWishlist(productHandle, variantId);
          if (result && result.success) {
            window.theme.wishlistHandles.delete(productHandle);
          }
        } else {
          const result = await addToWishlist(productHandle, variantId);
          if (result && (result.success || result.alreadyExists)) {
            window.theme.wishlistHandles.add(productHandle);
          }
        }
      } catch (error) {
        console.error("Wishlist action failed:", error);
        toastManager.show("Something went wrong. Please try again.", "error");
      } finally {
        if (typeof updateAllWishlistButtons === "function") {
          updateAllWishlistButtons();
        }
        button.disabled = false;
      }
    }
  });
});
