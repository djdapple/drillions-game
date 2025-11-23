// DRILLIONS LETTERS – Supabase world feed + local penpal unlock

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ------------------ CONFIG: PUT YOUR KEYS HERE ------------------
// Get these from Supabase project settings → API.
const SUPABASE_URL = "https://YOUR-PROJECT-ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------ DOM HOOKS ------------------
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

// ------------------ CONSTANTS & HELPERS ------------------
const WORLD_KEY = "dl_world_cache_v1";   // just for quick local cache (optional)
const PROFILE_KEY = "dl_letters_profile";
const THREAD_KEY = "dl_penpal_thread";

const ONE_DAY = 24 * 60 * 60 * 1000;

function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function uuid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) {
    const m = Math.floor(diff / 60_000);
    return `${m}m ago`;
  }
  if (diff < 86_400_000) {
    const h = Math.floor(diff / 3_600_000);
    return `${h}h ago`;
  }
  const d = Math.floor(diff / 86_400_000);
  return `${d}d ago`;
}

// ------------------ ANON PROFILE (LOCAL) ------------------
const avatarSymbols = ["✧", "✦", "❖", "✺", "✸", "✶", "✥"];

function initProfile() {
  let profile = safeLoad(PROFILE_KEY, null);
  if (!profile) {
    profile = {
      id: "user-" + uuid().slice(0, 6),
      avatar: avatarSymbols[Math.floor(Math.random() * avatarSymbols.length)],
      createdAt: Date.now()
    };
    safeSave(PROFILE_KEY, profile);
  }
  avatarCircle.textContent = profile.avatar;
  return profile;
}

const profile = initProfile();

// ------------------ WORLD FEED (SUPABASE) ------------------
let worldLetters = [];

async function fetchWorldLetters() {
  const cutoffIso = new Date(Date.now() - ONE_DAY).toISOString();

  const { data, error } = await supabase
    .from("letters")
    .select("id, content, created_at")
    .gte("created_at", cutoffIso)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading letters:", error);
    // Fall back to cache if any
    worldLetters = safeLoad(WORLD_KEY, []);
    renderWorld();
    return;
  }

  worldLetters = (data || []).map((row) => ({
    id: row.id,
    text: row.content,
    ts: new Date(row.created_at).getTime()
  }));

  safeSave(WORLD_KEY, worldLetters);
  renderWorld();
}

function renderWorld() {
  worldList.innerHTML = "";
  if (!worldLetters.length) {
    worldEmpty.style.display = "block";
    return;
  }
  worldEmpty.style.display = "none";

  worldLetters.forEach((msg) => {
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

// handle typing counter
worldInput.addEventListener("input", () => {
  worldCount.textContent = `${worldInput.value.length} / 400`;
});

// send to Supabase
worldForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = worldInput.value.trim();
  if (!text) return;

  const { data, error } = await supabase
    .from("letters")
    .insert({ content: text })
    .select()
    .single();

  if (error) {
    console.error("Error sending letter:", error);
    alert("Could not send letter. Try again in a moment.");
    return;
  }

  // Add to local list immediately
  worldLetters.unshift({
    id: data.id,
    text: data.content,
    ts: new Date(data.created_at).getTime()
  });
  safeSave(WORLD_KEY, worldLetters);
  worldInput.value = "";
  worldCount.textContent = "0 / 400";
  renderWorld();
});

// realtime updates (optional but nice)
function subscribeWorldRealtime() {
  try {
    supabase
      .channel("letters-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "letters" },
        (payload) => {
          const row = payload.new;
          const ts = new Date(row.created_at).getTime();
          // ignore if older than 24h
          if (Date.now() - ts > ONE_DAY) return;
          // ignore if we already have it (just in case)
          if (worldLetters.some((m) => m.id === row.id)) return;

          worldLetters.unshift({
            id: row.id,
            text: row.content,
            ts
          });
          safeSave(WORLD_KEY, worldLetters);
          renderWorld();
        }
      )
      .subscribe();
  } catch (e) {
    console.warn("Realtime not available:", e);
  }
}

// ------------------ PENPAL THREAD (LOCAL + UNLOCK) ------------------
function getThread() {
  return safeLoad(THREAD_KEY, {
    messages: [], // {id, from: 'me'|'them', text, ts}
    firstTs: null
  });
}

function saveThread(thread) {
  safeSave(THREAD_KEY, thread);
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
      const wrap = document.createElement("div");
      wrap.className = "bubble " + (m.from === "me" ? "me" : "them");
      wrap.textContent = m.text;

      const meta = document.createElement("div");
      meta.className = "bubble-meta";
      meta.textContent =
        (m.from === "me" ? "You" : "Penpal") + " • " + timeAgo(m.ts);

      wrap.appendChild(document.createElement("br"));
      wrap.appendChild(meta);
      threadList.appendChild(wrap);
    });

  threadList.scrollTop = threadList.scrollHeight;
}

// init thread
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

  // Simple first auto-reply so it feels alive
  if (thread.messages.length === 1) {
    thread.messages.push({
      id: uuid(),
      from: "them",
      text: "Letter received. Keep writing. The lock opens after time + consistency.",
      ts: Date.now() + 1500
    });
  }

  saveThread(thread);
  penpalInput.value = "";
  penpalCount.textContent = "0 / 500";
  renderThread(thread);
  renderProfileUnlock(thread);
});

// ------------------ INIT ------------------
(async function init() {
  worldCount.textContent = "0 / 400";
  penpalCount.textContent = "0 / 500";

  // try cached world first (optional)
  const cached = safeLoad(WORLD_KEY, []);
  if (cached.length) {
    worldLetters = cached;
    renderWorld();
  }

  await fetchWorldLetters();
  subscribeWorldRealtime();
})();
