const box = document.getElementById("letterBox");
const btn = document.getElementById("sendBtn");
const feed = document.getElementById("feed");
const floatLetter = document.getElementById("floatLetter");

let messages = JSON.parse(localStorage.getItem("letters")) || [];

render();

// Send letter
btn.onclick = () => {
  const text = box.value.trim();
  if (!text) return;

  const entry = {
    text,
    time: new Date().toLocaleString()
  };

  messages.unshift(entry);
  localStorage.setItem("letters", JSON.stringify(messages));

  animateFloat();
  box.value = "";
  render();
};

// Floating animation
function animateFloat() {
  floatLetter.style.opacity = "1";
  floatLetter.style.bottom = "50%";

  setTimeout(() => {
    floatLetter.style.opacity = "0";
    floatLetter.style.bottom = "-50px";
  }, 1300);
}

// Render feed
function render() {
  feed.innerHTML = "";

  messages.forEach((m, i) => {
    const card = document.createElement("div");
    card.className = "letterCard";

    const text = document.createElement("div");
    text.className = "letterText";
    text.textContent = m.text;

    const time = document.createElement("div");
    time.className = "time";
    time.textContent = m.time;

    card.appendChild(text);
    card.appendChild(time);

    feed.appendChild(card);
  });
}
