let board;
let context;

// NEW: Game ab poori screen ka size lega
let boardWidth = window.innerWidth;
let boardHeight = window.innerHeight;

let doodlerWidth = 46;
let doodlerHeight = 46;
let doodlerX = boardWidth / 2 - doodlerWidth / 2;
let doodlerY = boardHeight * 7 / 8 - doodlerHeight;
let doodlerRightImg;
let doodlerLeftImg;

let doodler = {
    img: null,
    x: doodlerX,
    y: doodlerY,
    width: doodlerWidth,
    height: doodlerHeight
}

let velocityX = 0;
let velocityY = 0;
let initialVelocityY = -8;
let gravity = 0.4;

let platformArray = [];
let platformWidth = 60;
let platformHeight = 18;
let platformImg;
let platformBrokenImg;

let gameState = "start";

let score = 0;
let highScore = 0;

let jumpSound;
let gameOverSound;


window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    doodlerRightImg = new Image();
    doodlerRightImg.src = "./doodler-right.png";
    doodler.img = doodlerRightImg;

    doodlerLeftImg = new Image();
    doodlerLeftImg.src = "./doodler-left.png";

    platformImg = new Image();
    platformImg.src = "./platform.png";

    platformBrokenImg = new Image();
    platformBrokenImg.src = "./platform-broken.png";

    jumpSound = new Audio("jump.mp3");
    gameOverSound = new Audio("gameOver.mp3");
    
    highScore = localStorage.getItem("doodleJumpHighScore") || 0;

    requestAnimationFrame(update);
    document.addEventListener("keydown", moveDoodler);
    document.addEventListener("keyup", stopDoodler);
    board.addEventListener("click", handleStartOrRestart);
}

function handleStartOrRestart() {
    if (gameState === "start" || gameState === "gameOver") {
        resetGame();
    }
}


function update() {
    requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height);

    if (gameState === "start") {
        drawStartScreen();
    } else if (gameState === "playing") {
        runGame();
    } else if (gameState === "gameOver") {
        drawGameOverScreen();
    }
}

function runGame() {
    doodler.x += velocityX;
    if (doodler.x > boardWidth) doodler.x = 0;
    else if (doodler.x + doodler.width < 0) doodler.x = boardWidth;

    velocityY += gravity;
    doodler.y += velocityY;
    if (doodler.y > board.height) {
        gameState = "gameOver";
        gameOverSound.play();
    }
    context.drawImage(doodler.img, doodler.x, doodler.y, doodler.width, doodler.height);

    for (let i = 0; i < platformArray.length; i++) {
        let platform = platformArray[i];

        if (platform.type === "moving") {
            platform.x += platform.velocityX;
            if (platform.x <= 0 || platform.x + platform.width >= boardWidth) {
                platform.velocityX *= -1;
            }
        }
        
        if (velocityY < 0 && doodler.y < boardHeight * 3 / 4) {
            platform.y -= initialVelocityY; 
            score++;
        }
        
        if (velocityY >= 0 && detectCollision(doodler, platform)) {
            if (platform.type === "broken") {
                platform.isBroken = true;
            } else {
                 velocityY = initialVelocityY;
                 jumpSound.play();
            }
        }
        
        if (!platform.isBroken) {
            context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
        }
    }

    platformArray = platformArray.filter(p => p.y < boardHeight && !p.isBroken);
    while (platformArray.length < 7) { // Screen par hamesha 7 platforms rakho
        newPlatform();
    }

    drawScore();
}

function moveDoodler(e) {
    if (gameState !== "playing") return;

    if (e.code == "ArrowRight" || e.code == "KeyD") {
        velocityX = 4;
        doodler.img = doodlerRightImg;
    } else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        velocityX = -4;
        doodler.img = doodlerLeftImg;
    }
}

function stopDoodler(e) {
    if (e.code == "ArrowRight" || e.code == "KeyD" || e.code == "ArrowLeft" || e.code == "KeyA") {
        velocityX = 0;
    }
}

function placePlatforms() {
    platformArray = [];
    
    let platform = {
        img: platformImg,
        x: boardWidth / 2,
        y: boardHeight - 50,
        width: platformWidth,
        height: platformHeight,
        type: "normal"
    }
    platformArray.push(platform);

    for (let i = 0; i < 6; i++) { // Shuru mein 6 platforms banao
        // CHANGE: Platforms ko sirf beech ke area mein banane ka logic
        let playAreaWidth = Math.min(boardWidth, 400);
        let playAreaXStart = (boardWidth - playAreaWidth) / 2;
        let randomX = playAreaXStart + Math.floor(Math.random() * playAreaWidth);

        let platform = {
            img: platformImg,
            x: randomX,
            y: boardHeight - 75 * i - 150,
            width: platformWidth,
            height: platformHeight,
            type: "normal"
        }
        platformArray.push(platform);
    }
}

function newPlatform() {
    // CHANGE: Naye platforms ko bhi sirf beech ke area mein banane ka logic
    let playAreaWidth = Math.min(boardWidth, 400);
    let playAreaXStart = (boardWidth - playAreaWidth) / 2;
    let randomX = playAreaXStart + Math.floor(Math.random() * playAreaWidth);

    let platform = {
        img: platformImg,
        x: randomX,
        y: -platformHeight,
        width: platformWidth,
        height: platformHeight,
        type: "normal"
    }

    let platformType = Math.random();
    if (platformType > 0.85) {
        platform.img = platformBrokenImg;
        platform.type = "broken";
    } else if (platformType > 0.70) {
        platform.type = "moving";
        platform.velocityX = 2;
    }

    platformArray.push(platform);
}


function detectCollision(a, b) {
    if (b.isBroken) return false;
    
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function resetGame() {
    doodler = {
        img: doodlerRightImg,
        x: doodlerX,
        y: doodlerY,
        width: doodlerWidth,
        height: doodlerHeight
    }
    velocityX = 0;
    velocityY = initialVelocityY;
    score = 0;
    placePlatforms();
    gameState = "playing";
}

function drawScore() {
    context.fillStyle = "black";
    context.font = "20px sans-serif";
    context.fillText(score, 10, 25);
}

function drawStartScreen() {
    context.fillStyle = "black";
    context.font = "bold 32px sans-serif";
    context.textAlign = "center";
    context.fillText("Doodle Jump", boardWidth / 2, boardHeight / 3);
    context.font = "20px sans-serif";
    context.fillText("Click to Start", boardWidth / 2, boardHeight / 2);
    context.textAlign = "start";
}

function drawGameOverScreen() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("doodleJumpHighScore", highScore);
    }

    context.fillStyle = "black";
    context.font = "bold 32px sans-serif";
    context.textAlign = "center";
    context.fillText("Game Over", boardWidth / 2, boardHeight / 3);
    context.font = "20px sans-serif";
    context.fillText("Score: " + score, boardWidth / 2, boardHeight / 2);
    context.fillText("High Score: " + highScore, boardWidth / 2, boardHeight / 2 + 30);
    context.font = "16px sans-serif";
    context.fillText("Click to Restart", boardWidth / 2, boardHeight / 2 + 60);
    context.textAlign = "start";
}