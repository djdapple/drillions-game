// ================================
//    DRILLIONS GALAXY — FLAPPY D
// ================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");

// ----- RESIZE -----
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ----- ASSETS -----
const logoImg = new Image();
logoImg.src = "../drillions-pixel-logo.png"; // from /flappy/ to root

// optional sounds (safe even if they fail)
let hitSound = null, boostSound = null;
try {
    hitSound = new Audio("../sfx/drillions_hit.wav");
    boostSound = new Audio("../sfx/drillions_boost.wav");
} catch (_) {}

// ----- GAME STATE -----
let player = {
    x: canvas.width * 0.23,
    y: canvas.height * 0.4,
    w: 96,
    h: 32,
    vy: 0
};

let gravity = 0.45;
let jumpStrength = -8.5;
let maxFallSpeed = 12;

let pipes = [];
let basePipeGap = 230;      // will shrink as difficulty rises
let pipeGap = basePipeGap;
let pipeWidth = 90;
let pipeSpacing = 420;
let pipeSpeed = 2.6;

let score = 0;
let gameStarted = false;
let gameOver = false;
let lastTime = 0;
let difficultyTimer = 0;

// trails & burst
let trailSegments = [];
let burstParticles = [];
let burstWave = null;

// ----- NEBULA BACKGROUND (Drillions Galaxy) -----
const nebulaLayers = [];

function initNebula() {
    nebulaLayers.length = 0;

    // Back layer: deep dim stars
    nebulaLayers.push(createStarLayer(80, 0.08, 0.2, "#2d3b5c", 0.3));

    // Mid layer: brighter glyph-stars
    nebulaLayers.push(createStarLayer(70, 0.18, 0.5, "#6eb5ff", 0.7));

    // Front layer: fast glowing shards
    nebulaLayers.push(createStarLayer(40, 0.4, 1.0, "#c9e7ff", 1.0));
}

function createStarLayer(count, minSpeed, maxSpeed, color, alpha) {
    const stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
            size: 0.7 + Math.random() * 2.2,
            color,
            alpha
        });
    }
    return stars;
}

function updateNebula(dt) {
    const factor = dt / 16.67;
    nebulaLayers.forEach((layer, index) => {
        const depth = 0.6 + index * 0.5;
        layer.forEach(star => {
            star.x -= star.speed * factor * depth * pipeSpeed;
            if (star.x < -10) {
                star.x = canvas.width + Math.random() * 40;
                star.y = Math.random() * canvas.height;
            }
        });
    });
}

function drawNebula() {
    // base gradient
    const bg = ctx.createRadialGradient(
        canvas.width * 0.3,
        canvas.height * 0.4,
        10,
        canvas.width * 0.5,
        canvas.height * 0.7,
        Math.max(canvas.width, canvas.height)
    );
    bg.addColorStop(0, "#020308");
    bg.addColorStop(0.25, "#040712");
    bg.addColorStop(0.6, "#02010a");
    bg.addColorStop(1, "#000000");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // soft diagonal fog
    ctx.save();
    ctx.globalAlpha = 0.12;
    const fogGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    fogGrad.addColorStop(0, "#30405c");
    fogGrad.addColorStop(0.5, "rgba(0,0,0,0)");
    fogGrad.addColorStop(1, "#1c2940");
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // star layers
    nebulaLayers.forEach(layer => {
        ctx.save();
        layer.forEach(s => {
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    });
}

// ----- PIPES -----
function seedPipes() {
    pipes.length = 0;
    let x = canvas.width + 200;
    for (let i = 0; i < 5; i++) {
        spawnPipe(x);
        x += pipeSpacing;
    }
}

function spawnPipe(xPos) {
    const margin = 60;
    const maxTop = canvas.height - pipeGap - margin;
    const top = margin + Math.random() * (maxTop - margin);
    pipes.push({
        x: xPos,
        gapY: top,
        counted: false
    });
}

function updatePipes(dt) {
    const factor = dt / 16.67;
    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= pipeSpeed * factor;

        // passed
        if (!p.counted && p.x + pipeWidth < player.x) {
            p.counted = true;
            score++;
            scoreEl.textContent = score.toString();
        }

        // remove / respawn
        if (p.x + pipeWidth < -40) {
            pipes.splice(i, 1);
            const lastX = pipes.reduce((max, pipe) => Math.max(max, pipe.x), 0);
            spawnPipe(lastX + pipeSpacing);
        }
    }
}

function drawChromePipe(x, y, w, h) {
    if (h <= 0) return;

    // main chrome body
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, "#f8fbff");
    grad.addColorStop(0.2, "#c9d4e5");
    grad.addColorStop(0.5, "#ffffff");
    grad.addColorStop(0.8, "#9da7ba");
    grad.addColorStop(1, "#e0e7f5");

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // inner dark rim
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // glow edge
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#d6e6ff";
    ctx.lineWidth = 6;
    ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
    ctx.restore();
}

