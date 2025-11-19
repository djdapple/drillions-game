const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// --------------------------------------------------------
// Load Logo
// --------------------------------------------------------
const logo = new Image();
logo.src = "drillions-pixel-logo.png";

// --------------------------------------------------------
// Player
// --------------------------------------------------------
let player = {
  x: W / 2,
  y: H - 120,
  w: 80,
  h: 40,
  vy: 0,
  gravity: 0.25,
  jumpStrength: -9
};

// --------------------------------------------------------
// Platforms
// --------------------------------------------------------
let platforms = [];
const PLATFORM_COUNT = 10;

function randomPlatform(y) {
  return {
    x: Math.random() * (W - 120),
    y: y,
    w: 120,
    h: 18
  };
}

function initPlatforms() {
  platforms = [];
  let spacing = H / PLATFORM_COUNT;

  for (let i = 0; i < PLATFORM_COUNT; i++) {
    platforms.push(randomPlatform(H - i * spacing));
  }
}
initPlatforms();

// --------------------------------------------------------
// Input
// --------------------------------------------------------
let input = { left: false, right: false };

document.addEventListener("touchstart", (e) => {
  const x = e.touches[0].clientX;
  input.left = x < W / 2;
  input.right = x > W / 2;
});

document.addEventListener("touchend", () => {
  input.left = input.right = false;
});

// Desktop arrow keys
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") input.left = true;
  if (e.key === "ArrowRight") input.right = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") input.left = false;
  if (e.key === "ArrowRight") input.right = false;
});

// --------------------------------------------------------
// Game Loop
// --------------------------------------------------------
let scrollY = 0;
let score = 0;

function update() {
  // Horizontal movement
  if (input.left) player.x -= 5;
  if (input.right) player.x += 5;

  if (player.x < -player.w) player.x = W;
  if (player.x > W) player.x = -player.w;

  // Gravity
  player.vy += player.gravity;
  player.y += player.vy;

  // Collision with platforms (bounce)
  for (let p of platforms) {
    if (
      player.vy > 0 &&
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h > p.y &&
      player.y + player.h < p.y + p.h
    ) {
      player.vy = player.jumpStrength;
    }
  }

  // Camera scroll when player goes high
  if (player.y < H * 0.4) {
    let diff = H * 0.4 - player.y;
    player.y = H * 0.4;

    scrollY += diff;
    score += Math.floor(diff);

    for (let p of platforms) {
      p.y += diff;
    }
  }

  // Regenerate platforms
  for (let p of platforms) {
    if (p.y > H + 20) {
      p.y = -20;
      p.x = Math.random() * (W - p.w);
    }
  }
}

function draw() {
  // Background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // Platforms
  ctx.fillStyle = "#5ddcff";
  for (let p of platforms) {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }

  // Player
  ctx.drawImage(logo, player.x, player.y, player.w, player.h);

  // Score
  ctx.fillStyle = "#a7f3ff";
  ctx.font = "20px system-ui";
  ctx.fillText("HEIGHT: " + score, 20, 50);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();