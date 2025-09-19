document.addEventListener("DOMContentLoaded", async () => {
  const modal = document.getElementById("beauty-profile-modal");
  const modalBody = document.getElementById("beauty-profile-modal-body");
  const closeModalBtn = document.getElementById(
    "beauty-profile-modal-close-btn"
  );

  let allQuestions = [];
  let currentProfileQuestions = [];
  let currentStep = -1;
  let userAnswers = {};
  let currentProfileType = "";
  let currentAnswer = null;
  let stepHistory = [];

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  async function openModal() {
    if (modal && modalBody) {
      modalBody.classList.add("is-transitioning");
      modal.style.display = "flex";
      await delay(20);
      modalBody.classList.remove("is-transitioning");
    }
  }

  async function closeModal() {
    if (modal && modalBody) {
      const animationDuration = 200;
      modalBody.classList.add("is-transitioning");
      await delay(animationDuration);
      modal.style.display = "none";
      modalBody.classList.remove("is-transitioning");
    }
  }

  function createModalLayout(innerHtml) {
    const footerHtml = `
    <div class="beauty-profile-modal-footer flex justify-between p-16 box-shadow">
      <button type="button" class="beauty-profile-modal-back-btn button button--outline h-44 text-primary border-color">Back</button>
      <button type="button" class="beauty-profile-modal-continue-btn button button--solid h-44">Continue</button>
    </div>
  `;

    return `
    <div class="pt-40 pr-32 pb-40 pl-32 flex flex-col gap-16 max-h-500 overflow-y-auto scrollbar-w-8 scrollbar-track-none scrollbar-thumb-brand scrollbar-thumb-brand-hover">
      ${innerHtml}
    </div>
    ${footerHtml}
  `;
  }

  function setupDobFields() {
    const dd = modalBody.querySelector("#dob-dd");
    const mm = modalBody.querySelector("#dob-mm");
    const yyyy = modalBody.querySelector("#dob-yyyy");

    if (!dd || !mm || !yyyy) return;

    const fields = [dd, mm, yyyy];
    fields.forEach((field, index) => {
      field.addEventListener("input", () => {
        field.value = field.value.replace(/[^0-g]/g, "");

        if (
          field.value.length === field.maxLength &&
          index < fields.length - 1
        ) {
          fields[index + 1].focus();
        }
      });
    });
  }

  function generateTitleMarkup(title) {
    return `<h2 class="beauty-profile-modal-body-title fw-400 fs-16-lh-22-ls-0 ff-general-sans">${title}</h2>`;
  }

  function generateErrorContainerMarkup() {
    return `<div class="error-container flex"></div>`;
  }

  async function renderModalContent(html, newClasses = "w-full") {
    if (!modal || !modalBody) return;

    const modalContent = modal.querySelector(".beauty-profile-modal-content");
    const animationDuration = 200;

    modalBody.classList.add("is-transitioning");
    await delay(animationDuration);

    modalContent.className =
      "beauty-profile-modal-content relative rounded-16 bg-bg";
    if (newClasses) {
      modalContent.classList.add(...newClasses.split(" "));
    }

    modalBody.innerHTML = html;
    modalBody.classList.remove("is-transitioning");

    modal
      .querySelector(".beauty-profile-modal-back-btn")
      ?.addEventListener("click", handleBack);
    modal
      .querySelector(".beauty-profile-modal-continue-btn")
      ?.addEventListener("click", handleContinue);

    const optionsContainers = modalBody.querySelectorAll(".options-container");
    optionsContainers.forEach((optionsContainer) => {
      optionsContainer.addEventListener("change", (e) => {
        if (e.target.type === "radio") {
          currentAnswer = e.target.value;
        }
      });

      optionsContainer.addEventListener("click", (e) => {
        const option = e.target.closest(".option-btn");
        if (!option) return;

        const isMultiChoice =
          optionsContainer.classList.contains("multi-choice");

        if (isMultiChoice) {
          option.classList.toggle("is-selected");
        } else {
          optionsContainer
            .querySelectorAll(".option-btn")
            .forEach((el) => el.classList.remove("is-selected"));
          option.classList.add("is-selected");
        }
      });

      const multiSelectDisplay =
        optionsContainer.querySelector(".select-display");
      if (multiSelectDisplay) {
        multiSelectDisplay.addEventListener("click", () => {
          const panel = optionsContainer.querySelector(".dropdown-panel");
          panel.classList.toggle("is-open");
        });
      }
    });

    openModal();
  }

  function generateSingleChoiceMarkup(question, flexCol = false) {
    const groupKey = question.key;
    const answerKey = question.q_key.replace(
      new RegExp(`^${question.key}_`, "i"),
      ""
    );
    const savedAnswer = userAnswers[groupKey]?.[answerKey];

    let optionsHtml = `<div class="options-container flex gap-8 ${
      flexCol ? "flex-col" : "flex-wrap"
    }">`;
    question.options.forEach((option) => {
      const isChecked = savedAnswer === option.value ? "checked" : "";
      if (isChecked) currentAnswer = option.value;
      optionsHtml += `
        <div class="radio-option">
          ${
            flexCol
              ? `<div class="flex"><input type="radio" class="hidden" id="${option.value}" name="${question.q_key}" value="${option.value}" ${isChecked}>
          <label for="${option.value}" class="radio-option-label flex gap-10 items-center rounded-100 border border-solid border-color cursor-pointer transition-transform pt-18 pr-16 pb-18 pl-16">
            <span class="radio-custom relative w-20 h-20 inline-block border border-solid border-2 rounded-full"></span>
            <span class="radio-option-text transition-transform fw-500 fs-13-lh-16-ls-0_2">${option.label}</span>
          </label></div>`
              : `<input type="radio" class="hidden" id="${option.value}" name="${question.q_key}" value="${option.value}" ${isChecked}>
          <label for="${option.value}" class="radio-option-label flex gap-10 items-center rounded-100 border border-solid border-color cursor-pointer transition-transform pt-18 pr-16 pb-18 pl-16">
            <span class="radio-custom relative w-20 h-20 inline-block border border-solid border-2 rounded-full"></span>
            <span class="radio-option-text transition-transform fw-500 fs-13-lh-16-ls-0_2">${option.label}</span>
          </label>`
          }
        </div>
      `;
    });
    optionsHtml += `</div>`;
    return optionsHtml;
  }

  function generatePictureChoiceMarkup(question) {
    const groupKey = question.key;
    const answerKey = question.q_key.replace(
      new RegExp(`^${question.key}_`, "i"),
      ""
    );
    const savedAnswer = userAnswers[groupKey]?.[answerKey];
    let optionsHtml = `<div class="options-container picture-options-container flex gap-16">`;
    question.options.forEach((option) => {
      const isSelected = savedAnswer === option.value ? "is-selected" : "";
      optionsHtml += `
      <button type="button" class="option-btn picture-option-card bg-transparent transition-transform border-2 border-solid border-color-transparent cursor-pointer w-221_3333 h-216 border-none rounded-6 ${isSelected}" data-value="${option.value}">
        <img src="${option.imageUrl}" alt="${option.label}" loading="lazy" class="rounded-6">
      </button>
    `;
    });
    optionsHtml += `</div>`;
    return optionsHtml;
  }

  function generateMultiChoiceMarkup(question) {
    const groupKey = question.key;
    const answerKey = question.q_key.replace(
      new RegExp(`^${question.key}_`, "i"),
      ""
    );
    const savedAnswers = userAnswers[groupKey]?.[answerKey] || [];

    let optionsHtml = question.options
      .map((option) => {
        const isSelected = savedAnswers.includes(option.value)
          ? "is-selected"
          : "";
        return `<button type="button" class="option-btn w-full text-left bg-bg p-16 border-none border-bottom fw-500 fs-14-lh-20-ls-0_1 ${isSelected}" data-value="${option.value}">${option.label}</button>`;
      })
      .join("");

    return `
    <div class="options-container multi-choice multi-select-container relative w-full">
      <div class="select-display flex justify-between items-center pt-14 pr-18 pb-14 pl-18 border-1 border-solid border-color rounded-12 cursor-pointer bg-bg fw-500 fs-14-lh-20-ls-0_1">
        <span class="placeholder">you can choose multiple</span>
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.6543 10.3008C8.32227 10.3008 8.0293 10.1738 7.77539 9.91016L0.333984 2.30273C0.119141 2.08789 0.00195312 1.81445 0.00195312 1.50195C0.00195312 0.867188 0.5 0.369141 1.13477 0.369141C1.44727 0.369141 1.73047 0.496094 1.95508 0.710938L8.6543 7.57617L15.3535 0.710938C15.5684 0.496094 15.8613 0.369141 16.1738 0.369141C16.7988 0.369141 17.2969 0.867188 17.2969 1.50195C17.2969 1.82422 17.1895 2.08789 16.9746 2.30273L9.5332 9.91016C9.28906 10.1738 8.98633 10.3008 8.6543 10.3008Z" fill="#90989C"/>
        </svg>
      </div>
      <div class="dropdown-panel hidden absolute left-0 right-0 bg-bg rounded-12 overflow-y-auto z-10 border-1 border-solid border-color scrollbar-w-8 scrollbar-track-none scrollbar-thumb-brand scrollbar-thumb-brand-hover">
        ${optionsHtml}
      </div>
    </div>
  `;
  }

  function renderCurrentQuestion() {
    currentAnswer = null;
    if (currentStep >= currentProfileQuestions.length) {
      const thankYouHtml = `
      ${generateTitleMarkup("Thank you! Your profile is complete.")}
      <p class="text-sm">Here are your answers:</p>
      <pre class="text-xs bg-gray-100 p-2 rounded">${JSON.stringify(
        userAnswers,
        null,
        2
      )}</pre>`;
      renderModalContent(thankYouHtml);
      return;
    }
    const question = currentProfileQuestions[currentStep];
    let optionsHtml = "";
    switch (question.type) {
      case "single_choice":
        optionsHtml = generateSingleChoiceMarkup(question);
        break;
      case "picture_choice":
        optionsHtml = generatePictureChoiceMarkup(question);
        break;
      case "multi_choice":
        optionsHtml = generateMultiChoiceMarkup(question);
        break;
      default:
        optionsHtml = `<p>This question type is not supported yet.</p>`;
    }
    const innerHtml = `
    ${generateTitleMarkup(question.title)}
    ${optionsHtml}
    ${generateErrorContainerMarkup()}
  `;
    renderModalContent(createModalLayout(innerHtml));
  }

  function clearErrors() {
    modalBody
      .querySelectorAll(".error-container")
      .forEach((el) => (el.innerHTML = ""));
    modalBody
      .querySelectorAll(".border-red-500")
      .forEach((el) => el.classList.remove("border-red-500"));
  }

  function displayError(container, message) {
    if (!container) return;
    container.innerHTML = `<p class="error-text">${message}</p>`;
  }

  function validateAndSaveAnswers() {
    clearErrors();
    if (currentStep === -1) {
      const dd = modalBody.querySelector("#dob-dd");
      const mm = modalBody.querySelector("#dob-mm");
      const yyyy = modalBody.querySelector("#dob-yyyy");
      const gender = modalBody.querySelector("#gender");
      const errorContainer = modalBody.querySelector(".error-container");
      if (
        !dd.value ||
        !mm.value ||
        !yyyy.value ||
        isNaN(dd.value) ||
        isNaN(mm.value) ||
        isNaN(yyyy.value) ||
        yyyy.value.length < 4
      ) {
        [dd, mm, yyyy].forEach((el) => {
          if (!el.value) el.classList.add("border-red-500");
        });
        displayError(errorContainer, "Please enter a valid date of birth.");
        return false;
      }
      userAnswers.dob = `${yyyy.value}-${mm.value.padStart(
        2,
        "0"
      )}-${dd.value.padStart(2, "0")}`;
      userAnswers.gender = gender.value;
      return true;
    }

    const isSpecialQuestion = typeof currentStep === "string";
    const q_key_map = {
      routine_or_product: "skinCare_routine_or_product",
      skin_type: "skinCare_skinConcerns",
      skin_issues: "skinCare_ageRange",
      skin_issues: "skinCare_ageRange",
    };
    const question = isSpecialQuestion
      ? allQuestions.find((q) => q.q_key === q_key_map[currentStep])
      : currentProfileQuestions[currentStep];

    const errorContainer = modalBody.querySelector(".error-container");
    let answers = [];

    // Handle multiple questions on skin_issues screen
    if (currentStep === "skin_issues") {
      const questionsToValidate = [
        { q_key: "skinCare_ageRange", type: "multi_choice", isRequired: true },
        {
          q_key: "skinCare_skinConcerns",
          type: "picture_choice",
          isRequired: true,
        },
        {
          q_key: "skinCare_skinIssueCondition",
          type: "single_choice",
          isRequired: false,
        },
        {
          q_key: "skinCare_is_pregnant",
          type: "single_choice",
          isRequired: false,
        },
        {
          q_key: "skinCare_acneIrritation",
          type: "single_choice",
          isRequired: false,
        },
      ];

      let hasError = false;

      questionsToValidate.forEach((questionInfo) => {
        const questionObj = allQuestions.find(
          (q) => q.q_key === questionInfo.q_key
        );
        if (!questionObj) return;

        const groupKey = questionObj.key;
        const answerKey = questionObj.q_key.replace(
          new RegExp(`^${questionObj.key}_`, "i"),
          ""
        );

        let questionAnswers = [];

        if (questionInfo.type === "multi_choice") {
          const selectedOptions = modalBody.querySelectorAll(
            `.multi-choice .is-selected`
          );
          questionAnswers = Array.from(selectedOptions).map(
            (el) => el.dataset.value
          );
        } else if (questionInfo.type === "picture_choice") {
          const selectedButton = modalBody.querySelector(
            `.picture-options-container .is-selected`
          );
          if (selectedButton)
            questionAnswers.push(selectedButton.dataset.value);
        } else {
          const checkedRadio = modalBody.querySelector(
            `input[name="${questionObj.q_key}"]:checked`
          );
          if (checkedRadio) questionAnswers.push(checkedRadio.value);
        }

        if (questionInfo.isRequired && questionAnswers.length === 0) {
          hasError = true;
        }

        if (!userAnswers[groupKey]) userAnswers[groupKey] = {};
        if (questionAnswers.length > 0) {
          userAnswers[groupKey][answerKey] =
            questionInfo.type === "multi_choice"
              ? questionAnswers
              : questionAnswers[0];
        }
      });

      if (hasError) {
        displayError(
          errorContainer,
          "Please answer all required questions to continue."
        );
        return false;
      }

      return true;
    } else {
      // Original logic for other questions
      if (question.type === "multi_choice") {
        const selectedOptions = modalBody.querySelectorAll(".is-selected");
        answers = Array.from(selectedOptions).map((el) => el.dataset.value);
      } else {
        // For single_choice and picture_choice
        const checkedRadio = modalBody.querySelector(
          "input[type='radio']:checked"
        );
        const selectedButton = modalBody.querySelector(".is-selected"); // For picture_choice

        if (checkedRadio) {
          answers.push(checkedRadio.value);
        } else if (selectedButton) {
          answers.push(selectedButton.dataset.value);
        }
      }
    }

    if (question.isRequired && answers.length === 0) {
      displayError(errorContainer, "Please select an option to continue.");
      return false;
    }

    const groupKey = question.key;
    const answerKey = question.q_key.replace(
      new RegExp(`^${question.key}_`, "i"),
      ""
    );
    if (!userAnswers[groupKey]) userAnswers[groupKey] = {};
    if (answers.length > 0) {
      userAnswers[groupKey][answerKey] =
        question.type === "multi_choice" ? answers : answers[0];
    } else {
      if (userAnswers[groupKey]) delete userAnswers[groupKey][answerKey];
    }

    return true;
  }

  function saveCurrentAnswer() {
    if (currentStep === -1) return;

    if (currentStep === "skin_issues") {
      // Handle saving multiple questions on skin_issues screen
      const questionsToSave = [
        { q_key: "skinCare_ageRange", type: "multi_choice" },
        { q_key: "skinCare_skinConcerns", type: "picture_choice" },
        { q_key: "skinCare_skinIssueCondition", type: "single_choice" },
        { q_key: "skinCare_is_pregnant", type: "single_choice" },
        { q_key: "skinCare_acneIrritation", type: "single_choice" },
      ];

      questionsToSave.forEach((questionInfo) => {
        const questionObj = allQuestions.find(
          (q) => q.q_key === questionInfo.q_key
        );
        if (!questionObj) return;

        const groupKey = questionObj.key;
        const answerKey = questionObj.q_key.replace(
          new RegExp(`^${questionObj.key}_`, "i"),
          ""
        );

        let questionAnswers = [];

        if (questionInfo.type === "multi_choice") {
          const selectedOptions = modalBody.querySelectorAll(
            `.multi-choice .is-selected`
          );
          questionAnswers = Array.from(selectedOptions).map(
            (el) => el.dataset.value
          );
        } else if (questionInfo.type === "picture_choice") {
          const selectedButton = modalBody.querySelector(
            `.picture-options-container .is-selected`
          );
          if (selectedButton)
            questionAnswers.push(selectedButton.dataset.value);
        } else {
          const checkedRadio = modalBody.querySelector(
            `input[name="${questionObj.q_key}"]:checked`
          );
          if (checkedRadio) questionAnswers.push(checkedRadio.value);
        }

        if (!userAnswers[groupKey]) userAnswers[groupKey] = {};
        if (questionAnswers.length > 0) {
          userAnswers[groupKey][answerKey] =
            questionInfo.type === "multi_choice"
              ? questionAnswers
              : questionAnswers[0];
        }
      });

      return;
    }

    const isSpecialQuestion = typeof currentStep === "string";
    const q_key_map = {
      routine_or_product: "skinCare_routine_or_product",
      skin_type: "skinCare_skinConcerns",
      skin_issues: "skinCare_ageRange",
    };
    const question = isSpecialQuestion
      ? allQuestions.find((q) => q.q_key === q_key_map[currentStep])
      : currentProfileQuestions[currentStep];

    if (!question) return;

    const answers = [];
    if (question.type === "multi_choice") {
      const selectedOptions = modalBody.querySelectorAll(".is-selected");
      answers.push(
        ...Array.from(selectedOptions).map((el) => el.dataset.value)
      );
    } else {
      const checkedRadio = modalBody.querySelector(
        "input[type='radio']:checked"
      );
      const selectedButton = modalBody.querySelector(".is-selected");
      if (checkedRadio) {
        answers.push(checkedRadio.value);
      } else if (selectedButton) {
        answers.push(selectedButton.dataset.value);
      }
    }

    const groupKey = question.key;
    const answerKey = question.q_key.replace(
      new RegExp(`^${question.key}_`, "i"),
      ""
    );
    if (!userAnswers[groupKey]) userAnswers[groupKey] = {};

    if (answers.length > 0) {
      userAnswers[groupKey][answerKey] =
        question.type === "multi_choice" ? answers : answers[0];
    } else {
      delete userAnswers[groupKey][answerKey];
    }
  }

  function handleContinue() {
    if (!validateAndSaveAnswers()) {
      return;
    }
    stepHistory.push(currentStep);

    if (currentStep === -1) {
      if (currentProfileType === "skincare") {
        showSkincareRoutineQuestion();
      } else {
        // currentStep = 0;
        renderCurrentQuestion();
      }
    } else if (currentStep === "routine_or_product") {
      const routineAnswer = userAnswers.skincare?.routine_or_product;
      if (routineAnswer === "proper_routine_based_on_concerns") {
        showProperRoutineBasedOnConcernScreen();
      } else {
        showSkinTypeQuestion();
      }
    } else if (currentStep === "skin_type") {
      closeModal();
      window.location.href = "/";
    } else if (currentStep === "skin_issues") {
      currentStep = 0;
      renderCurrentQuestion();
    } else {
      currentStep++;
      renderCurrentQuestion();
    }
  }

  function handleBack() {
    saveCurrentAnswer();

    if (stepHistory.length === 0) {
      closeModal();
      return;
    }
    const previousStep = stepHistory.pop();
    currentStep = previousStep;

    if (previousStep === -1) {
      showDobAndGenderModal();
    } else if (previousStep === "routine_or_product") {
      showSkincareRoutineQuestion();
    } else if (previousStep === "skin_type") {
      showSkinTypeQuestion();
    } else if (previousStep === "skin_issues") {
      showProperRoutineBasedOnConcernScreen();
    } else {
      renderCurrentQuestion();
    }
  }

  async function showDobAndGenderModal() {
    currentStep = -1;
    const innerHtml = `
    ${generateTitleMarkup(
      "What's your birthday? We've got personalized tips waiting for you."
    )}
    <div class="beauty-profile-modal-form-field flex flex-col gap-10">
      <label for="dob-dd" class="text-primary-label fw-400 fs-12-lh-16-ls-0_6">Date of Birth</label>
      <div class="beauty-profile-modal-input-group flex gap-16">
        <div class="relative w-63 h-56"><input type="text" class="pt-8 pr-16 pb-0 pl-16 fw-500 fs-14-lh-20-ls-0_1" placeholder=" " id="dob-dd" maxlength="2" inputmode="numeric" /><label for="dob-dd" class="fw-500 fs-14-lh-20-ls-0_1">DD</label></div>
        <div class="relative w-63 h-56"><input type="text" class="pt-8 pr-16 pb-0 pl-16 fw-500 fs-14-lh-20-ls-0_1" placeholder=" " id="dob-mm" maxlength="2" inputmode="numeric"><label for="dob-mm" class="fw-500 fs-14-lh-20-ls-0_1">MM</label></div>
        <div class="relative w-100 h-56"><input type="text" class="pt-8 pr-16 pb-0 pl-16 fw-500 fs-14-lh-20-ls-0_1" placeholder=" " id="dob-yyyy" maxlength="4" inputmode="numeric"><label for="dob-yyyy" class="fw-500 fs-14-lh-20-ls-0_1">YYYY</label></div>
      </div>
      ${generateErrorContainerMarkup()}
    </div>
    <div class="beauty-profile-modal-form-field flex flex-col gap-10">
      <div class="relative w-256 h-56">
        <select id="gender" class="w-full fs-500 fs-14-lh-20-ls-0_1 pl-12 h-full"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select>
        <label for="gender" class="text-primary-label fw-400 fs-12-lh-16-ls-0_6">Gender</label>
      </div>
    </div>
  `;
    await renderModalContent(createModalLayout(innerHtml), "w-700");

    if (userAnswers.dob) {
      const [yyyy, mm, dd] = userAnswers.dob.split("-");
      modalBody.querySelector("#dob-dd").value = dd;
      modalBody.querySelector("#dob-mm").value = mm;
      modalBody.querySelector("#dob-yyyy").value = yyyy;
    }
    if (userAnswers.gender) {
      modalBody.querySelector("#gender").value = userAnswers.gender;
    }

    setupDobFields();
  }

  function showSkincareRoutineQuestion() {
    currentStep = "routine_or_product";
    const question = allQuestions.find(
      (q) => q.q_key === "skinCare_routine_or_product"
    );
    if (!question) return;
    const optionsHtml = generateSingleChoiceMarkup(question);
    const innerHtml = `
    ${generateTitleMarkup(question.title)}
    ${optionsHtml}
    ${generateErrorContainerMarkup()}
  `;
    renderModalContent(createModalLayout(innerHtml), "w-760");
  }

  function showSkinTypeQuestion() {
    currentStep = "skin_type";
    const question = allQuestions.find(
      (q) => q.q_key === "skinCare_skinConcerns"
    );
    if (!question) return;
    const optionsHtml = generatePictureChoiceMarkup(question);
    const innerHtml = `
    <h2 class="beauty-profile-modal-body-title fw-400 fs-16-lh-22-ls-0 ff-general-sans">${
      question.title
    }</h2>
    ${optionsHtml}
    ${generateErrorContainerMarkup()}
  `;
    renderModalContent(createModalLayout(innerHtml), "w-760");
  }

  function showProperRoutineBasedOnConcernScreen() {
    currentStep = "skin_issues";

    // Get all the questions we want to display
    const skinIssuesQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_ageRange"
    );
    const skinTypeQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_skinConcerns"
    );
    const acneAllergyQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_skinIssueCondition"
    );
    const pregnantQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_is_pregnant"
    );
    const reactionQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_acneIrritation"
    );

    if (
      !skinIssuesQuestion ||
      !skinTypeQuestion ||
      !acneAllergyQuestion ||
      !pregnantQuestion ||
      !reactionQuestion
    )
      return;

    // Generate HTML for each question
    const skinIssuesHtml = generateMultiChoiceMarkup(skinIssuesQuestion);
    const skinTypeHtml = generatePictureChoiceMarkup(skinTypeQuestion);
    const acneAllergyHtml = generateSingleChoiceMarkup(acneAllergyQuestion);
    const pregnantHtml = generateSingleChoiceMarkup(pregnantQuestion);
    const reactionHtml = generateSingleChoiceMarkup(reactionQuestion, true);

    const innerHtml = `
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(skinIssuesQuestion.title)}
      ${skinIssuesHtml}
    </div>
    
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(skinTypeQuestion.title)}
      ${skinTypeHtml}
    </div>
    
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(acneAllergyQuestion.title)}
      ${acneAllergyHtml}
    </div>
    
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(pregnantQuestion.title)}
      ${pregnantHtml}
    </div>
    
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(reactionQuestion.title)}
      ${reactionHtml}
    </div>
    
    ${generateErrorContainerMarkup()}
  `;

    renderModalContent(createModalLayout(innerHtml), "w-760");
  }

  if (modal && modalBody && closeModalBtn) {
    modal.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeModal();
    });
    closeModalBtn.addEventListener("click", closeModal);
  }

  function handleProfileSelection(profileType) {
    if (!modal || !modalBody) return;
    currentProfileType = profileType;
    userAnswers = {};
    stepHistory = [];

    currentProfileQuestions = allQuestions
      .filter(
        (q) =>
          q.key === profileType &&
          q.q_key !== "skinCare_routine_or_product" &&
          q.q_key !== "skinCare_skinConcerns" &&
          q.q_key !== "skinCare_ageRange"
      )
      .sort((a, b) => a.order - b.order);

    if (!window.theme.customer_dob || !window.theme.customer_gender) {
      showDobAndGenderModal();
    } else {
      userAnswers.dob = window.theme.customer_dob;
      userAnswers.gender = window.theme.customer_gender;
      if (currentProfileType === "skincare") {
        showSkincareRoutineQuestion();
      } else {
        currentStep = 0;
        renderCurrentQuestion();
      }
    }
  }

  function createProfileTypes(productTypeQuestion) {
    const container = document.getElementById("beauty-profile-types-container");
    if (!container) return;
    if (productTypeQuestion && productTypeQuestion.options) {
      container.innerHTML = productTypeQuestion.options
        .map(
          (option) => `
          <div class="profile-type-card flex flex-col items-center gap-12 w-277 pt-12">
            <div>
              <div class="relative w-277"><img src="${option.image}" alt="${option.label} profile" loading="lazy" class="relative w-full h-222 object-cover"></div>
              <div class="w-full"><h3 class="w-full rounded-b-l-32 rounded-b-r-32 text-center uppercase pt-12 pr-8 pb-12 pl-8 bg-brand text-bg fs-26-lh-26-ls-1_2 fw-400">${option.label}</h3></div>
            </div>
            <button type="button" class="setup-now-btn button button--outline w-full flex gap-4 justify-center items-center fs-16-lh-100pct-ls-0" data-profile-type="${option.value}">
              <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.10352 13.9492C6.10352 13.2559 6.67969 12.6895 7.36328 12.6895H13.1055V6.94727C13.1055 6.26367 13.6719 5.6875 14.3652 5.6875C15.0586 5.6875 15.625 6.26367 15.625 6.94727V12.6895H21.3672C22.0605 12.6895 22.627 13.2559 22.627 13.9492C22.627 14.6426 22.0605 15.209 21.3672 15.209H15.625V20.9512C15.625 21.6445 15.0586 22.2109 14.3652 22.2109C13.6719 22.2109 13.1055 21.6445 13.1055 20.9512V15.209H7.36328C6.67969 15.209 6.10352 14.6426 6.10352 13.9492Z" fill="#FB6F92"/></svg>
              <span>Setup Now</span>
            </button>
          </div>`
        )
        .join("");
      container.querySelectorAll(".setup-now-btn").forEach((button) => {
        button.addEventListener("click", () =>
          handleProfileSelection(button.dataset.profileType)
        );
      });
    }
  }

  const apiUrl = `/apps/${window.APP_SUB_PATH}/customer/beauty-profile`;

  async function initializeProfile() {
    try {
      const response = await fetch(`${apiUrl}/questions`);
      const { questions } = await response.json();
      if (!questions || questions.length === 0) return;
      allQuestions = questions;
      const productTypeQuestion = questions.find(
        (q) => q.key === "product_type"
      );
      createProfileTypes(productTypeQuestion);
    } catch (error) {
      console.log(error);
    }
  }

  initializeProfile();
});

