console.log("Jump game starting…");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Resize
let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// Player image (safe-load)
const playerImg = new Image();
playerImg.src = "drillions-pixel-logo.png";
playerImg.onerror = () => console.log("⚠️ Logo failed to load");
playerImg.onload = () => console.log("✔ Logo loaded");

const player = {
  x: 150,
  y: 300,
  w: 120,
  h: 60,
  vy: 0,
  gravity: 0.7,
  jumpForce: -13
};

// Platforms
let platforms = [];
function newPlat(x, y) {
  return { x, y, w: 120, h: 12 };
}

// Create first platforms
for (let i = 0; i < 12; i++) {
  platforms.push(newPlat(
    Math.random() * (W - 120),
    H - i * 80
  ));
}

// Tap to jump
canvas.addEventListener("touchstart", () => {
  player.vy = player.jumpForce;
});

// Update physics
function update() {
  player.vy += player.gravity;
  player.y += player.vy;

  // Bounce on platform
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

  // Scroll world upward
  if (player.y < H * 0.4) {
    const shift = (H * 0.4) - player.y;
    player.y = H * 0.4;
    platforms.forEach(p => p.y += shift);
  }

  // Respawn platforms
  platforms.forEach((p, i) => {
    if (p.y > H) {
      platforms[i] = newPlat(
        Math.random() * (W - 120),
        -20
      );
    }
  });
}

// Draw everything
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // Platforms
  ctx.fillStyle = "#8af3ff";
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  // Player image OR fallback
  if (playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = "white";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }
}

function loop() {
  try {
    update();
    draw();
  } catch (err) {
    console.error("GAME ERROR:", err);
  }
  requestAnimationFrame(loop);
}

loop();