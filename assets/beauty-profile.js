document.addEventListener("DOMContentLoaded", async function () {
  const apiURL = "/apps/choice-legacy-app/customer/beauty-profile";
  const container = document.getElementById("questions-container");
  const tabsWrapper = document.getElementById("beauty-tabs");
  const ageInput = document.getElementById("customer-age");
  let activeTab = null;
  const tabAnswers = {
    skincare: {},
    haircare: {},
    makeup: {},
  };
  let preloadedProfile = null;
  const skippedOrders = [6, 7, 8, 9, 10, 11];
  let allQuestions = [];
  let productTypes = [];

  try {
    const response = await fetch(`${apiURL}/questions`);
    const data = await response.json();
    if (Array.isArray(data.questions)) {
      allQuestions = data.questions;
      const productTypeQuestion = allQuestions.find(
        (q) => q.key === "product_type"
      );
      if (productTypeQuestion) {
        productTypes = productTypeQuestion.options;
      }
    } else {
      throw new Error("Invalid API response");
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
    container.innerHTML = "<p>Failed to load questions.</p>";
    return;
  }

  try {
    const profileRes = await fetch(`${apiURL}`);
    const profileData = await profileRes.json();
    if (profileData.success && profileData.data) {
      preloadedProfile = profileData.data;

      // Pre-fill age
      if (preloadedProfile.customerAge) {
        ageInput.value = preloadedProfile.customerAge;
      }

      // Pre-fill skincare answers
      if (preloadedProfile.skinCare) {
        const s = preloadedProfile.skinCare;
        tabAnswers.skincare = {
          1: s.skinConcerns || [],
          2: s.skinType || "",
          3: s.currentSkinCareProducts || [],
          4: s.productTypePreference || [],
          5: s.skinIssueCondition || "",
          6: s.acneIrritation || "",
          7: s.acneType || "",
          8: s.usedWhiteningProduct || "",
          9: s.faceImageUploaded ? "yes" : "no",
          10: "", // optional if no value
          11: "", // optional if no value
        };
      }

      // Pre-fill haircare answers
      if (preloadedProfile.hairCare) {
        const h = preloadedProfile.hairCare;
        const hairQuestions = allQuestions.filter((q) => q.key === "haircare");
        const hairConcernQ = hairQuestions.find(
          (q) =>
            q.title.toLowerCase().includes("hair concern") ||
            q.title.toLowerCase().includes("concern")
        );
        if (hairConcernQ) {
          // Handle both array and string formats
          tabAnswers.haircare[hairConcernQ._id] = Array.isArray(h.concern)
            ? h.concern
            : [h.concern];
        }
      }

      // Pre-fill makeup answers
      if (preloadedProfile.makeup) {
        const m = preloadedProfile.makeup;
        const makeupQuestions = allQuestions.filter((q) => q.key === "makeup");
        const catQ = makeupQuestions.find(
          (q) =>
            q.title.toLowerCase().includes("makeup category") ||
            q.title.toLowerCase().includes("category")
        );
        const skinTypeQ = makeupQuestions.find((q) =>
          q.title.toLowerCase().includes("skin type")
        );
        const skinToneQ = makeupQuestions.find((q) =>
          q.title.toLowerCase().includes("skin tone")
        );
        const undertoneQ = makeupQuestions.find((q) =>
          q.title.toLowerCase().includes("undertone")
        );

        if (catQ) {
          tabAnswers.makeup[catQ._id] = m.categories || "";
          tabAnswers.makeup[`sub_${catQ._id}`] = m.subCategories || [];
        }
        if (skinTypeQ) {
          tabAnswers.makeup[skinTypeQ._id] = m.skinType || "";
        }
        if (skinToneQ) {
          tabAnswers.makeup[skinToneQ._id] = m.skinTone?.type || "";
        }
        if (undertoneQ) {
          tabAnswers.makeup[undertoneQ._id] = m.skinUnderTone || "";
        }
      }
    }
  } catch (err) {
    console.error("Error fetching profile on load:", err);
  }

  tabsWrapper.innerHTML = "";
  productTypes.forEach((type) => {
    const btn = document.createElement("button");
    btn.textContent = type.label;
    btn.setAttribute("data-type", type.value);
    tabsWrapper.appendChild(btn);
  });

  const tabs = tabsWrapper.querySelectorAll("button");

  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.getAttribute("data-type");
      container.innerHTML = "<p>Loading...</p>";

      const filteredQuestions = allQuestions.filter((q) => q.key === activeTab);

      if (filteredQuestions.length > 0) {
        if (activeTab === "skincare") {
          renderSkincare(filteredQuestions);
        } else {
          renderGeneric(filteredQuestions);
          // Show save button for haircare and makeup
          document.getElementById("save-answers").style.display =
            "inline-block";
        }
      } else {
        container.innerHTML = "<p>No questions available.</p>";
        document.getElementById("save-answers").style.display = "none";
      }
    });
  });

  if (tabs.length > 0) tabs[0].click();

  // --- renderSkincare function ---
  function renderSkincare(questions) {
    container.innerHTML = "";
    const form = document.createElement("form");
    form.id = "skincare-form";

    // Use existing answers or initialize empty
    const answers = tabAnswers.skincare || {};
    tabAnswers.skincare = answers;

    const renderedOrders = new Set();
    const suggestionBlock = document.getElementById("suggestion-output");
    suggestionBlock.innerHTML = "";

    const saveButton = document.getElementById("save-answers");
    saveButton.style.display = "inline-block";

    saveButton.onclick = async () => {
      const ageValue = ageInput.value.trim();
      if (!ageValue) {
        alert("Please enter your age.");
        return;
      }

      const requiredQuestions = allQuestions.filter(
        (q) => q.isRequired && activeTab === q.key
      );

      const answers = tabAnswers[activeTab] || {};

      for (const q of requiredQuestions) {
        const key = activeTab === "skincare" ? q.order : q._id;
        const val = answers[key];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          alert(`Please answer: ${q.title}`);
          return;
        }
      }

      if (activeTab === "skincare") {
        const val5 = answers[5];
        const val6 = answers[6];

        let suggestion = "Suggested products";
        if (val5 === "only_allergy") {
          suggestion = "No suggestion";
        } else if (
          (val5 === "only_acne" || val5 === "both_acne_allergy") &&
          val6 !== "no_itch_pain"
        ) {
          suggestion = "No suggestion";
        }

        suggestionBlock.innerHTML = `<p><strong>${suggestion}</strong></p>`;
      } else {
        suggestionBlock.innerHTML = "";
      }

      const payload = {
        customerAge: Number(ageValue),
      };

      if (activeTab === "skincare") {
        const ageRange = getAgeRange(Number(ageValue));

        payload.skinCare = {
          ageRange,
          skinConcerns: answers[1] || [],
          currentSkinCareProducts: answers[3] || [],
          productTypePreference: answers[4] || [],
          skinType: answers[2] || "",
          skinIssueCondition: answers[5] || "",
          acneIrritation: answers[6] || "",
          acneType: answers[7] || "",
          usedWhiteningProduct: answers[8] || "",
          faceImageUploaded: answers[9] === "yes",
          isCompleted: true,
        };
      }

      if (activeTab === "haircare") {
        const ageRange = getAgeRange(Number(ageValue));
        const hairQuestions = allQuestions.filter((q) => q.key === "haircare");
        const hairConcernQuestion = hairQuestions.find(
          (q) =>
            q.title.toLowerCase().includes("hair concern") ||
            q.title.toLowerCase().includes("concern")
        );

        payload.hairCare = {
          concern: tabAnswers.haircare[hairConcernQuestion?._id] || [],
          ageRange: ageRange,
          isCompleted: true,
        };
      }

      if (activeTab === "makeup") {
        const makeupAnswers = tabAnswers.makeup;
        const makeupQuestions = allQuestions.filter((q) => q.key === "makeup");

        const categoryQuestion = makeupQuestions.find(
          (q) =>
            q.title.toLowerCase().includes("makeup category") ||
            q.title.toLowerCase().includes("category")
        );
        const skinTypeQuestion = makeupQuestions.find((q) =>
          q.title.toLowerCase().includes("skin type")
        );
        const skinToneQuestion = makeupQuestions.find((q) =>
          q.title.toLowerCase().includes("skin tone")
        );
        const skinUndertoneQuestion = makeupQuestions.find((q) =>
          q.title.toLowerCase().includes("undertone")
        );

        const selectedSkinTone = skinToneQuestion?.options.find(
          (opt) => opt.value === makeupAnswers[skinToneQuestion?._id]
        );

        payload.makeup = {
          categories: makeupAnswers[categoryQuestion?._id] || "",
          subCategories: makeupAnswers[`sub_${categoryQuestion?._id}`] || [],
          skinType: makeupAnswers[skinTypeQuestion?._id] || "",
          skinTone: {
            type: makeupAnswers[skinToneQuestion?._id] || "",
            group: selectedSkinTone?.group?.toLowerCase() || "",
          },
          skinUnderTone: makeupAnswers[skinUndertoneQuestion?._id] || "",
          isCompleted: true,
        };
      }

      try {
        const res = await fetch(`${apiURL}/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Submission failed");

        alert("Profile submitted successfully!");
      } catch (err) {
        console.error(err);
        alert("Failed to submit profile.");
      }
    };

    const renderQuestion = (q) => {
      if (renderedOrders.has(q.order)) return;
      const wrapper = document.createElement("div");
      wrapper.className = "question-block";
      wrapper.dataset.order = q.order;

      const title = document.createElement("p");
      title.innerHTML = `<strong>${q.title}</strong>${
        q.isRequired ? " *" : ""
      }`;
      wrapper.appendChild(title);

      if (q.order === 4) {
        renderGroupedQuestion4(q, wrapper, answers);
      } else {
        q.options.forEach((opt) => {
          const label = document.createElement("label");
          const input = document.createElement("input");

          input.type = q.type === "multi_choice" ? "checkbox" : "radio";
          input.name = q._id;
          input.value = opt.value;

          // Preselect based on existing answers
          if (answers[q.order]) {
            if (input.type === "checkbox") {
              if (
                Array.isArray(answers[q.order]) &&
                answers[q.order].includes(opt.value)
              ) {
                input.checked = true;
              }
            } else {
              if (answers[q.order] === opt.value) {
                input.checked = true;
              }
            }
          }

          if (q.type === "picture_choice") {
            const img = document.createElement("img");
            img.src = opt.imageUrl;
            img.alt = opt.label;
            img.width = 80;
            img.height = 80;
            label.appendChild(input);
            label.appendChild(img);
          } else {
            label.appendChild(input);
            label.append(` ${opt.label}`);
          }

          input.addEventListener("change", () => {
            if (q.order === 3) {
              // For question 3, combine checkbox values with text field value
              updateQuestion3Answers(wrapper, answers, q);
            } else {
              answers[q.order] =
                input.type === "checkbox"
                  ? getCheckedValues(form, q._id)
                  : input.value;
            }

            handleConditionals();

            if (q.order === 9) {
              if (input.value === "yes" && input.checked) {
                showFileInput(wrapper);
              } else if (input.value === "no" && input.checked) {
                removeFileInput(wrapper);
              }
            }

            if (opt.sub_category && input.checked) {
              showSubCategory(opt, wrapper, q.order);
            } else if (opt.sub_category) {
              removeSubCategory(wrapper);
            }
          });

          wrapper.appendChild(label);
          wrapper.appendChild(document.createElement("br"));
        });
      }

      form.appendChild(wrapper);
      renderedOrders.add(q.order);

      // Add text field for question 3 (current skincare products)
      if (q.order === 3) {
        addTextFieldForQuestion3(wrapper, answers, q);
      }

      if (q.order === 9 && answers[9] === "yes") {
        showFileInput(wrapper);
      }
    };

    const renderGroupedQuestion4 = (q, wrapper, answers) => {
      const firstGroup = q.options.slice(0, 8);
      const secondGroup = q.options.slice(8);

      const firstGroupDiv = document.createElement("div");
      firstGroupDiv.className = "question-group";
      firstGroupDiv.innerHTML =
        "<p><strong>Select specific products:</strong></p>";

      firstGroup.forEach((opt) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = `${q._id}_group1`;
        input.value = opt.value;
        input.className = "group1-option";

        // Preselect checkboxes - only if the saved value is actually from the first group
        if (
          answers[q.order] &&
          Array.isArray(answers[q.order]) &&
          answers[q.order].includes(opt.value) &&
          firstGroup.some((option) => option.value === opt.value)
        ) {
          input.checked = true;
        }

        label.appendChild(input);
        label.append(` ${opt.label}`);
        firstGroupDiv.appendChild(label);
        firstGroupDiv.appendChild(document.createElement("br"));
      });

      const secondGroupDiv = document.createElement("div");
      secondGroupDiv.className = "question-group";
      secondGroupDiv.innerHTML = "<p><strong>Or choose a routine:</strong></p>";

      secondGroup.forEach((opt) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `${q._id}_group2`;
        input.value = opt.value;
        input.className = "group2-option";

        // Preselect radio button - handle both string and array cases
        let shouldCheck = false;

        if (answers[q.order]) {
          if (Array.isArray(answers[q.order])) {
            // If it's an array, check if this option is in the array AND belongs to second group
            shouldCheck =
              answers[q.order].includes(opt.value) &&
              secondGroup.some((option) => option.value === opt.value);
          } else {
            // If it's a string, check direct match
            shouldCheck = answers[q.order] === opt.value;
          }
        }

        if (shouldCheck) {
          input.checked = true;
        }

        label.appendChild(input);
        label.append(` ${opt.label}`);
        secondGroupDiv.appendChild(label);
        secondGroupDiv.appendChild(document.createElement("br"));
      });

      wrapper.appendChild(firstGroupDiv);
      wrapper.appendChild(secondGroupDiv);

      const group1Inputs = wrapper.querySelectorAll(".group1-option");
      const group2Inputs = wrapper.querySelectorAll(".group2-option");

      group1Inputs.forEach((input) => {
        input.addEventListener("change", () => {
          if (input.checked) {
            group2Inputs.forEach((g2Input) => {
              g2Input.checked = false;
              g2Input.disabled = true;
            });
          } else {
            const anyGroup1Selected = Array.from(group1Inputs).some(
              (inp) => inp.checked
            );
            if (!anyGroup1Selected) {
              group2Inputs.forEach((g2Input) => {
                g2Input.disabled = false;
              });
            }
          }
          updateQuestion4Answers(wrapper, answers, q.order);
        });
      });

      group2Inputs.forEach((input) => {
        input.addEventListener("change", () => {
          if (input.checked) {
            group1Inputs.forEach((g1Input) => {
              g1Input.checked = false;
              g1Input.disabled = true;
            });
          } else {
            const anyGroup2Selected = Array.from(group2Inputs).some(
              (inp) => inp.checked
            );
            if (!anyGroup2Selected) {
              group1Inputs.forEach((g1Input) => {
                g1Input.disabled = false;
              });
            }
          }
          updateQuestion4Answers(wrapper, answers, q.order);
        });
      });

      // FIXED: Set initial state based on preloaded data
      const anyGroup1Selected = Array.from(group1Inputs).some(
        (inp) => inp.checked
      );
      const anyGroup2Selected = Array.from(group2Inputs).some(
        (inp) => inp.checked
      );

      if (anyGroup1Selected) {
        group2Inputs.forEach((g2Input) => {
          g2Input.disabled = true;
        });
      } else if (anyGroup2Selected) {
        group1Inputs.forEach((g1Input) => {
          g1Input.disabled = true;
        });
      }
    };

    const updateQuestion4Answers = (wrapper, answers, order) => {
      const group1Inputs = wrapper.querySelectorAll(".group1-option:checked");
      const group2Inputs = wrapper.querySelectorAll(".group2-option:checked");

      if (group1Inputs.length > 0) {
        answers[order] = Array.from(group1Inputs).map((inp) => inp.value);
      } else if (group2Inputs.length > 0) {
        answers[order] = group2Inputs[0].value;
      } else {
        answers[order] = [];
      }
    };

    const addTextFieldForQuestion3 = (wrapper, answers, q) => {
      const textFieldWrapper = document.createElement("div");
      textFieldWrapper.className = "text-field-wrapper";
      textFieldWrapper.style.marginTop = "10px";

      const textLabel = document.createElement("label");
      textLabel.textContent = "Other products (please specify):";
      textLabel.style.fontWeight = "bold";
      textLabel.style.display = "block";
      textLabel.style.marginBottom = "5px";

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.name = `${q._id}_other`;
      textInput.placeholder = "Enter other skincare products...";
      textInput.style.width = "100%";
      textInput.style.padding = "8px";
      textInput.style.border = "1px solid #ccc";
      textInput.style.borderRadius = "4px";

      // Pre-fill text field if there are custom values in answers
      if (answers[q.order] && Array.isArray(answers[q.order])) {
        const customValues = answers[q.order].filter((val) => {
          return !q.options.some((opt) => opt.value === val);
        });
        if (customValues.length > 0) {
          textInput.value = customValues.join(", ");
        }
      }

      textInput.addEventListener("input", () => {
        updateQuestion3Answers(wrapper, answers, q);
      });

      textFieldWrapper.appendChild(textLabel);
      textFieldWrapper.appendChild(textInput);
      wrapper.appendChild(textFieldWrapper);
    };

    const updateQuestion3Answers = (wrapper, answers, q) => {
      const checkboxValues = getCheckedValues(wrapper, q._id);
      const textInput = wrapper.querySelector(`input[name="${q._id}_other"]`);
      const textValue = textInput ? textInput.value.trim() : "";

      let combinedValues = [...checkboxValues];

      if (textValue) {
        // Split by comma and clean up each value
        const textValues = textValue
          .split(",")
          .map((val) => val.trim())
          .filter((val) => val);
        combinedValues = combinedValues.concat(textValues);
      }

      answers[q.order] = combinedValues;
    };

    const showSubCategory = (opt, wrapper, order) => {
      removeSubCategory(wrapper);
      const subWrapper = document.createElement("div");
      subWrapper.className = "subcategory-block";
      subWrapper.dataset.parentOrder = order;
      opt.sub_category.forEach((sub) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = `sub_${order}`;
        input.value = sub.value;
        label.appendChild(input);
        label.append(` ${sub.label}`);
        subWrapper.appendChild(label);
        subWrapper.appendChild(document.createElement("br"));
      });
      wrapper.appendChild(subWrapper);
    };

    const removeSubCategory = (wrapper) => {
      const existing = wrapper.querySelector(".subcategory-block");
      if (existing) existing.remove();
    };

    const showFileInput = (wrapper) => {
      removeFileInput(wrapper);
      const fileInputWrapper = document.createElement("div");
      fileInputWrapper.className = "file-input-wrapper";

      const fileLabel = document.createElement("label");
      fileLabel.textContent = "Upload your face photo:";
      fileLabel.htmlFor = "face-photo-upload";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.id = "face-photo-upload";
      fileInput.name = "face_photo";

      fileInputWrapper.appendChild(fileLabel);
      fileInputWrapper.appendChild(fileInput);
      wrapper.appendChild(fileInputWrapper);
    };

    const removeFileInput = (wrapper) => {
      const existingInput = wrapper.querySelector(".file-input-wrapper");
      if (existingInput) existingInput.remove();
    };

    const handleConditionals = () => {
      skippedOrders.forEach((order) => {
        const el = form.querySelector(`.question-block[data-order='${order}']`);
        if (el) {
          el.remove();
          renderedOrders.delete(order);
        }
      });

      const q5Val = answers[5];
      const q6Val = answers[6];
      const getQ = (order) => questions.find((q) => q.order === order);

      if (q5Val === "neither_acne_allergy") {
        return;
      }

      if (q5Val === "only_allergy") {
        [7, 8, 9, 10, 11].forEach((order) => {
          const q = getQ(order);
          if (q) renderQuestion(q);
        });
        return;
      }

      if (q5Val === "only_acne" || q5Val === "both_acne_allergy") {
        const q6 = getQ(6);
        if (q6) renderQuestion(q6);

        if (["itch_red_burn", "itch_sometimes", "painful"].includes(q6Val)) {
          [7, 8, 9, 10, 11].forEach((order) => {
            const q = getQ(order);
            if (q) renderQuestion(q);
          });
          return;
        } else if (q6Val === "no_itch_pain") {
          [7, 8, 9, 10, 11].forEach((order) => {
            const q = getQ(order);
            if (q) renderQuestion(q);
          });
          return;
        }
      }
    };

    questions
      .filter((q) => q.order !== null && q.order <= 5)
      .sort((a, b) => a.order - b.order)
      .forEach((q) => renderQuestion(q));

    // Handle conditional questions based on preloaded data
    handleConditionals();

    container.appendChild(form);
  }

  function getCheckedValues(form, name) {
    return Array.from(
      form.querySelectorAll(`input[name="${name}"]:checked`)
    ).map((input) => input.value);
  }

  function getAgeRange(age) {
    if (age >= 0 && age <= 0.5) return "Newborn – 6 months";
    if (age > 0.5 && age <= 9) return "6 months- 9 years";
    if (age >= 10 && age <= 17) return "10–17 years";
    if (age >= 18 && age <= 25) return "18–25 years";
    return "25+ years";
  }

  function renderGeneric(questions) {
    container.innerHTML = "";
    const form = document.createElement("form");

    // Use existing answers or initialize empty
    const answers = tabAnswers[activeTab] || {};
    tabAnswers[activeTab] = answers;

    questions.forEach((q) => {
      const wrapper = document.createElement("div");
      wrapper.className = "question-block";

      const title = document.createElement("p");
      title.innerHTML = `<strong>${q.title}</strong>${
        q.isRequired ? " *" : ""
      }`;
      wrapper.appendChild(title);

      q.options.forEach((opt) => {
        const label = document.createElement("label");
        const input = document.createElement("input");

        input.type = q.type === "multi_choice" ? "checkbox" : "radio";
        input.name = q._id;
        input.value = opt.value;

        // Preselect based on existing answers
        if (answers[q._id]) {
          if (input.type === "checkbox") {
            if (
              Array.isArray(answers[q._id]) &&
              answers[q._id].includes(opt.value)
            ) {
              input.checked = true;
            }
          } else {
            if (answers[q._id] === opt.value) {
              input.checked = true;
            }
          }
        }

        if (q.type === "picture_choice") {
          const img = document.createElement("img");
          img.src = opt.imageUrl;
          img.alt = opt.label;
          img.width = 80;
          img.height = 80;
          label.appendChild(input);
          label.appendChild(img);
        } else {
          label.appendChild(input);
          label.append(` ${opt.label}`);
        }

        input.addEventListener("change", () => {
          answers[q._id] =
            input.type === "checkbox"
              ? getCheckedValues(form, q._id)
              : input.value;

          removeSubCategory(wrapper);
          if (opt.sub_category && input.checked) {
            showSubCategory(opt, wrapper, q._id);
          }
        });

        wrapper.appendChild(label);
        wrapper.appendChild(document.createElement("br"));
      });

      form.appendChild(wrapper);

      // Handle preloaded subcategories
      if (answers[`sub_${q._id}`] && Array.isArray(answers[`sub_${q._id}`])) {
        const selectedOption = q.options.find((opt) => {
          if (q.type === "multi_choice") {
            return (
              Array.isArray(answers[q._id]) &&
              answers[q._id].includes(opt.value)
            );
          } else {
            return answers[q._id] === opt.value;
          }
        });

        if (selectedOption && selectedOption.sub_category) {
          showSubCategory(selectedOption, wrapper, q._id);
          // Preselect subcategory options
          setTimeout(() => {
            const subInputs = wrapper.querySelectorAll(
              `input[name="sub_${q._id}"]`
            );
            subInputs.forEach((subInput) => {
              if (answers[`sub_${q._id}`].includes(subInput.value)) {
                subInput.checked = true;
              }
            });
          }, 0);
        }
      }
    });

    container.appendChild(form);

    function showSubCategory(opt, wrapper, name) {
      removeSubCategory(wrapper);
      const subWrapper = document.createElement("div");
      subWrapper.className = "subcategory-block";
      opt.sub_category.forEach((sub) => {
        const subLabel = document.createElement("label");
        const subInput = document.createElement("input");
        subInput.type = "checkbox";
        subInput.name = `sub_${name}`;
        subInput.value = sub.value;

        subInput.addEventListener("change", () => {
          answers[`sub_${name}`] = getCheckedValues(form, `sub_${name}`);
        });

        subLabel.appendChild(subInput);
        subLabel.append(` ${sub.label}`);
        subWrapper.appendChild(subLabel);
        subWrapper.appendChild(document.createElement("br"));
      });
      wrapper.appendChild(subWrapper);
    }

    function removeSubCategory(wrapper) {
      const existing = wrapper.querySelector(".subcategory-block");
      if (existing) existing.remove();
    }
  }
});
