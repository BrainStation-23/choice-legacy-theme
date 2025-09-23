document.addEventListener("DOMContentLoaded", async () => {
  const modal = document.getElementById("beauty-profile-modal");
  const modalBody = document.getElementById("beauty-profile-modal-body");
  const closeModalBtn = document.getElementById(
    "beauty-profile-modal-close-btn"
  );
  const apiUrl = `/apps/${window.APP_SUB_PATH}/customer/beauty-profile`;

  let allQuestions = [];
  let currentProfileQuestions = [];
  let currentStep = -1;
  let userAnswers = {};
  let currentProfileType = "";
  let stepHistory = [];
  let currentAnswer = null;
  let existingProfileData = null;

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  async function uploadImageFile(file, type = "face") {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", type);

    try {
      const response = await fetch(
        `/apps/${window.APP_SUB_PATH}/customer/image-upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          imageUrl: result.imageUrl,
        };
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

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
      field.addEventListener("input", (e) => {
        field.value = field.value.replace(/[^0-9]/g, "");

        if (field === dd) {
          if (field.value.length === 1 && parseInt(field.value) > 3) {
            field.value = "0" + field.value;
          }
          if (parseInt(field.value) > 31) {
            field.value = "31";
          }
        } else if (field === mm) {
          if (field.value.length === 1 && parseInt(field.value) > 1) {
            field.value = "0" + field.value;
          }
          if (parseInt(field.value) > 12) {
            field.value = "12";
          }
        } else if (field === yyyy) {
          if (field.value.length === 4) {
            const year = parseInt(field.value);
            const currentYear = new Date().getFullYear();
            const minYear = currentYear - 120;

            if (year > currentYear) {
              field.value = currentYear.toString();
            } else if (year < minYear) {
              field.value = minYear.toString();
            }
          }
        }

        if (
          field.value.length === field.maxLength &&
          index < fields.length - 1
        ) {
          fields[index + 1].focus();
        }
      });

      field.addEventListener("blur", () => {
        if (field === dd && field.value) {
          const day = parseInt(field.value);
          if (day < 1) field.value = "01";
          else if (day < 10) field.value = field.value.padStart(2, "0");
        } else if (field === mm && field.value) {
          const month = parseInt(field.value);
          if (month < 1) field.value = "01";
          else if (month < 10) field.value = field.value.padStart(2, "0");
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

          const selectedCount =
            optionsContainer.querySelectorAll(".is-selected").length;
          const placeholder = optionsContainer.querySelector(".placeholder");
          if (placeholder) {
            placeholder.textContent =
              selectedCount > 0
                ? `${selectedCount} selected`
                : "you can choose multiple";
          }
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

    // Handle face upload toggle and file input
    const faceUploadToggle = modalBody.querySelector("#face-upload-toggle");
    const fileInput = modalBody.querySelector("#face-image-upload");
    const uploadPlaceholder = modalBody.querySelector(".upload-placeholder");

    if (faceUploadToggle) {
      faceUploadToggle.addEventListener("change", (e) => {
        const imageUploadSection = modalBody.querySelector(
          ".image-upload-section"
        );
        if (imageUploadSection) {
          if (e.target.checked) {
            imageUploadSection.classList.remove("hidden");
            currentAnswer = true;
            if (!userAnswers.skincare) userAnswers.skincare = {};
            userAnswers.skincare.faceImageUploaded = false;
            userAnswers.skincare.faceImageUrl = "";
          } else {
            currentAnswer = false;
            if (userAnswers.skincare) {
              userAnswers.skincare.faceImageUploaded = false;
              userAnswers.skincare.faceImageUrl = "";
            }
          }
        }
      });
    }

    if (uploadPlaceholder && fileInput) {
      uploadPlaceholder.addEventListener("click", () => {
        fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          const imagePreview = modalBody.querySelector(".image-preview");
          const previewImg = modalBody.querySelector(".image-preview img");

          try {
            const uploadResult = await uploadImageFile(file, "face");

            if (uploadResult.success) {
              previewImg.src = uploadResult.imageUrl;
              imagePreview.classList.remove("hidden");

              if (!userAnswers.skincare) userAnswers.skincare = {};
              userAnswers.skincare.faceImageUrl = uploadResult.imageUrl;
              userAnswers.skincare.faceImageUploaded = true;

              currentAnswer = true;
            }
          } catch (error) {
            console.error("Upload error:", error);
          }
        }
      });
    }

    await openModal();
    await delay(50);
  }

  function generateSingleChoiceMarkup(question, flexCol = false) {
    const groupKey = question.key;
    const answerKey = question.q_key
      .replace(new RegExp(`^${question.key}_`, "i"), "")
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    const savedAnswer = userAnswers[groupKey]?.[answerKey];

    if (question.q_key === "skinCare_faceImageUploaded") {
      const isChecked = savedAnswer === true;
      const existingImageUrl = userAnswers.skincare?.faceImageUrl || "";

      return `
    <div class="face-upload-container flex flex-col gap-16">
      <div class="toggle-container flex items-center gap-12">
        <label class="toggle-switch relative inline-block w-44 h-24">
          <input type="checkbox" class="hidden" id="face-upload-toggle" ${
            isChecked ? "checked" : ""
          }>
          <span class="toggle-slider absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-secondary rounded-77 transition-all duration-300 before:content-[''] before:absolute before:h-18 before:w-18 before:left-3 before:bottom-3 before:bg-white before:transition-all before:duration-300 before:rounded-full"></span>
        </label>
        <span class="toggle-label fw-400 fs-16-lh-22-ls-0">${
          question.title
        }</span>
      </div>
      <div class="image-upload-section ${isChecked ? "" : "hidden"} flex gap-8">
        <div class="image-upload-area relative flex gap-8">
          <input type="file" id="face-image-upload" class="absolute w-60 h-full cursor-pointer opacity-0" accept="image/*">
          <div class="upload-placeholder cursor-pointer w-60 h-60 bg-brand-2 border-1 border-dashed border-brand pt-10 pr-16 pb-10 pl-16 rounded-6 flex flex-col items-center justify-center">
            <div class="w-28 h-28 flex items-center justify-center cursor-pointer">
              <svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.41992 12.3008C1.125 12.3008 0.433594 11.6211 0.433594 10.3379V4.17969C0.433594 2.89648 1.125 2.21094 2.41992 2.21094H3.87891C4.33594 2.21094 4.49414 2.13477 4.78711 1.83594L5.25 1.35547C5.56055 1.0332 5.87695 0.880859 6.46875 0.880859H8.92383C9.51562 0.880859 9.83203 1.0332 10.1426 1.35547L10.6055 1.83594C10.8984 2.13477 11.0566 2.21094 11.5078 2.21094H13.002C14.2969 2.21094 14.9824 2.89648 14.9824 4.17969V10.3379C14.9824 11.6211 14.2969 12.3008 13.002 12.3008H2.41992ZM12.6094 5.5625C13.0371 5.5625 13.3887 5.2168 13.3887 4.78906C13.3887 4.36133 13.0371 4.00977 12.6094 4.00977C12.1816 4.00977 11.8301 4.36133 11.8301 4.78906C11.8301 5.2168 12.1816 5.56836 12.6094 5.5625ZM7.71094 10.3965C9.45117 10.3965 10.8457 9.00195 10.8457 7.25C10.8457 5.50391 9.45117 4.10352 7.71094 4.10352C5.9707 4.10352 4.57031 5.50391 4.57031 7.25C4.57031 9.00195 5.9707 10.3965 7.71094 10.3965ZM7.71094 9.23047C6.62109 9.23047 5.73633 8.35156 5.73633 7.25C5.73633 6.1543 6.61523 5.26953 7.71094 5.26953C8.80664 5.26953 9.68555 6.1543 9.68555 7.25C9.68555 8.35156 8.80664 9.23047 7.71094 9.23047Z" fill="#FB6F92"></path>
              </svg>
            </div>
            <p class="text-brand fw-500 fs-11-lh-11-ls--2_5">Add</p>
          </div>
          <div class="image-preview w-60 h-60 rounded-6 ${
            existingImageUrl ? "" : "hidden"
          }">
            <img src="${existingImageUrl}" alt="Preview" class="rounded-6 h-60 w-60">
          </div>
        </div>
      </div>
    </div>
  `;
    }

    let optionsHtml = `<div class="options-container flex gap-8 ${
      flexCol ? "flex-col" : "flex-wrap"
    }">`;
    question.options.forEach((option) => {
      const isChecked = savedAnswer === option.value ? "checked" : "";
      if (isChecked) currentAnswer = option.value;

      const uniqueId = `${question.q_key}_${option.value}`;

      optionsHtml += `
      <div class="radio-option">
        ${
          flexCol
            ? `<div class="flex"><input type="radio" class="hidden" id="${uniqueId}" name="${question.q_key}" value="${option.value}" ${isChecked}>
        <label for="${uniqueId}" class="radio-option-label flex gap-10 items-center rounded-100 border border-solid border-color cursor-pointer transition-transform pt-18 pr-16 pb-18 pl-16">
          <span class="radio-custom relative w-20 h-20 inline-block border border-solid border-2 rounded-full"></span>
          <span class="radio-option-text transition-transform fw-500 fs-13-lh-16-ls-0_2">${option.label}</span>
        </label></div>`
            : `<input type="radio" class="hidden" id="${uniqueId}" name="${question.q_key}" value="${option.value}" ${isChecked}>
        <label for="${uniqueId}" class="radio-option-label flex gap-10 items-center rounded-100 border border-solid border-color cursor-pointer transition-transform pt-18 pr-16 pb-18 pl-16">
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
    const answerKey = question.q_key
      .replace(new RegExp(`^${question.key}_`, "i"), "")
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
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
    const answerKey = question.q_key
      .replace(new RegExp(`^${question.key}_`, "i"), "")
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    const savedAnswers = userAnswers[groupKey]?.[answerKey] || [];

    let optionsHtml = question.options
      .map((option) => {
        const isSelected = savedAnswers.includes(option.value)
          ? "is-selected"
          : "";
        return `<button type="button" class="option-btn w-full text-left bg-bg p-16 border-none border-bottom fw-500 fs-14-lh-20-ls-0_1 ${isSelected}" data-value="${option.value}">${option.label}</button>`;
      })
      .join("");

    const placeholderText =
      savedAnswers.length > 0
        ? `${savedAnswers.length} selected`
        : "you can choose multiple";

    return `
    <div class="options-container multi-choice multi-select-container relative w-full">
      <div class="select-display flex justify-between items-center pt-14 pr-18 pb-14 pl-18 border-1 border-solid border-color rounded-12 cursor-pointer bg-bg fw-500 fs-14-lh-20-ls-0_1">
        <span class="placeholder">${placeholderText}</span>
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
      showSuggestionsScreen();
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
      skin_type: "skinCare_skinType",
      skin_issues: "skinCare_skin_issues_products",
    };
    const question = isSpecialQuestion
      ? allQuestions.find((q) => q.q_key === q_key_map[currentStep])
      : currentProfileQuestions[currentStep];

    const errorContainer = modalBody.querySelector(".error-container");
    let answers = [];

    if (currentStep === "skin_issues") {
      const questionsToValidate = [
        {
          q_key: "skinCare_skin_issues_products",
          type: "multi_choice",
          isRequired: true,
        },
        {
          q_key: "skinCare_skinType",
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
          isRequired: true,
        },
      ];

      const additionalQuestions = document.getElementById(
        "additional-questions"
      );
      const areAdditionalQuestionsVisible =
        additionalQuestions &&
        !additionalQuestions.classList.contains("hidden");

      if (areAdditionalQuestionsVisible) {
        questionsToValidate.push(
          {
            q_key: "skinCare_acneType",
            type: "single_choice",
            isRequired: true,
          },
          {
            q_key: "skinCare_usedWhiteningProduct",
            type: "single_choice",
            isRequired: true,
          },
          {
            q_key: "skinCare_faceImageUploaded",
            type: "single_choice",
            isRequired: true,
          }
        );
      }

      let hasError = false;

      questionsToValidate.forEach((questionInfo) => {
        const questionObj = allQuestions.find(
          (q) => q.q_key === questionInfo.q_key
        );
        if (!questionObj) return;

        const groupKey = questionObj.key;
        const answerKey = questionObj.q_key
          .replace(new RegExp(`^${questionObj.key}_`, "i"), "")
          .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

        let questionAnswers = [];

        if (questionObj.q_key === "skinCare_faceImageUploaded") {
          const toggleInput = modalBody.querySelector("#face-upload-toggle");
          if (toggleInput) {
            questionAnswers.push(toggleInput.checked ? true : false);
          }
        } else if (questionInfo.type === "multi_choice") {
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
    } else if (currentStep === "reaction_check") {
      const reactionAnswer = userAnswers.skincare?.acneIrritation;
      if (
        ["itch_red_burn", "itch_sometimes", "painful"].includes(reactionAnswer)
      ) {
        closeModal();
        window.location.href = "/pages/beauty-profile-consultation";
        return true;
      }
      return true;
    } else {
      if (question.type === "multi_choice") {
        const selectedOptions = modalBody.querySelectorAll(".is-selected");
        answers = Array.from(selectedOptions).map((el) => el.dataset.value);
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
    }

    if (question.isRequired && answers.length === 0) {
      displayError(errorContainer, "Please select an option to continue.");
      return false;
    }

    const groupKey = question.key;
    const answerKey = question.q_key
      .replace(new RegExp(`^${question.key}_`, "i"), "")
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
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
      const questionsToSave = [
        { q_key: "skinCare_skin_issues_products", type: "multi_choice" },
        { q_key: "skinCare_skinType", type: "picture_choice" },
        { q_key: "skinCare_skinIssueCondition", type: "single_choice" },
        { q_key: "skinCare_is_pregnant", type: "single_choice" },
        { q_key: "skinCare_acneIrritation", type: "single_choice" },
      ];

      const reactionAnswer = modalBody.querySelector(
        'input[name="skinCare_acneIrritation"]:checked'
      )?.value;
      if (reactionAnswer === "no_itch_pain") {
        questionsToSave.push(
          { q_key: "skinCare_acneType", type: "single_choice" },
          { q_key: "skinCare_usedWhiteningProduct", type: "single_choice" },
          { q_key: "skinCare_faceImageUploaded", type: "single_choice" }
        );
      }

      questionsToSave.forEach((questionInfo) => {
        const questionObj = allQuestions.find(
          (q) => q.q_key === questionInfo.q_key
        );
        if (!questionObj) return;

        const groupKey = questionObj.key;
        const answerKey = questionObj.q_key
          .replace(new RegExp(`^${questionObj.key}_`, "i"), "")
          .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

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
      skin_type: "skinCare_skinType",
      skin_issues: "skinCare_skin_issues_products",
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
    const answerKey = question.q_key
      .replace(new RegExp(`^${question.key}_`, "i"), "")
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
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
        renderCurrentQuestion();
      }
    } else if (currentStep === "routine_or_product") {
      const routineAnswer = userAnswers.skincare?.routineOrProduct;
      if (routineAnswer === "proper_routine_based_on_concerns") {
        showProperRoutineBasedOnConcernScreen();
      } else {
        showSkinTypeQuestion();
      }
    } else if (currentStep === "skin_type") {
      showSuggestionsScreen();
    } else if (currentStep === "skin_issues") {
      const reactionAnswer = userAnswers.skincare?.acneIrritation;
      if (
        ["itch_red_burn", "itch_sometimes", "painful"].includes(reactionAnswer)
      ) {
        showConsultationScreen();
      } else if (reactionAnswer === "no_itch_pain") {
        showSuggestionsScreen();
      }
    } else {
      currentStep++;
      renderCurrentQuestion();
    }
  }

  function handleBack() {
    saveCurrentAnswer();

    if (stepHistory.length === 0) {
      if (currentStep >= 0 && currentProfileQuestions.length > 0) {
        showProperRoutineBasedOnConcernScreen();
        return;
      }

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

  async function saveUserProfile() {
    try {
      const profileData = { ...userAnswers };
      const response = await fetch(`${apiUrl}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      await response.json();
    } catch (error) {
      console.error("Error saving profile:", error);
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
    } else if (existingProfileData?.dob) {
      const dobDate = new Date(existingProfileData.dob);
      modalBody.querySelector("#dob-dd").value = String(
        dobDate.getDate()
      ).padStart(2, "0");
      modalBody.querySelector("#dob-mm").value = String(
        dobDate.getMonth() + 1
      ).padStart(2, "0");
      modalBody.querySelector("#dob-yyyy").value = String(
        dobDate.getFullYear()
      );
    }

    if (userAnswers.gender) {
      modalBody.querySelector("#gender").value = userAnswers.gender;
    } else if (existingProfileData?.gender) {
      modalBody.querySelector("#gender").value = existingProfileData.gender;
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
    const question = allQuestions.find((q) => q.q_key === "skinCare_skinType");
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

    const skinIssuesQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_skin_issues_products"
    );
    const skinTypeQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_skinType"
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

    const breakoutTypeQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_acneType"
    );
    const whiteningProductQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_usedWhiteningProduct"
    );
    const facePhotoQuestion = allQuestions.find(
      (q) => q.q_key === "skinCare_faceImageUploaded"
    );

    if (
      !skinIssuesQuestion ||
      !skinTypeQuestion ||
      !acneAllergyQuestion ||
      !pregnantQuestion ||
      !reactionQuestion ||
      !breakoutTypeQuestion ||
      !whiteningProductQuestion ||
      !facePhotoQuestion
    )
      return;

    const skinIssuesHtml = generateMultiChoiceMarkup(skinIssuesQuestion);
    const skinTypeHtml = generatePictureChoiceMarkup(skinTypeQuestion);
    const acneAllergyHtml = generateSingleChoiceMarkup(acneAllergyQuestion);
    const pregnantHtml = generateSingleChoiceMarkup(pregnantQuestion);
    const reactionHtml = generateSingleChoiceMarkup(reactionQuestion, true);
    const breakoutTypeHtml = generateSingleChoiceMarkup(breakoutTypeQuestion);
    const whiteningProductHtml = generateSingleChoiceMarkup(
      whiteningProductQuestion
    );
    const facePhotoHtml = generateSingleChoiceMarkup(facePhotoQuestion);

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

    <div id="additional-questions" class="hidden">
      <div class="question-section flex flex-col gap-16">
        ${generateTitleMarkup(breakoutTypeQuestion.title)}
        ${breakoutTypeHtml}
      </div>
      
      <div class="question-section flex flex-col gap-16">
        ${generateTitleMarkup(whiteningProductQuestion.title)}
        ${whiteningProductHtml}
      </div>
      
      <div class="question-section flex flex-col gap-16">
        ${facePhotoHtml}
      </div>
    </div>
    
    ${generateErrorContainerMarkup()}
  `;

    renderModalContent(createModalLayout(innerHtml), "w-760").then(() => {
      const reactionInputs = modalBody.querySelectorAll(
        'input[name="skinCare_acneIrritation"]'
      );

      reactionInputs.forEach((input) => {
        input.addEventListener("change", (e) => {
          const additionalQuestions = modalBody.querySelector(
            "#additional-questions"
          );
          if (additionalQuestions) {
            if (e.target.value === "no_itch_pain") {
              additionalQuestions.classList.remove("hidden");
              additionalQuestions.classList.add("flex", "flex-col", "gap-16");
            } else {
              additionalQuestions.classList.add("hidden");
              additionalQuestions.classList.remove(
                "flex",
                "flex-col",
                "gap-16"
              );
            }
          }
        });
      });

      const savedReactionAnswer = userAnswers.skincare?.acneIrritation;
      if (savedReactionAnswer === "no_itch_pain") {
        const additionalQuestions = modalBody.querySelector(
          "#additional-questions"
        );
        if (additionalQuestions) {
          additionalQuestions.classList.remove("hidden");
          additionalQuestions.classList.add("flex", "flex-col", "gap-16");
        }
      }
    });
  }

  function showConsultationScreen() {
    currentStep = "consultation";

    closeModal();

    const mainContent = document.querySelector(".page-width .flex");
    if (mainContent) {
      mainContent.classList.add("hidden");
    }

    const consultationSection = document.getElementById("consultation-section");
    if (consultationSection) {
      consultationSection.classList.remove("hidden");
      consultationSection.classList.add("flex", "flex-col", "gap-24");

      setActiveTab(currentProfileType);

      const consultationContent = consultationSection.querySelector(
        '[data-content="consultation"]'
      );
      const suggestionsContent = consultationSection.querySelector(
        '[data-content="suggestions"]'
      );

      if (consultationContent) {
        consultationContent.classList.remove("hidden");
        consultationContent.classList.add("flex", "flex-col", "gap-24");
      }
      if (suggestionsContent) {
        suggestionsContent.classList.add("hidden");
      }
    }

    saveUserProfile();
  }

  function showSuggestionsScreen() {
    currentStep = "suggestions";

    closeModal();

    const mainContent = document.querySelector(".page-width .flex");
    if (mainContent) {
      mainContent.classList.add("hidden");
    }

    const consultationSection = document.getElementById("consultation-section");
    if (consultationSection) {
      consultationSection.classList.remove("hidden");
      consultationSection.classList.add("flex", "flex-col", "gap-24");

      setActiveTab(currentProfileType);

      const consultationContent = consultationSection.querySelector(
        '[data-content="consultation"]'
      );
      const suggestionsContent = consultationSection.querySelector(
        '[data-content="suggestions"]'
      );

      if (consultationContent) {
        consultationContent.classList.add("hidden");
      }
      if (suggestionsContent) {
        suggestionsContent.classList.remove("hidden");
        suggestionsContent.classList.add("flex", "flex-col", "gap-24");
      }
    }

    saveUserProfile();
  }

  function setActiveTab(profileType) {
    const tabButtons = document.querySelectorAll(
      "#consultation-section .tab-button"
    );
    tabButtons.forEach((button) => button.classList.remove("active"));

    const activeButton = document.querySelector(
      `#consultation-section .tab-button[data-profile="${profileType}"]`
    );
    if (activeButton) {
      activeButton.classList.add("active");
    }
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

    const hasExistingData = existingProfileData?.[profileType];
    if (hasExistingData) {
      userAnswers[profileType] = {};
      Object.keys(existingProfileData[profileType]).forEach((key) => {
        if (key !== "isCompleted") {
          userAnswers[profileType][key] = existingProfileData[profileType][key];
        }
      });
    } else {
      userAnswers = {};
    }

    stepHistory = [];

    currentProfileQuestions = allQuestions
      .filter(
        (q) =>
          q.key === profileType &&
          q.q_key !== "skinCare_routine_or_product" &&
          q.q_key !== "skinCare_skinType" &&
          q.q_key !== "skinCare_skin_issues_products" &&
          q.q_key !== "skinCare_skinIssueCondition" &&
          q.q_key !== "skinCare_is_pregnant" &&
          q.q_key !== "skinCare_acneIrritation" &&
          q.q_key !== "skinCare_acneType" &&
          q.q_key !== "skinCare_usedWhiteningProduct" &&
          q.q_key !== "skinCare_faceImageUploaded"
      )
      .sort((a, b) => a.order - b.order);

    const hasDob = existingProfileData?.dob && existingProfileData.dob !== null;
    const hasGender =
      existingProfileData?.gender && existingProfileData.gender !== null;

    if (!hasDob || !hasGender) {
      showDobAndGenderModal();
    } else {
      if (existingProfileData.dob) {
        const dobDate = new Date(existingProfileData.dob);
        const yyyy = dobDate.getFullYear();
        const mm = String(dobDate.getMonth() + 1).padStart(2, "0");
        const dd = String(dobDate.getDate()).padStart(2, "0");
        userAnswers.dob = `${yyyy}-${mm}-${dd}`;
      }
      userAnswers.gender = existingProfileData.gender;
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
        .map((option) => {
          const isCompleted = existingProfileData?.[option.value]?.isCompleted;
          const buttonText = isCompleted ? "Edit Profile" : "Setup Now";

          return `
        <div class="profile-type-card flex flex-col items-center gap-12 w-277 lg:w-full md:w-full sm:w-full pt-12 sm:pt-0">
          <div class="w-full">
            <div class="relative w-full lg:w-full h-222 lg:h-200 md:h-150 sm:h-98">
              <img src="${option.image}" alt="${
            option.label
          } profile" loading="lazy" class="relative w-full h-full">
              ${
                isCompleted
                  ? '<div class="absolute top-10 right-10 bg-green-500 text-white px-8 py-4 rounded-full text-xs">Completed</div>'
                  : ""
              }
            </div>
            <div class="w-full"><h3 class="w-full rounded-b-l-32 rounded-b-r-32 sm:rounded-b-l-13 sm:rounded-b-r-13 text-center uppercase pt-12 pr-8 pb-12 pl-8 sm:p-5 bg-brand text-bg fs-26-lh-26-ls-1_2 sm:fs-15-lh-16-ls--1_2pct fw-400">${
              option.label
            }</h3></div>
          </div>
          <button type="button" class="setup-now-btn button button--outline w-full flex gap-4 justify-center items-center fs-16-lh-100pct-ls-0 sm:fs-14-lh-100pct-ls-0 sm:p-8" data-profile-type="${
            option.value
          }">
            <svg width="28" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.10352 13.9492C6.10352 13.2559 6.67969 12.6895 7.36328 12.6895H13.1055V6.94727C13.1055 6.26367 13.6719 5.6875 14.3652 5.6875C15.0586 5.6875 15.625 6.26367 15.625 6.94727V12.6895H21.3672C22.0605 12.6895 22.627 13.2559 22.627 13.9492C22.627 14.6426 22.0605 15.209 21.3672 15.209H15.625V20.9512C15.625 21.6445 15.0586 22.2109 14.3652 22.2109C13.6719 22.2109 13.1055 21.6445 13.1055 20.9512V15.209H7.36328C6.67969 15.209 6.10352 14.6426 6.10352 13.9492Z" fill="#FB6F92"/></svg>
            <span>${buttonText}</span>
          </button>
        </div>`;
        })
        .join("");
      container.querySelectorAll(".setup-now-btn").forEach((button) => {
        button.addEventListener("click", () =>
          handleProfileSelection(button.dataset.profileType)
        );
      });
    }
  }

  async function fetchExistingProfile() {
    try {
      const response = await fetch(`${apiUrl}`);
      const result = await response.json();

      if (result.success && result.data) {
        existingProfileData = result.data;

        if (existingProfileData.skincare) {
          userAnswers.skincare = {};
          Object.keys(existingProfileData.skincare).forEach((key) => {
            const value = existingProfileData.skincare[key];
            let formattedKey;
            if (key === "faceImageUrl") {
              formattedKey = "faceImageUrl";
            } else if (key === "faceImageUploaded") {
              formattedKey = "faceImageUploaded";
            } else {
              formattedKey = key.charAt(0).toLowerCase() + key.slice(1);
            }
            userAnswers.skincare[formattedKey] = value;
          });
        }
        if (existingProfileData.haircare) {
          userAnswers.haircare = { ...existingProfileData.haircare };
        }
        if (existingProfileData.makeup) {
          userAnswers.makeup = { ...existingProfileData.makeup };
        }
      }

      return result;
    } catch (error) {
      console.error("Error fetching existing profile:", error);
      return null;
    }
  }

  async function initializeProfile() {
    try {
      await fetchExistingProfile();

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
