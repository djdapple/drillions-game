const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");

// ---------- SIZING ----------
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  resetPlayerPosition();
  resetPipeParams();
  initStars();
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ---------- PLAYER (PIXEL DRILLIONS) ----------
const playerImg = new Image();
// assumes drillions-pixel-logo.png is in repo root, like before
playerImg.src = "../drillions-pixel-logo.png";

const player = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

let targetY = 0;
let lastPlayerY = 0;

function resetPlayerPosition() {
  const baseWidth = Math.min(canvas.width * 0.25, 170); // smaller & crisp
  const aspect = 0.28; // wordmark aspect
  player.width = baseWidth;
  player.height = baseWidth * aspect;
  player.x = canvas.width * 0.18;
  player.y = canvas.height * 0.5;
  targetY = player.y;
  lastPlayerY = player.y;
}

// ---------- PIPES (FEWER, MORE SPACED) ----------
let pipes = [];
let pipeGap, pipeWidth, pipeSpeed;
let spawnInterval = 1900;
let lastSpawn = 0;

function resetPipeParams() {
  pipeGap = canvas.height * 0.45;
  pipeWidth = Math.max(40, canvas.width * 0.09);
  pipeSpeed = Math.max(2.1, canvas.width * 0.0025); // smoother, not crazy fast
}

function spawnPipeAt(x) {
  const margin = 70;
  const maxTop = canvas.height - pipeGap - margin;
  const topHeight = margin + Math.random() * (maxTop - margin);
  pipes.push({
    x,
    topHeight,
    passed: false
  });
}

function spawnPipe() {
  spawnPipeAt(canvas.width + pipeWidth * 2);
}

// seed 4–5 pipes far apart so you can see what's coming
function seedPipes() {
  pipes = [];
  const spacing = canvas.width * 0.3; // more distance between pipes
  const startX = canvas.width * 0.7;

  for (let i = 0; i < 5; i++) {
    spawnPipeAt(startX + i * (pipeWidth + spacing));
  }
}

// ---------- STARFIELD (MOVING NEBULA / SPACE VIBE) ----------
let stars = [];

function initStars() {
  stars = [];
  const starCount = Math.min(
    140,
    Math.max(50, Math.floor((canvas.width * canvas.height) / 13000))
  );
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.25 + Math.random() * 0.9,
      size: 0.7 + Math.random() * 1.6,
      alpha: 0.3 + Math.random() * 0.7
    });
  }
}

