document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("support-form");
  const messageField = document.getElementById("message");
  const confirmation = document.getElementById("confirmation-message");
  const historyContainer = document.getElementById("message-history");
  const customerId = historyContainer?.dataset?.customerId;
  const apiUrl = `/apps/${APP_SUB_PATH}/customer/customer-service-management/message`;

  // Initialize Quill
  const quill = new Quill("#editor", { theme: "snow" });

  // Submit message
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    messageField.value = quill.root.innerHTML;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        confirmation.textContent = data.message;
        form.reset();
        quill.setContents([]);
        await loadMessages(customerId); // Refresh message history
      } else {
        confirmation.textContent = data.error || "Failed to send message.";
      }
    } catch (err) {
      confirmation.textContent = "Error sending message.";
    }
  });

  // Load message history
  async function loadMessages(customerId) {
    if (!customerId) {
      historyContainer.innerHTML = "<p>Please log in to view messages.</p>";
      return;
    }

    try {
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (res.ok) {
        if (!data.messages.length) {
          historyContainer.innerHTML = "<p>No messages yet.</p>";
          return;
        }

        const html = data.messages
          .map((msg) => {
            const date = new Date(msg.created_at).toLocaleString();
            return `
            <div style="margin-bottom: 1em;">
              <strong>${msg.sender === "user" ? "You" : "Support"}:</strong><br>
              <div>${msg.message}</div>
              <small>${date}</small>
            </div>
          `;
          })
          .join("");

        historyContainer.innerHTML = html;
      } else {
        historyContainer.innerHTML = `<p>${
          data.error || "Could not load messages."
        }</p>`;
      }
    } catch (err) {
      historyContainer.innerHTML = "<p>Failed to load messages.</p>";
    }
  }

  // Initial message history load
  if (customerId) {
    await loadMessages(customerId);

    // Poll for new messages every 10 seconds
    setInterval(() => {
      loadMessages(customerId);
    }, 10000);
  }
});
