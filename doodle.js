let board;
let boardWidth = 360;
let boardHeight = 576;
let context;

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
};

let velocityX = 0;
let velocityY = 0;
let initialVelocityY = -8;
let gravity = 0.4;

let platformArray = [];
let platformWidth = 60;
let platformHeight = 18;
let platformImg;
let springImg;

let cloudsArray = [];
let cloudImg;
let minCloudWidth = 80;
let maxCloudWidth = 150;
let minCloudHeight = 40;
let maxCloudHeight = 80;

let enemyArray = [];
let enemyImg;
let enemyWidth = 60;
let enemyHeight = 45;

let score = 0;
let maxScore = 0;
let highScore = 0;
let gameOver = false;
let gameStarted = false;

let startSound;
let jumpSound;
let springSound;
let gameOverSound;
let gameOverSoundPlayed = false;

window.onload = function () {
    board = document.getElementById("board");
    boardHeight = window.innerHeight;
    boardWidth = Math.min(414, window.innerWidth);
    board.height = boardHeight;
    board.width = boardWidth;
    doodlerX = boardWidth / 2 - doodlerWidth / 2;
    doodler.x = doodlerX;

    context = board.getContext("2d");

    highScore = localStorage.getItem("doodle-jump-highscore") || 0;

    let imagesToLoad = 6;
    let imagesLoaded = 0;

    function onImageLoad() {
        imagesLoaded++;
        if (imagesLoaded === imagesToLoad) {
            setupGame();
        }
    }

    doodlerRightImg = new Image();
    doodlerRightImg.src = "photos/doodler-right.png";
    doodlerRightImg.onload = onImageLoad;

    doodlerLeftImg = new Image();
    doodlerLeftImg.src = "photos/doodler-left.png";
    doodlerLeftImg.onload = onImageLoad;

    platformImg = new Image();
    platformImg.src = "photos/platform.png";
    platformImg.onload = onImageLoad;

    springImg = new Image();
    springImg.src = "photos/spring.png";
    springImg.onload = onImageLoad;

    cloudImg = new Image();
    cloudImg.src = "photos/cloud.png";
    cloudImg.onload = onImageLoad;

    enemyImg = new Image();
    enemyImg.src = "photos/enemy.png";
    enemyImg.onload = onImageLoad;
};

function setupGame() {
    doodler.img = doodlerRightImg;
    velocityY = initialVelocityY;

    startSound = new Audio("audio/start.wav");
    jumpSound = new Audio("audio/jump.mp3");
    springSound = new Audio("audio/spring.mp3");
    gameOverSound = new Audio("audio/over.wav");

    placePlatforms();
    for (let i = 0; i < 5; i++) {
        newCloud(true);
    }
    requestAnimationFrame(update);
    document.addEventListener("keydown", moveDoodler);
    document.addEventListener("keyup", stopDoodler);
    board.addEventListener("touchstart", touchStart);
    board.addEventListener("touchend", touchEnd);
}

function update() {
    requestAnimationFrame(update);

    if (!gameStarted) {
        context.clearRect(0, 0, board.width, board.height);
        context.fillStyle = "black";
        context.font = "24px sans-serif";
        context.textAlign = "center";
        context.fillText("Press Any Key or Tap to Start", boardWidth / 2, boardHeight / 2);
        return;
    }

    if (gameOver) {
        if (!gameOverSoundPlayed) {
            gameOverSound.play();
            gameOverSoundPlayed = true;
        }
        context.fillStyle = "black";
        context.textAlign = "center";

        context.font = "48px sans-serif";
        context.fillText("GAME OVER", boardWidth / 2, boardHeight / 2 - 80);

        context.font = "24px sans-serif";
        context.fillText("Score: " + score, boardWidth / 2, boardHeight / 2 - 20);
        context.fillText("High Score: " + highScore, boardWidth / 2, boardHeight / 2 + 20);
        
        context.font = "16px sans-serif";
        context.fillText("Tap or Press 'R'/'Space' to Restart", boardWidth / 2, boardHeight / 2 + 80);
        return;
    }

    context.clearRect(0, 0, board.width, board.height);

    for (let i = 0; i < cloudsArray.length; i++) {
        let cloud = cloudsArray[i];
        if (velocityY < 0 && doodler.y < boardHeight * 3 / 4) {
            cloud.y -= initialVelocityY * 0.5;
        }
        if (cloud.x + cloud.width < 0 || cloud.x > boardWidth) {
            cloud.direction *= -1;
        }
        cloud.x += cloud.direction * cloud.moveOffset;
        context.drawImage(cloud.img, cloud.x, cloud.y, cloud.width, cloud.height);
    }

    doodler.x += velocityX;
    if (doodler.x > boardWidth) {
        doodler.x = -doodlerWidth;
    } else if (doodler.x + doodler.width < 0) {
        doodler.x = boardWidth;
    }

    velocityY += gravity;
    doodler.y += velocityY;
    if (doodler.y > board.height) {
        endGame();
    }
    context.drawImage(doodler.img, doodler.x, doodler.y, doodler.width, doodler.height);

    for (let i = 0; i < enemyArray.length; i++) {
        let enemy = enemyArray[i];
        enemy.x += enemy.velocityX;
        if (enemy.x + enemy.width >= boardWidth || enemy.x <= 0) {
            enemy.velocityX *= -1;
        }
        if (velocityY < 0 && doodler.y < boardHeight * 3 / 4) {
            enemy.y -= initialVelocityY;
        }
        if (detectCollision(doodler, enemy)) {
            endGame();
        }
        context.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
    }

    for (let i = 0; i < platformArray.length; i++) {
        let platform = platformArray[i];
        if (velocityY < 0 && doodler.y < boardHeight * 3 / 4) {
            platform.y -= initialVelocityY;
        }
        if (detectCollision(doodler, platform) && velocityY >= 0) {
            if (platform.type === "spring") {
                velocityY = -24;
                springSound.currentTime = 0;
                springSound.play();
            } else {
                velocityY = initialVelocityY;
                startSound.currentTime = 0;  
                startSound.play();           
            }
        }
        context.drawImage(platform.img, platform.x, platform.y, platform.width, platform.height);
        if (platform.type === "spring") {
            context.drawImage(springImg, platform.x + platform.width / 4, platform.y - 12, platform.width / 2, 12);
        }
    }

    while (cloudsArray.length > 0 && cloudsArray[0].y >= boardHeight) {
        cloudsArray.shift();
        newCloud(false);
    }
    while (enemyArray.length > 0 && enemyArray[0].y >= boardHeight) {
        enemyArray.shift();
        newEnemy(false);
    }
    while (platformArray.length > 0 && platformArray[0].y >= boardHeight) {
        platformArray.shift();
        newPlatform();
    }

    updateScore();
    context.fillStyle = "black";
    context.font = "16px sans-serif";
    context.textAlign = "left";
    context.fillText(score, 5, 20);
}

