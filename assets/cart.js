/**
 * A helper function to fetch a snippet and return it as a DOM element.
 * @param {string} name - The name of the snippet to fetch.
 * @returns {Promise<HTMLElement>}
 */
function fetchSnippet(name) {
  return fetch(`/?section_id=${name}`)
    .then((response) => response.text())
    .then((text) => {
      const html = document.createElement("div");
      html.innerHTML = text;
      return html.querySelector(`[data-section-id="${name}"]`);
    });
}

/**
 * ProductForm Web Component
 * -------------------------
 * Handles the submission of the product form using the Fetch API.
 * Dispatches a 'cart:updated' event on success.
 */
class ProductForm extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector("form");
    this.submitButton = this.querySelector('[type="submit"]');
    this.errorMessage = this.querySelector(".product-form__error-message");
    this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
  }

  onSubmitHandler(evt) {
    evt.preventDefault();
    this.toggleLoading(true);

    const formData = new FormData(this.form);
    const config = {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/javascript",
      },
      body: formData,
    };

    fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          this.handleError(response.description);
          return;
        }

        // Dispatch a global event so other components can react
        document.dispatchEvent(
          new CustomEvent("cart:updated", { bubbles: true, detail: response })
        );
        this.errorMessage.parentElement.hidden = true;
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.toggleLoading(false);
      });
  }

  toggleLoading(isLoading) {
    const spinner = this.submitButton.querySelector(".loading-overlay");
    if (isLoading) {
      this.submitButton.setAttribute("disabled", true);
      spinner.classList.remove("hidden");
    } else {
      this.submitButton.removeAttribute("disabled");
      spinner.classList.add("hidden");
    }
  }

  handleError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.parentElement.hidden = false;
  }
}
customElements.define("product-form", ProductForm);

/**
 * CartDrawer Web Component
 * ------------------------
 * Manages the state and rendering of the cart drawer.
 */
class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.closeButton = this.querySelector(".cart-drawer__close-btn");
    this.overlay = this.querySelector(".cart-drawer__overlay");

    this.closeButton.addEventListener("click", this.close.bind(this));
    this.overlay.addEventListener("click", this.close.bind(this));

    // Listen for the global cart update event
    document.addEventListener("cart:updated", () => {
      this.renderContents();
    });
  }

  open() {
    this.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }

  close() {
    this.classList.add("hidden");
    document.body.style.overflow = "";
  }

  renderContents() {
    fetch(routes.cart_url + "?section_id=cart-drawer")
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement("div");
        html.innerHTML = text;

        const newDrawerBody =
          html.querySelector(".cart-drawer__body").innerHTML;
        const newSubtotal = html.querySelector(
          ".cart-drawer__subtotal"
        ).innerHTML;

        this.querySelector(".cart-drawer__body").innerHTML = newDrawerBody;
        this.querySelector(".cart-drawer__subtotal").innerHTML = newSubtotal;

        this.open();
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
customElements.define("cart-drawer", CartDrawer);
