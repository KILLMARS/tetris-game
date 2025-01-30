class Scoreboard {
    constructor(){
        this.score = 0;
        this.pointsPerRow = [0, 40, 100, 200, 300];
    }

    updateScore(rowCount){
        if(rowCount > 0){
            this.score += this.pointsPerRow[rowCount];
        }
    }

    getScore(){
        return this.score;
    }
}

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF'
];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

const board = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

const TETROMINOS = [
    null,
    [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    [
        [1,0,0],
        [1,1,1],
        [0,0,0]
    ],
    [
        [0,0,1],
        [1,1,1],
        [0,0,0]
    ],
    [
        [1,1],
        [1,1]
    ],
    [
        [0,1,1],
        [1,1,0],
        [0,0,0]
    ],
    [
        [0,1,0],
        [1,1,1],
        [0,0,0]
    ],
    [
        [1,1,0],
        [0,1,1],
        [0,0,0]
    ]
];

let isPaused = false;
let level = 1;
let currentTetromino;
let currentColorIndex;
let currentX;
let currentY;
let gameRunning = false;
let dropCounter = 0;
let dropInterval = 500;
let lastTime = 0;
const scoreboard = new Scoreboard();
let clearedLines = 0;
const linesPerLevel = 10;
let nextTetromino;
let nextColorIndex;
const nextCanvas = document.getElementById('next-piece-canvas');
const nextCtx = nextCanvas.getContext('2d');

nextCanvas.width = 4 * BLOCK_SIZE;
nextCanvas.height = 4 * BLOCK_SIZE;

function updateDifficulty(rowCount){
    clearedLines += rowCount;
    level = Math.floor(clearedLines / linesPerLevel) + 1;
    dropInterval = Math.max(100, 500 - (Math.floor(level - 1) * 50));
}

function spawnTetromino(){
    if(nextTetromino){
        currentTetromino = nextTetromino;
        currentColorIndex = nextColorIndex;
    } else {
        const randomIndex = Math.floor(Math.random() * (TETROMINOS.length - 1)) + 1;
        currentTetromino = TETROMINOS[randomIndex];
        currentColorIndex = randomIndex;
    }

    const randomIndex = Math.floor(Math.random() * (TETROMINOS.length - 1)) + 1;
    nextTetromino = TETROMINOS[randomIndex];
    nextColorIndex = randomIndex;
    currentX = Math.floor(COLS / 2) - Math.floor(currentTetromino[0].length / 2);
    currentY = 0;

    drawNextPiece();

    if(collision(currentTetromino, currentX, currentY)){
        gameRunning = false;
        if(confirm("Game Over! Do you want to restart?")){
            start();
        }
        return;
    }
}

function drawNextPiece(){
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    const offsetX = (nextCanvas.width / BLOCK_SIZE - nextTetromino[0].length) / 2;
    const offsetY = (nextCanvas.height / BLOCK_SIZE - nextTetromino.length) / 2;

    nextCtx.fillStyle = colors[nextColorIndex];
    nextCtx.strokeStyle = '#000';
    nextCtx.lineWidth = 2;

    nextTetromino.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value){
                nextCtx.fillRect(
                    (x + offsetX) * BLOCK_SIZE,
                    (y + offsetY) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
                nextCtx.strokeRect(
                    (x + offsetX) * BLOCK_SIZE,
                    (y + offsetY) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
            }
        });
    });
}

function drawTetromino(tetromino, colorIndex, offsetX, offsetY){
    ctx.fillStyle = colors[colorIndex];
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value){
                ctx.fillRect((offsetX + x) * BLOCK_SIZE, (offsetY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeRect((offsetX + x) * BLOCK_SIZE, (offsetY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function drawBoard(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value > 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        })
    })
}

function clearBoard(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function collision(tetromino, offsetX, offsetY){
    return tetromino.some((row, y) =>{
        return row.some((value, x) => {
            if(value !== 0){
                const newX = offsetX + x;
                const newY = offsetY + y;

                if(newX < 0 || newX >= COLS || newY >= ROWS){
                    return true;
                }

                if(board[newY] && board[newY][newX] > 0){
                    return true;
                }
            }
            return false;
        })
    })
}

function lockTetromino(){
    currentTetromino.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0){
                board[currentY + y][currentX + x] = currentColorIndex;
            }
        })
    })
    clearRows();
    spawnTetromino();
}

function moveTetrominoDown(){
    if(!collision(currentTetromino, currentX, currentY + 1)){
        currentY++;
    } else {
        lockTetromino();
    }
}

