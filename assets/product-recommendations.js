if (!customElements.get("product-recommendations")) {
  class ProductRecommendations extends HTMLElement {
    observer = undefined;

    constructor() {
      super();
    }

    connectedCallback() {
      const productId = this.dataset.productId;
      const productIds = this.dataset.productIds;

      if (productId) {
        this.initializeRecommendations(productId);
      } else if (productIds) {
        this.initializeRecommendations(productIds);
      }
    }

    initializeRecommendations(productData) {
      this.observer?.unobserve(this);
      this.observer = new IntersectionObserver(
        (entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.unobserve(this);
          this.loadRecommendations(productData);
        },
        { rootMargin: "0px 0px 400px 0px" }
      );
      this.observer.observe(this);
    }

    loadRecommendations(productData) {
      const limit = this.dataset.limit || 4;
      const intent = this.dataset.intent || "related";
      let url;

      // Handle single product ID (product page)
      if (typeof productData === "string" && !productData.includes(",")) {
        url = `${this.dataset.url}&product_id=${productData}&limit=${limit}&intent=${intent}&section_id=${this.dataset.sectionId}`;
      }
      // Handle multiple product IDs (cart page)
      else {
        const productIds =
          typeof productData === "string"
            ? productData
            : productData.toString();
        // For multiple products, we'll make multiple requests and merge results
        this.loadMultipleRecommendations(productIds.split(","), limit, intent);
        return;
      }

      this.fetchRecommendations(url);
    }

    async loadMultipleRecommendations(productIds, limit, intent) {
      try {
        const allRecommendations = new Map();
        const usedProducts = new Set(productIds); // Don't recommend products already in cart

        // Fetch recommendations for each product
        const promises = productIds.map((productId) => {
          const url = `${
            this.dataset.url
          }&product_id=${productId}&limit=${Math.ceil(
            limit / 2
          )}&intent=${intent}&section_id=${this.dataset.sectionId}`;
          return fetch(url).then((response) => response.text());
        });

        const responses = await Promise.all(promises);

        // Parse and collect unique recommendations
        responses.forEach((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector("product-recommendations");

          if (recommendations) {
            const productCards =
              recommendations.querySelectorAll(".swiper-slide");
            productCards.forEach((slide) => {
              const productCard = slide.querySelector("[data-product-id]");
              if (productCard) {
                const productId = productCard.dataset.productId;
                if (
                  !usedProducts.has(productId) &&
                  !allRecommendations.has(productId)
                ) {
                  allRecommendations.set(productId, slide.cloneNode(true));
                }
              }
            });
          }
        });

        // Build the final recommendations HTML
        if (allRecommendations.size > 0) {
          this.buildRecommendationsHTML(
            Array.from(allRecommendations.values()).slice(0, limit)
          );
        } else {
          this.remove();
        }
      } catch (error) {
        console.error("Error loading multiple product recommendations:", error);
        this.remove();
      }
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
