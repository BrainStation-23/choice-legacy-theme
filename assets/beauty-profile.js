async function initializeProfile() {
  try {
    // Execute both API calls in parallel
    const [profileResult, questionsResponse] = await Promise.all([
      fetchExistingProfile(),
      fetch(`${apiUrl}/questions`),
    ]);

    // Process questions response
    const { questions } = await questionsResponse.json();
    if (!questions || questions.length === 0) return;

    allQuestions = questions;
    const productTypeQuestion = questions.find((q) => q.key === "product_type");

    toggleSpinner("profile-types-spinner", "profile-types-content", true);

    createProfileTypes(productTypeQuestion);
  } catch (error) {
    console.error(error);
    const spinner = document.getElementById("profile-types-spinner");
    if (spinner) {
      spinner.innerHTML =
        '<p class="error-text">Failed to load profile options. Please try again.</p>';
    }
  }
}

function isFinalStep() {
  if (currentStep === -1) return false;

  if (currentStep === "skin_issues") {
    const acneAllergyAnswer = userAnswers.skincare?.skinIssueCondition;

    if (
      acneAllergyAnswer !== "only_acne" &&
      acneAllergyAnswer !== "both_acne_allergy"
    ) {
      return true;
    }

    const reactionAnswer = userAnswers.skincare?.acneIrritation;
    if (
      ["itch_red_burn", "itch_sometimes", "painful"].includes(reactionAnswer)
    ) {
      return true;
    }
    if (reactionAnswer === "no_itch_pain") {
      return true;
    }
  }

  if (currentStep === "skin_type") return true;

  if (currentStep === "haircare_concerns") return true;

  if (currentStep === "haircare_initial") {
    const suggestionType = userAnswers.haircare?.suggestionType;
    return suggestionType !== "suggestion_based_on_specific_concerns";
  }

  if (typeof currentStep === "number" && currentStep >= 0) {
    return currentStep === currentProfileQuestions.length - 1;
  }

  return false;
}

let isBeautyProfileInitialized = false;

const modal = document.getElementById("beauty-profile-modal");
const modalBody = document.getElementById("beauty-profile-modal-body");
const closeModalBtn = document.getElementById("beauty-profile-modal-close-btn");
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

function toggleSpinner(spinnerId, contentId, showContent = false) {
  const spinner = document.getElementById(spinnerId);
  const content = document.getElementById(contentId);

  if (spinner && content) {
    if (showContent) {
      spinner.style.display = "none";
      content.style.display = "block";
    } else {
      spinner.style.display = "flex";
      content.style.display = "none";
    }
  }
}

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
    document.body.style.overflow = "hidden";

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

    document.body.style.overflow = "";
  }
}