// document.addEventListener("DOMContentLoaded", async function () {
//   console.log("LOADED...");
//   const apiURL = `/apps/${APP_SUB_PATH}/customer/beauty-profile`;
//   const container = document.getElementById("questions-container");
//   const tabsWrapper = document.getElementById("beauty-tabs");
//   const ageInput = document.getElementById("customer-age");
//   let activeTab = null;
//   const tabAnswers = {
//     skincare: {},
//     haircare: {},
//     makeup: {},
//   };
//   let preloadedProfile = null;
//   const skippedOrders = [6, 7, 8, 9, 10, 11];
//   let allQuestions = [];
//   let productTypes = [];

//   try {
//     const response = await fetch(`${apiURL}/questions`);
//     const data = await response.json();
//     if (Array.isArray(data.questions)) {
//       allQuestions = data.questions;
//       const productTypeQuestion = allQuestions.find(
//         (q) => q.key === "product_type"
//       );
//       if (productTypeQuestion) {
//         productTypes = productTypeQuestion.options;
//       }
//     } else {
//       throw new Error("Invalid API response");
//     }
//   } catch (error) {
//     console.error("Error fetching questions:", error);
//     container.innerHTML = "<p>Failed to load questions.</p>";
//     return;
//   }

//   try {
//     const profileRes = await fetch(`${apiURL}`);
//     const profileData = await profileRes.json();
//     if (profileData.success && profileData.data) {
//       preloadedProfile = profileData.data;

