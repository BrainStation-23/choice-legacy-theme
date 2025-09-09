class CartDiscounts extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector(".discount-form__input");
    this.messageContainer = this.querySelector(".discount-form__message");
    this.messageText = this.querySelector(
      ".discount-form__message .error-text"
    );

    this.input.addEventListener("keydown", this.onKeyDown.bind(this));
    this.addEventListener("click", this.onRemove.bind(this));
  }

  onKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.applyNewDiscount();
    }
  }

  applyNewDiscount() {
    const newCode = this.input.value.trim();
    if (!newCode) return;

    const currentCodes = this.getCurrentDiscounts();
    const codesToApply = new Set([...currentCodes, newCode]);

    this.updateDiscounts(Array.from(codesToApply));
  }

  onRemove(event) {
    const removeButton = event.target.closest(".applied-discount__remove");
    const appliedDiscount = event.target.closest(".applied-discount");

    if (!removeButton || !appliedDiscount) return;

    event.preventDefault();
    const codeToRemove = appliedDiscount.dataset.code;

    const currentCodes = this.getCurrentDiscounts();
    const codesToApply = currentCodes.filter((code) => code !== codeToRemove);

    this.updateDiscounts(codesToApply);
  }

  getCurrentDiscounts() {
    const appliedDiscountElements = this.querySelectorAll("[data-code]");
    return Array.from(appliedDiscountElements).map((el) => el.dataset.code);
  }

  updateDiscounts(codes = []) {
    const cartPage = this.closest("cart-page");
    if (!cartPage) return;

    const currentCodeCount = this.getCurrentDiscounts().length;

    cartPage.classList.add("cart-page--loading");
    this.hideMessage();

    const discountString = codes.join(",");

    const sections = cartPage
      .getSectionsToRender()
      .map((section) => section.id);
    const body = JSON.stringify({
      discount: discountString,
      sections: sections,
      sections_url: window.location.pathname,
    });

    fetch("/cart/update.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((error) => {
            throw error;
          });
        }
        return response.json();
      })
      .then((state) => {
        cartPage.renderSections(state);

        const successfullyAppliedCodes =
          state.cart_level_discount_applications.map(
            (d) => d.discount_application.title
          );
        const attemptWasSuccessful =
          codes.length === successfullyAppliedCodes.length &&
          codes.every((c) => successfullyAppliedCodes.includes(c));

        if (attemptWasSuccessful) {
          const message =
            codes.length < currentCodeCount
              ? "Discount removed"
              : "Discount applied successfully";
          window.toast.show(message, "success");
        } else {
          const errorMessage = "Invalid discount code";
          this.showMessage(errorMessage);
          window.toast.show(errorMessage, "error");
        }
      })
      .catch((error) => {
        console.error(error);
        const errorMessage =
          error.description ||
          error.message ||
          "An error occurred while applying the discount.";

        this.showMessage(errorMessage);
        window.toast.show(errorMessage, "error");
      })
      .finally(() => {
        this.input.value = "";
        cartPage.classList.remove("cart-page--loading");
      });
  }

  showMessage(message) {
    if (!this.messageContainer || !this.messageText) return;
    this.messageContainer.classList.remove("hidden");
    this.messageText.textContent = message;
  }

  hideMessage() {
    if (!this.messageContainer) return;
    this.messageContainer.classList.add("hidden");
  }
}

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

    this.handleErrorMessage();
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
        this.cart.open();

        if (response.status) {
          this.cart.showError(response.description || response.message);
          this.handleErrorMessage(response.description || response.message);
          return;
        }

        this.updateCartCount();
        this.cart.refresh();
        this.showAddedToCartFeedback();
      })
      .catch((e) => {
        console.error("Fetch error:", e);
        const errorMessage = "An error occurred. Please try again.";

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
    this.addEventListener("change", this.onQuantityChange.bind(this));
    this.addEventListener("click", this.onButtonClick.bind(this));
    this.form = this.querySelector("form");
  }

  onQuantityChange(event) {
    if (event.target.classList.contains("quantity__input")) {
      const line = event.target.dataset.index;
      const quantity = parseInt(event.target.value);
      this.updateQuantity(line, quantity);
    }
  }

  onButtonClick(event) {
    const removeButton = event.target.closest(".cart-page__remove");
    if (removeButton) {
      event.preventDefault();
      const line = removeButton.dataset.index;
      this.updateQuantity(line, 0);
      return;
    }

    const quantityButton = event.target.closest(".quantity__button");
    if (quantityButton) {
      const input = quantityButton.parentNode.querySelector(".quantity__input");
      const line = input.dataset.index;
      const currentQuantity = parseInt(input.value);
      const newQuantity =
        quantityButton.name === "plus"
          ? currentQuantity + 1
          : Math.max(0, currentQuantity - 1);
      this.updateQuantity(line, newQuantity);
    }
  }

  updateQuantity(line, quantity) {
    const lineItem = this.querySelector(`#CartItem-${line}`);
    if (lineItem) {
      lineItem.classList.add("is-loading");
    }

    this.classList.add("cart-page--loading");

    const body = JSON.stringify({
      line: line,
      quantity: quantity,
      sections: this.getSectionsToRender().map((section) => section.id),
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
        this.classList.remove("cart-page--loading");
        if (parsedState.status) {
          this.showError(
            parsedState.description ||
              parsedState.message ||
              "Failed to update cart."
          );
        } else {
          this.renderSections(parsedState);
        }
      })
      .catch((e) => {
        this.classList.remove("cart-page--loading");
        console.error("Error updating quantity:", e);
        this.showError("An error occurred. Please try again.");
      });
  }

  renderSections(parsedState) {
    this.getSectionsToRender().forEach((section) => {
      const sectionHtml = parsedState.sections[section.id];

      const container = new DOMParser()
        .parseFromString(sectionHtml, "text/html")
        .querySelector(section.selector);

      if (!container) {
        console.error(
          "Cart Page Error: Invalid section received. Triggering AJAX refresh for recovery.",
          parsedState
        );

        this.refresh();
        return;
      }

      this.innerHTML = container.innerHTML;
    });

    this.updateCartCount();
  }

  refresh() {
    this.classList.add("cart-page--loading");

    fetch("/cart?section_id=cart-page")
      .then((response) => response.text())
      .then((htmlString) => {
        const html = new DOMParser().parseFromString(htmlString, "text/html");
        const newContents = html.querySelector(".cart-page__contents");

        if (newContents) {
          const currentContents = this.querySelector(".cart-page__contents");
          if (currentContents) {
            currentContents.innerHTML = newContents.innerHTML;
          }
        }

        this.updateCartCount();
      })
      .catch((e) => {
        console.error("Error refreshing cart page:", e);
        window.location.reload();
      })
      .finally(() => {
        this.classList.remove("cart-page--loading");
      });
  }

  getSectionsToRender() {
    const sectionId = this.closest(".shopify-section")?.id.replace(
      "shopify-section-",
      ""
    );
    return [
      {
        id: sectionId || "cart-page",
        selector: "cart-page",
      },
    ];
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  updateCartCount() {
    fetch("/cart.js")
      .then((response) => response.json())
      .then((cart) => {
        document.querySelectorAll("[data-cart-count]").forEach((el) => {
          el.textContent = cart.item_count;
        });
      });
  }

  showError(message) {
    const errorContainer = this.querySelector(".cart-page__error");
    if (errorContainer) {
      errorContainer.querySelector(".cart-page__error-message").textContent =
        message;
      errorContainer.classList.remove("hidden");
    }
  }

  hideError() {
    const errorContainer = this.querySelector(".cart-page__error");
    if (errorContainer) {
      errorContainer.classList.add("hidden");
    }
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

      const cartContainer =
        this.closest("cart-drawer") || this.closest("cart-page");

      if (cartContainer) {
        cartContainer.updateQuantity(this.dataset.index, 0);
      }
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
customElements.define("cart-discounts", CartDiscounts);

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
