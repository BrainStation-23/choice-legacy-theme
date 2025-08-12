document.addEventListener("DOMContentLoaded", () => {
  const rewardButton = document.getElementById("rewardButton");
  const pointsInput = document.getElementById("pointsInput");
  const currentPointsSpan = document.getElementById("currentPoints");
  const discountCodeSection = document.getElementById("discountCodeSection");
  const discountCodeSpan = document.getElementById("discountCode");
  const applyToCartButton = document.getElementById("applyToCartButton");

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

  const updateCustomerData = (apiResponse) => {
    if (!apiResponse?.success) {
      document.querySelector(".reward-container").style.display = "none";
    } else {
      // Update reward points balance
      const currentPoints = apiResponse.remainingPoints || 0;
      currentPointsSpan.textContent = currentPoints;

      // Update redemption rules text
      const redemptionRulesText = document.getElementById(
        "redemptionRulesText"
      );
      if (
        redemptionRulesText &&
        apiResponse.configuration?.pointRedemptionRules
      ) {
        const { pointsRequired, discountAmount } =
          apiResponse.configuration.pointRedemptionRules;
        redemptionRulesText.textContent = `Redeem ${pointsRequired} Points for ${discountAmount} OFF`;
      }

      // Update product review rules with localized text
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

      // Update order points rule with localized text
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
    }
  };

  const validatePointsInput = (pointsToRedeem) => {
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      throw new Error("Please enter a valid number of points.");
    }
    if (!Number.isInteger(Number(pointsToRedeem))) {
      throw new Error("Points must be a whole number.");
    }
    return Number(pointsToRedeem);
  };

  const handleRedeem = async () => {
    try {
      const pointsToRedeem = validatePointsInput(pointsInput.value);
      rewardButton.disabled = true;
      rewardButton.textContent = "Redeeming...";

      const redeemResponse = await apiCall(API_URLS.REDEEM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: pointsToRedeem }),
      });
      console.log(redeemResponse);
      if (redeemResponse.discountCode) {
        alert("Points redeemed successfully!");
      }

      // Show discount code
      if (redeemResponse.discountCode) {
        discountCodeSpan.textContent = redeemResponse.discountCode;
        discountCodeSection.style.display = "block";
      }

      const latestData = await apiCall(API_URLS.HISTORY);

      updateCustomerData(latestData);

      pointsInput.value = "";
    } catch (error) {
      console.error("Redemption failed:", error);
      alert(error.message);
    } finally {
      rewardButton.disabled = false;
      rewardButton.textContent = "Submit";
    }
  };

  const handleApplyToCart = () => {
    const discountCode = discountCodeSpan?.textContent?.trim();

    if (!discountCode) {
      console.error("No discount code provided.");
      return;
    }

    // Clean up any previous iframe if it exists
    const oldIframe = document.getElementById("discount-iframe");
    if (oldIframe) oldIframe.remove();

    // Create a hidden iframe to apply the discount
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.id = "discount-iframe";
    iframe.src = `/discount/${discountCode}?redirect=/cart`;

    // Append to body
    document.body.appendChild(iframe);

    // Optional: wait for it to load and then remove
    iframe.onload = () => {
      setTimeout(() => iframe.remove(), 2000);
    };
  };

  rewardButton?.addEventListener("click", handleRedeem);
  applyToCartButton?.addEventListener("click", handleApplyToCart);

  pointsInput?.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      handleRedeem();
    }
  });

  apiCall(API_URLS.HISTORY)
    .then(updateCustomerData)
    .catch((error) => {
      console.error("Failed to load initial points:", error);
      currentPointsSpan.textContent = "Error";
    });
});