//       // Pre-fill age
//       if (preloadedProfile.customerAge) {
//         ageInput.value = preloadedProfile.customerAge;
//       }

//       // Pre-fill skincare answers
//       if (preloadedProfile.skincare) {
//         const s = preloadedProfile.skincare;
//         tabAnswers.skincare = {
//           1: s.skinConcerns || [],
//           2: s.skinType || "",
//           3: s.currentSkinCareProducts || [],
//           4: s.productTypePreference || [],
//           5: s.skinIssueCondition || "",
//           6: s.acneIrritation || "",
//           7: s.acneType || "",
//           8: s.usedWhiteningProduct || "",
//           9: s.faceImageUploaded ? "yes" : "no",
//           10: "",
//           11: "", // optional if no value
//           faceImageUrl: s.faceImageUrl || "",
//         };
//       }

//       // Pre-fill haircare answers
//       if (preloadedProfile.haircare) {
//         const h = preloadedProfile.haircare;
//         const hairQuestions = allQuestions.filter((q) => q.key === "haircare");
//         const hairConcernQ = hairQuestions.find(
//           (q) =>
//             q.title.toLowerCase().includes("hair concern") ||
//             q.title.toLowerCase().includes("concern")
//         );
//         if (hairConcernQ) {
//           // Handle both array and string formats
//           tabAnswers.haircare[hairConcernQ._id] = Array.isArray(h.concern)
//             ? h.concern
//             : [h.concern];
//         }
//       }