function createModalLayout(innerHtml, removeOverflow = false) {
  const buttonText = isFinalStep() ? "Save" : "Continue";
  const shouldShowHeading =
    (currentProfileType === "skincare" || currentProfileType === "haircare") &&
    currentStep !== -1;

  const headingText =
    currentProfileType === "skincare"
      ? "Tell us about beauty skin"
      : "Tell us about Hair Care";

  const headingHtml = shouldShowHeading
    ? `<div class="profile-heading pt-40 pr-24 pl-24 pb-24 sm:pb-0 sm:pt-24">
       <h1 class="fw-400 fs-36-lh-40-ls-0 sm:fs-21-lh-24-ls-1_2pct uppercase">${headingText}</h1>
     </div>`
    : "";
  const footerHtml = `
    <div class="beauty-profile-modal-footer flex justify-between gap-16 p-16 box-shadow sm:box-shadow-none sm:pt-0 sm:flex-col-reverse">
      <button type="button" class="beauty-profile-modal-back-btn button button--outline sm:w-full h-44 text-primary border-color">Back</button>
      <button type="button" class="beauty-profile-modal-continue-btn button button--solid sm:w-full h-44">${buttonText}</button>
    </div>
  `;

  const scrollClasses = removeOverflow
    ? `${
        shouldShowHeading ? "" : "pt-40"
      } pr-32 pb-40 pl-32 flex flex-col gap-16`
    : `${
        shouldShowHeading ? "" : "pt-40"
      } pr-32 pb-40 pl-32 sm:pl-24 sm:pr-24 sm:pt-0 sm:pt-0 sm:pb-0 flex flex-col gap-16 max-h-500 overflow-y-auto scrollbar-w-8 scrollbar-track-none scrollbar-thumb-brand scrollbar-thumb-brand-hover`;

  return `
    ${headingHtml}
    <div class="${scrollClasses}">
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

      if (field.value.length === field.maxLength && index < fields.length - 1) {
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
  return `<h2 class="beauty-profile-modal-body-title fw-400 fs-16-lh-22-ls-0 ff-general-sans max-w-80pct">${title}</h2>`;
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
  if (currentStep === -1) {
    const scrollContainer = modalBody.querySelector(".pt-40.pr-32.pb-40.pl-32");
    if (scrollContainer) {
      scrollContainer.classList.remove(
        "overflow-y-auto",
        "max-h-500",
        "scrollbar-w-8",
        "scrollbar-track-none",
        "scrollbar-thumb-brand",
        "scrollbar-thumb-brand-hover"
      );
    }
  }
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

      const isMultiChoice = optionsContainer.classList.contains("multi-choice");

      if (isMultiChoice) {
        option.classList.toggle("is-selected");

        const selectedElements =
          optionsContainer.querySelectorAll(".is-selected");
        const selectedCount = selectedElements.length;
        const placeholder = optionsContainer.querySelector(".placeholder");

        if (placeholder) {
          if (selectedCount === 0) {
            placeholder.textContent = "you can choose multiple";
          } else {
            const selectedLabels = Array.from(selectedElements).map(
              (el) => el.textContent
            );
            if (selectedLabels.length <= 3) {
              placeholder.textContent = selectedLabels.join(", ");
            } else {
              placeholder.textContent = `${selectedLabels
                .slice(0, 2)
                .join(", ")} and ${selectedLabels.length - 2} more`;
            }
          }
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
      multiSelectDisplay.addEventListener("click", (e) => {
        e.stopPropagation();
        const panel = optionsContainer.querySelector(".dropdown-panel");
        panel.classList.toggle("is-open");
      });

      document.addEventListener("click", (e) => {
        const panel = optionsContainer.querySelector(".dropdown-panel");
        if (panel && !optionsContainer.contains(e.target)) {
          panel.classList.remove("is-open");
        }
      });
    }
  });

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
          <span class="toggle-slider absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-secondary rounded-77 w-44 transition-transform"></span>
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
        <label for="${uniqueId}" class="radio-option-label flex gap-10 items-center rounded-100 border border-solid border-divider cursor-pointer transition-transform pt-18 pr-16 pb-18 pl-16">
          <span class="radio-custom relative w-20 h-20 inline-block border border-solid border-2 rounded-full"></span>
          <span class="radio-option-text transition-transform fw-500 fs-13-lh-16-ls-0_2">${option.label}</span>
        </label></div>`
            : `<input type="radio" class="hidden" id="${uniqueId}" name="${question.q_key}" value="${option.value}" ${isChecked}>
        <label for="${uniqueId}" class="radio-option-label flex gap-10 items-center rounded-100 border border-solid border-divider cursor-pointer transition-transform pt-18 pr-16 pb-18 pl-16">
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
  let optionsHtml = `<div class="options-container picture-options-container grid grid-cols-3">`;
  question.options.forEach((option) => {
    const isSelected = savedAnswer === option.value ? "is-selected" : "";
    optionsHtml += `
      <button type="button" class="option-btn picture-option-card bg-transparent transition-transform border-2 border-solid border-color-transparent cursor-pointer h-216 sm:w-auto sm:h-auto border-none rounded-6 ${isSelected}" data-value="${option.value}">
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
      return `<button type="button" class="option-btn cursor-pointer w-full text-left bg-bg p-16 border-none border-bottom fw-500 fs-14-lh-20-ls-0_1 ${isSelected}" data-value="${option.value}">${option.label}</button>`;
    })
    .join("");

  const getSelectedLabels = () => {
    if (savedAnswers.length === 0) return "you can choose multiple";

    const selectedLabels = savedAnswers.map((value) => {
      const option = question.options.find((opt) => opt.value === value);
      return option ? option.label : value;
    });

    if (selectedLabels.length <= 3) {
      return selectedLabels.join(", ");
    } else {
      return `${selectedLabels.slice(0, 2).join(", ")} and ${
        selectedLabels.length - 2
      } more`;
    }
  };

  const placeholderText = getSelectedLabels();

  return `
    <div class="options-container multi-choice multi-select-container relative w-full">
      <div class="select-display flex justify-between items-center pt-14 pr-18 pb-14 pl-18 border-1 border-solid border-divider rounded-12 cursor-pointer bg-bg fw-500 fs-14-lh-20-ls-0_1">
        <span class="placeholder">${placeholderText}</span>
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.6543 10.3008C8.32227 10.3008 8.0293 10.1738 7.77539 9.91016L0.333984 2.30273C0.119141 2.08789 0.00195312 1.81445 0.00195312 1.50195C0.00195312 0.867188 0.5 0.369141 1.13477 0.369141C1.44727 0.369141 1.73047 0.496094 1.95508 0.710938L8.6543 7.57617L15.3535 0.710938C15.5684 0.496094 15.8613 0.369141 16.1738 0.369141C16.7988 0.369141 17.2969 0.867188 17.2969 1.50195C17.2969 1.82422 17.1895 2.08789 16.9746 2.30273L9.5332 9.91016C9.28906 10.1738 8.98633 10.3008 8.6543 10.3008Z" fill="#90989C"/>
        </svg>
      </div>
      <div class="dropdown-panel hidden absolute left-0 right-0 bg-bg rounded-12 overflow-y-auto z-10 border-1 border-solid border-divider scrollbar-w-8 scrollbar-track-none scrollbar-thumb-brand scrollbar-thumb-brand-hover">
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
  const isLastQuestion = currentStep === currentProfileQuestions.length - 1;
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
    skin_issues: "skinCare_skinConcerns",
    skin_type_with_products: "skinCare_skinType",
  };
  const question = isSpecialQuestion
    ? allQuestions.find((q) => q.q_key === q_key_map[currentStep])
    : currentProfileQuestions[currentStep];

  const errorContainer = modalBody.querySelector(".error-container");
  let answers = [];

  if (currentStep === "skin_issues") {
    const questionsToValidate = [
      {
        q_key: "skinCare_skinConcerns",
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
    ];

    const currentAcneAllergyAnswer =
      modalBody.querySelector(
        'input[name="skinCare_skinIssueCondition"]:checked'
      )?.value || userAnswers.skincare?.skinIssueCondition;

    if (
      currentAcneAllergyAnswer === "only_acne" ||
      currentAcneAllergyAnswer === "both_acne_allergy"
    ) {
      questionsToValidate.push(
        {
          q_key: "skinCare_is_pregnant",
          type: "single_choice",
          isRequired: false,
        },
        {
          q_key: "skinCare_acneIrritation",
          type: "single_choice",
          isRequired: true,
        }
      );
    }

    const acneAdditionalQuestions = document.getElementById(
      "acne-additional-questions"
    );
    const allergyQuestions = document.getElementById("allergy-questions");

    const areAcneAdditionalQuestionsVisible =
      acneAdditionalQuestions &&
      !acneAdditionalQuestions.classList.contains("hidden");
    const areAllergyQuestionsVisible =
      allergyQuestions && !allergyQuestions.classList.contains("hidden");

    if (areAcneAdditionalQuestionsVisible) {
      questionsToValidate.push({
        q_key: "skinCare_acneType",
        type: "single_choice",
        isRequired: true,
      });
    }

    if (areAllergyQuestionsVisible) {
      questionsToValidate.push(
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
        if (selectedButton) questionAnswers.push(selectedButton.dataset.value);
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
  } else if (currentStep === "skin_type_with_products") {
    const questionsToValidate = [
      {
        q_key: "skinCare_skinType",
        type: "picture_choice",
        isRequired: true,
      },
      {
        q_key: "skinCare_productTypePreference",
        type: "multi_choice",
        isRequired: true,
      },
    ];

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
        if (selectedButton) questionAnswers.push(selectedButton.dataset.value);
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
  } else if (currentStep === "haircare_initial") {
    const questionsToValidate = [
      {
        q_key: "hairCare_hairType",
        type: "single_choice",
        isRequired: true,
      },
      {
        q_key: "hairCare_suggestionType",
        type: "single_choice",
        isRequired: true,
      },
    ];

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
      const checkedRadio = modalBody.querySelector(
        `input[name="${questionObj.q_key}"]:checked`
      );
      if (checkedRadio) questionAnswers.push(checkedRadio.value);

      if (questionInfo.isRequired && questionAnswers.length === 0) {
        hasError = true;
      }

      if (!userAnswers[groupKey]) userAnswers[groupKey] = {};
      if (questionAnswers.length > 0) {
        userAnswers[groupKey][answerKey] = questionAnswers[0];
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
  } else if (currentStep === "haircare_concerns") {
    const concernQuestion = allQuestions.find(
      (q) => q.q_key === "hairCare_hairConcerns"
    );

    if (!concernQuestion) return false;

    const groupKey = concernQuestion.key;
    const answerKey = concernQuestion.q_key
      .replace(new RegExp(`^${concernQuestion.key}_`, "i"), "")
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

    const selectedOptions = modalBody.querySelectorAll(
      `.multi-choice .is-selected`
    );
    const answers = Array.from(selectedOptions).map((el) => el.dataset.value);

    if (answers.length === 0) {
      displayError(
        errorContainer,
        "Please select at least one concern to continue."
      );
      return false;
    }

    if (!userAnswers[groupKey]) userAnswers[groupKey] = {};
    userAnswers[groupKey][answerKey] = answers;

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
      { q_key: "skinCare_skinConcerns", type: "multi_choice" },
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
        if (selectedButton) questionAnswers.push(selectedButton.dataset.value);
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
    skin_issues: "skinCare_skinConcerns",
  };
  const question = isSpecialQuestion
    ? allQuestions.find((q) => q.q_key === q_key_map[currentStep])
    : currentProfileQuestions[currentStep];

  if (!question) return;

  const answers = [];
  if (question.type === "multi_choice") {
    const selectedOptions = modalBody.querySelectorAll(".is-selected");
    answers.push(...Array.from(selectedOptions).map((el) => el.dataset.value));
  } else {
    const checkedRadio = modalBody.querySelector("input[type='radio']:checked");
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
    } else if (currentProfileType === "haircare") {
      showHaircareQuestionsScreen(); // Add this
    } else {
      currentStep = 0;
      renderCurrentQuestion();
    }
  } else if (currentStep === "routine_or_product") {
    const routineAnswer = userAnswers.skincare?.routineOrProduct;
    if (routineAnswer === "proper_routine_based_on_concerns") {
      showProperRoutineBasedOnConcernScreen();
    } else if (routineAnswer === "one_single_product") {
      showSkinTypeWithCurrentProductsQuestion();
    } else {
      showSkinTypeQuestion();
    }
  } else if (currentStep === "skin_type") {
    showSuggestionsScreen();
  } else if (currentStep === "skin_issues") {
    const acneAllergyAnswer = userAnswers.skincare?.skinIssueCondition;

    if (acneAllergyAnswer === "neither_acne_allergy") {
      showSuggestionsScreen();
      return;
    }

    if (acneAllergyAnswer === "only_allergy") {
      showSuggestionsScreen();
      return;
    }

    const reactionAnswer = userAnswers.skincare?.acneIrritation;

    if (
      acneAllergyAnswer === "only_acne" ||
      acneAllergyAnswer === "both_acne_allergy"
    ) {
      if (
        ["itch_red_burn", "itch_sometimes", "painful"].includes(reactionAnswer)
      ) {
        showConsultationScreen();
      } else {
        showSuggestionsScreen();
      }
    }
  } else if (currentStep === "skin_type_with_products") {
    showSuggestionsScreen();
  } else if (currentStep === "haircare_initial") {
    const suggestionType = userAnswers.haircare?.suggestionType;
    if (suggestionType === "suggestion_based_on_specific_concerns") {
      showHaircareConcernsScreen();
    } else {
      showSuggestionsScreen();
    }
  } else if (currentStep === "haircare_concerns") {
    showSuggestionsScreen();
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
  } else if (previousStep === "skin_type_with_products") {
    showSkinTypeWithCurrentProductsQuestion();
  } else if (previousStep === "haircare_initial") {
    showHaircareQuestionsScreen();
  } else if (previousStep === "haircare_concerns") {
    showHaircareConcernsScreen();
  } else {
    renderCurrentQuestion();
  }
}

async function saveUserProfile() {
  try {
    const profileData = { ...userAnswers };

    if (currentProfileType === "skincare" && profileData.skincare) {
      const acneAllergyAnswer = profileData.skincare.skinIssueCondition;

      if (acneAllergyAnswer === "neither_acne_allergy") {
        delete profileData.skincare.isPregnant;
        delete profileData.skincare.acneIrritation;
        delete profileData.skincare.acneType;
        delete profileData.skincare.usedWhiteningProduct;
        delete profileData.skincare.faceImageUploaded;
        delete profileData.skincare.faceImageUrl;
      } else if (acneAllergyAnswer === "only_allergy") {
        delete profileData.skincare.isPregnant;
        delete profileData.skincare.acneIrritation;
        delete profileData.skincare.acneType;
      } else if (
        acneAllergyAnswer === "only_acne" ||
        acneAllergyAnswer === "both_acne_allergy"
      ) {
        const reactionAnswer = profileData.skincare.acneIrritation;
        if (reactionAnswer === "no_itch_pain") {
          delete profileData.skincare.acneType;
          delete profileData.skincare.usedWhiteningProduct;
          delete profileData.skincare.faceImageUploaded;
          delete profileData.skincare.faceImageUrl;
        }
      }
    }

    if (currentProfileType === "haircare" && profileData.haircare) {
      delete profileData.haircare.skinConcerns;

      const suggestionType = profileData.haircare.suggestionType;

      if (suggestionType !== "suggestion_based_on_specific_concerns") {
        delete profileData.haircare.hairConcerns;
      }
    }

    if (currentProfileType && profileData[currentProfileType]) {
      profileData[currentProfileType].isCompleted = true;
    }
    console.log(profileData);
    const response = await fetch(`${apiUrl}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const result = await response.json();

    await fetchExistingProfile();
    const productTypeQuestion = allQuestions.find(
      (q) => q.key === "product_type"
    );
    if (productTypeQuestion) {
      createProfileTypes(productTypeQuestion);
    }

    return result; // Return the result so showSuggestionsScreen can await it
  } catch (error) {
    console.error("Error saving profile:", error);
    throw error; // Re-throw so showSuggestionsScreen can catch it
  }
}

