if (!customElements.get("product-recommendations")) {
  class ProductRecommendations extends HTMLElement {
    observer = undefined;

    constructor() {
      super();
    }

    connectedCallback() {
      const productId = this.dataset.productId;

      if (productId) {
        this.initializeRecommendations(productId);
      }
    }

    initializeRecommendations(productId) {
      this.observer?.unobserve(this);
      this.observer = new IntersectionObserver(
        (entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.unobserve(this);
          this.loadRecommendations(productId);
        },
        { rootMargin: "0px 0px 400px 0px" }
      );
      this.observer.observe(this);
    }

    loadRecommendations(productId) {
      const limit = this.dataset.limit || 4;
      const intent = this.dataset.intent || "related";
      const url = `${this.dataset.url}&product_id=${productId}&limit=${limit}&intent=${intent}&section_id=${this.dataset.sectionId}`;

      this.fetchRecommendations(url);
    }

    fetchRecommendations(url) {
      fetch(url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector("product-recommendations");

          if (recommendations?.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          // Remove if no slideshow component was created (Dawn's logic)
          if (!this.querySelector("slideshow-component")) {
            this.remove();
            return;
          }

          // Check if actual products were loaded (adapt to your product card selector)
          if (
            html.querySelector(".swiper-slide") ||
            html.querySelector(".product-card")
          ) {
            this.classList.add("product-recommendations--loaded");
            this.initializeComponents();
          }
        })
        .catch((e) => {
          console.error("Error loading product recommendations:", e);
          this.remove();
        });
    }

    initializeComponents() {
      // Initialize slideshow component if it exists
      const slideshowComponent = this.querySelector("slideshow-component");
      if (
        slideshowComponent &&
        typeof window.initializeSlideshow === "function"
      ) {
        window.initializeSlideshow(slideshowComponent);
      }

      // Dispatch event to let other scripts know recommendations are loaded
      this.dispatchEvent(
        new CustomEvent("recommendations:loaded", {
          bubbles: true,
          detail: { element: this },
        })
      );
    }

    disconnectedCallback() {
      this.observer?.unobserve(this);
    }
  }

  customElements.define("product-recommendations", ProductRecommendations);
}
