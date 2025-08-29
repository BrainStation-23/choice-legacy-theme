// Debug version with console logs
console.log("Cart.js loaded");

class ProductForm extends HTMLElement {
  constructor() {
    super();
    console.log("ProductForm constructor called");

    this.form = this.querySelector("form");
    this.submitButton = this.querySelector('[type="submit"]');

    console.log("Form found:", this.form);
    console.log("Submit button found:", this.submitButton);
    console.log("Window.theme:", window.theme);

    this.cart =
      document.querySelector("cart-drawer") || this.createCartDrawer();

    if (this.form) {
      this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
      console.log("Submit event listener added");
    } else {
      console.error("No form found in ProductForm");
    }
  }

  createCartDrawer() {
    console.log("Creating cart drawer");
    const cartDrawer = document.createElement("cart-drawer");
    document.body.appendChild(cartDrawer);
    return cartDrawer;
  }

  onSubmitHandler(evt) {
    console.log("Form submitted!");
    evt.preventDefault();

    if (this.submitButton.getAttribute("aria-disabled") === "true") {
      console.log("Button disabled, returning");
      return;
    }

    console.log("Processing form submission...");

    this.handleErrorMessage();
    this.submitButton.setAttribute("aria-disabled", true);
    this.submitButton.classList.add("loading");

    const formData = new FormData(this.form);
    console.log("Form data:", Array.from(formData.entries()));

    const config = {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/javascript",
      },
      body: formData,
    };

    console.log("Making fetch request to:", window.theme.routes.cartAdd);