//       // Pre-fill makeup answers
//       if (preloadedProfile.makeup) {
//         const m = preloadedProfile.makeup;
//         const makeupQuestions = allQuestions.filter((q) => q.key === "makeup");
//         const catQ = makeupQuestions.find(
//           (q) =>
//             q.title.toLowerCase().includes("makeup category") ||
//             q.title.toLowerCase().includes("category")
//         );
//         const skinTypeQ = makeupQuestions.find((q) =>
//           q.title.toLowerCase().includes("skin type")
//         );
//         const skinToneQ = makeupQuestions.find((q) =>
//           q.title.toLowerCase().includes("skin tone")
//         );
//         const undertoneQ = makeupQuestions.find((q) =>
//           q.title.toLowerCase().includes("undertone")
//         );

//         if (catQ) {
//           tabAnswers.makeup[catQ._id] = m.categories || "";
//           tabAnswers.makeup[`sub_${catQ._id}`] = m.subCategories || [];
//         }
//         if (skinTypeQ) {
//           tabAnswers.makeup[skinTypeQ._id] = m.skinType || "";
//         }
//         if (skinToneQ) {
//           tabAnswers.makeup[skinToneQ._id] = m.skinTone?.type || "";
//         }
//         if (undertoneQ) {
//           tabAnswers.makeup[undertoneQ._id] = m.skinUnderTone || "";
//         }
//       }
//     }
//   } catch (err) {
//     console.error("Error fetching profile on load:", err);
//   }

