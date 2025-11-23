// DRILLIONS LETTERS – simple front-end prototype
// Local-only demo: fake penpals + localStorage.

const THREAD_KEY = "drillions_letters_threads_v1";

// Elements
const threadListEl = document.getElementById("thread-list");
const letterTextEl = document.getElementById("letter-text");
const newLetterBtn = document.getElementById("new-letter-btn");
const sendLetterBtn = document.getElementById("send-letter-btn");
const penpalLabelEl = document.getElementById("penpal-label");
const composerModeLabelEl = document.getElementById("composer-mode-label");
const toastEl = document.getElementById("toast");
const cooldownLabelEl = document.getElementById("cooldown-label");

const modeAnonBtn = document.getElementById("mode-anon");
const modeRevealBtn = document.getElementById("mode-reveal");

// State
let threads = loadThreads();
let activeThreadId = null;
let mode = "anonymous"; // or "reveal"
let cooldownUntil = 0;

const PENPAL_NAMES = [
  "North Star",
  "Blue Orbit",
  "Neon Ghost",
  "Analog Heart",
  "Night Signal",
  "Chrome Poet"
];

// ---- Storage helpers ----
function loadThreads() {
  try {
    const raw = localStorage.getItem(THREAD_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveThreads() {
  localStorage.setItem(THREAD_KEY, JSON.stringify(threads));
}

// ---- Toast ----
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("visible");
  setTimeout(() => toastEl.classList.remove("visible"), 2200);
}

// ---- Thread helpers ----
function createThread() {
  const id = Date.now().toString();
  const alias =
    PENPAL_NAMES[Math.floor(Math.random() * PENPAL_NAMES.length)];

  const t = {
    id,
    alias,
    mode,
    createdAt: Date.now(),
    letters: [] // { from, text, ts }
  };
  threads.unshift(t);
  activeThreadId = id;
  saveThreads();
  renderThreads();
  updateComposerHeader();
  return t;
}

function getActiveThread() {
  return threads.find((t) => t.id === activeThreadId) || null;
}

function setActiveThread(id) {
  activeThreadId = id;
  renderThreads();
  updateComposerHeader();
  const t = getActiveThread();
  if (t) {
    const last = t.letters[t.letters.length - 1];
    if (last) {
      letterTextEl.placeholder =
        "Write your next letter to " + t.alias + "…";
    }
  }
}

// ---- Render threads ----
function renderThreads() {
  threadListEl.innerHTML = "";

  if (!threads.length) {
    const empty = document.createElement("div");
    empty.className = "thread-empty";
    empty.textContent =
      "No letters yet. Start a new letter to be matched with a stranger.";
    threadListEl.appendChild(empty);
    return;
  }

  threads.forEach((t) => {
    const card = document.createElement("div");
    card.className = "thread-card";
    if (t.id === activeThreadId) {
      card.style.borderColor = "rgba(110,201,255,0.65)";
    }

    const top = document.createElement("div");
    top.className = "thread-top";

    const name = document.createElement("div");
    name.className = "thread-name";
    name.textContent = t.alias;

    const meta = document.createElement("div");
    meta.className = "thread-meta";
    meta.textContent = t.mode === "anonymous" ? "Anonymous" : "Reveal in 7";

    top.appendChild(name);
    top.appendChild(meta);

    const preview = document.createElement("div");
    preview.className = "thread-preview";
    const last = t.letters[t.letters.length - 1];
    preview.textContent = last
      ? (last.from === "you" ? "You: " : "Them: ") +
        (last.text.length > 70
          ? last.text.slice(0, 70) + "…"
          : last.text)
      : "No letters yet — say hi.";

    card.appendChild(top);
    card.appendChild(preview);
    card.addEventListener("click", () => setActiveThread(t.id));

    threadListEl.appendChild(card);
  });
}

// ---- Composer header ----
function updateComposerHeader() {
  const t = getActiveThread();
  if (!t) {
    penpalLabelEl.textContent = "Writing to: Random Stranger";
  } else {
    penpalLabelEl.textContent = "Writing to: " + t.alias;
  }

  composerModeLabelEl.textContent =
    "Mode: " + (mode === "anonymous" ? "Anonymous" : "Reveal after 7 letters");
}

// ---- Cooldown ----
function updateCooldownLabel() {
  const now = Date.now();
  if (now >= cooldownUntil) {
    cooldownLabelEl.textContent =
      "You can send 1 letter every few minutes in this prototype.";
    return;
  }
  const diffSec = Math.ceil((cooldownUntil - now) / 1000);
  cooldownLabelEl.textContent = `Next letter available in ${diffSec}s`;
}

setInterval(updateCooldownLabel, 500);

// ---- Fake reply generator ----
function generateReplyText() {
  const lines = [
    "I like how honest this feels. Nobody writes like this on normal apps.",
    "I read your letter twice. It's wild how easy it is to talk to a stranger.",
    "Thank you for sending that. What pulled you into this app?",
    "I’m answering from a quiet room while it rains outside. Feels right for this.",
    "You sound like someone who thinks a lot. I respect that.",
    "This already feels more real than most conversations I’ve had all week."
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

// ---- Send letter ----
function handleSend() {
  const now = Date.now();
  if (now < cooldownUntil) {
    showToast("Slow down. Let this one breathe before you send another.");
    return;
  }

  const text = letterTextEl.value.trim();
  if (!text) {
    showToast("Write something before sending.");
    return;
  }

  let thread = getActiveThread();
  if (!thread) {
    thread = createThread();
  }

  // Push your letter
  thread.letters.push({
    from: "you",
    text,
    ts: now
  });

  // Fake reply after your letter (for portfolio demo)
  const reply = {
    from: "them",
    text: generateReplyText(),
    ts: now + 1000 * 15 // pretend they answer later
  };
  thread.letters.push(reply);

  // If reveal mode & letters >= 14 → pretend profile unlocked
  if (thread.mode === "reveal" && thread.letters.length >= 14) {
    showToast("Streak unlocked. Their real profile would reveal here.");
  } else {
    showToast("Letter sent.");
  }

  letterTextEl.value = "";
  cooldownUntil = now + 1000 * 45; // 45s cooldown prototype

  // Keep most recent at top
  threads = [
    thread,
    ...threads.filter((t) => t.id !== thread.id)
  ];

  saveThreads();
  renderThreads();
  setActiveThread(thread.id);
}

// ---- New letter ----
function handleNewLetter() {
  letterTextEl.value = "";
  letterTextEl.focus();
  const t = createThread();
  setActiveThread(t.id);
  showToast("New stranger found. Say hi.");
}

// ---- Mode switching ----
modeAnonBtn.addEventListener("click", () => {
  mode = "anonymous";
  modeAnonBtn.classList.add("active");
  modeRevealBtn.classList.remove("active");
  updateComposerHeader();
});

modeRevealBtn.addEventListener("click", () => {
  mode = "reveal";
  modeRevealBtn.classList.add("active");
  modeAnonBtn.classList.remove("active");
  updateComposerHeader();
});

// ---- Events ----
sendLetterBtn.addEventListener("click", handleSend);
newLetterBtn.addEventListener("click", handleNewLetter);

// Allow Cmd+Enter / Ctrl+Enter to send
letterTextEl.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    handleSend();
  }
});

// Initial render
renderThreads();
updateComposerHeader();
updateCooldownLabel();