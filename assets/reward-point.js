document.addEventListener("DOMContentLoaded", () => {
  const toastManager = new ToastNotificationManager();

  const currentPointsSpan = document.getElementById("currentPoints");

  const API_URLS = {
    REDEEM: `/apps/${APP_SUB_PATH}/customer/reward-point-system/redeem`,
    HISTORY: `/apps/${APP_SUB_PATH}/customer/reward-point-system/get-history`,
  };

  const apiCall = async (url, options = {}) => {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
  };

  const renderEarningHistoryTable = (earningHistory, customerData) => {
    const tbody = document.getElementById("earning-history-body");
    if (!tbody) {
      return;
    }

    if (!Array.isArray(earningHistory) || earningHistory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px;">No earning history found.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    earningHistory.forEach((record) => {
      let transactionAmount = "";
      let actionLink = "#";

      const formattedDate = new Date(record.createdDate)
        .toISOString()
        .split("T")[0];
      const eventName =
        String(record.event).charAt(0).toUpperCase() +
        String(record.event).slice(1);

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

      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td class="fw-600 fs-16-lh-100pct-ls-0">${eventName}</td>
      <td class="fw-400 fs-16-lh-24-ls-0">${formattedDate}</td>
      <td class="fw-600 fs-16-lh-24-ls-0 text-success">+${
        record.earnPoint || 0
      }</td>
      <td class="fw-400 fs-16-lh-24-ls-0">${transactionAmount}</td>
      <td class="text-right">
        <a href="${actionLink}">
          <svg width="28" height="17" viewBox="0 0 28 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.9785 16.8535C6.08789 16.8535 0.658203 10.418 0.658203 8.44531C0.658203 6.46289 6.09766 0.0273438 13.9785 0.0273438C21.957 0.0273438 27.2891 6.46289 27.2891 8.44531C27.2891 10.418 21.9668 16.8535 13.9785 16.8535ZM13.9785 13.709C16.8984 13.709 19.2715 11.3066 19.2715 8.44531C19.2715 5.50586 16.8984 3.18164 13.9785 3.18164C11.0391 3.18164 8.68555 5.50586 8.68555 8.44531C8.68555 11.3066 11.0391 13.709 13.9785 13.709ZM13.9785 10.4473C12.8652 10.4473 11.957 9.53906 11.957 8.44531C11.957 7.3418 12.8652 6.43359 13.9785 6.43359C15.082 6.43359 16 7.3418 16 8.44531C16 9.53906 15.082 10.4473 13.9785 10.4473Z" fill="#FB6F92"/>
          </svg>
        </a>
      </td>
    `;
      tbody.appendChild(tr);
    });
  };

  const updateCustomerData = (apiResponse) => {
    if (!apiResponse?.success) {
      document.querySelector(".reward-container").style.display = "none";
    } else {
      const currentPoints = apiResponse.remainingPoints || 0;
      currentPointsSpan.textContent = currentPoints;

      const redemptionRulesText = document.getElementById(
        "redemptionRulesText"
      );
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
            const calculatedDiscount = Math.round(
              pointsRequiredForCard * ratio
            );
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

      const customerData = {
        orders: {},
        products: {},
      };

      (window.customerPurchasedProducts || []).forEach((item) => {
        const orderIdStr = String(item.orderId);
        const productIdStr = String(item.productId);

        if (!customerData.orders[orderIdStr]) {
          customerData.orders[orderIdStr] = {
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

      if (apiResponse.rewardHistory?.earning) {
        renderEarningHistoryTable(
          apiResponse.rewardHistory.earning,
          customerData
        );
      }
    }
  };

  const handleApplyToCart = (discountCode) => {
    if (!discountCode) {
      toastManager.show("No discount code provided.", "error");
      return;
    }
    const button = event.target;
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
    };
    document.body.appendChild(iframe);
  };

  const handleRedeemFromCard = async (event) => {
    const button = event.target;
    const pointsToRedeem = button.dataset.pointsRequired;
    try {
      button.disabled = true;
      button.textContent = window.rewardPointLocalization.redeeming;
      const redeemResponse = await apiCall(API_URLS.REDEEM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: Number(pointsToRedeem) }),
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
        button.addEventListener("click", () =>
          handleApplyToCart(button.dataset.discountCode)
        );
      }
      const latestData = await apiCall(API_URLS.HISTORY);
      updateCustomerData(latestData);
    } catch (error) {
      toastManager.show(`Redemption failed: ${error.message}`, "error");
    } finally {
      if (!button.dataset.discountCode) {
        button.disabled = false;
        button.textContent = window.rewardPointLocalization.redeemNow;
      }
    }
  };

  apiCall(API_URLS.HISTORY)
    .then(updateCustomerData)
    .catch((error) => {
      currentPointsSpan.textContent = "Error";
    });

  const redeemButtons = document.querySelectorAll(".redeem-now-button");
  redeemButtons.forEach((button) => {
    button.addEventListener("click", handleRedeemFromCard);
  });
});