//   tabsWrapper.innerHTML = "";
//   productTypes.forEach((type) => {
//     const btn = document.createElement("button");
//     btn.textContent = type.label;
//     btn.setAttribute("data-type", type.value);
//     tabsWrapper.appendChild(btn);
//   });

//   const tabs = tabsWrapper.querySelectorAll("button");

//   // Function to fetch and display suggested products
//   async function fetchAndDisplaySuggestions(profileType) {
//     const suggestionBlock = document.getElementById("suggestion-output");
//     suggestionBlock.innerHTML = "<p>Loading suggestions...</p>";

//     try {
//       const response = await fetch(
//         `${apiURL}/suggestionProducts/${profileType}`
//       );
//       const data = await response.json();

//       if (
//         response.ok &&
//         data.success &&
//         data.data &&
//         Array.isArray(data.data.edges)
//       ) {
//         const products = data.data.edges.map((edge) => edge.node);

//         if (products.length > 0) {
//           const productList = products
//             .map((product) => {
//               const img = product.featuredImage?.url || "";
//               const alt = product.featuredImage?.altText || product.title;
//               const title = product.title;
//               const handle = product.handle;
//               const productType = product.productType || "N/A";
//               const inventory = product.totalInventory;
//               const inventoryStatus =
//                 inventory > 0
//                   ? `<span style="color:green;">In stock</span>`
//                   : `<span style="color:red;">Out of stock</span>`;

//               return `
//               <li style="display: flex; gap: 15px; margin-bottom: 10px; align-items: center;">
//                 <img src="${img}" alt="${alt}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;" />
//                 <div>
//                   <a href="/products/${handle}" target="_blank" style="font-weight: bold; color: #007bff; text-decoration: none;">
//                     ${title}
//                   </a>
//                   <div>Type: ${productType}</div>
//                   <div>${inventoryStatus}</div>
//                 </div>
//               </li>
//             `;
//             })
//             .join("");

//           suggestionBlock.innerHTML = `
//           <p><strong>Suggested Products:</strong></p>
//           <ul style="list-style: none; padding-left: 0;">${productList}</ul>
//         `;
//         } else {
//           suggestionBlock.innerHTML = "<p>No suggestions available.</p>";
//         }
//       } else {
//         throw new Error(data.message || "Failed to fetch suggestions");
//       }
//     } catch (error) {
//       console.error("Error fetching suggestions:", error);
//       suggestionBlock.innerHTML = "<p>Failed to load suggestions.</p>";
//     }
//   }

//   tabs.forEach((button) => {
//     button.addEventListener("click", () => {
//       activeTab = button.getAttribute("data-type");
//       // Remove 'active' class from all tabs and add to the clicked one
//       tabs.forEach((btn) => btn.classList.remove("active"));
//       button.classList.add("active");

//       container.innerHTML = "<p>Loading...</p>";

//       const filteredQuestions = allQuestions.filter((q) => q.key === activeTab);

//       if (filteredQuestions.length > 0) {
//         if (activeTab === "skincare") {
//           renderSkincare(filteredQuestions);
//         } else {
//           renderGeneric(filteredQuestions);
//           // Show save button for haircare and makeup
//           document.getElementById("save-answers").style.display =
//             "inline-block";
//         }
//         // Fetch and display suggestions for the active tab
//         fetchAndDisplaySuggestions(activeTab);
//       } else {
//         container.innerHTML = "<p>No questions available.</p>";
//         document.getElementById("save-answers").style.display = "none";
//         document.getElementById("suggestion-output").innerHTML = ""; // Clear suggestions
//       }
//     });
//   });

//   if (tabs.length > 0) tabs[0].click();

//   // --- renderSkincare function ---
//   function renderSkincare(questions) {
//     container.innerHTML = "";
//     const form = document.createElement("form");
//     form.id = "skincare-form";

//     // Use existing answers or initialize empty
//     const answers = tabAnswers.skincare || {};
//     tabAnswers.skincare = answers;

//     const renderedOrders = new Set();
//     const suggestionBlock = document.getElementById("suggestion-output");
//     // suggestionBlock.innerHTML = ""; // This will be handled by fetchAndDisplaySuggestions

//     const saveButton = document.getElementById("save-answers");
//     saveButton.style.display = "inline-block";

//     saveButton.onclick = async () => {
//       const ageValue = ageInput.value.trim();
//       if (!ageValue) {
//         alert("Please enter your age.");
//         return;
//       }

//       const requiredQuestions = allQuestions.filter(
//         (q) => q.isRequired && activeTab === q.key
//       );

//       const answers = tabAnswers[activeTab] || {};

//       for (const q of requiredQuestions) {
//         const key = activeTab === "skincare" ? q.order : q._id;
//         const val = answers[key];
//         if (!val || (Array.isArray(val) && val.length === 0)) {
//           alert(`Please answer: ${q.title}`);
//           return;
//         }
//       }

//       // The suggestion logic below is for client-side display and should be kept separate
//       // from the API call for suggestions, which will now happen on tab change.
//       // If you still want this client-side logic to update the suggestion block,
//       // consider if it conflicts with the API-driven suggestions.
//       // For now, I'm commenting it out as the new API call will manage suggestions.
//       /*
//       if (activeTab === "skincare") {
//         const val5 = answers[5];
//         const val6 = answers[6];

//         let suggestion = "Suggested products";
//         if (val5 === "only_allergy") {
//           suggestion = "No suggestion";
//         } else if ((val5 === "only_acne" || val5 === "both_acne_allergy") && val6 !== "no_itch_pain") {
//           suggestion = "No suggestion";
//         }

//         suggestionBlock.innerHTML = `<p><strong>${suggestion}</strong></p>`;
//       } else {
//         suggestionBlock.innerHTML = "";
//       }
//       */

