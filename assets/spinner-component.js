class SpinnerComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const template = document.createElement("template");
    template.innerHTML = `
      <style>
        :host {
          display: inline-block;
          line-height: 0;
        }
        svg {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
      <svg id="spinner-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
      </svg>
    `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static get observedAttributes() {
    return ["size", "color"];
  }

  connectedCallback() {
    this._applyAttributes();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._applyAttributes();
  }

  _applyAttributes() {
    const svg = this.shadowRoot.getElementById("spinner-svg");
    if (!svg) return;

    const sizeAttr = this.getAttribute("size") || "medium";
    let pixelSize = "24"; // Default to medium
    if (sizeAttr === "small") pixelSize = "16";
    if (sizeAttr === "large") pixelSize = "32";

    svg.setAttribute("width", pixelSize);
    svg.setAttribute("height", pixelSize);

    const colorAttr = this.getAttribute("color");
    let colorValue = "";
    if (colorAttr === "primary")
      colorValue = "rgba(var(--color-primary-brand))";
    if (colorAttr === "white") colorValue = "#ffffff";
    if (colorAttr === "dark") colorValue = "#333333";

    this.style.color = colorValue;
  }
}

customElements.define("spinner-component", SpinnerComponent);
