const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");

// ---------- SIZING ----------
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
  initStars();
});

// ---------- PLAYER (PIXEL DRILLIONS) ----------
const playerImg = new Image();
// path assumes drillions-pixel-logo.png is in repo root
playerImg.src = "../drillions-pixel-logo.png";

const player = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  vy: 0
};

function resetPlayerPosition() {
  const baseWidth = Math.min(canvas.width * 0.25, 170); // smaller & crisp
  const aspect = 0.28; // wordmark aspect ratio

  player.width = baseWidth;
  player.height = baseWidth * aspect;
  player.x = canvas.width * 0.2;
  player.y = canvas.height * 0.45;
  player.vy = 0;
}

let gravity = 0.45;
let flapStrength = -9;
let maxFallSpeed = 14;

// ---------- PIPES ----------
let pipes = [];
let pipeGap, pipeWidth, pipeSpeed;
let spawnInterval = 1400;
let lastSpawn = 0;

function resetPipeParams() {
  pipeGap = canvas.height * 0.4;               // bigger gap
  pipeWidth = Math.max(35, canvas.width * 0.08);
  pipeSpeed = Math.max(2.2, canvas.width * 0.0027); // a bit slower -> more pipes on screen
}

function spawnPipeAt(x) {
  const margin = 60;
  const maxTop = canvas.height - pipeGap - margin;
  const topHeight = margin + Math.random() * (maxTop - margin);

  pipes.push({
    x,
    topHeight,
    passed: false
  });
}

function spawnPipe() {
  spawnPipeAt(canvas.width);
}

// seed ~5–6 pipes ahead so you can see them
function seedPipes() {
  pipes = [];
  const spacing = canvas.width * 0.22; // distance between pipes
  const startX = canvas.width * 0.6;

  for (let i = 0; i < 6; i++) {
    spawnPipeAt(startX + i * (pipeWidth + spacing));
  }
}

// ---------- STARFIELD (MOVING NEBULA / SPACE VIBE) ----------
let stars = [];

function initStars() {
  stars = [];
  const starCount = Math.min(
    120,
    Math.max(40, Math.floor((canvas.width * canvas.height) / 14000))
  );

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.3 + Math.random() * 0.9,
      size: 0.7 + Math.random() * 1.6,
      alpha: 0.3 + Math.random() * 0.7
    });
  }
}

function updateStars(dt) {
  const factor = dt / 16.67;
  for (const s of stars) {
    s.x -= s.speed * factor * 1.3;
    if (s.x < -10) {
      s.x