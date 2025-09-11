document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("support-form");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const errorEl = document.getElementById("error-message");
  const messagesContainer = document.getElementById("messages-container");
  const loadingEl = document.getElementById("loading");

  const customerId = messagesContainer?.dataset?.customerId;
  const apiUrl = `/apps/${APP_SUB_PATH}/customer/customer-service-management/message`;

  function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.style.display = "block";
    setTimeout(() => {
      element.style.display = "none";
    }, 5000);
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return (
        date.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " • " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message) return;

    sendButton.disabled = true;
    sendButton.innerHTML =
      '<spinner-component size="small" color="white"></spinner-component>';

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (res.ok) {
        messageInput.value = "";
        await loadMessages();
      } else {
        showMessage(errorEl, data.error || "Failed to send message.", true);
      }
    } catch (err) {
      showMessage(errorEl, "Error sending message. Please try again.", true);
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "Send";
      messageInput.focus();
    }
  });

  async function loadMessages() {
    if (!customerId) {
      messagesContainer.innerHTML = `
          <div class="empty-state">
            <p>Please log in to view messages.</p>
          </div>
        `;
      return;
    }

    try {
      loadingEl.innerHTML =
        '<spinner-component size="medium" color="primary"></spinner-component>';
      loadingEl.style.display = "block";

      const res = await fetch(apiUrl, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const data = await res.json();

      if (res.ok) {
        loadingEl.style.display = "none";

        if (!data.messages || !data.messages.length) {
          messagesContainer.innerHTML = `
              <div class="empty-state">
                <p class="fw-500 fs-14-lh-16-ls-0">No messages yet. Start a conversation with our support team!</p>
              </div>
            `;
          return;
        }

        const html = data.messages
          .map((msg) => {
            const isUser = msg.sender === "user";
            const senderName = isUser ? "You" : "Admin";
            const messageClass = isUser
              ? "user items-end"
              : "support items-start";
            const messageBubbleClass = isUser ? "bg-brand-2" : "bg-light-gray";
            const formattedDate = formatDate(msg.created_at);

            return `
                <div class="message ${messageClass} flex flex-col gap-8">
                  <div class="message-info fw-400 fs-12-lh-16-ls-0_072 flex justify-between text-primary-label">
                    <span>${senderName}</span>
                    <span class="ml-8 mr-8">•</span>
                    <span>${formattedDate}</span>
                  </div>
                  <div class="message-bubble ${messageBubbleClass} text-primary rounded-12 fw-500 fs-14-lh-20-ls-0_1 pt-12 pr-16 pb-12 pl-16">
                    ${msg.message}
                  </div>
                </div>
              `;
          })
          .join("");

        messagesContainer.innerHTML = html;
        scrollToBottom();
      } else {
        loadingEl.style.display = "none";
        messagesContainer.innerHTML = `
            <div class="empty-state">
              <p>${data.error || "Could not load messages."}</p>
            </div>
          `;
      }
    } catch (err) {
      loadingEl.style.display = "none";
      messagesContainer.innerHTML = `
          <div class="empty-state">
            <p>Failed to load messages.<br>Please refresh the page.</p>
          </div>
        `;
    }
  }

  messageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });

  await loadMessages();

  if (customerId) {
    setInterval(async () => {
      await loadMessages();
    }, 10000);
  }

  messageInput?.focus();
});
