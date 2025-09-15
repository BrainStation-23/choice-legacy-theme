if (!customElements.get("price-range")) {
  class PriceRange extends HTMLElement {
    constructor() {
      super();
      this.init();
    }

    init() {
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
      }
      if (this.maxSliderInput) {
        this.maxSliderInput.addEventListener("input", this.handleSliderInput.bind(this));
      }
      
      // Initialize the progress bar
      this.updateProgressBar();
    }

    handleInput(evt) {
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


      updateNumberInputs() {
       
        this.minNumberInput.value =
          this.minSliderInput.value !== this.minNumberInput.min ? this.minSliderInput.value : '';

        this.maxNumberInput.value =
          this.maxSliderInput.value !== this.maxNumberInput.max ? this.maxSliderInput.value : '';
      }


      updateSliderInputs(evt) {
        const minValue = parseInt(this.minNumberInput.value, 10) || parseInt(this.minNumberInput.min, 10);
        const maxValue = parseInt(this.maxNumberInput.value, 10) || parseInt(this.maxNumberInput.max, 10);

        console.log("updateSliderInputs called:", {
          target: evt.target.id,
          minValue: minValue,
          maxValue: maxValue
        });

        if (evt.target === this.minNumberInput) {
          const currentMaxValue = parseInt(this.maxSliderInput.value, 10);
          if (minValue >= currentMaxValue) {
            const correctedMin = Math.max(parseInt(this.minNumberInput.min, 10), currentMaxValue - 1);
            this.minSliderInput.value = correctedMin;
            console.log("Min input corrected to prevent crossing max:", correctedMin);
          } else {
            this.minSliderInput.value = minValue;
          }
        }

        if (evt.target === this.maxNumberInput) {
          const currentMinValue = parseInt(this.minSliderInput.value, 10);
          if (maxValue <= currentMinValue) {
            const correctedMax = Math.min(parseInt(this.maxNumberInput.max, 10), currentMinValue + 1);
            this.maxSliderInput.value = correctedMax;
            console.log("Max input corrected to prevent crossing min:", correctedMax);
          } else {
            this.maxSliderInput.value = maxValue;
          }
        }
        
        // Update progress bar after slider values change
        this.updateProgressBar();
      }

      handleSliderInput(evt) {
        console.log("=== SLIDER INPUT EVENT ===");
        console.log("Target:", evt.target.id, "Value:", evt.target.value);
        
        evt.stopPropagation();
        
        if (evt.target === this.minSliderInput) {
          const value = parseInt(evt.target.value, 10);
          const maxValue = parseInt(this.maxSliderInput.value, 10);
          const minBoundary = parseInt(this.minNumberInput.min, 10);
          
          // Prevent min from being greater than or equal to max
          if (value >= maxValue) {
            const correctedValue = Math.max(minBoundary, maxValue - 1);
            this.minSliderInput.value = correctedValue;
            console.log("Min slider corrected to prevent crossing max:", correctedValue);
          }
          
          const finalValue = parseInt(this.minSliderInput.value, 10);

          this.minNumberInput.value = finalValue !== minBoundary ? finalValue : '';
          console.log("Updated min number input to:", this.minNumberInput.value);
          
        } else if (evt.target === this.maxSliderInput) {
          const value = parseInt(evt.target.value, 10);
          const minValue = parseInt(this.minSliderInput.value, 10);
          const maxBoundary = parseInt(this.maxNumberInput.max, 10);
          
          // Prevent max from being less than or equal to min
          if (value <= minValue) {
            const correctedValue = Math.min(maxBoundary, minValue + 1);
            this.maxSliderInput.value = correctedValue;
            console.log("Max slider corrected to prevent crossing min:", correctedValue);
          }
          
          const finalValue = parseInt(this.maxSliderInput.value, 10);
          
    
          this.maxNumberInput.value = finalValue !== maxBoundary ? finalValue : '';
          console.log("Updated max number input to:", this.maxNumberInput.value);
        }
        
        // Update progress bar after slider input
        this.updateProgressBar();
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
        
        console.log("Progress bar updated:", {
          minVal, maxVal, rangeMin, rangeMax,
          minPercent: minPercent.toFixed(1),
          maxPercent: maxPercent.toFixed(1)
        });
      }
    }

    customElements.define("price-range", PriceRange);
  }
