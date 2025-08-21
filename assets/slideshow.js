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

  // Helper method to get responsive values based on breakpoints
  getResponsiveValue(baseAttribute) {
    const breakpoints = {
      mobile: { max: 768, suffix: "-mobile" },
      tablet: { min: 769, max: 1023, suffix: "-tablet" },
      laptop: { min: 1024, max: 1439, suffix: "-laptop" },
      desktop: { min: 1440, suffix: "-desktop" },
    };

    // Check for device-specific values first
    for (const [device, config] of Object.entries(breakpoints)) {
      const value =
        this.dataset[baseAttribute + config.suffix.replace("-", "")];
      if (value !== undefined) {
        return { [device]: value, ...breakpoints[device] };
      }
    }

    // Fallback to base attribute or default
    const fallbackValue = this.dataset[baseAttribute];
    return fallbackValue;
  }

  // Create Swiper breakpoints configuration
  createBreakpointsConfig() {
    const breakpoints = {};

    // Get responsive values for numberOfItems
    const mobileItems = this.dataset.numberOfItemsMobile;
    const tabletItems = this.dataset.numberOfItemsTablet;
    const laptopItems = this.dataset.numberOfItemsLaptop;
    const desktopItems = this.dataset.numberOfItemsDesktop;

    // Get responsive values for gap
    const mobileGap = this.dataset.gapMobile;
    const tabletGap = this.dataset.gapTablet;
    const laptopGap = this.dataset.gapLaptop;
    const desktopGap = this.dataset.gapDesktop;

    // Default values
    const defaultItems = parseInt(this.dataset.numberOfItems) || 1;
    const defaultGap = parseInt(this.dataset.gap) || 16;

    // Mobile (up to 768px)
    if (mobileItems || mobileGap) {
      breakpoints[0] = {
        slidesPerView: parseInt(mobileItems) || defaultItems,
        spaceBetween: parseInt(mobileGap) || defaultGap,
      };
    }

    // Tablet (769px to 1023px)
    if (tabletItems || tabletGap) {
      breakpoints[769] = {
        slidesPerView: parseInt(tabletItems) || defaultItems,
        spaceBetween: parseInt(tabletGap) || defaultGap,
      };
    }

    // Laptop (1024px to 1439px)
    if (laptopItems || laptopGap) {
      breakpoints[1024] = {
        slidesPerView: parseInt(laptopItems) || defaultItems,
        spaceBetween: parseInt(laptopGap) || defaultGap,
      };
    }

    // Desktop (1440px and above)
    if (desktopItems || desktopGap) {
      breakpoints[1440] = {
        slidesPerView: parseInt(desktopItems) || defaultItems,
        spaceBetween: parseInt(desktopGap) || defaultGap,
      };
    }

    return breakpoints;
  }

  init() {
    this.swiperContainer = this.querySelector(".swiper-container");
    this.prevButton = this.querySelector(".slideshow-nav-button-prev");
    this.nextButton = this.querySelector(".slideshow-nav-button-next");
    this.progressBar = this.querySelector(".swiper-pagination");

    if (!this.swiperContainer) {
      console.error("Swiper container not found");
      return;
    }

    const autoplay = this.dataset.autoplay === "true";
    const autoplayDelay = parseInt(this.dataset.autoplayDelay) || 5000;
    const pauseOnHover = this.dataset.pauseOnHover === "true";
    const enableCarousel = this.dataset.enableCarousel === "true";
    const showPartialSlides = this.dataset.showPartialSlides === "true";
    const showProgressBar = this.dataset.showProgressBar === "true";
    const numberOfItems = parseInt(this.dataset.numberOfItems) || 0;
    const gap = this.dataset.gap ? parseInt(this.dataset.gap) : 16;

    const swiperOptions = {
      loop: true,
      spaceBetween: gap,
      allowTouchMove: enableCarousel,
      navigation: {
        nextEl: this.nextButton,
        prevEl: this.prevButton,
      },
      on: {
        init: () => this.updateNavigationState(),
        slideChange: () => this.updateNavigationState(),
      },
    };

    // Add responsive breakpoints
    const responsiveBreakpoints = this.createBreakpointsConfig();
    if (Object.keys(responsiveBreakpoints).length > 0) {
      swiperOptions.breakpoints = responsiveBreakpoints;
    }

    if (enableCarousel) {
      Object.assign(swiperOptions, {
        grabCursor: true,
        freeMode: {
          enabled: true,
          momentum: true,
          sticky: false,
        },
        loop: false,
        watchSlidesProgress: true,
        watchSlidesVisibility: true,
      });

      if (numberOfItems > 0) {
        swiperOptions.slidesPerView = numberOfItems;
      } else {
        swiperOptions.slidesPerView = "auto";
        swiperOptions.on = {
          ...swiperOptions.on,
          init: () => {
            this.updateNavigationState();
            this.enforceSlideWidths();
          },
        };
      }
    } else if (numberOfItems > 0) {
      swiperOptions.slidesPerView = numberOfItems;
    } else if (showPartialSlides) {
      swiperOptions.allowTouchMove = true;
      swiperOptions.slidesPerView = 1;
      swiperOptions.centeredSlides = false;
      swiperOptions.centerInsufficientSlides = true;

      // Merge with existing breakpoints if any, otherwise create new ones
      if (!swiperOptions.breakpoints) {
        swiperOptions.breakpoints = {};
      }

      // Add the partial slides breakpoint, but don't override existing responsive settings
      if (!swiperOptions.breakpoints[769]) {
        swiperOptions.breakpoints[769] = {
          slidesPerView: 1.2,
          centeredSlides: true,
          spaceBetween: gap,
        };
      } else {
        // If there's already a tablet breakpoint, add the partial slides settings to it
        swiperOptions.breakpoints[769] = {
          ...swiperOptions.breakpoints[769],
          slidesPerView: swiperOptions.breakpoints[769].slidesPerView || 1.2,
          centeredSlides: true,
        };
      }
    } else {
      swiperOptions.slidesPerView = 1;
    }

    if (showProgressBar && this.progressBar) {
      swiperOptions.pagination = {
        el: this.progressBar,
        type: "progressbar",
        progressbarOpposite: false,
      };
    }

    if (autoplay) {
      swiperOptions.autoplay = {
        delay: autoplayDelay,
        disableOnInteraction: false,
        pauseOnMouseEnter: pauseOnHover,
        waitForTransition: true,
        reverseDirection: false,
        stopOnLastSlide: enableCarousel ? true : false,
      };

      if (enableCarousel) {
        swiperOptions.autoplay.disableOnInteraction = true;
      }
    }

    if (window.Swiper) {
      this.swiper = new Swiper(this.swiperContainer, swiperOptions);
      this.setupAutoplayInteractions();
    } else {
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
        }, 2000);
      };

      this.swiperContainer.addEventListener("touchend", resumeAutoplay);
      this.swiperContainer.addEventListener("mouseup", resumeAutoplay);
    }
  }

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

  enforceSlideWidths() {
    const enableCarousel = this.dataset.enableCarousel === "true";
    if (!enableCarousel || !this.swiper) return;

    const slides = this.querySelectorAll(".swiper-slide");
    slides.forEach((slide) => {
      slide.style.width = "auto";
      slide.style.flexShrink = "0";

      const computedStyle = window.getComputedStyle(slide);
      if (computedStyle.width && computedStyle.width !== "auto") {
        slide.style.width = computedStyle.width;
      }
    });
  }
}

customElements.define("slideshow-component", SlideshowComponent);
