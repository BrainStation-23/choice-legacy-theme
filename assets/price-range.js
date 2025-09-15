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
      this.activeSlider = null;
      this.addEventListener("input", this.handleInput.bind(this));
      
      // Add specific listeners for slider changes
      if (this.minSliderInput) {
        this.minSliderInput.addEventListener("input", this.handleSliderInput.bind(this));
        this.minSliderInput.addEventListener("change", this.handleSliderChange.bind(this));
        this.minSliderInput.addEventListener("mousedown", this.handleSliderMouseDown.bind(this));
        this.minSliderInput.addEventListener("mouseup", this.handleSliderMouseUp.bind(this));
      }
      if (this.maxSliderInput) {
        this.maxSliderInput.addEventListener("input", this.handleSliderInput.bind(this));
        this.maxSliderInput.addEventListener("change", this.handleSliderChange.bind(this));
        this.maxSliderInput.addEventListener("mousedown", this.handleSliderMouseDown.bind(this));
        this.maxSliderInput.addEventListener("mouseup", this.handleSliderMouseUp.bind(this));
      }

      // Initialize the progress bar
      this.updateProgressBar();
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
      
      // Update the visual progress bar after slider updates
      this.updateProgressBar();
    }

    /**
     * Handles mousedown events on sliders to determine which one should be active
     * @param {object} evt - Event object.
     */
    handleSliderMouseDown(evt) {
      const rect = evt.target.getBoundingClientRect();
      const clickX = evt.clientX - rect.left;
      const sliderWidth = rect.width;
      const clickPercent = clickX / sliderWidth;
      
      const minVal = parseInt(this.minSliderInput.value, 10);
      const maxVal = parseInt(this.maxSliderInput.value, 10);
      const rangeMin = parseInt(this.minSliderInput.min, 10);
      const rangeMax = parseInt(this.minSliderInput.max, 10);
      
      // Calculate positions of both handles as percentages
      const minPercent = (minVal - rangeMin) / (rangeMax - rangeMin);
      const maxPercent = (maxVal - rangeMin) / (rangeMax - rangeMin);
      
      // Determine which handle is closer to the click position
      const distanceToMin = Math.abs(clickPercent - minPercent);
      const distanceToMax = Math.abs(clickPercent - maxPercent);
      
      console.log("Slider mousedown analysis:", {
        clickPercent: clickPercent.toFixed(3),
        minPercent: minPercent.toFixed(3),
        maxPercent: maxPercent.toFixed(3),
        distanceToMin: distanceToMin.toFixed(3),
        distanceToMax: distanceToMax.toFixed(3),
        targetId: evt.target.id
      });
      
      // Bring the closer slider to front and set it as active
      if (distanceToMin < distanceToMax) {
        // Min slider is closer, make it active
        this.minSliderInput.style.zIndex = '5';
        this.maxSliderInput.style.zIndex = '4';
        this.activeSlider = this.minSliderInput;
        console.log("Min slider activated");
      } else {
        // Max slider is closer, make it active
        this.maxSliderInput.style.zIndex = '5';
        this.minSliderInput.style.zIndex = '4';
        this.activeSlider = this.maxSliderInput;
        console.log("Max slider activated");
      }
    }

    /**
     * Handles mouseup events on sliders to clear active slider
     * @param {object} evt - Event object.
     */
    handleSliderMouseUp(evt) {
      console.log("Slider mouseup, clearing active slider");
      this.activeSlider = null;
    }

    /**
     * Handles 'input' events on range sliders
     * @param {object} evt - Event object.
     */
    handleSliderInput(evt) {
      // Use the active slider instead of the event target
      const actualSlider = this.activeSlider || evt.target;
      
      const minVal = parseInt(this.minSliderInput.value, 10);
      const maxVal = parseInt(this.maxSliderInput.value, 10);
      
      console.log("Slider input:", {
        eventTarget: evt.target.id,
        activeSlider: this.activeSlider?.id || 'none',
        actualSlider: actualSlider.id,
        minVal,
        maxVal
      });
      
      // Update the active slider's value based on the event
      if (actualSlider === this.minSliderInput) {
        // Update min slider
        const newValue = parseInt(evt.target.value, 10);
        if (newValue >= maxVal) {
          this.minSliderInput.value = maxVal - 1;
        } else {
          this.minSliderInput.value = newValue;
        }
        // Update the min number input
        const finalMinValue = parseInt(this.minSliderInput.value, 10);
        this.minNumberInput.value = finalMinValue !== parseInt(this.minNumberInput.min, 10) ? finalMinValue : '';
      } else if (actualSlider === this.maxSliderInput) {
        // Update max slider
        const newValue = parseInt(evt.target.value, 10);
        if (newValue <= minVal) {
          this.maxSliderInput.value = minVal + 1;
        } else {
          this.maxSliderInput.value = newValue;
        }
        // Update the max number input
        const finalMaxValue = parseInt(this.maxSliderInput.value, 10);
        this.maxNumberInput.value = finalMaxValue !== parseInt(this.maxNumberInput.max, 10) ? finalMaxValue : '';
      }
      
      // Update the visual progress bar
      this.updateProgressBar();
    }

    /**
     * Updates the visual progress bar between the slider handles
     */
    updateProgressBar() {
      const slidersContainer = this.querySelector('.price-range__sliders');
      if (!slidersContainer) return;

      const minVal = parseInt(this.minSliderInput.value, 10);
      const maxVal = parseInt(this.maxSliderInput.value, 10);
      const rangeMin = parseInt(this.minSliderInput.min, 10);
      const rangeMax = parseInt(this.minSliderInput.max, 10);

      // Calculate percentages
      const minPercent = ((minVal - rangeMin) / (rangeMax - rangeMin)) * 100;
      const maxPercent = ((maxVal - rangeMin) / (rangeMax - rangeMin)) * 100;

      // Update CSS custom properties for the progress bar
      slidersContainer.style.setProperty('--range-min', `${minPercent}%`);
      slidersContainer.style.setProperty('--range-max', `${100 - maxPercent}%`);
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
