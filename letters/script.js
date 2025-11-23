// DRILLIONS LETTERS – CLEAN FEED + HIDDEN PROFILES

const WORLD_KEY = "dl_world_letters";
const PROFILE_KEY = "dl_letters_profile";
const THREAD_KEY = "dl_penpal_thread";

const ONE_DAY = 24 * 60 * 60 * 1000;

// DOM
const worldForm = document.getElementById("world-form");
const worldInput = document.getElementById("world-input");
const worldCount = document.getElementById("world-count");
const worldList = document.getElementById("world-list");
const worldEmpty = document.getElementById("world-empty");

const penpalForm = document.getElementById("penpal-form");
const penpalInput = document.getElementById("penpal-input");
const penpalCount = document.getElementById("penpal-count");
const threadList = document.getElementById("thread-list");
const threadEmpty = document.getElementById("thread-empty");

const avatarCircle = document.getElementById("avatar-circle");
const profileStatus = document.getElementById("profile-status");
const progressText = document.getElementById("progress-text");

// Helpers
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

function uuid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60 * 1000) return "just now";
  if (diff < 60 * 60 * 1000) {
    const m = Math.floor(diff / (60 * 1000));
    return `${m}m ago`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const h = Math.floor(diff / (60 * 60 * 1000));
    return `${h}h ago`;
  }
  const d = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${d}d ago`;
}

// ---------------- PROFILE ----------------

const avatarSymbols = ["✧", "✦", "❖", "✺", "✸", "✶", "✥"];

function initProfile() {
  let profile = load(PROFILE_KEY, null);
  if (!profile) {
    profile = {
      id: "user-" + uuid().slice(0, 6),
      avatar: avatarSymbols[Math.floor(Math.random() * avatarSymbols.length)],
      createdAt: Date.now()
    };
    save(PROFILE_KEY, profile);
  }
  avatarCircle.textContent = profile.avatar;
  return profile;
}

const profile = initProfile();

// --------------- WORLD FEED (CLEAN) ---------------

function getWorldLetters() {
  const list = load(WORLD_KEY, []);
  // CLEAN: only last 24 hours
  const cutoff = Date.now() - ONE_DAY;
  const cleaned = list.filter((m) => m.ts >= cutoff);
  if (cleaned.length !== list.length) save(WORLD_KEY, cleaned);
  return cleaned.sort((a, b) => b.ts - a.ts);
}

function renderWorld() {
  const letters = getWorldLetters();
  worldList.innerHTML = "";
  if (!letters.length) {
    worldEmpty.style.display = "block";
    return;
  }
  worldEmpty.style.display = "none";

  letters.forEach((msg) => {
    const item = document.createElement("article");
    item.className = "feed-item";

    const textEl = document.createElement("div");
    textEl.className = "feed-text";
    textEl.textContent = msg.text;

    const meta = document.createElement("div");
    meta.className = "feed-meta";
    const left = document.createElement("span");
    left.textContent = "Anonymous letter";
    const right = document.createElement("span");
    right.textContent = timeAgo(msg.ts);
    meta.appendChild(left);
    meta.appendChild(right);

    item.appendChild(textEl);
    item.appendChild(meta);
    worldList.appendChild(item);
  });
}

worldInput.addEventListener("input", () => {
  worldCount.textContent = `${worldInput.value.length} / 400`;
});

worldForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = worldInput.value.trim();
  if (!text) return;

  const list = getWorldLetters();
  list.push({
    id: uuid(),
    text,
    ts: Date.now()
  });
  save(WORLD_KEY, list);
  worldInput.value = "";
  worldCount.textContent = "0 / 400";
  renderWorld();
});

// --------------- PENPAL THREAD + UNLOCK LOGIC ---------------

function getThread() {
  return load(THREAD_KEY, {
    messages: [], // {id, from: 'me'|'them', text, ts}
    firstTs: null
  });
}

function saveThread(thread) {
  save(THREAD_KEY, thread);
}

function computeUnlock(thread) {
  const total = thread.messages.filter((m) => m.from === "me").length;
  const first = thread.firstTs;
  const now = Date.now();

  let hoursRemaining = 24;
  if (first) {
    const diff = now - first;
    if (diff >= ONE_DAY) hoursRemaining = 0;
    else hoursRemaining = Math.ceil((ONE_DAY - diff) / (60 * 60 * 1000));
  }

  const lettersNeeded = Math.max(0, 7 - total);
  const unlocked = total >= 7 && first && now - first >= ONE_DAY;

  return { total, lettersNeeded, hoursRemaining, unlocked };
}

function renderProfileUnlock(thread) {
  const { total, lettersNeeded, hoursRemaining, unlocked } = computeUnlock(thread);

  if (unlocked) {
    profileStatus.textContent = "Unlocked — Chrome Firefly";
    progressText.textContent = `${total} letters • identity unlocked`;
    avatarCircle.textContent = "✦";
  } else {
    profileStatus.textContent = "Hidden — Unknown";
    const lettersPart = `${total} / 7 letters`;
    const timePart = `${hoursRemaining || 24}h remaining`;
    progressText.textContent = `${lettersPart} • ${timePart}`;
    avatarCircle.textContent = profile.avatar;
  }
}

function renderThread(thread) {
  threadList.innerHTML = "";
  if (!thread.messages.length) {
    threadEmpty.style.display = "block";
    return;
  }
  threadEmpty.style.display = "none";

  thread.messages
    .slice()
    .sort((a, b) => a.ts - b.ts)
    .forEach((m) => {
      const bubble = document.createElement("div");
      bubble.className = "bubble " + (m.from === "me" ? "me" : "them");
      bubble.textContent = m.text;

      const meta = document.createElement("div");
      meta.className = "bubble-meta";
      meta.textContent = m.from === "me" ? `You • ${timeAgo(m.ts)}` : `Penpal • ${timeAgo(m.ts)}`;
      bubble.appendChild(document.createElement("br"));
      bubble.appendChild(meta);

      threadList.appendChild(bubble);
    });

  threadList.scrollTop = threadList.scrollHeight;
}

const thread = getThread();
renderThread(thread);
renderProfileUnlock(thread);

penpalInput.addEventListener("input", () => {
  penpalCount.textContent = `${penpalInput.value.length} / 500`;
});

penpalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = penpalInput.value.trim();
  if (!text) return;

  if (!thread.firstTs) thread.firstTs = Date.now();

  thread.messages.push({
    id: uuid(),
    from: "me",
    text,
    ts: Date.now()
  });

  // Optional: tiny auto-reply to make it feel alive
  if (thread.messages.length === 1) {
    thread.messages.push({
      id: uuid(),
      from: "them",
      text: "Your letter has been received. Keep writing. The lock will open in time.",
      ts: Date.now() + 1500
    });
  }

  saveThread(thread);
  penpalInput.value = "";
  penpalCount.textContent = "0 / 500";
  renderThread(thread);
  renderProfileUnlock(thread);
});

// INITIAL RENDER
renderWorld();
