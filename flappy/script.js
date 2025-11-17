const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ---------------------- PLAYER (DRILLIONS LOGO) ----------------------
const playerImg = new Image();
playerImg.src = "../assets/drillions_logo.png";

const player = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  vy: 0
};

function resetPlayerPosition() {
  const baseWidth = Math.min(canvas.width * 0.28, 180);
  const aspect = 0.28;

  player.width = baseWidth;
  player.height = baseWidth * aspect;
  player.x = canvas.width * 0.2;
  player.y = canvas.height * 0.45;
  player.vy = 0;
}

let gravity = 0.45;
let flapStrength = -9;
let maxFallSpeed = 14;

// ---------------------- PIPES ----------------------
let pipes = [];
let pipeGap, pipeWidth, pipeSpeed;
let spawnInterval = 1500;
let lastSpawn = 0;

function resetPipeParams() {
  pipeGap = canvas.height * 0.38;
  pipeWidth = Math.max(40, canvas.width * 0.10);
  pipeSpeed = Math.max(2.8, canvas.width * 0.003);
}

function spawnPipe() {
  const margin = 60;
  const maxTop = canvas.height - pipeGap - margin;
  const topHeight = margin + Math.random() * (maxTop - margin);

  pipes.push({
    x: canvas.width,
    topHeight,
    passed: false
  });
}

// ---------------------- TRAIL ----------------------
let trail = [];

function addTrail() {
  trail.push({
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
    opacity: 1,
    size: player.width * 0.6
  });
}

function updateTrail() {
  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].opacity -= 0.03;
    trail[i].size *= 0.97;
    if (trail[i].opacity <= 0) trail.splice(i, 1);
  }
}

function drawTrail() {
  for (const t of trail) {
    const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.size);
    g.addColorStop(0, `rgba(150,200,255,${t.opacity})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------- GAME STATE ----------------------
let score = 0;
let lastTime = 0;
let gameState = "loading";

function startNewGame() {
  score = 0;
  scoreEl.textContent = "0";
  pipes = [];
  resetPipeParams();
  resetPlayerPosition();
  trail = [];
  lastSpawn = 0;
  lastTime = 0;
  gameState = "ready";
  messageEl.textContent = "TAP TO START";
}

// ---------------------- INPUT ----------------------
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

window.addEventListener("touchstart", flap, { passive: false });
window.addEventListener("mousedown", flap);
window.addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp"].includes(e.code)) flap();
});

// ---------------------- LOOP ----------------------
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

function update(dt) {
  if (gameState === "loading" || gameState === "ready") return;

  if (gameState === "playing") {
    // physics
    player.vy += gravity;
    if (player.vy > maxFallSpeed) player.vy = maxFallSpeed;
    player.y += player.vy;

    // spawn
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

      if (p.x + pipeWidth < -20) pipes.splice(i, 1);
    }

    // collisions
    if (
      player.y + player.height > canvas.height ||
      player.y < -20
    ) {
      setGameOver();
    }

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

// ---------------------- RENDER ----------------------
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, "#06080f");
  g.addColorStop(0.5, "#0d1420");
  g.addColorStop(1, "#020305");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // diagonal lines
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.lineWidth = 1;
  for (let i = -canvas.height; i < canvas.width + canvas.height; i += 80) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + canvas.height, canvas.height);
    ctx.strokeStyle = "rgba(120,150,180,0.4)";
    ctx.stroke();
  }
  ctx.restore();
}

function drawSteelPipe(x, y, w, h) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#f6f8fc");
  grad.addColorStop(0.25, "#d1d7df");
  grad.addColorStop(0.5, "#ffffff");
  grad.addColorStop(0.75, "#9aa2b1");
  grad.addColorStop(1, "#e2e8f0");

  ctx.fillStyle = grad;
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

  for (const p of pipes) {
    drawSteelPipe(p.x, 0, pipeWidth, p.topHeight);

    const bottomY = p.topHeight + pipeGap;
    drawSteelPipe(p.x, bottomY, pipeWidth, canvas.height - bottomY);
  }

  drawTrail();

  if (playerImg.complete && playerImg.naturalWidth > 0) {
    const tilt = Math.max(-0.35, Math.min(0.35, -player.vy * 0.04));
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
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

// ---------------------- INIT ----------------------
playerImg.onload = () => {
  resetPlayerPosition();
  resetPipeParams();
  gameState = "ready";
  messageEl.textContent = "TAP TO START";
};

startNewGame();
requestAnimationFrame(loop);