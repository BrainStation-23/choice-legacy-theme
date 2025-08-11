class SlideshowComponent extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
    this.swiperContainer = null;
    this.prevButton = null;
    this.nextButton = null;
    this.progressBar = null;
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
    this.progressBar = this.querySelector(".swiper-pagination");

    if (!this.swiperContainer) {
      console.error("Swiper container not found");
      return;
    }

    // Get data attributes
    const autoplay = this.dataset.autoplay === "true";
    const autoplayDelay = parseInt(this.dataset.autoplayDelay) || 5000;
    const pauseOnHover = this.dataset.pauseOnHover === "true";
    const showPartialSlides = this.dataset.showPartialSlides === "true";
    const enableCarousel = this.dataset.enableCarousel === "true";
    const showProgressBar = this.dataset.showProgressBar === "true";

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

    // Configure carousel/dragging functionality
    if (enableCarousel) {
      swiperOptions.grabCursor = true;
      swiperOptions.touchRatio = 1;
      swiperOptions.touchAngle = 45;
      swiperOptions.longSwipesRatio = 0.5;
      swiperOptions.longSwipesMs = 300;
      swiperOptions.followFinger = true;
      swiperOptions.allowTouchMove = true;
      swiperOptions.resistance = true;
      swiperOptions.resistanceRatio = 0.85;

      // Enable free mode for smooth dragging
      swiperOptions.freeMode = {
        enabled: true,
        momentum: true,
        momentumRatio: 1,
        momentumVelocityRatio: 1,
        sticky: false,
      };

      // Disable loop when carousel is enabled for better UX
      swiperOptions.loop = false;

      // Set slides per view to auto for carousel - slides will use their natural width
      swiperOptions.slidesPerView = "auto";
      swiperOptions.centeredSlides = false;

      // Ensure slides don't stretch to full width
      swiperOptions.watchSlidesProgress = true;
      swiperOptions.watchSlidesVisibility = true;

      // Override any flex properties that might interfere
      swiperOptions.on = {
        ...swiperOptions.on,
        init: () => {
          this.updateNavigationState();
          this.enforceSlideWidths();
        },
        slideChange: () => {
          this.updateNavigationState();
        },
      };
    } else {
      // Configure slides per view based on partial slides setting (original logic)
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
    }

    // Configure progress bar if enabled
    if (showProgressBar && this.progressBar) {
      swiperOptions.pagination = {
        el: this.progressBar,
        type: "progressbar",
        progressbarOpposite: false,
      };
    }

    // Configure autoplay if enabled (works with all modes: partial slides, carousel, regular)
    if (autoplay) {
      swiperOptions.autoplay = {
        delay: autoplayDelay,
        disableOnInteraction: false,
        pauseOnMouseEnter: pauseOnHover,
        waitForTransition: true,
        reverseDirection: false,
        stopOnLastSlide: enableCarousel ? true : false, // Stop at last slide for carousel mode
      };

      // For carousel mode, we may want to resume autoplay after user interaction
      if (enableCarousel) {
        swiperOptions.autoplay.disableOnInteraction = true;
      }
    }

    // Initialize Swiper
    if (window.Swiper) {
      this.swiper = new Swiper(this.swiperContainer, swiperOptions);
      this.setupAutoplayInteractions();
    } else {
      // Wait for Swiper to load
      this.waitForSwiper().then(() => {
        this.swiper = new Swiper(this.swiperContainer, swiperOptions);
        this.setupAutoplayInteractions();
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

  setupAutoplayInteractions() {
    if (!this.swiper || !this.swiper.autoplay) return;

    const autoplay = this.dataset.autoplay === "true";
    const pauseOnHover = this.dataset.pauseOnHover === "true";
    const enableCarousel = this.dataset.enableCarousel === "true";

    if (!autoplay) return;

    // Set up hover interactions if pause on hover is enabled
    if (pauseOnHover) {
      this.addEventListener("mouseenter", () => {
        if (this.swiper && this.swiper.autoplay) {
          this.swiper.autoplay.pause();
        }
      });

      this.addEventListener("mouseleave", () => {
        if (this.swiper && this.swiper.autoplay) {
          this.swiper.autoplay.resume();
        }
      });
    }

    // For carousel mode, resume autoplay after user stops interacting
    if (enableCarousel) {
      let interactionTimeout;

      const resumeAutoplay = () => {
        clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
          if (
            this.swiper &&
            this.swiper.autoplay &&
            !this.swiper.autoplay.running
          ) {
            this.swiper.autoplay.start();
          }
        }, 2000); // Resume after 2 seconds of no interaction
      };

      // Listen for touch/drag end events
      this.swiperContainer.addEventListener("touchend", resumeAutoplay);
      this.swiperContainer.addEventListener("mouseup", resumeAutoplay);
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

  // New methods for carousel control
  setProgress(progress) {
    if (this.swiper && this.swiper.setProgress) {
      this.swiper.setProgress(progress);
    }
  }

  getProgress() {
    if (this.swiper && this.swiper.progress !== undefined) {
      return this.swiper.progress;
    }
    return 0;
  }

  // Enable/disable touch interactions
  enableTouch() {
    if (this.swiper && this.swiper.allowTouchMove !== undefined) {
      this.swiper.allowTouchMove = true;
    }
  }

  disableTouch() {
    if (this.swiper && this.swiper.allowTouchMove !== undefined) {
      this.swiper.allowTouchMove = false;
    }
  }

  // Force slides to maintain their defined widths in carousel mode
  enforceSlideWidths() {
    const enableCarousel = this.dataset.enableCarousel === "true";
    if (!enableCarousel || !this.swiper) return;

    const slides = this.querySelectorAll(".swiper-slide");
    slides.forEach((slide) => {
      // Force slides to use their content width, not stretch to fill
      slide.style.width = "auto";
      slide.style.flexShrink = "0";

      // If slide has a specific width class (like w-268), ensure it's respected
      const computedStyle = window.getComputedStyle(slide);
      if (computedStyle.width && computedStyle.width !== "auto") {
        slide.style.width = computedStyle.width;
      }
    });
  }
}

// Register the custom element
customElements.define("slideshow-component", SlideshowComponent);