function drawPipes() {
    for (const p of pipes) {
        const topH = p.gapY;
        const bottomY = p.gapY + pipeGap;
        const bottomH = canvas.height - bottomY;

        drawChromePipe(p.x, 0, pipeWidth, topH);
        drawChromePipe(p.x, bottomY, pipeWidth, bottomH);

        // soft reflection overlay
        const refGrad = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
        refGrad.addColorStop(0, "rgba(255,255,255,0.05)");
        refGrad.addColorStop(0.5, "rgba(255,255,255,0.2)");
        refGrad.addColorStop(1, "rgba(255,255,255,0.05)");
        ctx.fillStyle = refGrad;
        ctx.fillRect(p.x, 0, pipeWidth, canvas.height);
    }
}

// ----- TRAIL -----
function addTrailSegment() {
    trailSegments.push({
        x: player.x - player.w * 0.4,
        y: player.y + player.h * 0.55,
        length: player.w * 0.9,
        alpha: 1,
        wobbleSeed: Math.random() * Math.PI * 2
    });
}

function updateTrail(dt) {
    const factor = dt / 16.67;
    for (let i = trailSegments.length - 1; i >= 0; i--) {
        const t = trailSegments[i];
        t.x -= pipeSpeed * factor * 1.1;
        t.alpha -= 0.04 * factor;
        if (t.alpha <= 0) {
            trailSegments.splice(i, 1);
        }
    }
}