function setupCustomDropdown() {
  const dropdown = modalBody.querySelector("#gender-dropdown");
  const options = modalBody.querySelector("#gender-options");
  const arrow = modalBody.querySelector(".dropdown-arrow");

  if (!dropdown || !options || !arrow) return;

  dropdown.addEventListener("click", () => {
    const isOpen = !options.classList.contains("hidden");
    if (isOpen) {
      options.classList.add("hidden");
      arrow.style.transform = "rotate(0deg)";
    } else {
      const dropdownRect = dropdown.getBoundingClientRect();
      const modalBody = dropdown.closest(".beauty-profile-modal-content");
      const modalRect = modalBody.getBoundingClientRect();

      const spaceBelow = modalRect.bottom - dropdownRect.bottom;
      const spaceAbove = dropdownRect.top - modalRect.top;
      const dropdownHeight = 200;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        options.classList.remove("top-full", "mt-4");
        options.classList.add("bottom-full", "mb-4");
      } else {
        options.classList.remove("bottom-full", "mb-4");
        options.classList.add("top-full", "mt-4");
      }

      options.classList.remove("hidden");
      arrow.style.transform = "rotate(180deg)";
    }
  });

  options.addEventListener("click", (e) => {
    const option = e.target.closest(".dropdown-option");
    if (!option) return;

    const value = option.dataset.value;
    const text = option.textContent;

    setGenderValue(value, text);

    options.classList.add("hidden");
    arrow.style.transform = "rotate(0deg)";
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !options.contains(e.target)) {
      options.classList.add("hidden");
      arrow.style.transform = "rotate(0deg)";
    }
  });
}

