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

async function removeFromCart(lineIndex) {
  try {
    const body = JSON.stringify({
      line: lineIndex,
      quantity: 0,
    });

    const response = await fetch(window.theme.routes.cartChange, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body,
    });

    const result = await response.json();

    if (response.ok) {
      updateCartCount();

      const cartDrawer = document.querySelector("cart-drawer");
      if (cartDrawer) {
        cartDrawer.refresh();
      }

      const cartPage = document.querySelector("cart-page");
      if (cartPage) {
        window.location.reload();
      }

      return { success: true, result };
    } else {
      throw new Error("Failed to remove from cart");
    }
  } catch (error) {
    console.error("Remove from cart failed:", error);
    return { success: false, error };
  }
}

function updateCartCount() {
  fetch("/cart.js")
    .then((response) => response.json())
    .then((cart) => {
      const cartCountElements = document.querySelectorAll("[data-cart-count]");
      cartCountElements.forEach((element) => {
        element.textContent = cart.item_count;
        element.classList.toggle("hidden", cart.item_count === 0);
      });
    })
    .catch((e) => console.error("Error updating cart count:", e));
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

function getCartItemLineIndex(button) {
  const cartItem = button.closest(".cart-drawer__item, .cart-page__item");
  if (!cartItem) return null;

  const itemId = cartItem.id;
  const match = itemId.match(/Cart(?:Drawer-)?Item-(\d+)/);
  return match ? match[1] : null;
}

function isInCartDrawer(button) {
  return button.closest("cart-drawer") !== null;
}

function isInCartPage(button) {
  return button.closest("cart-page") !== null;
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
      const inCartDrawer = isInCartDrawer(button);
      const inCartPage = isInCartPage(button);

      if (inCartDrawer || inCartPage) {
        const result = await addToWishlist(productHandle, productId);
        if (result && (result.success || result.alreadyExists)) {
          window.theme.wishlistHandles.add(productHandle);

          const lineIndex = getCartItemLineIndex(button);
          if (lineIndex) {
            const cartRemoveResult = await removeFromCart(lineIndex);
            if (cartRemoveResult.success) {
              wishlistToastManager.show("Moved to wishlist", "success");
            } else {
              wishlistToastManager.show(
                "Added to wishlist, but failed to remove from cart",
                "warning"
              );
            }
          } else {
            console.warn("Could not find cart line index for item");
            wishlistToastManager.show("Added to wishlist", "success");
          }
        }
      } else {
        // Normal wishlist behavior outside cart drawer
        if (window.theme.wishlistHandles.has(productHandle)) {
          // Product is already in wishlist, remove from wishlist
          const result = await removeFromWishlist(productHandle, productId);
          if (result && result.success) {
            window.theme.wishlistHandles.delete(productHandle);
            wishlistToastManager.show(
              "Product removed from wishlist",
              "success"
            );
          }
        } else {
          // Product is not in wishlist, add to wishlist
          const result = await addToWishlist(productHandle, productId);
          if (result && (result.success || result.alreadyExists)) {
            window.theme.wishlistHandles.add(productHandle);
          }
        }
      }
    } catch (error) {
      console.error("Wishlist action failed:", error);
      wishlistToastManager.show(
        "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      updateAllWishlistButtons();
      button.disabled = false;
    }
  });
});
