// ----------------------------------------------
// DRILLIONS JUMP — PROTOTYPE v2
// Tap = jump | Slide = move | Breakable platforms
// ----------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;

// RESIZE
window.onresize = () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
};

// ----------------------------------------------
// PLAYER
// ----------------------------------------------
const player = {
  x: W / 2,
  y: H - 120,
  w: 55,
  h: 55,
  vy: 0,
  vx: 0,
  gravity: 0.45,
  jumpForce: -11,
  moveSpeed: 0.22,
  maxSpeed: 6
};

// ----------------------------------------------
// PLATFORMS
// ----------------------------------------------
let platforms = [];
const platformGap = 85;

function spawnPlatforms() {
  platforms = [];
  let y = H - 40;

  for (let i = 0; i < 20; i++) {
    platforms.push({
      x: Math.random() * (W - 100),
      y: y,
      w: 110,
      h: 14,
      breakable: Math.random() < 0.3 ? true : false,
      broken: false
    });
    y -= platformGap;
  }
}

spawnPlatforms();

// ----------------------------------------------
// INPUT
// ----------------------------------------------
let touchX = null;
let holding = false;

canvas.addEventListener("touchstart", (e) => {
  // TAP = jump
  player.vy = player.jumpForce;
  holding = true;
  touchX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", (e) => {
  holding = true;
  touchX = e.touches[0].clientX;
});

canvas.addEventListener("touchend", () => {
  holding = false;
  touchX = null;
});

// ----------------------------------------------
// PHYSICS
// ----------------------------------------------
function updatePlayer() {
  // Horizontal Movement
  if (holding && touchX !== null) {
    let dx = touchX - player.x;
    if (Math.abs(dx) > 6) {
      player.vx += (dx > 0 ? 1 : -1) * player.moveSpeed;
    }
  }

  // Limit speed
  player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx));
  player.x += player.vx;

  // Gravity + Jump
  player.vy += player.gravity;
  player.y += player.vy;

  // Wrap around
  if (player.x < -40) player.x = W + 40;
  if (player.x > W + 40) player.x = -40;

  // Scroll world upward
  if (player.y < H * 0.35) {
    let diff = H * 0.35 - player.y;
    player.y = H * 0.35;

    platforms.forEach(p => p.y += diff);
  }

  // FALL RESET
  if (player.y > H + 80) {
    spawnPlatforms();
    player.y = H - 120;
    player.vy = 0;
  }
}

// ----------------------------------------------
// PLATFORM COLLISIONS
// ----------------------------------------------
function checkPlatforms() {
  platforms.forEach(p => {
    if (p.broken) return;

    if (
      player.vy > 0 &&
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h > p.y &&
      player.y + player.h < p.y + p.h + 22
    ) {
      player.vy = player.jumpForce;

      if (p.breakable) {
        p.broken = true;
      }
    }
  });
}

// ----------------------------------------------
// DRAW
// ----------------------------------------------
function drawPlayer() {
  ctx.fillStyle = "#8af3ff";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

function drawPlatforms() {
  platforms.forEach(p => {
    if (p.broken) {
      ctx.fillStyle = "rgba(255,0,0,0.3)";
    } else if (p.breakable) {
      ctx.fillStyle = "#ffbd73";
    } else {
      ctx.fillStyle = "#85e8ff";
    }
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });
}

// ----------------------------------------------
// LOOP
// ----------------------------------------------
function loop() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  updatePlayer();
  checkPlatforms();

  drawPlatforms();
  drawPlayer();

  requestAnimationFrame(loop);
}

loop();