//       const payload = {
//         customerAge: Number(ageValue),
//       };

//       if (activeTab === "skincare") {
//         const ageRange = getAgeRangeForSkinCare(Number(ageValue));

//         payload.skincare = {
//           ageRange,
//           skinConcerns: answers[1] || [],
//           currentSkinCareProducts: answers[3] || [],
//           productTypePreference: answers[4] || [],
//           skinType: answers[2] || "",
//           skinIssueCondition: answers[5] || "",
//           acneIrritation: answers[6] || "",
//           acneType: answers[7] || "",
//           usedWhiteningProduct: answers[8] || "",
//           faceImageUploaded: answers[9] === "yes",
//           faceImageUrl: answers.faceImageUrl || "",
//           isCompleted: true,
//         };
//       }

//       if (activeTab === "haircare") {
//         const ageRange = getAgeRangeForHairCare(Number(ageValue));
//         const hairQuestions = allQuestions.filter((q) => q.key === "haircare");
//         const hairConcernQuestion = hairQuestions.find(
//           (q) =>
//             q.title.toLowerCase().includes("hair concern") ||
//             q.title.toLowerCase().includes("concern")
//         );

//         payload.haircare = {
//           concern: tabAnswers.haircare[hairConcernQuestion?._id] || [],
//           ageRange: ageRange,
//           isCompleted: true,
//         };
//       }

//       if (activeTab === "makeup") {
//         const makeupAnswers = tabAnswers.makeup;
//         const makeupQuestions = allQuestions.filter((q) => q.key === "makeup");

//         const categoryQuestion = makeupQuestions.find(
//           (q) =>
//             q.title.toLowerCase().includes("makeup category") ||
//             q.title.toLowerCase().includes("category")
//         );
//         const skinTypeQuestion = makeupQuestions.find((q) =>
//           q.title.toLowerCase().includes("skin type")
//         );
//         const skinToneQuestion = makeupQuestions.find((q) =>
//           q.title.toLowerCase().includes("skin tone")
//         );
//         const skinUndertoneQuestion = makeupQuestions.find((q) =>
//           q.title.toLowerCase().includes("undertone")
//         );

//         const selectedSkinTone = skinToneQuestion?.options.find(
//           (opt) => opt.value === makeupAnswers[skinToneQuestion?._id]
//         );

//         payload.makeup = {
//           categories: makeupAnswers[categoryQuestion?._id] || "",
//           subCategories: makeupAnswers[`sub_${categoryQuestion?._id}`] || [],
//           skinType: makeupAnswers[skinTypeQuestion?._id] || "",
//           skinTone: {
//             type: makeupAnswers[skinToneQuestion?._id] || "",
//             group: selectedSkinTone?.group?.toLowerCase() || "",
//           },
//           skinUnderTone: makeupAnswers[skinUndertoneQuestion?._id] || "",
//           isCompleted: true,
//         };
//       }

//       try {
//         const res = await fetch(`${apiURL}/create`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         });

//         const result = await res.json();
//         if (!res.ok) throw new Error(result.message || "Submission failed");

//         alert("Profile submitted successfully!");
//         // After successful submission, re-fetch suggestions based on the updated profile
//         fetchAndDisplaySuggestions(activeTab);
//       } catch (err) {
//         console.error(err);
//         alert("Failed to submit profile.");
//       }
//     };

//     const renderQuestion = (q) => {
//       if (renderedOrders.has(q.order)) return;
//       const wrapper = document.createElement("div");
//       wrapper.className = "question-block";
//       wrapper.dataset.order = q.order;

//       const title = document.createElement("p");
//       title.innerHTML = `<strong>${q.title}</strong>${
//         q.isRequired ? " *" : ""
//       }`;
//       wrapper.appendChild(title);

//       if (q.order === 4) {
//         renderGroupedQuestion4(q, wrapper, answers);
//       } else {
//         q.options.forEach((opt) => {
//           const label = document.createElement("label");
//           const input = document.createElement("input");

//           input.type = q.type === "multi_choice" ? "checkbox" : "radio";
//           input.name = q._id;
//           input.value = opt.value;

//           // Preselect based on existing answers
//           if (answers[q.order]) {
//             if (input.type === "checkbox") {
//               if (
//                 Array.isArray(answers[q.order]) &&
//                 answers[q.order].includes(opt.value)
//               ) {
//                 input.checked = true;
//               }
//             } else {
//               if (answers[q.order] === opt.value) {
//                 input.checked = true;
//               }
//             }
//           }

//           if (q.type === "picture_choice") {
//             const img = document.createElement("img");
//             img.src = opt.imageUrl;
//             img.alt = opt.label;
//             img.width = 80;
//             img.height = 80;
//             label.appendChild(input);
//             label.appendChild(img);
//           } else {
//             label.appendChild(input);
//             label.append(` ${opt.label}`);
//           }

//           input.addEventListener("change", () => {
//             if (q.order === 3) {
//               // For question 3, combine checkbox values with text field value
//               updateQuestion3Answers(wrapper, answers, q);
//             } else {
//               answers[q.order] =
//                 input.type === "checkbox"
//                   ? getCheckedValues(form, q._id)
//                   : input.value;
//             }

//             handleConditionals();

//             if (q.order === 9) {
//               if (input.value === "yes" && input.checked) {
//                 showFileInput(wrapper);
//               } else if (input.value === "no" && input.checked) {
//                 removeFileInput(wrapper);
//               }
//             }

//             if (opt.sub_category && input.checked) {
//               showSubCategory(opt, wrapper, q.order);
//             } else if (opt.sub_category) {
//               removeSubCategory(wrapper);
//             }
//           });

//           wrapper.appendChild(label);
//           wrapper.appendChild(document.createElement("br"));
//         });
//       }

//       form.appendChild(wrapper);
//       renderedOrders.add(q.order);

//       // Add text field for question 3 (current skincare products)
//       if (q.order === 3) {
//         addTextFieldForQuestion3(wrapper, answers, q);
//       }

//       if (q.order === 9 && answers[9] === "yes") {
//         showFileInput(wrapper);
//       }
//     };

//     const renderGroupedQuestion4 = (q, wrapper, answers) => {
//       const firstGroup = q.options.slice(0, 8);
//       const secondGroup = q.options.slice(8);

//       const firstGroupDiv = document.createElement("div");
//       firstGroupDiv.className = "question-group";
//       firstGroupDiv.innerHTML =
//         "<p><strong>Select specific products:</strong></p>";

//       firstGroup.forEach((opt) => {
//         const label = document.createElement("label");
//         const input = document.createElement("input");
//         input.type = "checkbox";
//         input.name = `${q._id}_group1`;
//         input.value = opt.value;
//         input.className = "group1-option";

//         // Preselect checkboxes - only if the saved value is actually from the first group
//         if (
//           answers[q.order] &&
//           Array.isArray(answers[q.order]) &&
//           answers[q.order].includes(opt.value) &&
//           firstGroup.some((option) => option.value === opt.value)
//         ) {
//           input.checked = true;
//         }

//         label.appendChild(input);
//         label.append(` ${opt.label}`);
//         firstGroupDiv.appendChild(label);
//         firstGroupDiv.appendChild(document.createElement("br"));
//       });

//       const secondGroupDiv = document.createElement("div");
//       secondGroupDiv.className = "question-group";
//       secondGroupDiv.innerHTML = "<p><strong>Or choose a routine:</strong></p>";

//       secondGroup.forEach((opt) => {
//         const label = document.createElement("label");
//         const input = document.createElement("input");
//         input.type = "radio";
//         input.name = `${q._id}_group2`;
//         input.value = opt.value;
//         input.className = "group2-option";

//         // Preselect radio button - handle both string and array cases
//         let shouldCheck = false;

