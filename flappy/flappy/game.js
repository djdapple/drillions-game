const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  if (gameState === "ready") {
    centerPlayer();
  }
});

// ---- Player (Drillions logo) ----
const playerImg = new Image();
playerImg.src = "../assets/drillions_logo.png";

const player = {
  x: 0,
  y: 0,
  width: 160,
  height: 50,
  vy: 0
};

function centerPlayer() {
  player.x = width * 0.2;
  player.y = height * 0.5;
  player.vy = 0;
}

// ---- Game parameters ----
const gravity = 0.35;
const flapStrength = -7.5;
const maxVelocity = 12;

const barWidth = 80;
const barGap = 180;
const barSpeed = 3.4;
const barSpawnInterval = 1600;

let bars = [];
let lastSpawn = 0;
let lastTime = 0;
let score = 0;
let gameState = "loading"; // loading | ready | playing | gameover

// ---- Input ----
function flap() {
  if (gameState === "loading") return;

  if (gameState === "ready") {
    gameState = "playing";
    messageEl.textContent = "";
  }

  if (gameState === "playing") {
    player.vy = flapStrength;
  } else if (gameState === "gameover") {
    restartGame();
  }
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    flap();
  }
});

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  flap();
});

// ---- Bars ----
function spawnBar() {
  const minTop = 40;
  const maxTop = height - barGap - 80;
  const topHeight = minTop + Math.random() * (maxTop - minTop);

  bars.push({
    x: width + barWidth,
    topHeight,
    passed: false
  });
}

// ---- Game control ----
function restartGame() {
  score = 0;
  scoreEl.textContent = "0";
  bars = [];
  centerPlayer();
  lastSpawn = 0;
  lastTime = 0;
  gameState = "ready";
  messageEl.textContent = "TAP OR PRESS SPACE TO FLY";
}

// ---- Main loop ----
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

function update(dt) {
  if (gameState === "loading") return;

  if (gameState === "playing") {
    player.vy += gravity;
    if (player.vy > maxVelocity) player.vy = maxVelocity;
    player.y += player.vy;

    // spawn bars
    lastSpawn += dt;
    if (lastSpawn > barSpawnInterval) {
      spawnBar();
      lastSpawn = 0;
    }

    // move bars
    for (let i = bars.length - 1; i >= 0; i--) {
      bars[i].x -= barSpeed;

      // score when passed
      if (!bars[i].passed && bars[i].x + barWidth < player.x) {
        bars[i].passed = true;
        score++;
        scoreEl.textContent = String(score);
      }

      // remove off-screen
      if (bars[i].x + barWidth < 0) {
        bars.splice(i, 1);
      }
    }

    // collisions with floor / ceiling
    if (player.y + player.height > height || player.y < -40) {
      setGameOver();
    }

    // collisions with bars
    for (const bar of bars) {
      if (rectOverlap(player.x, player.y, player.width, player.height,
                      bar.x, 0, barWidth, bar.topHeight) ||
          rectOverlap(player.x, player.y, player.width, player.height,
                      bar.x, bar.topHeight + barGap, barWidth, height)) {
        setGameOver();
        break;
      }
    }
  }
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}

function setGameOver() {
  if (gameState !== "playing") return;
  gameState = "gameover";
  messageEl.textContent = "GAME OVER — TAP TO RESTART";
}

// ---- Rendering ----
function render() {
  // background: chrome street gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#020409");
  grad.addColorStop(0.35, "#181d24");
  grad.addColorStop(0.7, "#0a0c10");
  grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // subtle chrome streaks
  ctx.save();
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    const y = (i / 12) * height;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + 40);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(180, 220, 255, 0.4)";
    ctx.stroke();
  }
  ctx.restore();

  // bars
  for (const bar of bars) {
    drawChromeBar(bar.x, 0, barWidth, bar.topHeight);
    drawChromeBar(bar.x, bar.topHeight + barGap, barWidth, height);
  }

  // player
  if (playerImg.complete) {
    const tilt = Math.max(-0.35, Math.min(0.35, player.vy * -0.03));
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

    // trail
    ctx.globalAlpha = 0.4;
    ctx.drawImage(
      playerImg,
      -player.width / 2 - 18,
      -player.height / 2 + 4,
      player.width * 0.9,
      player.height * 0.85
    );
    ctx.restore();
  } else {
    ctx.fillStyle = "#66ccff";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  if (gameState === "ready") {
    messageEl.textContent = "TAP OR PRESS SPACE TO FLY";
  } else if (gameState === "loading") {
    messageEl.textContent = "LOADING…";
  }
}

function drawChromeBar(x, y, w, h) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#d8f0ff");
  grad.addColorStop(0.25, "#8fb4d9");
  grad.addColorStop(0.5, "#f5fbff");
  grad.addColorStop(0.75, "#6f90b0");
  grad.addColorStop(1, "#d8f0ff");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

playerImg.onload = () => {
  centerPlayer();
  gameState = "ready";
};

restartGame();
requestAnimationFrame(loop);