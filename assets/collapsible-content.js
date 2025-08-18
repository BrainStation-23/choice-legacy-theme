class CollapsibleContent extends HTMLElement {
  constructor() {
    super();
    this.isExpanded = false;
  }

  connectedCallback() {
    this.setupEventListeners();
    this.setupInitialState();
  }

  setupInitialState() {
    // Set initial expanded state from data attribute
    if (this.dataset.expanded === "true") {
      this.expand();
    }

    // Store original border classes if border replacement is configured
    if (this.dataset.borderMap) {
      try {
        this.borderMap = JSON.parse(this.dataset.borderMap);
        this.storeBorderClasses();
      } catch (e) {
        console.warn("Invalid border-map JSON:", this.dataset.borderMap);
      }
    }
  }

  storeBorderClasses() {
    const trigger =
      this.querySelector("[data-collapsible-trigger]") ||
      this.querySelector(".collapsible-trigger");

    if (trigger && this.borderMap) {
      this.originalBorderClasses = [];
      this.expandedBorderClasses = [];

      // Extract original and expanded border classes
      Object.entries(this.borderMap).forEach(([original, expanded]) => {
        if (trigger.classList.contains(original)) {
          this.originalBorderClasses.push(original);
          this.expandedBorderClasses.push(expanded);
        }
      });
    }
  }

  setupEventListeners() {
    // Look for generic trigger element using data attribute or class
    const trigger =
      this.querySelector("[data-collapsible-trigger]") ||
      this.querySelector(".collapsible-trigger");

    if (trigger) {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggle();
      });
    }
  }

  toggle() {
    // Check if accordion behavior is enabled
    const isAccordion =
      this.dataset.accordion === "true" ||
      this.closest("[data-accordion]") !== null;

    if (isAccordion) {
      // Close all other collapsible content elements in the same accordion group
      const accordionContainer = this.closest("[data-accordion]") || document;
      const allCollapsibles = accordionContainer.querySelectorAll(
        "collapsible-content"
      );

      allCollapsibles.forEach((collapsible) => {
        if (collapsible !== this && collapsible.isExpanded) {
          collapsible.collapse();
        }
      });
    }

    // Toggle this one
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  expand() {
    this.isExpanded = true;
    this.classList.add("expanded");
    this.setAttribute("aria-expanded", "true");

    // Find and show content
    const content =
      this.querySelector("[data-collapsible-content]") ||
      this.querySelector(".collapsible-content");
    if (content) {
      content.style.maxHeight = content.scrollHeight + "px";
      content.classList.add("expanded");
    }

    // Handle icon toggle (plus/minus or rotation)
    const iconContainer =
      this.querySelector("[data-collapsible-icon]") ||
      this.querySelector(".collapsible-icon");
    if (iconContainer) {
      // Check if it has plus/minus icons
      const plusIcon = iconContainer.querySelector(
        '[class*="icon-plus"], .icon-plus'
      );
      const minusIcon = iconContainer.querySelector(
        '[class*="icon-minus"], .icon-minus'
      );

      if (plusIcon && minusIcon) {
        // Plus/minus toggle
        plusIcon.classList.add("hidden");
        plusIcon.classList.remove("block");
        minusIcon.classList.add("block");
        minusIcon.classList.remove("hidden");
      } else {
        // Single icon rotation
        iconContainer.classList.add("rotated");
      }
    }

    // Handle border class changes if configured
    this.updateBorderClasses(true);

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent("collapsible:expanded", {
        bubbles: true,
        detail: { element: this },
      })
    );
  }

  updateBorderClasses(isExpanded) {
    if (
      !this.borderMap ||
      !this.originalBorderClasses ||
      !this.expandedBorderClasses
    )
      return;

    const trigger =
      this.querySelector("[data-collapsible-trigger]") ||
      this.querySelector(".collapsible-trigger");

    if (trigger) {
      if (isExpanded) {
        // Remove original border classes and add expanded ones
        this.originalBorderClasses.forEach((cls) =>
          trigger.classList.remove(cls)
        );
        this.expandedBorderClasses.forEach((cls) => trigger.classList.add(cls));
      } else {
        // Remove expanded border classes and add original ones back
        this.expandedBorderClasses.forEach((cls) =>
          trigger.classList.remove(cls)
        );
        this.originalBorderClasses.forEach((cls) => trigger.classList.add(cls));
      }
    }
  }

  collapse() {
    this.isExpanded = false;
    this.classList.remove("expanded");
    this.setAttribute("aria-expanded", "false");

    // Find and hide content
    const content =
      this.querySelector("[data-collapsible-content]") ||
      this.querySelector(".collapsible-content");
    if (content) {
      content.style.maxHeight = "0";
      content.classList.remove("expanded");
    }

    // Handle icon toggle (plus/minus or rotation)
    const iconContainer =
      this.querySelector("[data-collapsible-icon]") ||
      this.querySelector(".collapsible-icon");
    if (iconContainer) {
      // Check if it has plus/minus icons
      const plusIcon = iconContainer.querySelector(
        '[class*="icon-plus"], .icon-plus'
      );
      const minusIcon = iconContainer.querySelector(
        '[class*="icon-minus"], .icon-minus'
      );

      if (plusIcon && minusIcon) {
        // Plus/minus toggle
        plusIcon.classList.add("block");
        plusIcon.classList.remove("hidden");
        minusIcon.classList.add("hidden");
        minusIcon.classList.remove("block");
      } else {
        // Single icon rotation
        iconContainer.classList.remove("rotated");
      }
    }

    // Handle border class changes if configured
    this.updateBorderClasses(false);

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent("collapsible:collapsed", {
        bubbles: true,
        detail: { element: this },
      })
    );
  }
}

// Register the web component
customElements.define("collapsible-content", CollapsibleContent);