function updateStars(dt) {
  const factor = dt / 16.67;
  for (const s of stars) {
    s.x -= s.speed * factor * 1.2;
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

// ---------- CHROME TRAIL UNDER THE LOGO ----------
let trail = [];

function addTrail() {
  trail.push({
    x: player.x,
    y: player.y + player.height * 0.7, // under the wordmark
    length: player.width * 0.7,
    opacity: 0.9,
    wobbleSeed: Math.random() * Math.PI * 2
  });
}

function updateTrail(dt) {
  const factor = dt / 16.67;
  for (let i = trail.length - 1; i >= 0; i--) {
    const t = trail[i];
    t.x -= pipeSpeed * factor * 1.1;
    t.opacity -= 0.04 * factor;
    if (t.opacity <= 0) {
      trail.splice(i, 1);
    }
  }
}

function drawTrail(time) {
  for (const t of trail) {
    const wobble = Math.sin(time / 180 + t.wobbleSeed) * 4; // chrome sprites bouncing

    const grad = ctx.createLinearGradient(
      t.x - t.length,
      t.y + wobble,
      t.x,
      t.y + wobble
    );
    grad.addColorStop(0, "rgba(20,70,130,0)");
    grad.addColorStop(0.4, `rgba(90,170,240,${t.opacity * 0.7})`);
    grad.addColorStop(1, `rgba(200,240,255,${t.opacity})`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x - t.length, t.y + wobble);
    ctx.lineTo(t.x, t.y + wobble);
    ctx.stroke();

    // little chrome sparks along the trail
    ctx.fillStyle = `rgba(200,240,255,${t.opacity})`;
    for (let i = 0; i < 3; i++) {
      const fx = t.x - Math.random() * t.length;
      const fy = t.y + wobble + (Math.random() - 0.5) * 6;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- BURST ON DEATH ----------
let burstParticles = [];

function createBurst() {
  burstParticles = [];
  const cx = player.x + player.width / 2;
  const cy = player.y + player.height / 2;

  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    burstParticles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 2 + Math.random() * 3
    });
  }
}

function updateBurst(dt) {
  const factor = dt / 16.67;
  for (let i = burstParticles.length - 1; i >= 0; i--) {
    const p = burstParticles[i];
    p.x += p.vx * factor;
    p.y += p.vy * factor;
    p.vy += 0.12 * factor; // tiny gravity
    p.life -= 0.03 * factor;
    if (p.life <= 0) burstParticles.splice(i, 1);
  }
}

function drawBurst() {
  for (const p of burstParticles) {
    const alpha = Math.max(0, p.life);
    const grad = ctx.createRadialGradient(
      p.x,
      p.y,
      0,
      p.x,
      p.y,
      p.size * 2
    );
    grad.addColorStop(0, `rgba(200,240,255,${alpha})`);
    grad.addColorStop(1, "rgba(30,80,140,0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();
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
  seedPipes();
  trail = [];
  burstParticles = [];
  lastSpawn = 0;
  lastTime = 0;
  gameState = "ready";
  messageEl.textContent = "TAP & DRAG TO PLAY";
}

// ---------- INPUT: TRUE TOUCH MOVEMENT ----------
let touchActive = false;

function getPointerY(e) {
  if (e.touches && e.touches.length > 0) {
    return e.touches[0].clientY;
  }
  return e.clientY;
}

function pointerDown(e) {
  e.preventDefault();
  const y = getPointerY(e);
  targetY = y;
  touchActive = true;

  if (gameState === "ready") {
    gameState = "playing";
    messageEl.textContent = "";
  } else if (gameState === "over") {
    startNewGame();
  }
}

function pointerMove(e) {
  if (!touchActive) return;
  const y = getPointerY(e);
  targetY = y;
}

function pointerUp() {
  touchActive = false;
}

window.addEventListener("touchstart", pointerDown, { passive: false });
window.addEventListener("touchmove", pointerMove, { passive: false });
window.addEventListener("touchend", pointerUp);
window.addEventListener("mousedown", pointerDown);
window.addEventListener("mousemove", pointerMove);
window.addEventListener("mouseup", pointerUp);

// ---------- LOOP ----------
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt);
  render(timestamp);

  requestAnimationFrame(loop);
}

function update(dt) {
  updateStars(dt);
  updateBurst(dt);

  if (gameState === "loading" || gameState === "ready") return;

  if (gameState === "playing") {
    // smooth movement towards touch target (no gravity)
    const lerpSpeed = 0.18 * (dt / 16.67);
    player.y += (targetY - player.y) * lerpSpeed;

    // clamp inside screen
    const minY = 0;
    const maxY = canvas.height - player.height;
    if (player.y < minY) player.y = minY;
    if (player.y > maxY) player.y = maxY;

    // pipes spawn
    lastSpawn += dt;
    if (lastSpawn > spawnInterval) {
      spawnPipe();
      lastSpawn = 0;
    }

    // move pipes
    const factor = dt / 16.67;
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= pipeSpeed * factor * 1.05;

      if (!p.passed && p.x + pipeWidth < player.x) {
        p.passed = true;
        score++;
        scoreEl.textContent = score.toString();
      }

      if (p.x + pipeWidth < -50) pipes.splice(i, 1);
    }

    // collisions (touch ANY pipe)
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
    updateTrail(dt);
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
  createBurst();
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

function render(timestamp) {
  drawBackground();
  drawStars();
  drawBurst();

  // pipes
  for (const p of pipes) {
    drawSteelPipe(p.x, 0, pipeWidth, p.topHeight);
    const bottomY = p.topHeight + pipeGap;
    drawSteelPipe(p.x, bottomY, pipeWidth, canvas.height - bottomY);
  }

  // chrome trail
  drawTrail(timestamp || 0);

  // player
  if (playerImg.complete && playerImg.naturalWidth > 0) {
    const verticalVel = player.y - lastPlayerY;
    lastPlayerY = player.y;
    const tilt = Math.max(-0.3, Math.min(0.3, -verticalVel * 0.06));

    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.imageSmoothingEnabled = false;
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
  seedPipes();
  startNewGame();
};

initStars();
requestAnimationFrame(loop);