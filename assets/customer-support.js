let isSupportChatInitialized = false;

window.loadSupportMessages = async function () {
  const messagesContainer = document.getElementById("messages-container");
  const loadingEl = document.getElementById("loading");
  const chatContainer = document.querySelector(".chat-container");
  const customerId = messagesContainer?.dataset.customerId;

  if (!messagesContainer || !loadingEl || !chatContainer || !customerId) {
    return;
  }

  try {
    // Show the spinner before calling the API
    loadingEl.style.display = "block";
    messagesContainer.innerHTML = ""; // Clear old messages before loading new ones

    const res = await fetch(
      `/apps/${APP_SUB_PATH}/customer/customer-service-management/message`,
      { headers: { "X-Requested-With": "XMLHttpRequest" } }
    );
    const data = await res.json();

    // Hide the spinner after the API call is complete
    loadingEl.style.display = "none";

    if (res.ok) {
      document.body.dataset.unreadMessages = 0;
      const unreadCountElement = document.querySelector(
        "#unread-messages-count"
      );
      if (unreadCountElement) {
        unreadCountElement.classList.add("hidden");
      }

      if (!data.messages || !data.messages.length) {
        messagesContainer.innerHTML = `<div class="empty-state"><p class="fw-500 fs-14-lh-16-ls-0">No messages yet. Start a conversation!</p></div>`;
        return;
      }

      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        return `${date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })} • ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      };

      const html = data.messages
        .map((msg) => {
          const isUser = msg.sender === "user";
          return `
            <div class="message ${
              isUser ? "user items-end" : "support items-start"
            } flex flex-col gap-8">
              <div class="message-info fw-400 fs-12-lh-16-ls-0_072 flex justify-between text-primary-label">
                <span>${
                  isUser ? "You" : "Admin"
                }</span><span class="ml-8 mr-8">•</span><span>${formatDate(
            msg.created_at
          )}</span>
              </div>
              <div class="message-bubble ${
                isUser ? "bg-brand-2" : "bg-light-gray"
              } text-primary rounded-12 fw-500 fs-14-lh-20-ls-0_1 pt-12 pr-16 pb-12 pl-16">${
            msg.message
          }</div>
            </div>`;
        })
        .join("");

      messagesContainer.innerHTML = html;
      requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    } else {
      messagesContainer.innerHTML = `<div class="empty-state"><p>${
        data.error || "Could not load messages."
      }</p></div>`;
    }
  } catch (err) {
    loadingEl.style.display = "none";
    messagesContainer.innerHTML = `<div class="empty-state"><p>Failed to load messages.<br>Please refresh the page.</p></div>`;
  }
};

window.initializeSupportChat = async function () {
  if (!isSupportChatInitialized) {
    isSupportChatInitialized = true;

    const form = document.getElementById("support-form");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const errorEl = document.getElementById("error-message");

    if (!form || !messageInput || !sendButton || !errorEl) {
      console.error("Support chat UI elements not found.");
      return;
    }

    const showMessage = (element, message) => {
      element.textContent = message;
      element.style.display = "block";
      setTimeout(() => {
        element.style.display = "none";
      }, 5000);
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = messageInput.value.trim();
      if (!message) return;

      sendButton.disabled = true;
      sendButton.innerHTML =
        '<spinner-component size="small" color="white"></spinner-component>';

      try {
        const res = await fetch(
          `/apps/${APP_SUB_PATH}/customer/customer-service-management/message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({ message }),
          }
        );
        const data = await res.json();
        if (res.ok) {
          messageInput.value = "";
          if (typeof window.loadSupportMessages === "function") {
            await window.loadSupportMessages();
          }
        } else {
          showMessage(errorEl, data.error || "Failed to send message.");
        }
      } catch (err) {
        showMessage(errorEl, "Error sending message. Please try again.");
      } finally {
        sendButton.disabled = false;
        sendButton.textContent = "Send";
        messageInput.focus();
      }
    });

    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
      }
    });

    // Your polling logic - this part is correct.
    setInterval(async () => {
      const unreadCount = parseInt(document.body.dataset.unreadMessages || 0);
      const activeTab = document.body.dataset.activeTab || "";

      if (activeTab === "support" && unreadCount > 0) {
        if (typeof window.loadSupportMessages === "function") {
          await window.loadSupportMessages();
        }
      }
    }, 10000);
  }

  // Load messages when the tab is first opened.
  if (typeof window.loadSupportMessages === "function") {
    await window.loadSupportMessages();
  }

  const messageInput = document.getElementById("message-input");
  if (messageInput) {
    messageInput.focus();
  }
};
