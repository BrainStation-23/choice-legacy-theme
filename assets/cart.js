class ProductForm extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector("form");
    this.submitButton = this.querySelector('[type="submit"]');
    this.cart =
      document.querySelector("cart-drawer") || this.createCartDrawer();
    if (this.form) {
      this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
    }
  }

  createCartDrawer() {
    const cartDrawer = document.createElement("cart-drawer");
    document.body.appendChild(cartDrawer);
    return cartDrawer;
  }

  onSubmitHandler(evt) {
    evt.preventDefault();
    if (this.submitButton.getAttribute("aria-disabled") === "true") {
      return;
    }

    this.handleErrorMessage(); // Clear previous errors
    this.submitButton.setAttribute("aria-disabled", true);
    this.submitButton.classList.add("loading");

    const formData = new FormData(this.form);
    const config = {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/javascript",
      },
      body: formData,
    };

    fetch(window.theme.routes.cartAdd, config)
      .then((response) => response.json())
      .then((response) => {
        // Always open the cart drawer
        this.cart.open();

        if (response.status) {
          // Handle error case - show error in drawer
          // DON'T refresh cart on error to preserve error message
          this.cart.showError(response.description || response.message);
          this.handleErrorMessage(response.description || response.message);
          return;
        }

        // Success case - refresh cart to show updated content
        this.updateCartCount();
        this.cart.refresh();
        this.showAddedToCartFeedback();
      })
      .catch((e) => {
        console.error("Fetch error:", e);
        const errorMessage = "An error occurred. Please try again.";

        // Open drawer and show error even on fetch failure
        // DON'T refresh cart on error
        this.cart.open();
        this.cart.showError(errorMessage);
        this.handleErrorMessage(errorMessage);
      })
      .finally(() => {
        this.submitButton.removeAttribute("aria-disabled");
        this.submitButton.classList.remove("loading");
      });
  }

  updateCartCount() {
    fetch("/cart.js")
      .then((response) => response.json())
      .then((cart) => {
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
    const originalText = this.submitButton.textContent;
    this.submitButton.textContent =
      this.submitButton.dataset.addedText || "Added to cart";
    setTimeout(() => {
      this.submitButton.textContent = originalText;
    }, 2000);
  }

  handleErrorMessage(errorMessage = false) {
    const errorMessageWrapper = this.querySelector(
      ".product-form__error-message-wrapper"
    );
    const errorMessage_element = this.querySelector(
      ".product-form__error-message"
    );
    if (!errorMessageWrapper) return;
    if (errorMessage) {
      errorMessage_element.textContent = errorMessage;
      errorMessageWrapper.toggleAttribute("hidden", false);
    } else {
      errorMessageWrapper.toggleAttribute("hidden", true);
    }
  }
}

class CartPage extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector("form");
    this._setupEventListeners();
    this.createErrorContainer();
  }

  createErrorContainer() {
    // Check if error container already exists
    let errorContainer = this.querySelector(".cart-page__error");

    if (!errorContainer) {
      // If not in HTML, create it
      errorContainer = document.createElement("div");
      errorContainer.className = "cart-page__error hidden";

      const errorMessage = document.createElement("span");
      errorMessage.className = "cart-page__error-message error-text";
      errorContainer.appendChild(errorMessage);

      // Insert before cart items
      const cartItems = this.querySelector(".cart-page__items");
      if (cartItems) {
        cartItems.parentNode.insertBefore(errorContainer, cartItems);
      }
    } else {
      // Ensure the error message span exists
      if (!errorContainer.querySelector(".cart-page__error-message")) {
        const errorMessage = document.createElement("span");
        errorMessage.className = "cart-page__error-message error-text";
        errorContainer.appendChild(errorMessage);
      }
    }
  }

  showError(message) {
    const errorContainer = this.querySelector(".cart-page__error");
    const errorMessage = this.querySelector(".cart-page__error-message");

    if (errorContainer && errorMessage) {
      errorMessage.textContent = message;
      errorContainer.classList.remove("hidden");

      if (this.errorTimeout) {
        clearTimeout(this.errorTimeout);
      }
      this.errorTimeout = setTimeout(() => {
        this.hideError();
      }, 8000);
    }
  }

  hideError() {
    const errorContainer = this.querySelector(".cart-page__error");
    if (errorContainer) {
      errorContainer.classList.add("hidden");
    }
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  _setupEventListeners() {
    // Handle form submission for update button
    if (this.form) {
      this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
    }

    this.setUpQuantityHandlers();
  }

  onSubmitHandler(evt) {
    evt.preventDefault();
    const submitButton = evt.submitter;

    if (submitButton && submitButton.name === "update") {
      this.hideError();
      this.updateCart();
    }
  }

  updateCart() {
    const updateButton = this.querySelector('[name="update"]');
    if (updateButton) {
      updateButton.disabled = true;
      updateButton.textContent = "Updating...";
    }

    const formData = new FormData(this.form);

    fetch(window.theme.routes.cartUpdate, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          return response.json();
        }
      })
      .then((data) => {
        if (data && data.status) {
          this.showError(
            data.description || data.message || "Failed to update cart"
          );
        } else {
          // Refresh page to show updated cart
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error("Error updating cart:", error);
        this.showError("Failed to update cart. Please try again.");
      })
      .finally(() => {
        if (updateButton) {
          updateButton.disabled = false;
          updateButton.textContent = "Update";
        }
      });
  }

  setUpQuantityHandlers() {
    // Reuse the same quantity handler pattern from CartDrawer
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

  updateQuantity(line, quantity) {
    const lineItem = this.querySelector(`#CartItem-${line}`);
    if (lineItem) lineItem.classList.add("is-loading");

    const body = JSON.stringify({
      line: line,
      quantity: quantity,
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
        if (parsedState.status) {
          this.showError(
            parsedState.description ||
              parsedState.message ||
              "Failed to update quantity"
          );
          // Refresh page on error to sync state
          setTimeout(() => window.location.reload(), 2000);
        } else {
          // Update cart count in header
          this.updateCartCount();

          // If quantity is 0, refresh the page to remove the item
          if (quantity === 0) {
            window.location.reload();
          } else {
            // Update the input value and totals
            const input = lineItem.querySelector(".quantity__input");
            if (input) input.value = quantity;

            // Update line total if we have the item data
            if (parsedState.items) {
              const item = parsedState.items.find(
                (item) => item.index === parseInt(line) - 1
              );
              if (item) {
                const totalElement = lineItem.querySelector(
                  ".cart-page__item-total"
                );
                if (totalElement) {
                  totalElement.textContent = `৳${(item.line_price / 100)
                    .toFixed(2)
                    .replace(/\.00$/, "")}`;
                }
              }
            }
          }
        }
      })
      .catch((error) => {
        console.error("Error updating quantity:", error);
        this.showError("Failed to update quantity. Please try again.");
        setTimeout(() => window.location.reload(), 2000);
      })
      .finally(() => {
        if (lineItem) lineItem.classList.remove("is-loading");
      });
  }

  updateCartCount() {
    fetch("/cart.js")
      .then((response) => response.json())
      .then((cart) => {
        const cartCountElements =
          document.querySelectorAll("[data-cart-count]");
        cartCountElements.forEach((element) => {
          element.textContent = cart.item_count;
          element.classList.toggle("hidden", cart.item_count === 0);
        });

        // Update cart title
        const cartTitle = this.querySelector(".cart-page__title");
        if (cartTitle) {
          cartTitle.textContent = `{{ 'sections.cart.title' | t }} (${cart.item_count})`;
        }
      })
      .catch((e) => console.error("Error updating cart count:", e));
  }
}

