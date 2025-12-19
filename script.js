const API_KEY = "AIzaSyBDs1m0AuJ6xWp1KqTxXM6Yjq-Z854l4vw";

const MODEL = "gemini-2.5-flash";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");

function autoSizeTextarea(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}
inputEl.addEventListener("input", () => autoSizeTextarea(inputEl));

function escapeHtml(str) {
  return str.replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

function makeBubble(text, who = "ai", meta = "") {
  const wrap = document.createElement("div");
  wrap.className = "bubble " + who;
  if (meta) {
    const m = document.createElement("div");
    m.className = "meta";
    m.textContent = meta;
    wrap.appendChild(m);
  }
  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = text;
  wrap.appendChild(content);
  return wrap;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendUser(text) {
  messagesEl.appendChild(makeBubble(escapeHtml(text), "user", "You"));
  scrollToBottom();
}

function appendAITyping() {
  const node = makeBubble("", "ai", "Chatbot");
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.innerHTML =
    '<span class="dot"></span><span class="dot"></span><span class="dot"></span> Thinking...';
  node.appendChild(typing);
  messagesEl.appendChild(node);
  scrollToBottom();
  return node;
}

function replaceWithAI(node, html) {
  node.innerHTML = "";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = "Chatbot";
  node.appendChild(meta);

  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = html;
  node.appendChild(content);
  scrollToBottom();
}

async function callGemini(prompt) {
  
  if (!API_KEY || API_KEY.startsWith("PASTE") || API_KEY.length < 10) {
    return "⚠️ Error: Please open script.js and paste your valid Google API Key.";
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
     
      const errText = await res.text();
      let errMsg = `${res.status} ${res.statusText}`;

      try {
        const jsonErr = JSON.parse(errText);

        if (jsonErr.error && jsonErr.error.message) {
          errMsg = jsonErr.error.message;
        }
      } catch (e) {
        errMsg = errText;
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response content.";
    return text;
  } catch (err) {
    console.error(err);

    if (err.message.includes("404") || err.message.includes("not found")) {
      return `⚠️ Model Error: The model '${MODEL}' was not found. Try changing the MODEL variable in script.js to 'gemini-1.5-flash-001'.`;
    }
    return `⚠️ Error: ${escapeHtml(err.message)}`;
  }
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  appendUser(text);
  inputEl.value = "";
  autoSizeTextarea(inputEl);
  inputEl.style.height = "auto";

  const typingNode = appendAITyping();

  const reply = await callGemini(text);

  await new Promise((r) =>
    setTimeout(r, 300 + Math.min(reply.length * 10, 1500))
  );

  let formattedReply = escapeHtml(reply)
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

  replaceWithAI(typingNode, formattedReply);
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messagesEl.appendChild(
  makeBubble(
    `<strong>Welcome!</strong> I am powered by ${MODEL}. Ask me anything!`,
    "ai",
    "Chatbot"
  )
);
scrollToBottom();

