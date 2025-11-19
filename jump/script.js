const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// Logo player
const playerImg = new Image();
playerImg.src = "drillions-pixel-logo.png";

const player = {
  x: 150,
  y: 300,
  w: 120,
  h: 60,
  vy: 0,
  jumpForce: -15,
  gravity: 0.7
};

// Platforms
let platforms = [];
function makePlatform(x, y) {
  return { x, y, w: 120, h: 14 };
}

// Init platforms
for (let i = 0; i < 12; i++) {
  platforms.push(makePlatform(
    Math.random() * (W - 120),
    H - i * 80
  ));
}

// Tap to jump
canvas.addEventListener("touchstart", () => {
  player.vy = player.jumpForce;
});

// Update loop
function update() {
  player.vy += player.gravity;
  player.y += player.vy;

  // Bounce on platforms
  for (let p of platforms) {
    if (
      player.y + player.h >= p.y &&
      player.y + player.h <= p.y + p.h &&
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.vy > 0
    ) {
      player.vy = player.jumpForce;
    }
  }

  // Scroll platforms when player goes up
  if (player.y < H / 2) {
    const diff = (H / 2) - player.y;
    player.y = H / 2;
    platforms.forEach(p => p.y += diff);
  }

  // Respawn platforms
  platforms.forEach((p, i) => {
    if (p.y > H) {
      platforms[i] = makePlatform(
        Math.random() * (W - 120),
        -20
      );
    }
  });
}

// Draw loop
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // Draw player
  if (playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  }

  // Draw platforms
  ctx.fillStyle = "#8af3ff";
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });
}

// Game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
