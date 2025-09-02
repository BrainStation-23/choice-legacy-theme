document.addEventListener("DOMContentLoaded", () => {
  const toastManager = new ToastNotificationManager();
  const currentPointsSpan = document.getElementById("currentPoints");

  const API_URLS = {
    REDEEM: `/apps/${APP_SUB_PATH}/customer/reward-point-system/redeem`,
    HISTORY: `/apps/${APP_SUB_PATH}/customer/reward-point-system/get-history`,
  };

  let earningPagination, usedPagination, expirePagination;

  const apiCall = async (url, options = {}) => {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
  };

  // New function to update redeem button states based on current points
  const updateRedeemButtonStates = (currentPoints) => {
    const redeemButtons = document.querySelectorAll(".redeem-now-button");

    redeemButtons.forEach((button) => {
      const pointsRequired = parseInt(button.dataset.pointsRequired) || 0;

      if (currentPoints === 0 || currentPoints < pointsRequired) {
        button.disabled = true;
        button.classList.add("disabled"); // Add disabled class for styling
      } else {
        button.disabled = false;
        button.classList.remove("disabled");
      }
    });
  };

  const fetchHistoryForTab = async (tabType, page = 1) => {
    const tbody = document.getElementById("earning-history-body");
    const mobileView = document.getElementById("history-mobile-view");

    if (tbody && mobileView) {
      const loadingHTML = `<tr><td class="fs-16-lh-24-ls-0" colspan="5" style="text-align:center; padding: 16px;">Loading...</td></tr>`;
      tbody.innerHTML = loadingHTML;
      mobileView.innerHTML = `<div class="fs-16-lh-24-ls-0" style="text-align:center; padding: 16px;">Loading...</div>`;
    }

    try {
      const customerId = window.customerId;
      if (!customerId) return;

      const data = await apiCall(
        `${API_URLS.HISTORY}?historyType=${tabType}&page=${page}`
      );
      renderHistoryTable(data.history, tabType);

      const paginationData = data.pagination;
      if (tabType === "earning") {
        earningPagination.update(paginationData);
      } else if (tabType === "used") {
        usedPagination.update(paginationData);
      } else if (tabType === "expire") {
        expirePagination.update(paginationData);
      }
    } catch (error) {
      toastManager.show(`Failed to load history: ${error.message}`, "error");
    }
  };

  const initializePagination = () => {
    earningPagination = new PaginationManager({
      containerId: "earning-pagination",
      mode: "backend",
      itemsPerPage: 5,
      onPageChange: (newPage) => fetchHistoryForTab("earning", newPage),
    });

    usedPagination = new PaginationManager({
      containerId: "used-pagination",
      mode: "backend",
      itemsPerPage: 5,
      onPageChange: (newPage) => fetchHistoryForTab("used", newPage),
    });

    expirePagination = new PaginationManager({
      containerId: "expire-pagination",
      mode: "backend",
      itemsPerPage: 5,
      onPageChange: (newPage) => fetchHistoryForTab("expire", newPage),
    });
  };

  const renderHistoryTable = (historyItems, tabType) => {
    const tbody = document.getElementById("earning-history-body");
    const mobileView = document.getElementById("history-mobile-view");

    if (!tbody || !mobileView || !Array.isArray(historyItems)) {
      return;
    }

    const customerData = {
      orders: {},
      products: {},
    };

    (window.customerPurchasedProducts || []).forEach((item) => {
      const orderIdStr = String(item.orderId);
      const productIdStr = String(item.productId);

      if (!customerData.orders[orderIdStr]) {
        customerData.orders[orderIdStr] = {
          name: item.orderName,
          total_price: item.orderTotalPrice,
          customer_url: item.orderCustomerUrl,
        };
      }

      if (!customerData.products[productIdStr]) {
        customerData.products[productIdStr] = {
          productHandle: item.productHandle,
        };
      }
    });

    const emptyMessageHTML = `<tr><td class="fs-16-lh-24-ls-0" colspan="5" style="text-align:center; padding: 16px;">No ${tabType} history found.</td></tr>`;
    if (historyItems.length === 0) {
      tbody.innerHTML = emptyMessageHTML;
      mobileView.innerHTML = `<div class="fs-16-lh-24-ls-0" style="text-align:center; padding: 16px;">No ${tabType} history found.</div>`;
      return;
    }

    tbody.innerHTML = "";
    mobileView.innerHTML = "";

    historyItems.forEach((record) => {
      const tr = document.createElement("tr");
      const mobileCard = document.createElement("div");
      mobileCard.className =
        "mobile-history-card pt-10 pr-16 pb-10 pl-16 flex flex-col rounded-12 border border-solid border-color";

      let desktopRowContent = "";
      let mobileCardContent = "";

      if (tabType === "used") {
        const formattedDate = new Date(record.date).toISOString().split("T")[0];
        const pointsDisplay = `<span class="fw-600 fs-16-lh-24-ls-0 text-error text-error-alt">-${
          record.point || 0
        }</span>`;
        const transactionAmount = record.amount
          ? `৳${record.amount.toFixed(2)}`
          : "N/A";
        let eventName = "Discount Used";
        let actionLink = "#";

        if (record.referenceId) {
          const order = customerData.orders[String(record.referenceId)];
          if (order) {
            eventName = order.name;
            actionLink = order.customer_url;
          }
        }

        desktopRowContent = `
          <td class="fw-600 fs-16-lh-100pct-ls-0">${eventName}</td>
          <td class="fw-400 fs-16-lh-24-ls-0">${formattedDate}</td>
          <td>${pointsDisplay}</td>
          <td class="fw-400 fs-16-lh-24-ls-0">${transactionAmount}</td>
          <td class="text-right">
            <a href="${actionLink}">
              <svg width="28" height="17" viewBox="0 0 28 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.9785 16.8535C6.08789 16.8535 0.658203 10.418 0.658203 8.44531C0.658203 6.46289 6.09766 0.0273438 13.9785 0.0273438C21.957 0.0273438 27.2891 6.46289 27.2891 8.44531C27.2891 10.418 21.9668 16.8535 13.9785 16.8535ZM13.9785 13.709C16.8984 13.709 19.2715 11.3066 19.2715 8.44531C19.2715 5.50586 16.8984 3.18164 13.9785 3.18164C11.0391 3.18164 8.68555 5.50586 8.68555 8.44531C8.68555 11.3066 11.0391 13.709 13.9785 13.709ZM13.9785 10.4473C12.8652 10.4473 11.957 9.53906 11.957 8.44531C11.957 7.3418 12.8652 6.43359 13.9785 6.43359C15.082 6.43359 16 7.3418 16 8.44531C16 9.53906 15.082 10.4473 13.9785 10.4473Z" fill="#FB6F92"/></svg>
            </a>
          </td>
        `;
        mobileCardContent = `
          <div class="card-top-row pb-10 flex justify-between items-center w-full">
            <div class="event-details flex items-center gap-6">
              <span class="fw-600 fs-16-lh-100pct-ls-0">${eventName}</span>
              <span class="fw-400 fs-16-lh-24-ls-0 text-label">${formattedDate}</span>
            </div>
            <div class="point-details flex items-center gap-12">
              <span class="text-label fs-16-lh-24-ls-0 fw-400">Point</span>
              <span class="text-error-alt">${pointsDisplay}</span>
            </div>
          </div>
          <div class="card-bottom-row pt-10 flex justify-between items-center w-full border-top-1 border-solid border-color border-bottom-none border-left-none border-right-none">
            <span class="text-label fw-500 fs-16-lh-20-ls-0_1">Transaction</span>
            <span class="fw-600 fs-16-lh-24-ls-0">${transactionAmount}</span>
          </div>
        `;
      } else {
        let transactionAmount = "";
        let actionLink = "#";
        let pointsDisplay = "";

        const dateValue =
          tabType === "expire" && record.expDate
            ? record.expDate
            : record.createdDate;
        const formattedDate = new Date(dateValue).toISOString().split("T")[0];
        const eventName =
          String(record.event).charAt(0).toUpperCase() +
          String(record.event).slice(1);

        if (tabType === "earning") {
          pointsDisplay = `<span class="fw-600 fs-16-lh-24-ls-0 text-success">+${
            record.earnPoint || 0
          }</span>`;
        } else if (tabType === "expire") {
          pointsDisplay = `<span class="fw-600 fs-16-lh-24-ls-0 text-warning">${
            record.remainingPoint || 0
          }</span>`;
        }

        if (record.event === "order") {
          const order = customerData.orders[String(record.referenceId)];
          if (order) {
            transactionAmount = `৳${(order.total_price / 100).toFixed(2)}`;
            actionLink = order.customer_url;
          } else {
            transactionAmount = "N/A";
          }
        } else if (record.event === "review") {
          const product = customerData.products[String(record.referenceId)];
          if (product && product.productHandle) {
            actionLink = `/products/${product.productHandle}`;
          } else {
            actionLink = "/collections/all";
          }
        }

        desktopRowContent = `
          <td class="fw-600 fs-16-lh-100pct-ls-0">${eventName}</td>
          <td class="fw-400 fs-16-lh-24-ls-0">${formattedDate}</td>
          <td>${pointsDisplay}</td>
          <td class="fw-400 fs-16-lh-24-ls-0">${transactionAmount}</td>
          <td class="text-right">
            <a href="${actionLink}">
              <svg width="28" height="17" viewBox="0 0 28 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.9785 16.8535C6.08789 16.8535 0.658203 10.418 0.658203 8.44531C0.658203 6.46289 6.09766 0.0273438 13.9785 0.0273438C21.957 0.0273438 27.2891 6.46289 27.2891 8.44531C27.2891 10.418 21.9668 16.8535 13.9785 16.8535ZM13.9785 13.709C16.8984 13.709 19.2715 11.3066 19.2715 8.44531C19.2715 5.50586 16.8984 3.18164 13.9785 3.18164C11.0391 3.18164 8.68555 5.50586 8.68555 8.44531C8.68555 11.3066 11.0391 13.709 13.9785 13.709ZM13.9785 10.4473C12.8652 10.4473 11.957 9.53906 11.957 8.44531C11.957 7.3418 12.8652 6.43359 13.9785 6.43359C15.082 6.43359 16 7.3418 16 8.44531C16 9.53906 15.082 10.4473 13.9785 10.4473Z" fill="#FB6F92"/></svg>
            </a>
          </td>
        `;
        mobileCardContent = `
          <div class="card-top-row pb-10 flex justify-between items-center w-full">
            <div class="event-details flex items-center gap-6">
              <span class="fw-600 fs-16-lh-100pct-ls-0">${eventName}</span>
              <span class="fw-400 fs-16-lh-24-ls-0 text-label">${formattedDate}</span>
            </div>
            <div class="point-details flex items-center gap-12">
              <span class="text-label fs-16-lh-24-ls-0 fw-400">Point</span>
              <span class="text-error-alt">${pointsDisplay}</span>
            </div>
          </div>
          <div class="card-bottom-row pt-10 flex justify-between items-center w-full border-top-1 border-solid border-color border-bottom-none border-left-none border-right-none">
            <span class="text-label fw-500 fs-16-lh-20-ls-0_1">Transaction</span>
            <span class="fw-600 fs-16-lh-24-ls-0">${transactionAmount}</span>
          </div>
        `;
      }

      tr.innerHTML = desktopRowContent;
      mobileCard.innerHTML = mobileCardContent;

      tbody.appendChild(tr);
      mobileView.appendChild(mobileCard);
    });
  };

  const switchTab = (tabType) => {
    document
      .querySelectorAll(".tab-button")
      .forEach((btn) => btn.classList.remove("active"));
    document.querySelector(`[data-tab="${tabType}"]`).classList.add("active");

    document.getElementById("earning-pagination").style.display = "none";
    document.getElementById("used-pagination").style.display = "none";
    document.getElementById("expire-pagination").style.display = "none";

    const dateHeader = document.getElementById("date-column-header");
    const pointHeader = document.getElementById("point-column-header");

    if (tabType === "expire") {
      dateHeader.textContent = "Expire Date";
    } else {
      dateHeader.textContent = "Date";
      pointHeader.textContent = "Point";
    }

    document.getElementById(`${tabType}-pagination`).style.display = "flex";
    fetchHistoryForTab(tabType, 1);
  };

  const updateCustomerData = (apiResponse) => {
    const currentPoints = apiResponse.remainingPoints || 0;
    currentPointsSpan.textContent = currentPoints;

    // Update redeem button states based on current points
    updateRedeemButtonStates(currentPoints);

    const redemptionRulesText = document.getElementById("redemptionRulesText");
    const redemptionRules = apiResponse.configuration?.pointRedemptionRules;
    if (redemptionRulesText && redemptionRules) {
      const { pointsRequired, discountAmount } = redemptionRules;
      redemptionRulesText.textContent = `Redeem ${pointsRequired} Points for ${discountAmount} OFF`;

      const redeemCards = document.querySelectorAll(".redeem-card");
      redeemCards.forEach((card) => {
        const pointsRequiredForCard =
          card.querySelector(".redeem-now-button").dataset.pointsRequired;
        const discountSpan = card.querySelector(".discount-amount");

        if (redemptionRules.pointsRequired > 0) {
          const ratio =
            redemptionRules.discountAmount / redemptionRules.pointsRequired;
          const calculatedDiscount = Math.round(pointsRequiredForCard * ratio);
          discountSpan.textContent = calculatedDiscount;
        } else {
          discountSpan.textContent = "0";
        }
      });
    }

    const reviewRules = apiResponse.configuration?.pointsPerProductReview;
    if (reviewRules) {
      const threeStarText = document
        .getElementById("threeStarReview")
        .getAttribute("data-translation");
      document.getElementById("threeStarReview").textContent =
        threeStarText.replace("{points}", reviewRules.threeStarPoints);
      const fourStarText = document
        .getElementById("fourStarReview")
        .getAttribute("data-translation");
      document.getElementById("fourStarReview").textContent =
        fourStarText.replace("{points}", reviewRules.fourStarPoints);
      const fiveStarText = document
        .getElementById("fiveStarReview")
        .getAttribute("data-translation");
      document.getElementById("fiveStarReview").textContent =
        fiveStarText.replace("{points}", reviewRules.fiveStarPoints);
    }

    const orderRules = apiResponse.configuration?.purchasePointsConfiguration;
    if (orderRules) {
      const orderRuleText = document
        .getElementById("orderPointsRule")
        .getAttribute("data-translation");
      let finalOrderRule = orderRuleText.replace(
        "{points}",
        orderRules.pointsAwarded
      );
      finalOrderRule = finalOrderRule.replace(
        "{amount}",
        orderRules.amountThreshold
      );
      document.getElementById("orderPointsRule").textContent = finalOrderRule;
    }

    // Only render history if it's for earning tab - avoid calling renderHistoryTable with used tab data
    if (
      apiResponse.history &&
      apiResponse.pagination &&
      !apiResponse.history.some((item) => item.isUsed)
    ) {
      renderHistoryTable(apiResponse.history, "earning");
      earningPagination.update(apiResponse.pagination);
      document.querySelector(`[data-tab="earning"]`).classList.add("active");
      document.getElementById("earning-pagination").style.display = "flex";
    }
  };

  const handleApplyToCart = (button, discountCode, applyHandler) => {
    if (!discountCode || !button) {
      toastManager.show("An error occurred.", "error");
      return;
    }

    button.disabled = true;
    button.textContent = "Applying...";
    toastManager.show("Discount code applied successfully!", "success");

    const oldIframe = document.getElementById("discount-iframe");
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.id = "discount-iframe";
    iframe.src = `/discount/${discountCode}?redirect=/cart`;

    iframe.onload = () => {
      button.textContent = window.rewardPointLocalization.redeemNow;
      button.disabled = false;
      button.removeAttribute("data-discount-code");
      button.removeEventListener("click", applyHandler);
      button.addEventListener("click", handleRedeemFromCard);

      // Re-check button state after iframe loads
      const currentPoints = parseInt(currentPointsSpan.textContent) || 0;
      updateRedeemButtonStates(currentPoints);
    };

    document.body.appendChild(iframe);
  };

  const handleRedeemFromCard = async (event) => {
    const button = event.target;
    const pointsToRedeem = button.dataset.pointsRequired;
    const customerId = window.customerId;
    if (!customerId) return;

    // Check if user has enough points before proceeding
    const currentPoints = parseInt(currentPointsSpan.textContent) || 0;
    if (currentPoints === 0 || currentPoints < parseInt(pointsToRedeem)) {
      toastManager.show("Insufficient points to redeem this reward.", "error");
      return;
    }

    const applyHandler = () =>
      handleApplyToCart(button, button.dataset.discountCode, applyHandler);

    try {
      button.disabled = true;
      button.textContent = window.rewardPointLocalization.redeeming;
      const redeemResponse = await apiCall(API_URLS.REDEEM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: Number(pointsToRedeem), customerId }),
      });
      if (redeemResponse.discountCode) {
        toastManager.show(
          window.rewardPointLocalization.redeemMessage,
          "success"
        );
        button.textContent = window.rewardPointLocalization.applyToCart;
        button.dataset.discountCode = redeemResponse.discountCode;
        button.disabled = false;
        button.removeEventListener("click", handleRedeemFromCard);
        button.addEventListener("click", applyHandler);
      }

      // Only update current points, don't call updateCustomerData with used tab data
      const latestData = await apiCall(
        `${API_URLS.HISTORY}?historyType=used&page=1`
      );

      // Update the current points display and button states
      const newCurrentPoints = latestData.remainingPoints || 0;
      currentPointsSpan.textContent = newCurrentPoints;
      updateRedeemButtonStates(newCurrentPoints);

      // If we're currently on the used tab, refresh it
      const activeTab = document.querySelector(".tab-button.active");
      if (activeTab && activeTab.getAttribute("data-tab") === "used") {
        renderHistoryTable(latestData.history, "used");
        usedPagination.update(latestData.pagination);
      }
    } catch (error) {
      toastManager.show(`Redemption failed: ${error.message}`, "error");
    } finally {
      if (!button.dataset.discountCode) {
        button.disabled = false;
        button.textContent = window.rewardPointLocalization.redeemNow;

        // Re-check button state in case of error
        const currentPoints = parseInt(currentPointsSpan.textContent) || 0;
        updateRedeemButtonStates(currentPoints);
      }
    }
  };

  initializePagination();

  document.querySelectorAll(".tab-button").forEach((button, index) => {
    const tabTypes = ["earning", "used", "expire"];
    button.setAttribute("data-tab", tabTypes[index]);
    button.addEventListener("click", () => switchTab(tabTypes[index]));
  });

  const customerId = window.customerId;
  if (customerId) {
    apiCall(`${API_URLS.HISTORY}?historyType=earning&page=1`)
      .then(updateCustomerData)
      .catch((error) => {
        const redemptionRulesText = document.getElementById(
          "redemptionRulesText"
        );
        if (redemptionRulesText) {
          redemptionRulesText.textContent = "Could not load redemption rules.";
        }

        currentPointsSpan.textContent = "Error";
        const tbody = document.getElementById("earning-history-body");
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px;">Failed to load reward history.</td></tr>`;
        }

        // Disable all redeem buttons on error
        updateRedeemButtonStates(0);
      });
  }

  const redeemButtons = document.querySelectorAll(".redeem-now-button");
  redeemButtons.forEach((button) => {
    button.addEventListener("click", handleRedeemFromCard);
  });
});