    fetch(window.theme.routes.cartAdd, config)
      .then((response) => {
        console.log("Response received:", response.status);
        return response.json();
      })
      .then((response) => {
        console.log("Response data:", response);

        if (response.status) {
          console.log("Error in response:", response.description);
          this.handleErrorMessage(response.description);
          return;
        }

        // Update cart count
        this.updateCartCount();

        // Open cart drawer
        this.cart.open();

        // Refresh cart drawer content
        this.cart.refresh();

        // Show success feedback
        this.showAddedToCartFeedback();
      })
      .catch((e) => {
        console.error("Fetch error:", e);
        this.handleErrorMessage("An error occurred. Please try again.");
      })
      .finally(() => {
        this.submitButton.removeAttribute("aria-disabled");
        this.submitButton.classList.remove("loading");
      });
  }

  updateCartCount() {
    console.log("Updating cart count...");
    fetch("/cart.js")
      .then((response) => response.json())
      .then((cart) => {
        console.log("Cart data:", cart);
        const cartCountElements =
          document.querySelectorAll("[data-cart-count]");
        cartCountElements.forEach((element) => {
          element.textContent = cart.item_count;
          element.classList.toggle("hidden", cart.item_count === 0);
        });
      })
      .catch((e) => console.error("Error updating cart count:", e));
  }

  showAddedToCartFeedback() {
    console.log("Showing feedback");
    const originalText = this.submitButton.textContent;
    this.submitButton.textContent =
      this.submitButton.dataset.addedText || "Added to cart";

    setTimeout(() => {
      this.submitButton.textContent = originalText;
    }, 2000);
  }

  handleErrorMessage(errorMessage = false) {
    console.log("Handling error message:", errorMessage);
    const errorMessageWrapper = this.querySelector(
      ".product-form__error-message-wrapper"
    );
    const errorMessage_element = this.querySelector(
      ".product-form__error-message"
    );

    if (!errorMessageWrapper) {
      console.log("No error wrapper found");
      return;
    }

    if (errorMessage) {
      errorMessage_element.textContent = errorMessage;
      errorMessageWrapper.toggleAttribute("hidden", false);
    } else {
      errorMessageWrapper.toggleAttribute("hidden", true);
    }
  }
}

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    console.log("CartDrawer constructor called");

    this.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.close()
    );

    const overlay = this.querySelector(".cart-drawer__overlay");
    const closeBtn = this.querySelector(".cart-drawer__close");

    if (overlay) {
      overlay.addEventListener("click", this.close.bind(this));
      console.log("Overlay click listener added");
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", this.close.bind(this));
      console.log("Close button listener added");
    }

    // Setup quantity change handlers
    this.setUpQuantityHandlers();
  }

  setUpQuantityHandlers() {
    this.addEventListener("change", (event) => {
      if (event.target.classList.contains("quantity__input")) {
        this.updateQuantity(event.target.dataset.index, event.target.value);
      }
    });

    this.addEventListener("click", (event) => {
      if (event.target.classList.contains("quantity__button")) {
        const input = event.target.parentNode.querySelector(".quantity__input");
        const index = input.dataset.index;
        const currentQuantity = parseInt(input.value);
        const isIncrease = event.target.name === "plus";
        const newQuantity = isIncrease
          ? currentQuantity + 1
          : Math.max(0, currentQuantity - 1);

        this.updateQuantity(index, newQuantity);
      }
    });
  }

  open() {
    console.log("Opening cart drawer");
    this.classList.add("animate", "active");
    document.body.classList.add("overflow-hidden");

    // Show the overlay
    this.style.visibility = "visible";
    this.style.opacity = "1";
  }

  close() {
    console.log("Closing cart drawer");
    this.classList.remove("active");
    document.body.classList.remove("overflow-hidden");

    // Hide the overlay after animation completes
    setTimeout(() => {
      if (!this.classList.contains("active")) {
        this.style.visibility = "hidden";
        this.style.opacity = "0";
      }
    }, 300); // Match the CSS transition duration
  }

  refresh() {
    console.log("Refreshing cart drawer");
    fetch(`${window.theme.routes.cart}?view=drawer`)
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement("div");
        html.innerHTML = text;
        const newCartDrawer = html.querySelector("cart-drawer");

        if (newCartDrawer) {
          this.querySelector(".cart-drawer__inner").innerHTML =
            newCartDrawer.querySelector(".cart-drawer__inner").innerHTML;
          this.setUpQuantityHandlers();
        }
      })
      .catch((e) => console.error("Error refreshing cart:", e));
  }

  updateQuantity(line, quantity) {
    console.log("Updating quantity:", line, quantity);
    this.querySelector(".cart-drawer__inner").classList.add(
      "cart-drawer--loading"
    );

    const body = JSON.stringify({
      line: line,
      quantity: quantity,
      sections: this.getSectionsToRender().map((section) => section.id),
      sections_url: window.location.pathname,
    });

    fetch(window.theme.routes.cartChange, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body,
    })
      .then((response) => response.json())
      .then((parsedState) => {
        this.renderContents(parsedState);
      })
      .catch((e) => {
        console.error("Error updating quantity:", e);
        this.refresh();
      })
      .finally(() => {
        this.querySelector(".cart-drawer__inner").classList.remove(
          "cart-drawer--loading"
        );
      });
  }

  getSectionsToRender() {
    return [
      {
        id: "cart-drawer",
        section: "cart-drawer",
        selector: ".cart-drawer__inner",
      },
    ];
  }

  renderContents(parsedState) {
    this.getSectionsToRender().forEach((section) => {
      const elementToReplace = this.querySelector(section.selector) || this;
      elementToReplace.innerHTML = this.getSectionInnerHTML(
        parsedState.sections[section.section],
        section.selector
      );
    });

    this.setUpQuantityHandlers();
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }
}

class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      event.preventDefault();
      const cartDrawer = this.closest("cart-drawer");
      cartDrawer.updateQuantity(this.dataset.index, 0);
    });
  }
}

// Register custom elements
console.log("Registering custom elements...");
customElements.define("product-form", ProductForm);
customElements.define("cart-drawer", CartDrawer);
customElements.define("cart-remove-button", CartRemoveButton);
console.log("Custom elements registered");

// Global cart utilities
window.CartUtilities = {
  openDrawer() {
    const cartDrawer = document.querySelector("cart-drawer");
    if (cartDrawer) {
      cartDrawer.open();
    }
  },

  refreshCart() {
    const cartDrawer = document.querySelector("cart-drawer");
    if (cartDrawer) {
      cartDrawer.refresh();
    }
  },
};

// Test function to manually trigger
window.testCartDrawer = function () {
  const cartDrawer = document.querySelector("cart-drawer");
  if (cartDrawer) {
    cartDrawer.open();
    console.log("Cart drawer opened manually");
  } else {
    console.log("No cart drawer found");
  }
};