//19/01

function moveTetrominoLeft(){
    if(!collision(currentTetromino, currentX - 1,currentY)){
        currentX--;
    }
}

function moveTetrominoRight(){
    if(!collision(currentTetromino, currentX + 1, currentY)){
        currentX++;
    }
}

function hardDrop(){
    while(!collision(currentTetromino, currentX, currentY + 1)){
        currentY++;
    }
    lockTetromino();
}

document.addEventListener('keydown', (event) => {
    if(event.key === 'ArrowLeft'){
        moveTetrominoLeft();
    } else if (event.key === 'ArrowRight'){
        moveTetrominoRight();
    } else if (event.key === 'ArrowDown'){
        moveTetrominoDown();
    } else if (event.key === ' '){
        hardDrop();
    } else if (event.key === 'x' || event.key === 'ArrowUp'){
        rotateTetromino();
    } else if (event.key === 'p'){
        togglePause();
    }
});

document.addEventListener('keydown', event => {
    if(gameRunning && event.key === 'Escape'){
        start();
    }
})

//19/1 part 2 10:40 lets try to implement some rotation

function rotateTetromino(){
    const rotatedTetromino = [];
    for(let col = 0; col < currentTetromino[0].length; col++){
        const newRow = [];
        for(let row = currentTetromino.length - 1; row >= 0; row--){
            newRow.push(currentTetromino[row][col]);
        }
        rotatedTetromino.push(newRow);
    }

    const wallkick = [
        [0, 0],
        [-1, 0],
        [1,0],
        [0, -1],
    ]

    for(const [offsetX, offsetY] of wallkick){
        if(!collision(rotatedTetromino, currentX + offsetX, currentY + offsetY)){
            currentX += offsetX;
            currentY += offsetY;
            currentTetromino = rotatedTetromino;
            return;
        }
    }
}

function clearRows(){
    let rowCount = 0;
    
    for(let row = ROWS - 1; row >= 0; row--){
        let rowFull = true; 
        for(let col = 0; col < COLS; col ++){
            if(board[row][col] === 0){
                rowFull = false;
                break;
            }
        }

        if(rowFull){
            rowCount++;
            for(let shiftRow = row; shiftRow > 0; shiftRow--){
                for(let col = 0; col < COLS; col++){
                    board[shiftRow][col] = board[shiftRow - 1][col];
                }
            }

            for(let col = 0; col < COLS; col++){
                board[0][col] = 0;
            }
            row++;
        }
    }

    if(rowCount > 0){
        updateDifficulty(rowCount);
    }

    scoreboard.updateScore(rowCount)
    return rowCount;
}

//ive mnaged to write classes in ruby, python, java, but never ever ive done it JS let dive in


function displayScore(){
    const scoreEl = document.getElementById("score");
    
    if(scoreEl){
        scoreEl.innerText = `Score: ${scoreboard.getScore()}`;
    }
}

function displayLevel(){
    const levelEl = document.getElementById("level");
    
    if(levelEl){
        levelEl.innerText = `Level: ${level}`;
    }
}

function displayLines(){
    const linesEl = document.getElementById("lines-cleared");
    
    if(linesEl){
        linesEl.innerText = `Lines: ${clearedLines}`;
    }
}

function togglePause(){
    isPaused = !isPaused;
    if(!isPaused){
        lastTime = performance.now();
        requestAnimationFrame(update);
    }
}

const backgroundMusic = document.getElementById('background-music');
const muteButton = document.getElementById('mute-button');
const muteIcon = document.getElementById('mute-icon');

let isMuted = false;

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    backgroundMusic.muted = isMuted;

    if(isMuted){
        muteIcon.src = 'mute.png';
    } else {
        muteIcon.src = 'unmute.png';
    }
});

window.addEventListener('load', () => {
    backgroundMusic.play();
});


function update(time = 0){
    if(isPaused){
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        return;
    }

    let deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;

    if(dropCounter >= dropInterval){
        moveTetrominoDown();
        dropCounter = 0;
    }

    drawBoard();
    drawTetromino(currentTetromino, currentColorIndex, currentX, currentY);
    displayScore();
    displayLevel();
    displayLines();

    if(gameRunning){
        requestAnimationFrame(update);
    }
}

function start(){
    gameRunning = true;
    level = 1;
    clearedLines = 0;
    scoreboard.score = 0;
    dropInterval = 500;
    nextTetromino = null;
    board.forEach(ROWS => ROWS.fill(0));
    drawBoard();
    spawnTetromino();
    update();

}

start();