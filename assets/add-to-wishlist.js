const toastManager = new ToastNotificationManager();

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

  return await response.json();
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
        console.error("Product handle not found");
        return;
      }

      try {
        button.disabled = true;
        const result = await addToWishlist(productHandle, variantId);

        if (result.success) {
          toastManager.show("Added to wishlist", "success");
        } else if (result.alreadyExists) {
          toastManager.show("Already in wishlist", "success");
        } else {
          toastManager.show("Failed to add to wishlist", "error");
        }
      } catch (error) {
        console.error("Wishlist error:", error);
        toastManager.show("Something went wrong. Please try again.", "error");
      } finally {
        button.disabled = false;
      }
    }
  });
});