if (window.CartUtilities) {
  window.CartUtilities.refreshCartPage = function () {
    const cartPage = document.querySelector("cart-page");
    if (cartPage) {
      cartPage.updateCartCount();
    }
  };

  window.CartUtilities.showCartPageError = function (message) {
    const cartPage = document.querySelector("cart-page");
    if (cartPage) {
      cartPage.showError(message);
    }
  };
}

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.close()
    );
    this._setupEventListeners();
    this.createErrorContainer();
  }

  createErrorContainer() {
    // Check if error container already exists in the HTML
    let errorContainer = this.querySelector(".cart-drawer__error");

    if (!errorContainer) {
      // If not in HTML, create it and place before cart note
      errorContainer = document.createElement("div");
      errorContainer.className = "cart-drawer__error hidden";

      const errorMessage = document.createElement("span");
      errorMessage.className = "cart-drawer__error-message error-text";
      errorContainer.appendChild(errorMessage);

      // Insert before cart-note
      const cartNote = this.querySelector("cart-note");
      if (cartNote) {
        cartNote.parentNode.insertBefore(errorContainer, cartNote);
      } else {
        // Fallback: insert at beginning of footer
        const footer = this.querySelector(".cart-drawer__footer");
        if (footer) {
          footer.insertBefore(errorContainer, footer.firstChild);
        }
      }
    } else {
      // Ensure the error message span exists
      if (!errorContainer.querySelector(".cart-drawer__error-message")) {
        const errorMessage = document.createElement("span");
        errorMessage.className = "cart-drawer__error-message error-text";
        errorContainer.appendChild(errorMessage);
      }
    }
  }

  showError(message) {
    const errorContainer = this.querySelector(".cart-drawer__error");
    const errorMessage = this.querySelector(".cart-drawer__error-message");

    if (errorContainer && errorMessage) {
      errorMessage.textContent = message;
      errorContainer.classList.remove("hidden");

      if (this.errorTimeout) {
        clearTimeout(this.errorTimeout);
      }
      // this.errorTimeout = setTimeout(() => {
      //   this.hideError();
      // }, 8000);
    }
  }

  hideError() {
    const errorContainer = this.querySelector(".cart-drawer__error");
    if (errorContainer) {
      errorContainer.classList.add("hidden");
    }
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  _setupEventListeners() {
    const overlay = this.querySelector(".cart-drawer__overlay");
    if (overlay) {
      overlay.addEventListener("click", this.close.bind(this));
    }

    const closeBtn = this.querySelector(".cart-drawer__close");
    if (closeBtn) {
      closeBtn.addEventListener("click", this.close.bind(this));
    }

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
    this.classList.add("animate", "active");
    document.body.classList.add("overflow-hidden");
    this.style.visibility = "visible";
    this.style.opacity = "1";
  }

  close() {
    this.classList.remove("active");
    document.body.classList.remove("overflow-hidden");
    this.hideError();
    setTimeout(() => {
      if (!this.classList.contains("active")) {
        this.style.visibility = "hidden";
        this.style.opacity = "0";
      }
    }, 300);
  }

  refresh() {
    fetch(`${window.theme.routes.cart}?view=drawer`)
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement("div");
        html.innerHTML = text;
        const newCartDrawer = html.querySelector("cart-drawer");
        if (newCartDrawer) {
          const currentError = this.querySelector(".cart-drawer__error");
          const hasError =
            currentError && !currentError.classList.contains("hidden");
          const errorMessage = hasError
            ? currentError.querySelector(".cart-drawer__error-message")
                .textContent
            : null;

          this.querySelector(".cart-drawer__inner").innerHTML =
            newCartDrawer.querySelector(".cart-drawer__inner").innerHTML;

          this.createErrorContainer();
          this._setupEventListeners();

          if (hasError && errorMessage) {
            this.showError(errorMessage);
          }
        }
      })
      .catch((e) => {
        console.error("Error refreshing cart:", e);
        this.showError("Failed to refresh cart. Please try again.");
      });
  }

  updateQuantity(line, quantity) {
    this.querySelector(".cart-drawer__inner").classList.add(
      "cart-drawer--loading"
    );
    const lineItem = this.querySelector(`#CartDrawer-Item-${line}`);
    if (lineItem) lineItem.classList.add("is-loading");

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
        if (parsedState.status) {
          this.showError(
            parsedState.description ||
              parsedState.message ||
              "Failed to update quantity"
          );
          this.refresh();
        } else {
          this.renderContents(parsedState);
        }
      })
      .catch((e) => {
        console.error("Error updating quantity:", e);
        this.showError("Failed to update quantity. Please try again.");
        const errorLineItem = this.querySelector(`#CartDrawer-Item-${line}`);
        if (errorLineItem) errorLineItem.classList.remove("is-loading");
        this.refresh();
      })
      .finally(() => {
        this.querySelector(".cart-drawer__inner").classList.remove(
          "cart-drawer--loading"
        );
        const finalLineItem = this.querySelector(`#CartDrawer-Item-${line}`);
        if (finalLineItem) finalLineItem.classList.remove("is-loading");
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
      const sectionHtml = parsedState.sections[section.section];

      const container = new DOMParser()
        .parseFromString(sectionHtml, "text/html")
        .querySelector(section.selector);

      if (!container) {
        this.refresh();
        return;
      }

      const elementToReplace = this.querySelector(section.selector) || this;
      elementToReplace.innerHTML = container.innerHTML;
    });

    this.createErrorContainer();
    this._setupEventListeners();
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

class CartNote extends HTMLElement {
  constructor() {
    super();
    this.noteInput = this.querySelector("textarea");
    this.debounceTimeout = null;
    this.noteInput.addEventListener("input", this.onNoteChange.bind(this));
  }

  onNoteChange() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      this.saveNote();
    }, 800);
  }

  async saveNote() {
    const noteValue = this.noteInput.value;
    const body = JSON.stringify({ note: noteValue });
    try {
      const response = await fetch(window.theme.routes.cartUpdate, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to save cart note:", error);
      const cartDrawer = this.closest("cart-drawer");
      if (cartDrawer) {
        cartDrawer.showError("Failed to save note. Please try again.");
      }
    }
  }
}

customElements.define("product-form", ProductForm);
customElements.define("cart-drawer", CartDrawer);
customElements.define("cart-remove-button", CartRemoveButton);
customElements.define("cart-note", CartNote);
customElements.define("cart-page", CartPage);

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
  showError(message) {
    const cartDrawer = document.querySelector("cart-drawer");
    if (cartDrawer) {
      cartDrawer.open();
      cartDrawer.showError(message);
    }
  },
};
