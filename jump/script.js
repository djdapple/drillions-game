// DRILLIONS JUMP – PROTOTYPE
// Doodle-jump style vertical game

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");

let W = window.innerWidth;
let H = window.innerHeight;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// --------------------------------------------------
// Assets
// --------------------------------------------------

// Background texture (inside /jump)
const bgImage = new Image();
bgImage.src = "drillions-bg.png";

// Drillions pixel logo (one level up)
const logoImage = new Image();
logoImage.src = "../drillions-pixel-logo.png";

let logoReady = false;
logoImage.onload = () => {
  logoReady = true;
};

// --------------------------------------------------
// Game State
// --------------------------------------------------

const GRAVITY = 0.35;
const JUMP_VELOCITY = -9.5;
const HORIZ_ACCEL = 0.9;
const HORIZ_FRICTION = 0.88;
const MAX_HORIZ_SPEED = 7;

const PLATFORM_WIDTH_MIN = 80;
const PLATFORM_WIDTH_MAX = 150;
const PLATFORM_SPACING_Y = 80; // vertical distance between platforms

let cameraY = 0; // world offset
let maxHeight = 0; // highest point reached (negative y)

const player = {
  x: 0,
  y: 0,
  width: 80,
  height: 40,
  vx: 0,
  vy: 0,
};

let platforms = [];
let gameStarted = false;
let gameOver = false;

function initGame() {
  // Reset world
  cameraY = 0;
  maxHeight = 0;
  platforms = [];
  gameOver = false;
  gameStarted = false;

  // Player starts on a safe platform near bottom
  const startY = 0;
  const startX = 0;

  player.width = Math.min(120, W * 0.28);
  player.height = player.width * 0.45;
  player.x = startX;
  player.y = startY;
  player.vx = 0;
  player.vy = 0;

  // Generate a column of platforms going downward (positive y)
  // and also a bit upward so we can immediately jump.
  let y = startY + 40;
  for (let i = 0; i < 40; i++) {
    const width =
      PLATFORM_WIDTH_MIN +
      Math.random() * (PLATFORM_WIDTH_MAX - PLATFORM_WIDTH_MIN);
    const x = -W / 2 + Math.random() * W; // world coords, wrap later
    platforms.push({ x, y, width, height: 16 });
    y += PLATFORM_SPACING_Y;
  }

  // Starting platform centered under player
  platforms.push({
    x: -player.width / 2,
    y: player.y + 40,
    width: player.width * 1.4,
    height: 18,
  });
}

initGame();

// --------------------------------------------------
// Controls
// --------------------------------------------------
let moveDir = 0; // -1 = left, 1 = right

// Keyboard
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") moveDir = -1;
  if (e.key === "ArrowRight" || e.key === "d") moveDir = 1;
  if (!gameStarted && (e.key === "ArrowUp" || e.key === " " || e.key === "w")) {
    startJump();
  }
});

window.addEventListener("keyup", (e) => {
  if (
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight" ||
    e.key === "a" ||
    e.key === "d"
  ) {
    moveDir = 0;
  }
});

// Touch – left / right half of screen
function handleTouchStart(e) {
  e.preventDefault();
  if (!gameStarted && !gameOver) startJump();
  if (gameOver) {
    initGame();
    return;
  }

  const t = e.touches[0];
  if (!t) return;
  const x = t.clientX;
  moveDir = x < W / 2 ? -1 : 1;
}

function handleTouchMove(e) {
  e.preventDefault();
  const t = e.touches[0];
  if (!t) return;
  const x = t.clientX;
  moveDir = x < W / 2 ? -1 : 1;
}

function handleTouchEnd(e) {
  e.preventDefault();
  if (e.touches.length === 0) {
    moveDir = 0;
  }
}

canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

