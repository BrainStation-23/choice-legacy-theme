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

  const renderEarningHistoryTable = (earningHistory, orders) => {
    const tbody = document.getElementById("earning-history-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    const orderMap = new Map(
      orders.map((order) => [order.id.toString(), order])
    );

    if (earningHistory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 16px;">No earning history found.</td></tr>`;
      return;
    }

    earningHistory.forEach((record) => {
      const tr = document.createElement("tr");

      let transactionAmount = "";
      let actionLink = "#";
      let actionText = "View";

      if (record.event === "order") {
        const order = orderMap.get(record.referenceId.toString());
        if (order) {
          transactionAmount = `৳${(order.total_price / 100).toFixed(2)}`;
          actionLink = order.customer_url;
        } else {
          transactionAmount = "N/A";
        }
      } else if (record.event === "review") {
        actionLink = "/collections/all";
      }

      tr.innerHTML = `
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-transform: capitalize;">${record.event}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">#${record.referenceId}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: green;">+${record.earnPoint}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${transactionAmount}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="${actionLink}">${actionText}</a></td>
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

      if (apiResponse.rewardHistory?.earning) {
        renderEarningHistoryTable(
          apiResponse.rewardHistory.earning,
          window.customerOrders || []
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
