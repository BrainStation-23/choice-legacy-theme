if (!customElements.get("price-range")) {
  class PriceRange extends HTMLElement {
    constructor() {
      super();
      this.init();
    }

    init() {
      // Find elements within this component (works with multiple instances)
      this.minNumberInput = this.querySelector('[id*="price-range-number-min"]');
      this.maxNumberInput = this.querySelector('[id*="price-range-number-max"]');
      this.minSliderInput = this.querySelector('[id*="price-range-slider-min"]');
      this.maxSliderInput = this.querySelector('[id*="price-range-slider-max"]');
      
      
      // Safety check
      if (!this.minNumberInput || !this.maxNumberInput) {
        console.error("Price range inputs not found");
        return;
      }
      
      this.minValue = Number(this.minNumberInput.min);
      this.maxValue = Number(this.maxNumberInput.max);
      this.timeout = null;
      this.addEventListener("input", this.handleInput.bind(this));
      
      // Add event listeners for slider changes
      if (this.minSliderInput) {
        this.minSliderInput.addEventListener("input", this.handleSliderInput.bind(this));
      }
      if (this.maxSliderInput) {
        this.maxSliderInput.addEventListener("input", this.handleSliderInput.bind(this));
      }
      
      // Initialize the progress bar
      this.updateProgressBar();
    }

    handleInput(evt) {
      if (evt.target === this.minSliderInput || evt.target === this.maxSliderInput) {
        return;
      }
      
      
      // Show spinner when price input changes
      this.showSpinner();
      
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
        this.triggerFilterChange(evt);
      }
    }


      updateNumberInputs() {
       
        this.minNumberInput.value =
          this.minSliderInput.value !== this.minNumberInput.min ? this.minSliderInput.value : '';

        this.maxNumberInput.value =
          this.maxSliderInput.value !== this.maxNumberInput.max ? this.maxSliderInput.value : '';
      }


      updateSliderInputs(evt) {
        const minValue = parseInt(this.minNumberInput.value, 10) || parseInt(this.minNumberInput.min, 10);
        const maxValue = parseInt(this.maxNumberInput.value, 10) || parseInt(this.maxNumberInput.max, 10);


        if (evt.target === this.minNumberInput) {
          const currentMaxValue = parseInt(this.maxSliderInput.value, 10);
          if (minValue >= currentMaxValue) {
            const correctedMin = Math.max(parseInt(this.minNumberInput.min, 10), currentMaxValue - 1);
            this.minSliderInput.value = correctedMin;
          } else {
            this.minSliderInput.value = minValue;
          }
        }

        if (evt.target === this.maxNumberInput) {
          const currentMinValue = parseInt(this.minSliderInput.value, 10);
          if (maxValue <= currentMinValue) {
            const correctedMax = Math.min(parseInt(this.maxNumberInput.max, 10), currentMinValue + 1);
            this.maxSliderInput.value = correctedMax;
          } else {
            this.maxSliderInput.value = maxValue;
          }
        }
        
        // Update progress bar after slider values change
        this.updateProgressBar();
      }

      handleSliderInput(evt) {
        evt.stopPropagation();
        
        // Show spinner when slider changes
        this.showSpinner();
        
        if (evt.target === this.minSliderInput) {
          const value = parseInt(evt.target.value, 10);
          const maxValue = parseInt(this.maxSliderInput.value, 10);
          const minBoundary = parseInt(this.minNumberInput.min, 10);
          
          // Prevent min from being greater than or equal to max
          if (value >= maxValue) {
            const correctedValue = Math.max(minBoundary, maxValue - 1);
            this.minSliderInput.value = correctedValue;
          }
          
          const finalValue = parseInt(this.minSliderInput.value, 10);

          this.minNumberInput.value = finalValue !== minBoundary ? finalValue : '';
          
        } else if (evt.target === this.maxSliderInput) {
          const value = parseInt(evt.target.value, 10);
          const minValue = parseInt(this.minSliderInput.value, 10);
          const maxBoundary = parseInt(this.maxNumberInput.max, 10);
          
          // Prevent max from being less than or equal to min
          if (value <= minValue) {
            const correctedValue = Math.min(maxBoundary, minValue + 1);
            this.maxSliderInput.value = correctedValue;
          }
          
          const finalValue = parseInt(this.maxSliderInput.value, 10);
          
    
          this.maxNumberInput.value = finalValue !== maxBoundary ? finalValue : '';
        }
        
        // Update progress bar after slider input
        this.updateProgressBar();
        
        // Trigger filter change after slider input
        this.triggerFilterChange(evt);
      }
      
      showSpinner() {
        const spinner = document.getElementById("filtering-spinner");
        if (spinner) {
          spinner.classList.remove("hidden");
        }
      }
      
      triggerFilterChange(evt) {
        // Create a change event to trigger facet-filters processing
        const changeEvent = new Event('change', { bubbles: true });
        evt.target.dispatchEvent(changeEvent);
      }
      
      updateProgressBar() {
        const slidersContainer = this.querySelector(".price-range__sliders");
        if (!slidersContainer) return;
        
        const minVal = parseInt(this.minSliderInput.value, 10);
        const maxVal = parseInt(this.maxSliderInput.value, 10);
        const rangeMin = parseInt(this.minSliderInput.min, 10);
        const rangeMax = parseInt(this.minSliderInput.max, 10);
        
        const minPercent = ((minVal - rangeMin) / (rangeMax - rangeMin)) * 100;
        const maxPercent = ((maxVal - rangeMin) / (rangeMax - rangeMin)) * 100;
        
        slidersContainer.style.setProperty("--range-min", `${minPercent}%`);
        slidersContainer.style.setProperty("--range-max", `${100 - maxPercent}%`);

      }
    }

    customElements.define("price-range", PriceRange);
  }
