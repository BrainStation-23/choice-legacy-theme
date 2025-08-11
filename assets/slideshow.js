class SlideshowComponent extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
    this.swiperContainer = null;
    this.prevButton = null;
    this.nextButton = null;
  }

  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
    }
  }

  init() {
    // Find swiper container and navigation buttons
    this.swiperContainer = this.querySelector(".swiper-container");
    this.prevButton = this.querySelector(".slideshow-nav-button-prev");
    this.nextButton = this.querySelector(".slideshow-nav-button-next");

    if (!this.swiperContainer) {
      console.error("Swiper container not found");
      return;
    }

    // Get data attributes
    const autoplay = this.dataset.autoplay === "true";
    const autoplayDelay = parseInt(this.dataset.autoplayDelay) || 5000;
    const pauseOnHover = this.dataset.pauseOnHover === "true";
    const showPartialSlides = this.dataset.showPartialSlides === "true";

    // Get gap - prioritize data attribute, fallback to 0
    const gap = this.dataset.gap ? parseInt(this.dataset.gap) : 0;

    // Configure Swiper options
    const swiperOptions = {
      loop: true,
      centeredSlides: false,
      spaceBetween: gap,
      navigation: {
        nextEl: this.nextButton,
        prevEl: this.prevButton,
      },
      on: {
        init: () => {
          this.updateNavigationState();
        },
        slideChange: () => {
          this.updateNavigationState();
        },
      },
    };

    // Configure slides per view based on partial slides setting
    if (showPartialSlides) {
      // Default mobile settings (0-768px)
      swiperOptions.slidesPerView = 1;
      swiperOptions.centeredSlides = false;
      swiperOptions.centerInsufficientSlides = true;

      // Desktop breakpoint - partial slides on desktop with equal distribution
      swiperOptions.breakpoints = {
        769: {
          slidesPerView: 1.2, // Desktop (769px+): shows 0.2 of prev + 1 full + 0.2 of next
          centeredSlides: true, // Center the active slide to show equal partial slides
          spaceBetween: gap,
        },
      };
    } else {
      swiperOptions.slidesPerView = 1;
    }

    // Configure autoplay if enabled
    if (autoplay) {
      swiperOptions.autoplay = {
        delay: autoplayDelay,
        disableOnInteraction: false,
        pauseOnMouseEnter: pauseOnHover,
      };
    }

    // Initialize Swiper
    if (window.Swiper) {
      this.swiper = new Swiper(this.swiperContainer, swiperOptions);
    } else {
      // Wait for Swiper to load
      this.waitForSwiper().then(() => {
        this.swiper = new Swiper(this.swiperContainer, swiperOptions);
      });
    }
  }

  waitForSwiper() {
    return new Promise((resolve) => {
      const checkSwiper = () => {
        if (window.Swiper) {
          resolve();
        } else {
          setTimeout(checkSwiper, 100);
        }
      };
      checkSwiper();
    });
  }

  updateNavigationState() {
    if (!this.swiper) return;

    // Update navigation button states
    if (this.prevButton) {
      this.prevButton.disabled =
        this.swiper.isBeginning && !this.swiper.params.loop;
      this.prevButton.setAttribute("aria-disabled", this.prevButton.disabled);
    }

    if (this.nextButton) {
      this.nextButton.disabled = this.swiper.isEnd && !this.swiper.params.loop;
      this.nextButton.setAttribute("aria-disabled", this.nextButton.disabled);
    }
  }

  // Public methods for external control
  slideNext() {
    if (this.swiper) {
      this.swiper.slideNext();
    }
  }

  slidePrev() {
    if (this.swiper) {
      this.swiper.slidePrev();
    }
  }

  slideTo(index) {
    if (this.swiper) {
      this.swiper.slideTo(index);
    }
  }

  startAutoplay() {
    if (this.swiper && this.swiper.autoplay) {
      this.swiper.autoplay.start();
    }
  }

  stopAutoplay() {
    if (this.swiper && this.swiper.autoplay) {
      this.swiper.autoplay.stop();
    }
  }
}

// Register the custom element
customElements.define("slideshow-component", SlideshowComponent);
