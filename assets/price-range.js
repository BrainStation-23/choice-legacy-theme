if (!customElements.get("price-range")) {
  class PriceRange extends HTMLElement {
    constructor() {
      super();
      this.init();
    }

    init() {
      console.log("PriceRange init() called");
      this.minNumberInput = document.getElementById("price-range-number-min");
      this.maxNumberInput = document.getElementById("price-range-number-max");
      this.minSliderInput = document.getElementById("price-range-slider-min");
      this.maxSliderInput = document.getElementById("price-range-slider-max");
      
      console.log("Elements found:", {
        minNumberInput: !!this.minNumberInput,
        maxNumberInput: !!this.maxNumberInput,
        minSliderInput: !!this.minSliderInput,
        maxSliderInput: !!this.maxSliderInput
      });
      
      this.minValue = Number(this.minNumberInput.min);
      this.maxValue = Number(this.maxNumberInput.max);
      this.timeout = null;
      this.addEventListener("input", this.handleInput.bind(this));
      
      // Add event listeners for slider changes
      if (this.minSliderInput) {
        this.minSliderInput.addEventListener("input", this.handleSliderInput.bind(this));
        console.log("Added input listener to min slider");
      }
      if (this.maxSliderInput) {
        this.maxSliderInput.addEventListener("input", this.handleSliderInput.bind(this));
        console.log("Added input listener to max slider");
      }
    }

    /**
     * Handles 'input' events on the price range component.
     * @param {object} evt - Event object.
     */
    handleInput(evt) {
      // Skip slider input events - they are handled separately
      if (evt.target === this.minSliderInput || evt.target === this.maxSliderInput) {
        console.log("Skipping slider event in handleInput");
        return;
      }
      
      console.log("handleInput for:", evt.target.id);
      
      if (evt.detail !== undefined) {
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
          this.updateSliderInputs(evt);
          this.updateNumberInputs();
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
          this.minSliderInput.value !== this.minNumberInput.min ? this.minSliderInput.value : '';

        this.maxNumberInput.value =
          this.maxSliderInput.value !== this.maxNumberInput.max ? this.maxSliderInput.value : '';
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
        console.log("=== SLIDER INPUT EVENT ===");
        console.log("Target:", evt.target.id, "Value:", evt.target.value);
        
        // Stop the event from bubbling to prevent conflicts
        evt.stopPropagation();
        
        // Update the corresponding number input immediately
        if (evt.target === this.minSliderInput) {
          const value = parseInt(evt.target.value, 10);
          const minBoundary = parseInt(this.minNumberInput.min, 10);
          
          console.log("Min slider moved:", {
            value: value,
            minBoundary: minBoundary,
            isAtBoundary: value === minBoundary
          });
          
          this.minNumberInput.value = value !== minBoundary ? value : '';
          console.log("Updated min number input to:", this.minNumberInput.value);
          
        } else if (evt.target === this.maxSliderInput) {
          const value = parseInt(evt.target.value, 10);
          const maxBoundary = parseInt(this.maxNumberInput.max, 10);
          
          console.log("Max slider moved:", {
            value: value,
            maxBoundary: maxBoundary,
            isAtBoundary: value === maxBoundary
          });
          
          this.maxNumberInput.value = value !== maxBoundary ? value : '';
          console.log("Updated max number input to:", this.maxNumberInput.value);
        }
        
        console.log("=== END SLIDER INPUT ===");
      }
    }

    customElements.define("price-range", PriceRange);
  }
