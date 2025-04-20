// Handle Enter key for sending message
document.getElementById("user-input").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const inputField = document.getElementById("user-input");
  const message = inputField.value.trim();

  if (!message) return;

  const chat = document.getElementById("chat");
  chat.innerHTML += `<div class="user">${message}</div>`;

  // Show typing indicator
  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add("bot", "typing");
  typingIndicator.innerHTML = "Bot is typing<span class='dots'>...</span>";
  chat.appendChild(typingIndicator);
  chat.scrollTop = chat.scrollHeight;

  fetch("/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const reply = data.reply;

      // Remove typing indicator
      const typingDiv = document.querySelector(".typing");
      typingDiv && typingDiv.remove();

      if (reply.richContent) {
        handleRichContent(reply.richContent.listValue.values);
      } else {
        chat.innerHTML += `<div class="bot">${reply}</div>`;
      }

      inputField.value = "";
      chat.scrollTop = chat.scrollHeight;
    })
    .catch(err => {
      console.error("Error from server:", err);

      // Remove typing indicator if present
      const typingDiv = document.querySelector(".typing");
      typingDiv && typingDiv.remove();

      // Show error message to user
      chat.innerHTML += `<div class="bot error">⚠️ Oops, something went wrong. Please try again.</div>`;
      chat.scrollTop = chat.scrollHeight;
    });
}

function handleRichContent(richContent) {
  const chat = document.getElementById("chat");

  richContent.forEach(innerList => {
    const items = innerList.listValue.values;

    items.forEach(item => {
      const itemFields = item.structValue.fields;
      const type = itemFields.type.stringValue;

      switch (type) {
        case "text":
          const text = itemFields.text?.stringValue || "";
          chat.innerHTML += `<div class="bot">${text}</div>`;
          break;

        case "button":
          const buttonText = itemFields.text?.stringValue || "Button";
          const link = itemFields.link?.stringValue || "#";
          chat.innerHTML += `<div class="bot"><button onclick="window.open('${link}', '_blank')">${buttonText}</button></div>`;
          break;

        case "image":
          const imageUrl = itemFields.rawUrl?.stringValue || "";
          chat.innerHTML += `<div class="bot"><img src="${imageUrl}" style="max-width: 200px; border-radius: 8px; margin: 5px 0;"></div>`;
          break;

        case "info":
          const title = itemFields.title?.stringValue || "";
          const subtitle = itemFields.subtitle?.stringValue || "";
          chat.innerHTML += `
            <div class="bot info-card">
              <strong>${title}</strong><br>
              <small>${subtitle}</small>
            </div>
          `;
          break;

        case "chips":
          const chipOptions = itemFields.options.listValue.values;
          let chipsHTML = `<div class="bot chips">`;
          chipOptions.forEach(chipItem => {
            const chipText = chipItem.structValue.fields.text.stringValue;
            chipsHTML += `<button class="chip" onclick="sendQuickReply('${chipText}')">${chipText}</button>`;
          });
          chipsHTML += `</div>`;
          chat.innerHTML += chipsHTML;
          break;

        default:
          console.warn(`Unknown rich content type: ${type}`);
          break;
      }
    });
  });

  chat.scrollTop = chat.scrollHeight;
}

function sendQuickReply(message) {
  document.getElementById("user-input").value = message;
  sendMessage();
}