function setGenderValue(value, displayText = null) {
  const hiddenInput = modalBody.querySelector("#gender");
  const selectedValue = modalBody.querySelector("#gender-selected-value");

  if (hiddenInput) hiddenInput.value = value;

  if (selectedValue) {
    const displayMap = {
      male: "Male",
      female: "Female",
      other: "Other",
      prefer_not_to_say: "Prefer not to say",
    };
    selectedValue.textContent = displayText || displayMap[value] || value;
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
          <div class="relative w-63 h-56"><input type="text" class="pt-8 pr-16 pb-0 pl-16 fw-500 h-full fs-14-lh-20-ls-0_1 border-divider" placeholder=" " id="dob-dd" maxlength="2" inputmode="numeric" /><label for="dob-dd" class="fw-500 fs-14-lh-20-ls-0_1">DD</label></div>
          <div class="relative w-63 h-56"><input type="text" class="pt-8 pr-16 pb-0 pl-16 fw-500 h-full fs-14-lh-20-ls-0_1 border-divider" placeholder=" " id="dob-mm" maxlength="2" inputmode="numeric"><label for="dob-mm" class="fw-500 fs-14-lh-20-ls-0_1">MM</label></div>
          <div class="relative w-100 h-56"><input type="text" class="pt-8 pr-16 pb-0 pl-16 fw-500 h-full fs-14-lh-20-ls-0_1 border-divider" placeholder=" " id="dob-yyyy" maxlength="4" inputmode="numeric"><label for="dob-yyyy" class="fw-500 fs-14-lh-20-ls-0_1">YYYY</label></div>
        </div>
        ${generateErrorContainerMarkup()}
      </div>
      <div class="beauty-profile-modal-form-field flex flex-col gap-10">
        <div class="custom-dropdown relative w-256 h-56">
          <div class="dropdown-selected flex justify-between items-center w-full h-full pl-16 pr-16 pt-10 pb-10 border-1 border-solid border-divider rounded-12 cursor-pointer bg-bg" id="gender-dropdown">
            <div class="selected-content flex flex-col">
              <span class="selected-label fw-400 fs-12-lh-16-ls-0_6 text-primary-label">Gender</span>
              <span class="selected-value fw-500 fs-14-lh-20-ls-0_1" id="gender-selected-value">Male</span>
            </div>
            <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg" class="dropdown-arrow transition-transform">
              <path d="M14.6543 19.3008C14.3223 19.3008 14.0293 19.1738 13.7754 18.9102L6.33398 11.3027C6.11914 11.0879 6.00195 10.8145 6.00195 10.502C6.00195 9.86719 6.5 9.36914 7.13477 9.36914C7.44727 9.36914 7.73047 9.49609 7.95508 9.71094L14.6543 16.5762L21.3535 9.71094C21.5684 9.49609 21.8613 9.36914 22.1738 9.36914C22.7988 9.36914 23.2969 9.86719 23.2969 10.502C23.2969 10.8242 23.1895 11.0879 22.9746 11.3027L15.5332 18.9102C15.2891 19.1738 14.9863 19.3008 14.6543 19.3008Z" fill="#90989C"/>
            </svg>
          </div>
          <div class="dropdown-options absolute left-0 w-full bg-bg border-1 border-solid border-divider rounded-12 mt-4 hidden z-10 overflow-hidden top-full" id="gender-options">
            <div class="dropdown-option pt-10 pr-16 pb-10 pl-16 cursor-pointer hover:bg-secondary transition-colors fw-500 fs-14-lh-20-ls-0_1" data-value="male">Male</div>
            <div class="dropdown-option pt-10 pr-16 pb-10 pl-16 cursor-pointer hover:bg-secondary transition-colors fw-500 fs-14-lh-20-ls-0_1" data-value="female">Female</div>
            <div class="dropdown-option pt-10 pr-16 pb-10 pl-16 cursor-pointer hover:bg-secondary transition-colors fw-500 fs-14-lh-20-ls-0_1" data-value="other">Other</div>
            <div class="dropdown-option pt-10 pr-16 pb-10 pl-16 cursor-pointer hover:bg-secondary transition-colors fw-500 fs-14-lh-20-ls-0_1" data-value="prefer_not_to_say">Prefer not to say</div>
          </div>
          <input type="hidden" id="gender" value="male">
        </div>
      </div>
    `;

  await renderModalContent(
    createModalLayout(innerHtml, true),
    "w-700 sm:w-370"
  );

  setupCustomDropdown();

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
    modalBody.querySelector("#dob-yyyy").value = String(dobDate.getFullYear());
  }

  if (userAnswers.gender) {
    setGenderValue(userAnswers.gender);
  } else if (existingProfileData?.gender) {
    setGenderValue(existingProfileData.gender);
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
  renderModalContent(createModalLayout(innerHtml), "w-760 sm:w-370");
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
  renderModalContent(createModalLayout(innerHtml), "w-760 sm:w-370");
}

function showSkinTypeWithCurrentProductsQuestion() {
  currentStep = "skin_type_with_products";

  const skinTypeQuestion = allQuestions.find(
    (q) => q.q_key === "skinCare_skinType"
  );
  const currentProductsQuestion = allQuestions.find(
    (q) => q.q_key === "skinCare_productTypePreference"
  );

  if (!skinTypeQuestion || !currentProductsQuestion) return;

  const skinTypeHtml = generatePictureChoiceMarkup(skinTypeQuestion);
  const currentProductsHtml = generateMultiChoiceMarkup(
    currentProductsQuestion
  );

  const innerHtml = `
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(skinTypeQuestion.title)}
      ${skinTypeHtml}
    </div>
    
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(currentProductsQuestion.title)}
      ${currentProductsHtml}
    </div>
    
    ${generateErrorContainerMarkup()}
  `;

  renderModalContent(createModalLayout(innerHtml, true), "w-760 sm:w-370");
}

function showProperRoutineBasedOnConcernScreen() {
  currentStep = "skin_issues";

  const skinIssuesQuestion = allQuestions.find(
    (q) => q.q_key === "skinCare_skinConcerns"
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

  <!-- Questions for acne-related answers -->
  <div id="pregnant-question" class="question-section flex flex-col gap-16 hidden">
    ${generateTitleMarkup(pregnantQuestion.title)}
    ${pregnantHtml}
  </div>
  
  <div id="reaction-question" class="question-section flex flex-col gap-16 hidden">
    ${generateTitleMarkup(reactionQuestion.title)}
    ${reactionHtml}
  </div>

  <!-- Questions for acne-related answers (except only_allergy) -->
  <div id="acne-additional-questions" class="hidden">
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(breakoutTypeQuestion.title)}
      ${breakoutTypeHtml}
    </div>
  </div>

  <!-- Questions for only_allergy -->
  <div id="allergy-questions" class="hidden">
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

  renderModalContent(createModalLayout(innerHtml), "w-760 sm:w-370").then(
    () => {
      const acneAllergyInputs = modalBody.querySelectorAll(
        'input[name="skinCare_skinIssueCondition"]'
      );

      acneAllergyInputs.forEach((input) => {
        input.addEventListener("change", (e) => {
          const pregnantQuestion =
            modalBody.querySelector("#pregnant-question");
          const reactionQuestion =
            modalBody.querySelector("#reaction-question");
          const acneAdditionalQuestions = modalBody.querySelector(
            "#acne-additional-questions"
          );
          const allergyQuestions =
            modalBody.querySelector("#allergy-questions");

          if (pregnantQuestion) pregnantQuestion.classList.add("hidden");
          if (reactionQuestion) reactionQuestion.classList.add("hidden");
          if (acneAdditionalQuestions)
            acneAdditionalQuestions.classList.add("hidden");
          if (allergyQuestions) allergyQuestions.classList.add("hidden");

          if (!userAnswers.skincare) userAnswers.skincare = {};

          userAnswers.skincare.skinIssueCondition = e.target.value;

          if (
            e.target.value === "only_acne" ||
            e.target.value === "both_acne_allergy"
          ) {
            if (pregnantQuestion) pregnantQuestion.classList.remove("hidden");
            if (reactionQuestion) reactionQuestion.classList.remove("hidden");
          } else if (e.target.value === "only_allergy") {
            if (allergyQuestions) allergyQuestions.classList.remove("hidden");

            delete userAnswers.skincare.isPregnant;
            delete userAnswers.skincare.acneIrritation;
            delete userAnswers.skincare.acneType;
          } else if (e.target.value === "neither_acne_allergy") {
            delete userAnswers.skincare.isPregnant;
            delete userAnswers.skincare.acneIrritation;
            delete userAnswers.skincare.acneType;
            delete userAnswers.skincare.usedWhiteningProduct;
            delete userAnswers.skincare.faceImageUploaded;
            delete userAnswers.skincare.faceImageUrl;
          }
        });
      });

      const reactionInputs = modalBody.querySelectorAll(
        'input[name="skinCare_acneIrritation"]'
      );

      reactionInputs.forEach((input) => {
        input.addEventListener("change", (e) => {
          const acneAdditionalQuestions = modalBody.querySelector(
            "#acne-additional-questions"
          );
          const allergyQuestions =
            modalBody.querySelector("#allergy-questions");

          if (acneAdditionalQuestions) {
            const acneAllergyAnswer =
              userAnswers.skincare?.skinIssueCondition ||
              modalBody.querySelector(
                'input[name="skinCare_skinIssueCondition"]:checked'
              )?.value;

            if (
              (acneAllergyAnswer === "only_acne" ||
                acneAllergyAnswer === "both_acne_allergy") &&
              e.target.value !== "no_itch_pain"
            ) {
              acneAdditionalQuestions.classList.remove("hidden");
              acneAdditionalQuestions.classList.add(
                "flex",
                "flex-col",
                "gap-16"
              );

              if (allergyQuestions) {
                allergyQuestions.classList.remove("hidden");
                allergyQuestions.classList.add("flex", "flex-col", "gap-16");
              }
            } else {
              acneAdditionalQuestions.classList.add("hidden");
              acneAdditionalQuestions.classList.remove(
                "flex",
                "flex-col",
                "gap-16"
              );

              if (
                acneAllergyAnswer === "only_acne" ||
                acneAllergyAnswer === "both_acne_allergy"
              ) {
                if (allergyQuestions) {
                  allergyQuestions.classList.add("hidden");
                  allergyQuestions.classList.remove(
                    "flex",
                    "flex-col",
                    "gap-16"
                  );
                }
              }
            }
          }
        });
      });

      const savedAcneAllergyAnswer = userAnswers.skincare?.skinIssueCondition;
      const savedReactionAnswer = userAnswers.skincare?.acneIrritation;

      if (
        savedAcneAllergyAnswer === "only_acne" ||
        savedAcneAllergyAnswer === "both_acne_allergy"
      ) {
        const pregnantQuestion = modalBody.querySelector("#pregnant-question");
        const reactionQuestion = modalBody.querySelector("#reaction-question");
        if (pregnantQuestion) pregnantQuestion.classList.remove("hidden");
        if (reactionQuestion) reactionQuestion.classList.remove("hidden");

        if (
          (savedAcneAllergyAnswer === "only_acne" ||
            savedAcneAllergyAnswer === "both_acne_allergy") &&
          savedReactionAnswer &&
          savedReactionAnswer !== "no_itch_pain"
        ) {
          const acneAdditionalQuestions = modalBody.querySelector(
            "#acne-additional-questions"
          );
          const allergyQuestions =
            modalBody.querySelector("#allergy-questions");
          if (acneAdditionalQuestions) {
            acneAdditionalQuestions.classList.remove("hidden");
            acneAdditionalQuestions.classList.add("flex", "flex-col", "gap-16");
          }
          if (allergyQuestions) {
            allergyQuestions.classList.remove("hidden");
            allergyQuestions.classList.add("flex", "flex-col", "gap-16");
          }
        }
      } else if (savedAcneAllergyAnswer === "only_allergy") {
        const allergyQuestions = modalBody.querySelector("#allergy-questions");
        if (allergyQuestions) {
          allergyQuestions.classList.remove("hidden");
          allergyQuestions.classList.add("flex", "flex-col", "gap-16");
        }
      }
    }
  );
}

function showHaircareQuestionsScreen() {
  currentStep = "haircare_initial";

  const hairTypeQuestion = allQuestions.find(
    (q) => q.q_key === "hairCare_hairType"
  );
  const suggestionTypeQuestion = allQuestions.find(
    (q) => q.q_key === "hairCare_suggestionType"
  );

  if (!hairTypeQuestion || !suggestionTypeQuestion) return;

  const hairTypeHtml = generateSingleChoiceMarkup(hairTypeQuestion);
  const suggestionTypeHtml = generateSingleChoiceMarkup(suggestionTypeQuestion);

  const innerHtml = `
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(hairTypeQuestion.title)}
      ${hairTypeHtml}
    </div>
    
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(suggestionTypeQuestion.title)}
      ${suggestionTypeHtml}
    </div>
    
    ${generateErrorContainerMarkup()}
  `;

  renderModalContent(createModalLayout(innerHtml, true), "w-760 sm:w-370").then(
    () => {
      const suggestionTypeInputs = modalBody.querySelectorAll(
        'input[name="hairCare_suggestionType"]'
      );

      suggestionTypeInputs.forEach((input) => {
        input.addEventListener("change", (e) => {
          const continueBtn = modalBody.querySelector(
            ".beauty-profile-modal-continue-btn"
          );
          if (continueBtn) {
            if (!userAnswers.haircare) userAnswers.haircare = {};
            userAnswers.haircare.suggestionType = e.target.value;

            if (e.target.value === "suggestion_based_on_specific_concerns") {
              continueBtn.textContent = "Continue";
            } else {
              continueBtn.textContent = "Save";
            }
          }
        });
      });
    }
  );
}

function showHaircareConcernsScreen() {
  currentStep = "haircare_concerns";

  const concernQuestion = allQuestions.find(
    (q) => q.q_key === "hairCare_hairConcerns"
  );

  if (!concernQuestion) return;

  const concernHtml = generateMultiChoiceMarkup(concernQuestion);

  const innerHtml = `
    <div class="question-section flex flex-col gap-16">
      ${generateTitleMarkup(concernQuestion.title)}
      ${concernHtml}
    </div>
    
    ${generateErrorContainerMarkup()}
  `;

  renderModalContent(createModalLayout(innerHtml, true), "w-760 sm:w-370");
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

      toggleSpinner("consultation-spinner", "consultation-content", false);

      setTimeout(() => {
        toggleSpinner("consultation-spinner", "consultation-content", true);
      }, 1000);
    }

    if (suggestionsContent) {
      suggestionsContent.classList.add("hidden");
    }
  }

  saveUserProfile();
}

async function fetchSuggestionProducts(profileType) {
  try {
    const response = await fetch(`${apiUrl}/suggestionProducts/${profileType}`);
    const result = await response.json();
  } catch (error) {
    console.error("Error fetching suggestion products:", error);
  }
}

async function showSuggestionsScreen() {
  currentStep = "suggestions";
  closeModal();

  // Re-enable body scroll since we're leaving the modal
  document.body.style.overflow = "";

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

      toggleSpinner("suggestions-spinner", "suggestions-content", false);

      try {
        // Wait for the profile to be saved first
        await saveUserProfile();

        // Then fetch suggestions
        await fetchSuggestionProducts(currentProfileType);

        setTimeout(() => {
          toggleSpinner("suggestions-spinner", "suggestions-content", true);
        }, 500); // Reduced timeout since API calls are done
      } catch (error) {
        console.error("Error in suggestions flow:", error);
        toggleSpinner("suggestions-spinner", "suggestions-content", true);
      }
    }
  }
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
        q.q_key !== "skinCare_skinConcerns" &&
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
    } else if (currentProfileType === "haircare") {
      showHaircareQuestionsScreen();
    } else {
      currentStep = 0;
      renderCurrentQuestion();
    }
  }
}

function createProfileTypes(productTypeQuestion) {
  const container = document.getElementById("beauty-profile-types-container");
  if (!container) return;

  container.innerHTML = `
    <div class="spinner-container flex justify-center items-center w-full h-200">
      <spinner-component size="large" color="primary"></spinner-component>
    </div>
  `;

  if (productTypeQuestion && productTypeQuestion.options) {
    let isCompleted = false;
    isCompleted = productTypeQuestion.options.find(
      (option) => existingProfileData?.[option.value]?.isCompleted
    );
    console.log(isCompleted);
    container.innerHTML = productTypeQuestion.options
      .map((option) => {
        const isCurrentItemCompleted =
          existingProfileData?.[option.value]?.isCompleted;
        const buttonText = isCurrentItemCompleted ? "Edit" : "Setup Now";

        return `
            <div class="profile-type-card flex flex-col items-center gap-12 w-277 lg:w-full md:w-full sm:w-full pt-12 sm:pt-0">
              ${
                isCurrentItemCompleted
                  ? `
                   <div class="flex justify-between items-center gap-6 w-full lg:flex-col md:flex-col sm:flex-col">
                     <button
                      type="button"
                      class="setup-now-btn button button--outline w-auto lg:w-full md:w-full sm:w-full flex gap-4 justify-center items-center pt-1 pb-1 fs-16-lh-100pct-ls-0 sm:fs-14-lh-100pct-ls-0"
                      data-profile-type="${option.value}"
                    >
                      <svg
                        width="29"
                        height="28"
                        viewBox="0 0 29 28"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.7969 8.09375L21.5156 6.8125L22.0469 6.28906C22.3594 5.97656 22.8438 5.92969 23.125 6.21094L23.3516 6.42969C23.6719 6.75 23.6562 7.21875 23.3281 7.55469L22.7969 8.09375ZM13.5391 16.3906C13.3438 16.4688 13.1094 16.2422 13.1953 16.0312L13.9062 14.4375L20.8984 7.42969L22.1875 8.70312L15.1875 15.7109L13.5391 16.3906ZM10.5078 21.7266C8.78125 21.7266 7.85938 20.8125 7.85938 19.1016V10.1719C7.85938 8.45312 8.78125 7.54688 10.5078 7.54688H19.0938L17.3594 9.28125H10.6562C9.96875 9.28125 9.60156 9.63281 9.60156 10.3516V18.9141C9.60156 19.6328 9.96875 19.9844 10.6562 19.9844H19.4141C19.9297 19.9844 20.2969 19.6328 20.2969 18.9141V12.2812L22.0391 10.5391V19.1016C22.0391 20.8125 21.125 21.7266 19.5625 21.7266H10.5078Z"
                          fill="#FB6F92"
                        />
                      </svg>
                      <span>${buttonText}</span>
                    </button>
                    <div class="flex justify-center gap-4 items-center min-w-118 lg:w-full md:w-full sm:w-full bg-success text-bg rounded-100 pt-2 pr-4 pb-2 pl-12">
                      <span class="fw-500 fs-14-lh-20-ls-0_1 text-primary-label">Completed</span>
                      <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.4531 19.8809C11.0781 19.8809 8.3418 17.1445 8.3418 13.7695C8.3418 10.3945 11.0781 7.6582 14.4531 7.6582C17.8281 7.6582 20.5645 10.3945 20.5645 13.7695C20.5645 17.1445 17.8281 19.8809 14.4531 19.8809ZM14.4531 18.5391C17.0898 18.5391 19.2227 16.4062 19.2227 13.7695C19.2227 11.1328 17.0898 9 14.4531 9C11.8164 9 9.68359 11.1328 9.68359 13.7695C9.68359 16.4062 11.8164 18.5391 14.4531 18.5391ZM13.8262 16.5586C13.5977 16.5586 13.416 16.4531 13.252 16.248L11.8984 14.6133C11.793 14.4785 11.7344 14.3438 11.7344 14.1973C11.7344 13.8809 11.9863 13.6348 12.2969 13.6348C12.4785 13.6348 12.625 13.7051 12.7656 13.8867L13.8086 15.1934L16.0352 11.6191C16.1641 11.4082 16.334 11.3027 16.5273 11.3027C16.8262 11.3027 17.1016 11.5137 17.1016 11.8301C17.1016 11.9648 17.0371 12.1113 16.9551 12.2402L14.377 16.2422C14.248 16.4414 14.0488 16.5586 13.8262 16.5586Z" fill="white"/>
                      </svg>
                    </div>
                   </div>
                  `
                  : `
                    <button
                      type="button"
                      class="setup-now-btn button button--outline w-full ${
                        isCompleted
                          ? "pt-1 pb-1 lg:pt-19 lg:pb-19 md:pt-19 md:pb-19 sm:pt-19 sm:pb-19"
                          : "pt-10 pb-10"
                      } sm:pl-0 sm:pr-0 flex gap-4 justify-center items-center fs-16-lh-100pct-ls-0 sm:fs-14-lh-100pct-ls-0"
                      data-profile-type="${option.value}"
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 29 28"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.10352 13.9492C6.10352 13.2559 6.67969 12.6895 7.36328 12.6895H13.1055V6.94727C13.1055 6.26367 13.6719 5.6875 14.3652 5.6875C15.0586 5.6875 15.625 6.26367 15.625 6.94727V12.6895H21.3672C22.0605 12.6895 22.627 13.2559 22.627 13.9492C22.627 14.6426 22.0605 15.209 21.3672 15.209H15.625V20.9512C15.625 21.6445 15.0586 22.2109 14.3652 22.2109C13.6719 22.2109 13.1055 21.6445 13.1055 20.9512V15.209H7.36328C6.67969 15.209 6.10352 14.6426 6.10352 13.9492Z"
                          fill="#FB6F92"
                        />
                      </svg>
                    <span>${buttonText}</span>
                </button>
              `
              }

    <div class="w-full">
      <div class="relative w-full lg:w-full h-222 lg:h-200 md:h-150 sm:h-98">
        <img src="${option.image}" alt="${
          option.label
        } profile" loading="lazy" class="relative w-full h-full">
      </div>
      <div class="w-full">
        <h3 class="w-full rounded-b-l-32 rounded-b-r-32 sm:rounded-b-l-13 sm:rounded-b-r-13 text-center uppercase pt-12 pr-8 pb-12 pl-8 sm:p-5 bg-brand text-bg fs-26-lh-26-ls-1_2 sm:fs-15-lh-16-ls--1_2pct fw-400">
          ${option.label}
        </h3>
      </div>
    </div>
  </div>
`;
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

          // Handle special cases first
          if (key === "skinIssuesProducts") {
            formattedKey = "skinConcerns";
          } else if (key === "faceImageUrl") {
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
        userAnswers.haircare = {};
        Object.keys(existingProfileData.haircare).forEach((key) => {
          if (key !== "isCompleted") {
            userAnswers.haircare[key] = existingProfileData.haircare[key];
          }
        });
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

window.initializeBeautyProfile = function () {
  if (!isBeautyProfileInitialized) {
    isBeautyProfileInitialized = true;
    initializeProfile();
  }
};