//         if (answers[q.order]) {
//           if (Array.isArray(answers[q.order])) {
//             // If it's an array, check if this option is in the array AND belongs to second group
//             shouldCheck =
//               answers[q.order].includes(opt.value) &&
//               secondGroup.some((option) => option.value === opt.value);
//           } else {
//             // If it's a string, check direct match
//             shouldCheck = answers[q.order] === opt.value;
//           }
//         }

//         if (shouldCheck) {
//           input.checked = true;
//         }

//         label.appendChild(input);
//         label.append(` ${opt.label}`);
//         secondGroupDiv.appendChild(label);
//         secondGroupDiv.appendChild(document.createElement("br"));
//       });

//       wrapper.appendChild(firstGroupDiv);
//       wrapper.appendChild(secondGroupDiv);

//       const group1Inputs = wrapper.querySelectorAll(".group1-option");
//       const group2Inputs = wrapper.querySelectorAll(".group2-option");

//       group1Inputs.forEach((input) => {
//         input.addEventListener("change", () => {
//           if (input.checked) {
//             group2Inputs.forEach((g2Input) => {
//               g2Input.checked = false;
//               g2Input.disabled = true;
//             });
//           } else {
//             const anyGroup1Selected = Array.from(group1Inputs).some(
//               (inp) => inp.checked
//             );
//             if (!anyGroup1Selected) {
//               group2Inputs.forEach((g2Input) => {
//                 g2Input.disabled = false;
//               });
//             }
//           }
//           updateQuestion4Answers(wrapper, answers, q.order);
//         });
//       });

//       group2Inputs.forEach((input) => {
//         input.addEventListener("change", () => {
//           if (input.checked) {
//             group1Inputs.forEach((g1Input) => {
//               g1Input.checked = false;
//               g1Input.disabled = true;
//             });
//           } else {
//             const anyGroup2Selected = Array.from(group2Inputs).some(
//               (inp) => inp.checked
//             );
//             if (!anyGroup2Selected) {
//               group1Inputs.forEach((g1Input) => {
//                 g1Input.disabled = false;
//               });
//             }
//           }
//           updateQuestion4Answers(wrapper, answers, q.order);
//         });
//       });

//       // FIXED: Set initial state based on preloaded data
//       const anyGroup1Selected = Array.from(group1Inputs).some(
//         (inp) => inp.checked
//       );
//       const anyGroup2Selected = Array.from(group2Inputs).some(
//         (inp) => inp.checked
//       );

//       if (anyGroup1Selected) {
//         group2Inputs.forEach((g2Input) => {
//           g2Input.disabled = true;
//         });
//       } else if (anyGroup2Selected) {
//         group1Inputs.forEach((g1Input) => {
//           g1Input.disabled = true;
//         });
//       }
//     };

//     const updateQuestion4Answers = (wrapper, answers, order) => {
//       const group1Inputs = wrapper.querySelectorAll(".group1-option:checked");
//       const group2Inputs = wrapper.querySelectorAll(".group2-option:checked");

//       if (group1Inputs.length > 0) {
//         answers[order] = Array.from(group1Inputs).map((inp) => inp.value);
//       } else if (group2Inputs.length > 0) {
//         answers[order] = group2Inputs[0].value;
//       } else {
//         answers[order] = [];
//       }
//     };

//     const addTextFieldForQuestion3 = (wrapper, answers, q) => {
//       const textFieldWrapper = document.createElement("div");
//       textFieldWrapper.className = "text-field-wrapper";
//       textFieldWrapper.style.marginTop = "10px";

//       const textLabel = document.createElement("label");
//       textLabel.textContent = "Other products (please specify):";
//       textLabel.style.fontWeight = "bold";
//       textLabel.style.display = "block";
//       textLabel.style.marginBottom = "5px";

//       const textInput = document.createElement("input");
//       textInput.type = "text";
//       textInput.name = `${q._id}_other`;
//       textInput.placeholder = "Enter other skincare products...";
//       textInput.style.width = "100%";
//       textInput.style.padding = "8px";
//       textInput.style.border = "1px solid #ccc";
//       textInput.style.borderRadius = "4px";

//       // Pre-fill text field if there are custom values in answers
//       if (answers[q.order] && Array.isArray(answers[q.order])) {
//         const customValues = answers[q.order].filter((val) => {
//           return !q.options.some((opt) => opt.value === val);
//         });
//         if (customValues.length > 0) {
//           textInput.value = customValues.join(", ");
//         }
//       }

//       textInput.addEventListener("input", () => {
//         updateQuestion3Answers(wrapper, answers, q);
//       });

//       textFieldWrapper.appendChild(textLabel);
//       textFieldWrapper.appendChild(textInput);
//       wrapper.appendChild(textFieldWrapper);
//     };

//     const updateQuestion3Answers = (wrapper, answers, q) => {
//       const checkboxValues = getCheckedValues(wrapper, q._id);
//       const textInput = wrapper.querySelector(`input[name="${q._id}_other"]`);
//       const textValue = textInput ? textInput.value.trim() : "";

//       let combinedValues = [...checkboxValues];

//       if (textValue) {
//         // Split by comma and clean up each value
//         const textValues = textValue
//           .split(",")
//           .map((val) => val.trim())
//           .filter((val) => val);
//         combinedValues = combinedValues.concat(textValues);
//       }

//       answers[q.order] = combinedValues;
//     };

//     const showSubCategory = (opt, wrapper, order) => {
//       removeSubCategory(wrapper);
//       const subWrapper = document.createElement("div");
//       subWrapper.className = "subcategory-block";
//       subWrapper.dataset.parentOrder = order;
//       opt.sub_category.forEach((sub) => {
//         const label = document.createElement("label");
//         const input = document.createElement("input");
//         input.type = "checkbox";
//         input.name = `sub_${order}`;
//         input.value = sub.value;
//         label.appendChild(input);
//         label.append(` ${sub.label}`);
//         subWrapper.appendChild(label);
//         subWrapper.appendChild(document.createElement("br"));
//       });
//       wrapper.appendChild(subWrapper);
//     };

//     const removeSubCategory = (wrapper) => {
//       const existing = wrapper.querySelector(".subcategory-block");
//       if (existing) existing.remove();
//     };

//     // Helper function to render the image preview
//     function renderImagePreview(wrapper, imageUrl) {
//       // Clear any existing preview first
//       const existingPreview = wrapper.querySelector(".image-preview-wrapper");
//       if (existingPreview) existingPreview.remove();

//       // If no imageUrl, do nothing else
//       if (!imageUrl) return;

//       const previewWrapper = document.createElement("div");
//       previewWrapper.className = "image-preview-wrapper";
//       previewWrapper.style.marginBottom = "10px";

//       const previewImage = document.createElement("img");
//       previewImage.src = imageUrl;
//       previewImage.alt = "Uploaded photo";
//       previewImage.style.maxWidth = "100px";
//       previewImage.style.maxHeight = "100px";
//       previewImage.style.borderRadius = "8px";

//       previewWrapper.appendChild(previewImage);
//       wrapper.appendChild(previewWrapper);
//     }

//     // The main function, now updated and complete
//     const showFileInput = (wrapper) => {
//       removeFileInput(wrapper); // Clear old elements

//       // Render the existing image preview first, if a URL exists
//       renderImagePreview(wrapper, tabAnswers.skincare.faceImageUrl);

//       const fileInputWrapper = document.createElement("div");
//       fileInputWrapper.className = "file-input-wrapper";
//       fileInputWrapper.style.display = "flex";
//       fileInputWrapper.style.alignItems = "center";

//       const fileLabel = document.createElement("label");
//       fileLabel.textContent = tabAnswers.skincare.faceImageUrl
//         ? "Upload a different photo:"
//         : "Upload your face photo:";
//       fileLabel.htmlFor = "face-photo-upload";

//       const fileInput = document.createElement("input");
//       fileInput.type = "file";
//       fileInput.accept = "image/*";
//       fileInput.id = "face-photo-upload";
//       fileInput.name = "face_photo";