function moveDoodler(e) {
    if (!gameStarted) {
        gameStarted = true;
        startSound.play();
        return;
    }
    if (gameOver && (e.code === "KeyR" || e.code === "Space")) {
        resetGame();
    }
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

function touchStart(e) {
    e.preventDefault();
    if (!gameStarted) {
        gameStarted = true;
        startSound.play();
        return;
    }
    if (gameOver) {
        resetGame();
        return;
    }
    let touchX = e.touches[0].clientX - board.offsetLeft;
    if (touchX > boardWidth / 2) {
        velocityX = 4;
        doodler.img = doodlerRightImg;
    } else {
        velocityX = -4;
        doodler.img = doodlerLeftImg;
    }
}

function touchEnd(e) {
    velocityX = 0;
}

function resetGame() {
    doodler = {
        img: doodlerRightImg,
        x: doodlerX,
        y: boardHeight * 7 / 8 - doodlerHeight,
        width: doodlerWidth,
        height: doodlerHeight
    };
    velocityX = 0;
    velocityY = initialVelocityY;
    score = 0;
    maxScore = 0;
    gameOver = false;
    gameStarted = false;
    gameOverSoundPlayed = false;
    placePlatforms();
    cloudsArray = [];
    enemyArray = [];
    for (let i = 0; i < 5; i++) {
        newCloud(true);
    }
}

function endGame() {
    if (gameOver) return;
    gameOver = true;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("doodle-jump-highscore", highScore);
    }
}

function placePlatforms() {
    platformArray = [];
    let firstPlatform = {
        img: platformImg,
        x: boardWidth / 2 - platformWidth / 2,
        y: boardHeight - 50,
        width: platformWidth,
        height: platformHeight,
        type: "normal"
    };
    platformArray.push(firstPlatform);

    for (let i = 0; i < 15; i++) {
        let randomX = Math.floor(Math.random() * boardWidth * 3 / 4);
        let lastPlatformY = platformArray[platformArray.length - 1].y;
        let randomYOffset = platformHeight + 20 + Math.floor(Math.random() * 30);
        let platform = {
            img: platformImg,
            x: randomX,
            y: lastPlatformY - randomYOffset,
            width: platformWidth,
            height: platformHeight,
            type: "normal"
        };
        platformArray.push(platform);
    }
}

function newPlatform() {
    let randomX = Math.floor(Math.random() * boardWidth * 3 / 4);
    let platformType = "normal";
    if (score > 1000 && Math.random() < 0.1) {
        platformType = "spring";
    }
    let platform = {
        img: platformImg,
        x: randomX,
        y: -platformHeight,
        width: platformWidth,
        height: platformHeight,
        type: platformType
    };
    platformArray.push(platform);

    if (score > 500 && Math.random() < 0.10) {
        newEnemy(false);
    }
}

function newCloud(initialPlacement = false) {
    let cloudWidth = minCloudWidth + Math.random() * (maxCloudWidth - minCloudWidth);
    let cloudHeight = minCloudHeight + Math.random() * (maxCloudHeight - minCloudHeight);
    let randomX = Math.random() * (boardWidth - cloudWidth);
    let randomY;
    if (initialPlacement) {
        randomY = Math.random() * boardHeight;
    } else {
        randomY = -cloudHeight - Math.random() * boardHeight * 0.2;
    }
    let direction = Math.random() < 0.5 ? 1 : -1;
    let moveOffset = Math.random() * 0.5 + 0.2;
    let cloud = {
        img: cloudImg,
        x: randomX,
        y: randomY,
        width: cloudWidth,
        height: cloudHeight,
        direction: direction,
        moveOffset: moveOffset
    };
    cloudsArray.push(cloud);
}

function newEnemy(initialPlacement = false) {
    let randomX = Math.random() * (boardWidth - enemyWidth);
    let randomY;

    if (initialPlacement) {
        randomY = Math.random() * boardHeight * 0.75;
    } else {
        randomY = -enemyHeight - Math.random() * boardHeight * 0.2;
    }

    let enemy = {
        img: enemyImg,
        x: randomX,
        y: randomY,
        width: enemyWidth,
        height: enemyHeight,
        velocityX: 1
    };
    enemyArray.push(enemy);
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function updateScore() {
    let points = Math.floor(50 * Math.random());
    if (velocityY < 0) {
        maxScore += points;
        if (score < maxScore) {
            score = maxScore;
        }
    } else if (velocityY >= 0) {
        maxScore -= points;
    }
}