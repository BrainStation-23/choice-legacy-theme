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

    if (enableCarousel) {
      Object.assign(swiperOptions, {
        grabCursor: true,
        freeMode: {
          enabled: true,
          momentum: true,
          momentumRatio: 1,
          momentumVelocityRatio: 1,
          sticky: false,
        },
        loop: false,
        slidesPerView: "auto",
        centeredSlides: false,
        watchSlidesProgress: true,
        watchSlidesVisibility: true,
      });

      swiperOptions.on = {
        ...swiperOptions.on,
        init: () => {
          this.updateNavigationState();
          this.enforceSlideWidths();
        },
      };
    } else if (numberOfItems > 0) {
      swiperOptions.slidesPerView = numberOfItems;
    } else if (showPartialSlides) {
      swiperOptions.slidesPerView = 1;
      swiperOptions.centeredSlides = false;
      swiperOptions.centerInsufficientSlides = true;
      swiperOptions.breakpoints = {
        769: {
          slidesPerView: 1.2,
          centeredSlides: true,
          spaceBetween: gap,
        },
      };
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