function drawTrail(time) {
    for (const t of trailSegments) {
        const wobble = Math.sin(time / 220 + t.wobbleSeed) * 3;

        const grad = ctx.createLinearGradient(
            t.x - t.length,
            t.y + wobble,
            t.x,
            t.y + wobble
        );
        grad.addColorStop(0, "rgba(10, 45, 90, 0)");
        grad.addColorStop(0.4, `rgba(80, 150, 240, ${t.alpha * 0.7})`);
        grad.addColorStop(1, `rgba(200, 240, 255, ${t.alpha})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(t.x - t.length, t.y + wobble);
        ctx.lineTo(t.x, t.y + wobble);
        ctx.stroke();

        // little chrome sparks
        ctx.fillStyle = `rgba(200,240,255,${t.alpha})`;
        for (let i = 0; i < 3; i++) {
            const fx = t.x - Math.random() * t.length;
            const fy = t.y + wobble + (Math.random() - 0.5) * 6;
            ctx.beginPath();
            ctx.arc(fx, fy, 1.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ----- BURST ON DEATH -----
function createBurst() {
    burstParticles.length = 0;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;

    for (let i = 0; i < 55; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4.5;
        burstParticles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            size: 2 + Math.random() * 3
        });
    }

    burstWave = {
        x: cx,
        y: cy,
        radius: 0,
        alpha: 0.8
    };

    if (hitSound) {
        hitSound.currentTime = 0;
        hitSound.play().catch(() => {});
    }
}

function updateBurst(dt) {
    const factor = dt / 16.67;
    for (let i = burstParticles.length - 1; i >= 0; i--) {
        const p = burstParticles[i];
        p.x += p.vx * factor;
        p.y += p.vy * factor;
        p.vy += 0.15 * factor;
        p.life -= 0.03 * factor;
        if (p.life <= 0) burstParticles.splice(i, 1);
    }

    if (burstWave) {
        burstWave.radius += 10 * factor;
        burstWave.alpha -= 0.03 * factor;
        if (burstWave.alpha <= 0) burstWave = null;
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

    if (burstWave) {
        ctx.save();
        ctx.strokeStyle = `rgba(180,220,255,${burstWave.alpha})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(burstWave.x, burstWave.y, burstWave.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// ----- INPUT: TAP TO JUMP -----
function handleTap() {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gameOver) {
        startGame();
        return;
    }
    // jump
    player.vy = jumpStrength;
    if (boostSound) {
        boostSound.currentTime = 0;
        boostSound.play().catch(() => {});
    }
}

window.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleTap();
}, { passive: false });

window.addEventListener("mousedown", (e) => {
    e.preventDefault();
    handleTap();
});

// ----- GAME CONTROL -----
function startGame() {
    score = 0;
    scoreEl.textContent = "0";
    player.y = canvas.height * 0.45;
    player.vy = 0;
    pipeGap = basePipeGap;
    pipeSpeed = 2.6;
    difficultyTimer = 0;
    gameStarted = true;
    gameOver = false;
    messageEl.textContent = "";
    trailSegments.length = 0;
    burstParticles.length = 0;
    burstWave = null;
    seedPipes();
}

function setGameOver() {
    if (gameOver) return;
    gameOver = true;
    messageEl.textContent = "GAME OVER — TAP TO RESTART";
    createBurst();
}

// ----- COLLISION -----
function checkCollision() {
    const px = player.x;
    const py = player.y;
    const pw = player.w;
    const ph = player.h;

    // floor / ceiling
    if (py < -40 || py + ph > canvas.height + 10) {
        setGameOver();
        return;
    }

    for (const p of pipes) {
        const topRect = { x: p.x, y: 0, w: pipeWidth, h: p.gapY };
        const bottomY = p.gapY + pipeGap;
        const bottomRect = {
            x: p.x,
            y: bottomY,
            w: pipeWidth,
            h: canvas.height - bottomY
        };

        if (rectOverlap(px, py, pw, ph, topRect) ||
            rectOverlap(px, py, pw, ph, bottomRect)) {
            setGameOver();
            return;
        }
    }
}

function rectOverlap(px, py, pw, ph, r) {
    const margin = 6; // tiny forgiveness
    return !(
        px + pw - margin < r.x ||
        px + margin > r.x + r.w ||
        py + ph - margin < r.y ||
        py + margin > r.y + r.h
    );
}

// ----- MAIN LOOP -----
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    update(dt);
    render(timestamp);

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    updateNebula(dt);
    updateBurst(dt);

    if (!gameStarted || gameOver) return;

    const factor = dt / 16.67;

    // difficulty scaling over time
    difficultyTimer += dt;
    const diffFactor = Math.min(1.2, 1 + score * 0.03 + difficultyTimer / 60000);
    pipeSpeed = 2.6 * diffFactor;
    pipeGap = basePipeGap - Math.min(80, score * 2.2);

    // physics
    player.vy += gravity * factor;
    if (player.vy > maxFallSpeed) player.vy = maxFallSpeed;
    player.y += player.vy * factor * 1.1;

    // pipes & collisions
    updatePipes(dt);
    checkCollision();

    // trail
    addTrailSegment();
    updateTrail(dt);
}

function render(timestamp) {
    drawNebula();
    drawPipes();
    drawBurst();
    drawTrail(timestamp || 0);

    // player
    if (logoImg.complete && logoImg.naturalWidth > 0) {
        const tilt = Math.max(-0.4, Math.min(0.4, -player.vy * 0.06));
        const cx = player.x + player.w / 2;
        const cy = player.y + player.h / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            logoImg,
            -player.w / 2,
            -player.h / 2,
            player.w,
            player.h
        );
        ctx.restore();
    }

    if (!gameStarted) {
        messageEl.textContent = "TAP TO START";
    }
}

// ----- INIT -----
initNebula();
logoImg.onload = () => {
    // adjust hitbox to image aspect
    const aspect = logoImg.height ? logoImg.height / logoImg.width : 0.35;
    player.w = Math.min(canvas.width * 0.28, 170);
    player.h = player.w * (aspect || 0.35);
};
requestAnimationFrame(gameLoop);