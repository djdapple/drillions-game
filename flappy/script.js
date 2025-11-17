// CANVAS
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// PLAYER
const player = {
    x: 80,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    gravity: 3,
    lift: -25,
    velocity: 0
};

// PIPE SETTINGS
let pipes = [];
let pipeGap = 230;
let pipeWidth = 80;
let pipeSpeed = 5;

// SCORE
let score = 0;

// COLOR (DRILLIONS ENERGY BLUE)
const drillColor = "#55ccff";

// CREATE PIPES EVERY 1.5 SECONDS
setInterval(() => {
    let topHeight = Math.random() * (canvas.height - pipeGap - 200) + 50;
    let bottomY = topHeight + pipeGap;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: bottomY
    });
}, 1500);

// GAME LOOP
function update() {
    // Gravity
    player.velocity += player.gravity;
    player.y += player.velocity;

    // Prevent falling below screen
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocity = 0;
    }

    // PIPE MOVEMENT
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;

        // Passed pipe → +1 score
        if (pipe.x + pipeWidth < player.x && !pipe.passed) {
            pipe.passed = true;
            score++;
            console.log("Score:", score);
        }

        // Collision top
        if (player.x < pipe.x + pipeWidth &&
            player.x + player.width > pipe.x &&
            player.y < pipe.topHeight) {
            resetGame();
        }

        // Collision bottom
        if (player.x < pipe.x + pipeWidth &&
            player.x + player.width > pipe.x &&
            player.y + player.height > pipe.bottomY) {
            resetGame();
        }
    });

    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    draw();
    requestAnimationFrame(update);
}

// DRAW EVERYTHING
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pipes
    pipes.forEach(pipe => {
        ctx.fillStyle = drillColor;

        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);

        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
    });

    // Player (blue glowing square for now)
    ctx.fillStyle = "#00aaff";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Score
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.fillText(score, 30, 50);
}

// TAP / SPACE / CLICK → JUMP
window.addEventListener("mousedown", jump);
window.addEventListener("touchstart", jump);
window.addEventListener("keydown", e => {
    if (e.code === "Space") jump();
});

function jump() {
    player.velocity = player.lift;
}

// RESET GAME
function resetGame() {
    pipes = [];
    score = 0;
    player.y = canvas.height / 2;
    player.velocity = 0;
}

// START LOOP
update();