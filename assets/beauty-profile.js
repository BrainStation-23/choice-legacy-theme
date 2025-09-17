document.addEventListener("DOMContentLoaded", async () => {
  function createProfileTypes(productTypeQuestion) {
    const container = document.getElementById("beauty-profile-types-container");

    if (!container) return;

    if (productTypeQuestion && productTypeQuestion.options) {
      const cardsHtml = productTypeQuestion.options
        .map(
          (option) => `
        <div class="profile-type-card flex flex-col items-center gap-12 w-277 pt-12">
          <div>
            <div class="relative w-277">
              <img
                src="${option.image}"
                alt="${option.label} profile"
                loading="lazy"
                class="relative w-full h-222 object-cover"
              >
            </div>

            <div class="w-full">
              <h3 class="w-full rounded-b-l-32 rounded-b-r-32 text-center uppercase pt-12 pr-8 pb-12 pl-8 bg-brand text-bg fs-26-lh-26-ls-1_2 fw-400">
                ${option.label}
              </h3>
            </div>
          </div>

          <button
            type="button"
            class="setup-now-btn button button--outline w-full flex gap-4 justify-center items-center fs-16-lh-100pct-ls-0"
            data-profile-type="${option.value}"
          >
            <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.10352 13.9492C6.10352 13.2559 6.67969 12.6895 7.36328 12.6895H13.1055V6.94727C13.1055 6.26367 13.6719 5.6875 14.3652 5.6875C15.0586 5.6875 15.625 6.26367 15.625 6.94727V12.6895H21.3672C22.0605 12.6895 22.627 13.2559 22.627 13.9492C22.627 14.6426 22.0605 15.209 21.3672 15.209H15.625V20.9512C15.625 21.6445 15.0586 22.2109 14.3652 22.2109C13.6719 22.2109 13.1055 21.6445 13.1055 20.9512V15.209H7.36328C6.67969 15.209 6.10352 14.6426 6.10352 13.9492Z" fill="#FB6F92"/>
            </svg>
            <span>Setup Now</span>
          </button>
        </div>
      `
        )
        .join("");

      container.innerHTML = `
        ${cardsHtml}
      `;

      container.querySelectorAll(".setup-now-btn").forEach((button) => {
        button.addEventListener("click", () => {
          handleProfileSelection(button.dataset.profileType);
        });
      });
    }
  }

  const apiUrl = `/apps/${window.APP_SUB_PATH}/customer/beauty-profile`;

  try {
    const response = await fetch(`${apiUrl}/questions`);
    const { questions } = await response.json();

    if (!questions || questions.length === 0) {
      return;
    }

    const productTypeQuestion = questions.find((q) => q.key === "product_type");

    createProfileTypes(productTypeQuestion);
  } catch (error) {
    console.log(error);
  }
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
