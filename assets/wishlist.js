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
  const table = document.querySelector(".wishlist-table");
  const tableBody = document.getElementById("customer-wishlist-items");
  const loader = document.getElementById("wishlist-loader");
  const emptyMessage = document.getElementById("empty-wishlist-message");

  const renderWishlist = (items) => {
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

      const row = document.createElement("tr");
      row.id = item.id;

      row.innerHTML = `
          <td>
            <img src="${imageUrl}" alt="${item.title}" class="product-image w-32 h-32">
          </td>
          <td class="product-name fw-400 fs-16-lh-24-ls-0">${item.title}</td>
          <td class="product-price fw-400 fs-16-lh-24-ls-0 min-w-85">${currencySymbol}${price}</td>
          <td class="wishlist-actions text-right flex justify-end items-center flex-wrap gap-16">
            <button 
              class="remove-wishlist-button bg-transparent text-brand border-none fw-600 fs-14-lh-16-ls-0 cursor-pointer" 
              data-product-handle="${item.handle}"
              data-item-id="${item.id}"
            >
              Remove
            </button>
            <button class="button button--solid cursor-pointer p-11">Add to cart</button>
          </td>
        `;
      tableBody.appendChild(row);
    });
  };

  const fetchAndDisplayWishlist = async () => {
    try {
      const response = await fetch(
        `/apps/${APP_SUB_PATH}/customer/wishlist/fetch`
      );
      const data = await response.json();

      if (data.success && data.wishlist.length > 0) {
        renderWishlist(data.wishlist);
        table.style.display = "table";
      } else {
        emptyMessage.style.display = "block";
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      emptyMessage.innerText =
        "Could not load wishlist. Please try again later.";
      emptyMessage.style.display = "block";
    } finally {
      loader.style.display = "none";
    }
  };

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
          const listItem = document.getElementById(itemId);
          if (listItem) {
            listItem.remove();
          }

          if (tableBody.children.length === 0) {
            emptyMessage.style.display = "block";
            table.style.display = "none";
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
