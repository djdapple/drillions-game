const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");

// --------------------- SIZING ---------------------
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// --------------------- PLAYER (DRILLIONS LOGO) ---------------------
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
  const baseWidth = Math.min(canvas.width * 0.45, 260); // keep logo readable
  const aspect = 0.28; // wordmark is wider than tall
  player.width = baseWidth;
  player.height = baseWidth * aspect;
  player.x = canvas.width * 0.2;
  player.y = canvas.height * 0.45;
  player.vy = 0;
}

// Physics
let gravity = 0.45;
let flapStrength = -9;
let maxFallSpeed = 14;

// --------------------- PIPES ---------------------
let pipes = [];
let pipeGap;
let pipeWidth;
let pipeSpeed;
let spawnInterval = 1500;
let lastSpawn = 0;

function resetPipeParams() {
  pipeGap = canvas.height * 0.3; // gap between pipes
  pipeWidth = Math.max(60, canvas.width * 0.16);
  pipeSpeed = Math.max(3.5, canvas.width * 0.004);
}

function spawnPipe() {
  const margin = 60;
  const maxTop = canvas.height - pipeGap - margin;
  const topHeight =
    margin + Math.random() * Math.max(40, maxTop - margin);

  pipes.push({
    x: canvas.width,
    topHeight,
    passed: false
  });
}

// --------------------- GAME STATE ---------------------
let score = 0;
let lastTime = 0;
let gameState = "loading"; // loading | ready | playing | over

function startNewGame() {
  score = 0;
  scoreEl.textContent = "0";
  pipes = [];
  resetPipeParams();
  resetPlayerPosition();
  lastSpawn = 0;
  lastTime = 0;
  gameState = "ready";
  messageEl.textContent = "TAP TO START";
}

// --------------------- INPUT ---------------------
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

function handlePointer(e) {
  e.preventDefault();
  flap();
}

window.addEventListener("touchstart", handlePointer, { passive: false });
window.addEventListener("mousedown", handlePointer);

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    flap();
  }
});

// --------------------- MAIN LOOP ---------------------
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
    // gravity
    player.vy += gravity;
    if (player.vy > maxFallSpeed) player.vy = maxFallSpeed;
    player.y += player.vy;

    // spawn pipes
    lastSpawn += dt;
    if (lastSpawn > spawnInterval) {
      spawnPipe();
      lastSpawn = 0;
    }

    // move & handle pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= pipeSpeed;

      // scoring
      if (!p.passed && p.x + pipeWidth < player.x) {
        p.passed = true;
        score++;
        scoreEl.textContent = String(score);
      }

      // remove offscreen
      if (p.x + pipeWidth < -10) {
        pipes.splice(i, 1);
      }
    }

    // collision with floor / ceiling
    if (
      player.y + player.height > canvas.height ||
      player.y + player.height < 0
    ) {
      setGameOver();
    }

    // collision with pipes
    for (const p of pipes) {
      const topRect = {
        x: p.x,
        y: 0,
        w: pipeWidth,
        h: p.topHeight
      };
      const bottomRect = {
        x: p.x,
        y: p.topHeight + pipeGap,
        w: pipeWidth,
        h: canvas.height - (p.topHeight + pipeGap)
      };

      if (rectOverlap(player, topRect) || rectOverlap(player, bottomRect)) {
        setGameOver();
        break;
      }
    }
  }
}

function rectOverlap(a, r) {
  return (
    a.x < r.x + r.w &&
    a.x + a.width > r.x &&
    a.y < r.y + r.h &&
    a.y + a.height > r.y
  );
}

function setGameOver() {
  if (gameState !== "playing") return;
  gameState = "over";
  messageEl.textContent = "GAME OVER — TAP TO RESTART";
}

// --------------------- RENDER ---------------------
function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#05070d");
  grad.addColorStop(0.4, "#101722");
  grad.addColorStop(0.8, "#04060a");
  grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle diagonal lines to feel like a steel wall
  ctx.save();
  ctx.globalAlpha = 0.15;
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
  const pipeGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  pipeGrad.addColorStop(0, "#f4f7fb");
  pipeGrad.addColorStop(0.25, "#c5cdd8");
  pipeGrad.addColorStop(0.5, "#ffffff");
  pipeGrad.addColorStop(0.75, "#9199a4");
  pipeGrad.addColorStop(1, "#dfe6f1");

  ctx.fillStyle = pipeGrad;
  ctx.fillRect(x, y, w, h);

  // edges
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  // inner shadow
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  // Mario-style rim on top
  const rimHeight = Math.min(20, h * 0.18);
  const rimGrad = ctx.createLinearGradient(
    x,
    y,
    x,
    y + rimHeight
  );
  rimGrad.addColorStop(0, "#ffffff");
  rimGrad.addColorStop(0.4, "#d7dfea");
  rimGrad.addColorStop(1, "#a3acb8");
  ctx.fillStyle = rimGrad;
  ctx.fillRect(x - 4, y - rimHeight / 2, w + 8, rimHeight);
}

function render() {
  drawBackground();

  // pipes
  for (const p of pipes) {
    drawSteelPipe(p.x, 0, pipeWidth, p.topHeight);
    const bottomY = p.topHeight + pipeGap;
    drawSteelPipe(p.x, bottomY, pipeWidth, canvas.height - bottomY);
  }

  // player (Drillions logo)
  if (playerImg.complete && playerImg.naturalWidth > 0) {
    // slight tilt based on velocity
    const tilt = Math.max(-0.35, Math.min(0.35, -player.vy * 0.04));
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);

    // glow behind logo
    const glowGrad = ctx.createRadialGradient(
      0,
      0,
      player.width * 0.1,
      0,
      0,
      player.width * 0.7
    );
    glowGrad.addColorStop(0, "rgba(120,200,255,0.6)");
    glowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(
      -player.width / 1.2,
      -player.height * 1.4,
      player.width * 2.4,
      player.height * 3
    );

    ctx.globalAlpha = 1;
    ctx.drawImage(
      playerImg,
      -player.width / 2,
      -player.height / 2,
      player.width,
      player.height
    );

    ctx.restore();
  } else {
    // fallback rectangle
    ctx.fillStyle = "#55ccff";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
}

// --------------------- INIT ---------------------
playerImg.onload = () => {
  resetPlayerPosition();
  resetPipeParams();
  gameState = "ready";
  messageEl.textContent = "TAP TO START";
};

startNewGame();
requestAnimationFrame(loop);