//       fileInput.addEventListener("change", async (event) => {
//         const file = event.target.files[0];
//         if (!file) return;

//         const spinner = document.createElement("div");
//         spinner.className = "face-image_upload-spinner";
//         fileInputWrapper.appendChild(spinner);
//         fileInput.disabled = true;

//         const formData = new FormData();
//         formData.append("face_photo", file);

//         try {
//           const response = await fetch(`${apiURL}/image-upload`, {
//             method: "POST",
//             body: formData,
//           });

//           const result = await response.json();
//           if (!response.ok) throw new Error(result.message || "Upload failed.");

//           alert("Image uploaded successfully!");
//           tabAnswers.skincare.faceImageUrl = result.faceImageUrl; // Store the new URL

//           // Update the UI with the new image
//           renderImagePreview(wrapper, result.faceImageUrl);
//           fileLabel.textContent = "Upload a different photo:"; // Update label text
//         } catch (error) {
//           console.error("Error uploading image:", error);
//           alert(error.message);
//         } finally {
//           spinner.remove();
//           fileInput.disabled = false;
//         }
//       });

//       fileInputWrapper.appendChild(fileLabel);
//       fileInputWrapper.appendChild(fileInput);
//       wrapper.appendChild(fileInputWrapper);
//     };

//     // Updated remove function to clean up both preview and input
//     const removeFileInput = (wrapper) => {
//       const existingPreview = wrapper.querySelector(".image-preview-wrapper");
//       if (existingPreview) existingPreview.remove();

//       const existingInput = wrapper.querySelector(".file-input-wrapper");
//       if (existingInput) existingInput.remove();
//     };

//     const handleConditionals = () => {
//       // First, remove all conditionally rendered questions to re-render them correctly
//       skippedOrders.forEach((order) => {
//         const el = form.querySelector(`.question-block[data-order='${order}']`);
//         if (el) {
//           el.remove();
//           renderedOrders.delete(order);
//         }
//       });

//       const q5Val = answers[5];
//       const q6Val = answers[6];
//       const getQ = (order) => questions.find((q) => q.order === order);

//       // Re-render questions based on conditions
//       if (q5Val === "only_allergy") {
//         [7, 8, 9, 10, 11].forEach((order) => {
//           const q = getQ(order);
//           if (q) renderQuestion(q);
//         });
//       } else if (q5Val === "only_acne" || q5Val === "both_acne_allergy") {
//         const q6 = getQ(6);
//         if (q6) renderQuestion(q6);

//         if (["itch_red_burn", "itch_sometimes", "painful"].includes(q6Val)) {
//           [7, 8, 9, 10, 11].forEach((order) => {
//             const q = getQ(order);
//             if (q) renderQuestion(q);
//           });
//         } else if (q6Val === "no_itch_pain") {
//           [7, 8, 9, 10, 11].forEach((order) => {
//             const q = getQ(order);
//             if (q) renderQuestion(q);
//           });
//         }
//       }
//     };

//     questions
//       .filter((q) => q.order !== null && q.order <= 5)
//       .sort((a, b) => a.order - b.order)
//       .forEach((q) => renderQuestion(q));

//     // Handle conditional questions based on preloaded data
//     handleConditionals();

//     container.appendChild(form);
//   }

//   function getCheckedValues(form, name) {
//     return Array.from(
//       form.querySelectorAll(`input[name="${name}"]:checked`)
//     ).map((input) => input.value);
//   }

//   function getAgeRangeForSkinCare(age) {
//     if (age >= 0 && age <= 0.5) return "Newborn_6_months";
//     if (age > 0.5 && age <= 9) return "6_months_9 years";
//     if (age >= 10 && age <= 17) return "10_17_years";
//     if (age >= 18 && age <= 25) return "18_25_years";
//     return "25_years";
//   }

//   function getAgeRangeForHairCare(age) {
//     if (age >= 0 && age <= 11) return "Newborn_11_years";
//     if (age > 11 && age <= 17) return "12–17_years";
//     return "18_years";
//   }

//   function renderGeneric(questions) {
//     container.innerHTML = "";
//     const form = document.createElement("form");

//     // Use existing answers or initialize empty
//     const answers = tabAnswers[activeTab] || {};
//     tabAnswers[activeTab] = answers;

//     questions.forEach((q) => {
//       const wrapper = document.createElement("div");
//       wrapper.className = "question-block";

//       const title = document.createElement("p");
//       title.innerHTML = `<strong>${q.title}</strong>${
//         q.isRequired ? " *" : ""
//       }`;
//       wrapper.appendChild(title);

//       q.options.forEach((opt) => {
//         const label = document.createElement("label");
//         const input = document.createElement("input");

//         input.type = q.type === "multi_choice" ? "checkbox" : "radio";
//         input.name = q._id;
//         input.value = opt.value;

//         // Preselect based on existing answers
//         if (answers[q._id]) {
//           if (input.type === "checkbox") {
//             if (
//               Array.isArray(answers[q._id]) &&
//               answers[q._id].includes(opt.value)
//             ) {
//               input.checked = true;
//             }
//           } else {
//             if (answers[q._id] === opt.value) {
//               input.checked = true;
//             }
//           }
//         }

//         if (q.type === "picture_choice") {
//           const img = document.createElement("img");
//           img.src = opt.imageUrl;
//           img.alt = opt.label;
//           img.width = 80;
//           img.height = 80;
//           label.appendChild(input);
//           label.appendChild(img);
//         } else {
//           label.appendChild(input);
//           label.append(` ${opt.label}`);
//         }

//         input.addEventListener("change", () => {
//           answers[q._id] =
//             input.type === "checkbox"
//               ? getCheckedValues(form, q._id)
//               : input.value;

//           removeSubCategory(wrapper);
//           if (opt.sub_category && input.checked) {
//             showSubCategory(opt, wrapper, q._id);
//           }
//         });

//         wrapper.appendChild(label);
//         wrapper.appendChild(document.createElement("br"));
//       });

//       form.appendChild(wrapper);

//       // Handle preloaded subcategories
//       if (answers[`sub_${q._id}`] && Array.isArray(answers[`sub_${q._id}`])) {
//         const selectedOption = q.options.find((opt) => {
//           if (q.type === "multi_choice") {
//             return (
//               Array.isArray(answers[q._id]) &&
//               answers[q._id].includes(opt.value)
//             );
//           } else {
//             return answers[q._id] === opt.value;
//           }
//         });

//         if (selectedOption && selectedOption.sub_category) {
//           showSubCategory(selectedOption, wrapper, q._id);
//           // Preselect subcategory options
//           setTimeout(() => {
//             const subInputs = wrapper.querySelectorAll(
//               `input[name="sub_${q._id}"]`
//             );
//             subInputs.forEach((subInput) => {
//               if (answers[`sub_${q._id}`].includes(subInput.value)) {
//                 subInput.checked = true;
//               }
//             });
//           }, 0);
//         }
//       }
//     });

//     container.appendChild(form);

//     function showSubCategory(opt, wrapper, name) {
//       removeSubCategory(wrapper);
//       const subWrapper = document.createElement("div");
//       subWrapper.className = "subcategory-block";
//       opt.sub_category.forEach((sub) => {
//         const subLabel = document.createElement("label");
//         const subInput = document.createElement("input");
//         subInput.type = "checkbox";
//         subInput.name = `sub_${name}`;
//         subInput.value = sub.value;

//         subInput.addEventListener("change", () => {
//           answers[`sub_${name}`] = getCheckedValues(form, `sub_${name}`);
//         });

//         subLabel.appendChild(subInput);
//         subLabel.append(` ${sub.label}`);
//         subWrapper.appendChild(subLabel);
//         subWrapper.appendChild(document.createElement("br"));
//       });
//       wrapper.appendChild(subWrapper);
//     }

//     function removeSubCategory(wrapper) {
//       const existing = wrapper.querySelector(".subcategory-block");
//       if (existing) existing.remove();
//     }
//   }
// });
