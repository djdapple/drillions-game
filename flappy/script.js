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
      s.x = canvas.width + Math.random() * 40;
      s.y = Math.random() * canvas.height;
    }
  }
}

function drawStars() {
  ctx.save();
  for (const s of stars) {
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = "#9fd8ff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- TRAIL (NO BIG BALL – SLIM CHROME TAIL) ----------
let trail = [];

function addTrail() {
  trail.push({
    x: player.x + player.width * 0.1,
    y: player.y + player.height * 0.65,
    length: player.width * 0.6,
    opacity: 0.9
  });
}

function updateTrail() {
  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].x -= pipeSpeed * 0.9;
    trail[i].opacity -= 0.04;
    if (trail[i].opacity <= 0) trail.splice(i, 1);
  }
}

function drawTrail() {
  for (const t of trail) {
    const grad = ctx.createLinearGradient(
      t.x - t.length,
      t.y,
      t.x,
      t.y
    );
    grad.addColorStop(0, `rgba(25,80,140,0)`);
    grad.addColorStop(0.5, `rgba(120,200,255,${t.opacity * 0.7})`);
    grad.addColorStop(1, `rgba(200,240,255,${t.opacity})`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x - t.length, t.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
  }
}

// ---------- GAME STATE ----------
let score = 0;
let lastTime = 0;
let gameState = "loading";

function startNewGame() {
  score = 0;
  scoreEl.textContent = "0";
  resetPipeParams();
  resetPlayerPosition();
  trail = [];
  seedPipes();
  lastSpawn = 0;
  lastTime = 0;
  gameState = "ready";
  messageEl.textContent = "TAP TO START";
}

// ---------- INPUT ----------
function flap() {
  if (gameState === "loading") return;

  if (gameState === "ready") {
    gameState = "playing";
    messageEl.textContent = "";
  } else if (gameState === "over") {
    startNewGame();
    return;
  }

  player.vy = flapStrength;
}

window.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flap();
}, { passive: false });

window.addEventListener("mousedown", flap);

window.addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp"].includes(e.code)) {
    e.preventDefault();
    flap();
  }
});

// ---------- LOOP ----------
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

function update(dt) {
  updateStars(dt); // background moves even when not playing

  if (gameState === "loading" || gameState === "ready") return;

  if (gameState === "playing") {
    // physics
    player.vy += gravity;
    if (player.vy > maxFallSpeed) player.vy = maxFallSpeed;
    player.y += player.vy;

    // spawn new pipes over time
    lastSpawn += dt;
    if (lastSpawn > spawnInterval) {
      spawnPipe();
      lastSpawn = 0;
    }

    // move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= pipeSpeed * 1.1;

      if (!p.passed && p.x + pipeWidth < player.x) {
        p.passed = true;
        score++;
        scoreEl.textContent = score.toString();
      }

      if (p.x + pipeWidth < -40) pipes.splice(i, 1);
    }

    // collisions with floor/ceiling
    if (player.y + player.height > canvas.height || player.y < -40) {
      setGameOver();
    }

    // collisions with pipes (touch anything = lose)
    for (const p of pipes) {
      const topRect = { x: p.x, y: 0, w: pipeWidth, h: p.topHeight };
      const bottomY = p.topHeight + pipeGap;
      const bottomRect = {
        x: p.x,
        y: bottomY,
        w: pipeWidth,
        h: canvas.height - bottomY
      };

      if (rectOverlap(player, topRect) || rectOverlap(player, bottomRect)) {
        setGameOver();
        break;
      }
    }

    addTrail();
    updateTrail();
  }
}

function rectOverlap(a, r) {
  return !(
    a.x + a.width < r.x ||
    a.x > r.x + r.w ||
    a.y + a.height < r.y ||
    a.y > r.y + r.h
  );
}

function setGameOver() {
  if (gameState !== "playing") return;
  gameState = "over";
  messageEl.textContent = "GAME OVER — TAP TO RESTART";
}

// ---------- RENDER ----------
function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#05060c");
  grad.addColorStop(0.5, "#060b15");
  grad.addColorStop(1, "#020208");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle diagonal streaks
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.lineWidth = 1;
  for (let i = -canvas.height; i < canvas.width + canvas.height; i += 80) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + canvas.height, canvas.height);
    ctx.strokeStyle = "rgba(110,130,160,0.4)";
    ctx.stroke();
  }
  ctx.restore();
}

function drawSteelPipe(x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, "#f6f8fc");
  g.addColorStop(0.25, "#d1d7df");
  g.addColorStop(0.5, "#ffffff");
  g.addColorStop(0.75, "#9aa2b1");
  g.addColorStop(1, "#e2e8f0");

  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  const rimHeight = Math.min(20, h * 0.18);
  const rimGrad = ctx.createLinearGradient(x, y, x, y + rimHeight);
  rimGrad.addColorStop(0, "#ffffff");
  rimGrad.addColorStop(0.4, "#d7dfea");
  rimGrad.addColorStop(1, "#a3acb8");

  ctx.fillStyle = rimGrad;
  ctx.fillRect(x - 4, y - rimHeight / 2, w + 8, rimHeight);
}

function render() {
  drawBackground();
  drawStars();

  // pipes
  for (const p of pipes) {
    drawSteelPipe(p.x, 0, pipeWidth, p.topHeight);
    const bottomY = p.topHeight + pipeGap;
    drawSteelPipe(p.x, bottomY, pipeWidth, canvas.height - bottomY);
  }

  // trail
  drawTrail();

  // player logo (no glowing ball)
  if (playerImg.complete && playerImg.naturalWidth > 0) {
    const tilt = Math.max(-0.35, Math.min(0.35, -player.vy * 0.04));
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.imageSmoothingEnabled = false; // keep pixels crisp
    ctx.drawImage(
      playerImg,
      -player.width / 2,
      -player.height / 2,
      player.width,
      player.height
    );
    ctx.restore();
  }
}

// ---------- INIT ----------
playerImg.onload = () => {
  resetPlayerPosition();
  resetPipeParams();
  initStars();
  startNewGame();
};

initStars();
requestAnimationFrame(loop);