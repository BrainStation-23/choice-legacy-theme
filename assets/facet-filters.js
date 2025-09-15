/* global SideDrawer */

if (!customElements.get("facet-filters")) {
  class FacetFilters extends HTMLElement {
    constructor() {
      super();
      this.init = this.init.bind(this);
      this.handleFilterChange = this.handleFilterChange.bind(this);
      this.handleFiltersClick = this.handleFiltersClick.bind(this);
      this.handleActiveFiltersClick = this.handleActiveFiltersClick.bind(this);
      this.handleHistoryChange = this.handleHistoryChange.bind(this);
      this.handleBreakpointChange = this.handleBreakpointChange.bind(this);
    }

    connectedCallback() {
      this.init();
    }

    disconnectedCallback() {
      window.removeEventListener("popstate", this.historyChangeHandler);

      if (this.breakpointChangeHandler) {
        window.removeEventListener("on:breakpoint-change", this.breakpointChangeHandler);
      }
    }

    init() {
      this.filteringEnabled = this.dataset.filtering === "true";
      this.sortingEnabled = this.dataset.sorting === "true";
      this.form = document.getElementById("facets");
      this.results = document.getElementById("filter-results");
      this.expanded = [];
      this.filterChangeTimeout = null;

      console.log("FacetFilters init:", {
        filteringEnabled: this.filteringEnabled,
        sortingEnabled: this.sortingEnabled,
        form: this.form,
        results: this.results,
      });

      this.handleBreakpointChange();
      this.addElements();
      this.addListeners();

      this.historyChangeHandler = this.handleHistoryChange;
      window.addEventListener("popstate", this.historyChangeHandler);
    }

    addElements() {
      if (this.filteringEnabled) {
        this.filters = this.querySelector(".facets__filters");
        this.activeFilters = this.querySelector(".facets__active-filters");
        this.activeFiltersList = this.querySelector(".active-filters");
        this.activeFiltersHeader = this.querySelector(".active-filters-header");
        this.footer = this.querySelector(".facets__footer");
      }

      if (this.sortingEnabled) {
        this.mobileSortByOptions = this.querySelectorAll(".js-drawer-sort-by");
        this.desktopSortBy = document.querySelector(".products-toolbar__sort");
      }
    }

    addListeners() {
      if (this.filteringEnabled && this.filters) {
        this.filters.addEventListener("click", this.handleFiltersClick);
        this.filters.addEventListener("input", this.handleFilterChange);
        this.filters.addEventListener("change", this.handleFilterChange);

        // Add specific listeners for checkboxes
        const checkboxes = this.filters.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
          checkbox.addEventListener("change", (evt) => {
            console.log("Checkbox changed:", evt.target.name, evt.target.checked);
            // Show spinner immediately for checkbox changes
            this.showSpinner();
            this.processFilterChange(evt);
          });
        });
      }

      if (this.activeFilters) {
        this.activeFilters.addEventListener("click", this.handleActiveFiltersClick);
      }

      if (this.sortingEnabled && this.desktopSortBy) {
        this.desktopSortBy.addEventListener("change", this.handleFilterChange);
      }

      // Handle breakpoint changes if theme object exists
      if (typeof theme !== "undefined" && theme.mediaMatches) {
        this.breakpointChangeHandler = this.handleBreakpointChange;
        window.addEventListener("on:breakpoint-change", this.breakpointChangeHandler);
      }
    }

    /**
     * Handles viewport breakpoint changes.
     */
    handleBreakpointChange() {
      if (typeof theme !== "undefined" && theme.mediaMatches && theme.mediaMatches.lg) {
        this.setAttribute("open", "");
        this.setAttribute("aria-hidden", "false");
        this.removeAttribute("aria-modal");
        this.removeAttribute("role");
      } else {
        this.close();
        this.setAttribute("role", "dialog");
        this.setAttribute("aria-modal", "true");
        this.setAttribute("aria-hidden", "true");
        this.hidden = false;
      }
    }

    close() {
      this.removeAttribute("open");
    }

    /**
     * Handles 'input' and 'change' events on the filters.
     * @param {Event} evt - Event object.
     */
    handleFilterChange(evt) {
      console.log("Filter change event:", evt.type, evt.target);

      // Skip checkbox events as they're handled by specific listeners
      if (evt.target.type === "checkbox") {
        console.log("Skipping checkbox - handled by specific listener");
        return;
      }

      // Show appropriate spinner immediately for any filter interaction
      this.showSpinner();

      // Handle price range changes with delay when it's a change event
      if (evt.target.id?.includes("price-range") && evt.type === "change") {
        console.log("Processing price range change with delay");
        // Continue with delay logic below
      } else if (evt.type === "change" && !evt.target.id?.includes("sort-by") && !evt.target.id?.includes("price-range")) {
        // Hide spinner if we're not processing this event type (but keep it for price range)
        this.hideSpinner();
        return;
      }

      // Don't reload when typing a price
      if (evt.target.id?.includes("price-range") && evt.constructor.name === "InputEvent") return;

      const timeoutDelay = 500;

      clearTimeout(this.filterChangeTimeout);

      this.filterChangeTimeout = setTimeout(() => {
        this.processFilterChange(evt);
      }, timeoutDelay);
    }

    /**
     * Process the actual filter change
     * @param {Event} evt - Event object.
     */
    processFilterChange(evt) {
      if (!this.form) {
        console.error("Form not found");
        return;
      }

      const formData = new FormData(this.form);
      const searchParams = new URLSearchParams(formData);
      const emptyParams = [];

      console.log("Form data:", Array.from(formData.entries()));

      if (this.sortingEnabled) {
        let currentSortBy = searchParams.get("sort_by");

        // Keep the mobile facets form sync'd with the desktop sort by dropdown
        if (evt.target.tagName === "CUSTOM-SELECT") {
          this.mobileSortByOptions.forEach((option) => {
            option.checked = option.value === evt.detail.selectedValue;
            currentSortBy = evt.detail.selectedValue;
          });
        }

        // Set the 'sort_by' parameter.
        if (currentSortBy) {
          searchParams.set("sort_by", currentSortBy);
        }
      }

      // Remove pagination parameters when applying filters (should reset to page 1)
      searchParams.delete("page");
      searchParams.delete("phcursor");

      // Get empty parameters.
      searchParams.forEach((value, key) => {
        if (!value) emptyParams.push(key);
      });

      // Remove empty parameters.
      emptyParams.forEach((key) => {
        searchParams.delete(key);
      });

      console.log("Final search params:", searchParams.toString());
      this.applyFilters(searchParams.toString(), evt);
    }

    /**
     * Handles 'click' events on the filters.
     * @param {Event} evt - Event object.
     */
    handleFiltersClick(evt) {
      const { target } = evt;

      // Filter 'clear' button clicked.
      if (target.matches(".js-clear-filter")) {
        evt.preventDefault();

        // Show spinner when clearing filters
        this.showSpinner();

        this.applyFilters(new URL(evt.target.href).searchParams.toString(), evt);
      }

      // Filter 'show more' button clicked.
      if (target.matches(".js-show-more")) {
        const filter = target.closest(".filter");
        target.remove();

        filter.querySelectorAll("li").forEach((el) => {
          el.classList.remove("js-hidden");
        });

        if (!this.expanded.includes(filter.id)) {
          this.expanded.push(filter.id);
        }
      }
    }

    /**
     * Handles 'click' events on the active filters.
     * @param {Event} evt - Event object.
     */
    handleActiveFiltersClick(evt) {
      if (evt.target.tagName !== "A") return;
      evt.preventDefault();

      // Show spinner when removing active filters
      this.showSpinner();

      this.applyFilters(new URL(evt.target.href).searchParams.toString(), evt);
    }

    /**
     * Handles history changes (e.g. back button clicked).
     * @param {Event} evt - Event object.
     */
    handleHistoryChange(evt) {
      if (evt.state !== null) {
        let searchParams = "";

        if (evt.state && evt.state.searchParams) {
          ({ searchParams } = evt.state);
        }

        this.applyFilters(searchParams, null, false);
      }
    }

    /**
     * Fetches the filtered/sorted page data and updates the current page.
     * @param {string} searchParams - Filter/sort search parameters.
     * @param {Event} evt - Event object.
     * @param {boolean} [updateUrl=true] - Update url with the selected options.
     */
    async applyFilters(searchParams, evt, updateUrl = true) {
      console.log("Applying filters with params:", searchParams);

      try {
        // Preserve the current element focus
        const activeElementId = document.activeElement.id;

        // Disable infinite scrolling.
        const customPagination = document.querySelector("custom-pagination");
        if (customPagination) customPagination.dataset.pauseInfiniteScroll = "true";

        // Set loading state.
        if (this.results) {
          this.results.classList.add("is-loading");
        }

        // Disable "Show X results" button until submission is complete.
        const closeBtn = this.querySelector(".js-close-drawer-mob");
        if (closeBtn) {
          closeBtn.setAttribute("aria-disabled", "true");
          closeBtn.classList.add("is-loading");
        }

        // Use Section Rendering API for the request, if possible.
        let fetchUrl = `${window.location.pathname}?${searchParams}`;
        if (this.form.dataset.filterSectionId) {
          fetchUrl += `&section_id=${this.form.dataset.filterSectionId}`;
        }

        console.log("Fetching URL:", fetchUrl);

        // Cancel current fetch request.
        if (this.applyFiltersFetchAbortController) {
          this.applyFiltersFetchAbortController.abort("Request changed");
        }
        this.applyFiltersFetchAbortController = new AbortController();

        // Fetch filtered products markup.
        const response = await fetch(fetchUrl, {
          method: "GET",
          signal: this.applyFiltersFetchAbortController.signal,
        });

        if (response.ok) {
          const responseText = await response.text();
          console.log("Response received, length:", responseText.length);

          const tmpl = document.createElement("template");
          tmpl.innerHTML = responseText;

          // Restore UI state.
          this.form.querySelectorAll("details-disclosure > details").forEach((existingFilter) => {
            const target = tmpl.content.getElementById(existingFilter.id);
            if (target) {
              target.open = existingFilter.open;
            }
          });

          tmpl.content.querySelectorAll("#facets details-disclosure > details").forEach((newFilter) => {
            if (this.expanded.includes(newFilter.id)) {
              const hiddenElements = newFilter.querySelectorAll(".js-hidden");
              hiddenElements.forEach((listItem) => {
                listItem.classList.remove("js-hidden");
              });
              newFilter.querySelector(".filter__more")?.remove();
            }
          });

          // Update the filters.
          const newFacetsContent = tmpl.content.getElementById("facets");
          if (newFacetsContent) {
            this.form.innerHTML = newFacetsContent.innerHTML;
          }

          // Update the label of the mobile filter button
          const newCloseBtn = tmpl.content.querySelector(".js-close-drawer-mob");
          if (closeBtn && newCloseBtn) {
            closeBtn.innerText = newCloseBtn.innerText;
          }

          // Preserve the CSS class of the results
          const currentResultsContainer = this.results.querySelector('[role="list"]');
          this.currentResultsClass = currentResultsContainer
            ? currentResultsContainer.getAttribute("class")
            : this.currentResultsClass;

          // Update the results.
          const newResults = tmpl.content.getElementById("filter-results");
          if (newResults && this.results) {
            this.results.innerHTML = newResults.innerHTML;
          }

          // Update pagination if it exists
          const currentPaginationContainer = document.querySelector(".pagination-container");
          const newPaginationContainer = tmpl.content.querySelector(".pagination-container");
          if (currentPaginationContainer && newPaginationContainer) {
            currentPaginationContainer.innerHTML = newPaginationContainer.innerHTML;
          } else if (currentPaginationContainer && !newPaginationContainer) {
            // Hide pagination if no pages
            currentPaginationContainer.style.display = "none";
          }

          // Set the CSS class of the results to what it was
          const newResultsContainer = this.results.querySelector('[role="list"]');
          if (newResultsContainer && this.currentResultsClass) {
            newResultsContainer.setAttribute("class", this.currentResultsClass);
          }

          // Reinitialize re-rendered components.
          this.addElements();
          this.addListeners();

          // Reinitialize any custom pagination
          if (customPagination && customPagination.reload) customPagination.reload();

          // Update the URL.
          if (updateUrl) FacetFilters.updateURL(searchParams);

          // Scroll to the top of the results if needed
          if (this.results && this.results.getBoundingClientRect().top < 0) {
            // If the header is sticky, compensate for it when scrolling to elements
            let headerHeight = 0;
            const stickyHeader = document.querySelector('store-header[data-is-sticky="true"]');
            if (stickyHeader) {
              headerHeight =
                Number.parseInt(
                  getComputedStyle(this.parentElement).getPropertyValue("--header-height").replace("px", ""),
                  10
                ) || 0;
            }
            window.scrollTo({
              top: this.results.getBoundingClientRect().top + window.scrollY - headerHeight - 45,
              behavior: "smooth",
            });
          }

          // Enable the "Show X results" button
          if (closeBtn) {
            closeBtn.classList.remove("is-loading");
            closeBtn.removeAttribute("aria-disabled");
          }

          // Re-enable infinite scroll
          if (customPagination) customPagination.dataset.pauseInfiniteScroll = "false";

          // Focus on the element with the same ID in the new HTML
          if (activeElementId) {
            const elementToFocus = document.getElementById(activeElementId);
            if (elementToFocus) elementToFocus.focus();
          }

          // Broadcast the update for anything else to hook into
          document.dispatchEvent(new CustomEvent("on:facet-filters:updated", { bubbles: true }));
        } else {
          console.error("Filter request failed:", response.status, response.statusText);
        }
      } catch (error) {
        console.warn("Filter error:", error);
      } finally {
        if (this.results) {
          this.results.classList.remove("is-loading");
        }

        // Hide spinner when filtering is complete
        this.hideSpinner();
      }
    }

    /**
     * Shows the filtering spinner over the main product grid
     */
    showSpinner() {
      const filteringSpinner = document.getElementById("filtering-spinner");
      if (filteringSpinner) {
        filteringSpinner.classList.remove("hidden");
        console.log("Filtering spinner shown over product grid");
      }
    }

    /**
     * Hides the filtering spinner
     */
    hideSpinner() {
      const filteringSpinner = document.getElementById("filtering-spinner");
      if (filteringSpinner) {
        filteringSpinner.classList.add("hidden");
      }
    }

    /**
     * Updates the url with the current filter/sort parameters.
     * @param {string} searchParams - Filter/sort parameters.
     */
    static updateURL(searchParams) {
      window.history.pushState(
        { searchParams },
        "",
        `${window.location.pathname}${searchParams && "?".concat(searchParams)}`
      );
    }
  }

  customElements.define("facet-filters", FacetFilters);
}

// Log when script loads
console.log("Facet filters script loaded");