// Simple "start" so first jump has some energy
function startJump() {
  if (!gameStarted) {
    gameStarted = true;
    player.vy = JUMP_VELOCITY;
  }
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function wrapX(x) {
  // Horizontal wrap like Doodle Jump (world coords)
  const span = W * 1.2;
  if (x < -span / 2) return x + span;
  if (x > span / 2) return x - span;
  return x;
}

// --------------------------------------------------
// Update
// --------------------------------------------------

function update() {
  if (gameOver) return;

  // Horizontal control
  if (moveDir !== 0) {
    player.vx += moveDir * HORIZ_ACCEL;
  }
  player.vx *= HORIZ_FRICTION;
  player.vx = Math.max(-MAX_HORIZ_SPEED, Math.min(MAX_HORIZ_SPEED, player.vx));

  // Gravity
  player.vy += GRAVITY;

  // Apply velocity
  player.x += player.vx;
  player.y += player.vy;

  // Wrap horizontal in world space
  player.x = wrapX(player.x);

  // Auto jump when landing on platform (only when falling)
  if (player.vy > 0) {
    for (const p of platforms) {
      const px1 = p.x;
      const px2 = p.x + p.width;
      const py = p.y;

      const playerBottomPrev = player.y - player.vy + player.height;
      const playerBottom = player.y + player.height;

      const withinX = player.x + player.width * 0.3 < px2 &&
                      player.x + player.width * 0.7 > px1;

      if (
        withinX &&
        playerBottomPrev <= py &&
        playerBottom >= py &&
        playerBottom - py < 24
      ) {
        // Land
        player.y = py - player.height;
        player.vy = JUMP_VELOCITY;
        break;
      }
    }
  }

  // Camera follows upward progress (we treat "up" as negative y)
  if (player.y < maxHeight) {
    maxHeight = player.y;
  }
  cameraY = maxHeight - H * 0.3; // keep player ~1/3 from top

  // Generate more platforms above if needed
  const highestPlatformY = platforms.reduce(
    (min, p) => Math.min(min, p.y),
    Infinity
  );
  while (highestPlatformY > maxHeight - 800) {
    const targetY = highestPlatformY - PLATFORM_SPACING_Y;
    const width =
      PLATFORM_WIDTH_MIN +
      Math.random() * (PLATFORM_WIDTH_MAX - PLATFORM_WIDTH_MIN);
    const x = -W / 2 + Math.random() * W;
    platforms.push({
      x,
      y: targetY,
      width,
      height: 16,
    });
    // recompute highestPlatformY for next loop
    const nextMin = platforms.reduce(
      (min, p) => Math.min(min, p.y),
      Infinity
    );
    if (nextMin === highestPlatformY) break;
  }

  // Clean up platforms too far below
  const cutOff = cameraY + H + 300;
  platforms = platforms.filter((p) => p.y < cutOff);

  // Game over if you fall too far below camera
  if (player.y - cameraY > H + 120) {
    gameOver = true;
  }

  // Score = meters climbed (rough)
  const meters = Math.max(0, Math.round((-maxHeight) / 15));
  scoreEl.textContent = meters.toString();
}

// --------------------------------------------------
// Draw
// --------------------------------------------------

function drawBackground() {
  if (bgImage.complete && bgImage.naturalWidth > 0) {
    // Tile or stretch the BG with slight offset to feel like moving
    const scale = Math.max(W / bgImage.width, H / bgImage.height);
    const w = bgImage.width * scale;
    const h = bgImage.height * scale;
    const x = (W - w) / 2;
    const y = (H - h) / 2 + ((cameraY * 0.15) % h);

    ctx.globalAlpha = 1;
    ctx.drawImage(bgImage, x, y, w, h);
  } else {
    // fallback gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#02030a");
    g.addColorStop(0.5, "#05081b");
    g.addColorStop(1, "#02030a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Soft star noise
  ctx.fillStyle = "rgba(180,230,255,0.25)";
  for (let i = 0; i < 40; i++) {
    const sx = (i * 97 + (cameraY * 0.3)) % W;
    const sy = (i * 53 - cameraY * 0.15) % H;
    const r = (i % 3) + 1;
    ctx.beginPath();
    ctx.arc((sx + W) % W, (sy + H) % H, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
  ctx.save();
  ctx.translate(W / 2, -cameraY);

  for (const p of platforms) {
    const x = p.x;
    const y = p.y;
    const w = p.width;
    const h = p.height;

    // Base
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.2, "#d3d7dd");
    grad.addColorStop(0.5, "#8f959f");
    grad.addColorStop(1, "#21252b");

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // top border highlight
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(x, y, w, 2);
  }

  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(W / 2, -cameraY);

  const x = player.x;
  const y = player.y;
  const w = player.width;
  const h = player.height;

  // Glow trail behind / below logo
  const glowGrad = ctx.createRadialGradient(
    x + w / 2,
    y + h / 2 + 12,
    h * 0.1,
    x + w / 2,
    y + h / 2 + 12,
    h * 1.2
  );
  glowGrad.addColorStop(0, "rgba(0, 235, 255, 0.45)");
  glowGrad.addColorStop(1, "rgba(0, 235, 255, 0)");

  ctx.fillStyle = glowGrad;
  ctx.fillRect(x - w, y - h, w * 3, h * 3);

  // Draw logo sprite
  if (logoReady) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(logoImage, x, y, w, h);
  } else {
    // fallback rect
    ctx.fillStyle = "#8af3ff";
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function drawOverlay() {
  if (!gameOver && gameStarted) return;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  if (!gameStarted && !gameOver) {
    ctx.fillStyle = "#8af3ff";
    ctx.font = "22px system-ui, sans-serif";
    ctx.fillText("Tap to start · Keep jumping up", W / 2, H / 2);
  } else if (gameOver) {
    ctx.fillStyle = "#ffedf3";
    ctx.font = "26px system-ui, sans-serif";
    ctx.fillText("Drillions Fell.", W / 2, H / 2 - 10);

    ctx.font = "16px system-ui, sans-serif";
    ctx.fillStyle = "#8af3ff";
    ctx.fillText("Tap to retry prototype", W / 2, H / 2 + 22);
  }

  ctx.restore();
}

// --------------------------------------------------
// Main Loop
// --------------------------------------------------

function loop() {
  update();

  drawBackground();
  drawPlatforms();
  drawPlayer();
  drawOverlay();

  requestAnimationFrame(loop);
}

loop();