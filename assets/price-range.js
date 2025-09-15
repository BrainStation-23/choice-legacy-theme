if (!customElements.get("price-range")) {
  class PriceRange extends HTMLElement {
    constructor() {
      super();
      window.initLazyScript(this, this.init.bind(this));
    }

    init() {
      this.minNumberInput = document.getElementById("price-range-number-min");
      this.maxNumberInput = document.getElementById("price-range-number-max");
      this.minSliderInput = document.getElementById("price-range-slider-min");
      this.maxSliderInput = document.getElementById("price-range-slider-max");
      
      console.log("PriceRange: Initializing", {
        minInput: !!this.minNumberInput,
        maxInput: !!this.maxNumberInput,
        minSlider: !!this.minSliderInput,
        maxSlider: !!this.maxSliderInput
      });
      
      this.minValue = Number(this.minNumberInput.min);
      this.maxValue = Number(this.maxNumberInput.max);
      this.timeout = null;
      this.addEventListener("input", this.handleInput.bind(this));
      
      // Add specific listeners for slider changes
      if (this.minSliderInput) {
        this.minSliderInput.addEventListener("input", this.handleSliderInput.bind(this));
        this.minSliderInput.addEventListener("change", this.handleSliderChange.bind(this));
      }
      if (this.maxSliderInput) {
        this.maxSliderInput.addEventListener("input", this.handleSliderInput.bind(this));
        this.maxSliderInput.addEventListener("change", this.handleSliderChange.bind(this));
      }
    }

    /**
     * Handles 'input' events on the price range component.
     * @param {object} evt - Event object.
     */
    handleInput(evt) {
      if (evt.detail !== undefined) {
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
          this.updateSliderInputs(evt);
          this.updateNumberInputs();
          this.triggerFilterChange(evt);
        }, 500);
      } else {
        this.updateSliderInputs(evt);
        this.updateNumberInputs();
      }
    }

    /**
     * Updates the value of the 'number' type inputs.
     */
    updateNumberInputs() {
      this.minNumberInput.value =
        this.minSliderInput.value !== this.minNumberInput.min
          ? this.minSliderInput.value
          : '';

      this.maxNumberInput.value =
        this.maxSliderInput.value !== this.maxNumberInput.max
          ? this.maxSliderInput.value
          : '';
    }

    /**
     * Updates the value of the 'range' type inputs.
     * @param {object} evt - Event object.
     */
    updateSliderInputs(evt) {
      const minValue = parseInt(this.minNumberInput.value, 10);
      const maxValue = parseInt(this.maxNumberInput.value, 10);

      if (minValue > maxValue - 10) {
        if (evt.target === this.minNumberInput) {
          this.maxSliderInput.value = minValue + 10;

          if (maxValue === this.maxValue) {
            this.minSliderInput.value = this.maxValue - 10;
          }
        } else {
          this.minSliderInput.value = maxValue - 10;
        }
      }

      if (maxValue < minValue + 10) {
        if (evt.target === this.maxNumberInput) {
          this.minSliderInput.value = maxValue - 10;

          if (minValue === this.minValue) {
            this.maxSliderInput.value = 10;
          }
        } else {
          this.maxSliderInput.value = minValue + 10;
        }
      }

      if (evt.target === this.minNumberInput) {
        this.minSliderInput.value = minValue || Number(this.minNumberInput.min);
      }

      if (evt.target === this.maxNumberInput) {
        this.maxSliderInput.value = maxValue || Number(this.maxNumberInput.max);
      }
    }

    /**
     * Handles 'input' events on range sliders
     * @param {object} evt - Event object.
     */
    handleSliderInput(evt) {
      // Update corresponding number inputs when sliders move
      if (evt.target === this.minSliderInput) {
        this.minNumberInput.value = evt.target.value !== this.minNumberInput.min ? evt.target.value : '';
      } else if (evt.target === this.maxSliderInput) {
        this.maxNumberInput.value = evt.target.value !== this.maxNumberInput.max ? evt.target.value : '';
      }
    }

    /**
     * Handles 'change' events on range sliders (when user finishes dragging)
     * @param {object} evt - Event object.
     */
    handleSliderChange(evt) {
      // Trigger filter change when user finishes moving slider
      this.triggerFilterChange(evt);
    }

    /**
     * Triggers a filter change event to notify the facet filters system
     * @param {object} evt - Event object.
     */
    triggerFilterChange(evt) {
      console.log("PriceRange: triggerFilterChange called", {
        target: evt.target.id,
        minValue: this.minNumberInput.value,
        maxValue: this.maxNumberInput.value
      });

      // Find the facet filters form
      const facetForm = document.getElementById("facets");
      if (!facetForm) {
        console.warn("Facet form not found");
        return;
      }

      // Create a change event on the number input that was modified
      // This will be picked up by the facet-filters event listener
      const changeEvent = new Event("change", {
        bubbles: true,
        cancelable: true
      });

      // Trigger the change event on the appropriate input
      if (evt.target === this.minSliderInput || evt.target === this.minNumberInput) {
        console.log("PriceRange: Dispatching change event on min input", this.minNumberInput.value);
        this.minNumberInput.dispatchEvent(changeEvent);
      } else if (evt.target === this.maxSliderInput || evt.target === this.maxNumberInput) {
        console.log("PriceRange: Dispatching change event on max input", this.maxNumberInput.value);
        this.maxNumberInput.dispatchEvent(changeEvent);
      }
    }
  }

  customElements.define("price-range", PriceRange);
}
