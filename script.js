// --- Prevent Scroll with Arrow Keys & Space ---
window.addEventListener("keydown", function (e) {
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
  ) {
    e.preventDefault();
  }
});

// --- GAME LOGIC ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const rotateButton = document.getElementById("rotateButton");
const pauseButton = document.getElementById("pauseButton");
const playAgainButton = document.getElementById("playAgainButton");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const finalScoreElement = document.getElementById("finalScore");
const gameOverUI = document.getElementById("gameOverUI");
const gameUI = document.getElementById("gameUI");

let gameState = "menu";
let isGameOver = false;
let isPaused = false;
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
let board = [];
let score = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let requestId = null;

const SHAPES = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
];
const COLORS = [
  "#00BCD4",
  "#FFC107",
  "#9C27B0",
  "#FF9800",
  "#2196F3",
  "#4CAF50",
  "#F44336",
];
let currentPiece = null;

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}
function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = "#1a1a2e";
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}
function drawBoard() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) drawBlock(col, row, board[row][col]);
    }
  }
}
function drawPiece() {
  if (!currentPiece) return;
  currentPiece.shape.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value === 1) {
        drawBlock(currentPiece.x + c, currentPiece.y + r, currentPiece.color);
      }
    });
  });
}
function createPiece() {
  const randomIndex = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[randomIndex],
    color: COLORS[randomIndex],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[randomIndex][0].length / 2),
    y: 0,
  };
}
function checkCollision(piece, x, y, shape) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 0) continue;
      const newX = piece.x + x + c;
      const newY = piece.y + y + r;
      if (
        newX < 0 ||
        newX >= COLS ||
        newY >= ROWS ||
        (newY >= 0 && board[newY][newX])
      ) {
        return true;
      }
    }
  }
  return false;
}
function lockPiece() {
  currentPiece.shape.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value === 1) {
        board[currentPiece.y + r][currentPiece.x + c] = currentPiece.color;
      }
    });
  });
  clearLines();
}
function clearLines() {
  let linesCleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((col) => col !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      r++;
    }
  }
  if (linesCleared > 0) {
    score += linesCleared * 100 * level;
    updateScore();
    updateLevel();
  }
}
function rotatePiece() {
  if (!currentPiece) return;
  const newShape = currentPiece.shape[0].map((_, colIndex) =>
    currentPiece.shape.map((row) => row[row.length - 1 - colIndex])
  );
  if (!checkCollision(currentPiece, 0, 0, newShape)) {
    currentPiece.shape = newShape;
  }
}
function updateScore() {
  scoreElement.textContent = score;
}
function updateLevel() {
  const newLevel = Math.floor(score / 500) + 1;
  if (newLevel > level) {
    level = newLevel;
    dropInterval *= 0.9;
    levelElement.textContent = level;
  }
}
function gameLoop(time = 0) {
  if (isGameOver || isPaused) {
    requestId = requestAnimationFrame(gameLoop);
    return;
  }
  if (!currentPiece) {
    currentPiece = createPiece();
    if (checkCollision(currentPiece, 0, 0, currentPiece.shape)) {
      endGame();
      return;
    }
  }
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    if (!checkCollision(currentPiece, 0, 1, currentPiece.shape)) {
      currentPiece.y++;
    } else {
      lockPiece();
      currentPiece = null;
    }
    dropCounter = 0;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawPiece();
  requestId = requestAnimationFrame(gameLoop);
}
function pauseGame() {
  isPaused = true;
  pauseButton.innerHTML = '<i class="fas fa-play"></i> Lanjutkan';
}
function resumeGame() {
  isPaused = false;
  pauseButton.innerHTML = '<i class="fas fa-pause"></i> Jeda';
  gameLoop();
}
function togglePause() {
  if (isPaused) resumeGame();
  else pauseGame();
}
function endGame() {
  isGameOver = true;
  if (requestId) cancelAnimationFrame(requestId);
  finalScoreElement.textContent = score;
  gameState = "gameOver";
  showView(gameState);
}

// --- UI ---
function showView(view) {
  gameUI.classList.add("hidden");
  gameOverUI.classList.add("hidden");
  if (view === "game") gameUI.classList.remove("hidden");
  else if (view === "gameOver") gameOverUI.classList.remove("hidden");
}
function startGame() {
  gameState = "game";
  showView(gameState);
  initBoard();
  score = 0;
  level = 1;
  dropInterval = 1000;
  updateScore();
  updateLevel();
  isGameOver = false;
  isPaused = false;
  if (requestId) cancelAnimationFrame(requestId);
  gameLoop();
}

// --- Event Listeners ---
document.addEventListener("keydown", (e) => {
  if (isGameOver) return;
  switch (gameState) {
    case "menu":
    case "gameOver":
      if (e.key === "Enter") startGame();
      break;
    case "game":
      if (isPaused) {
        if (e.key.toLowerCase() === "p") togglePause();
        return;
      }
      switch (e.key) {
        case "ArrowLeft":
          if (!checkCollision(currentPiece, -1, 0, currentPiece.shape))
            currentPiece.x--;
          break;
        case "ArrowRight":
          if (!checkCollision(currentPiece, 1, 0, currentPiece.shape))
            currentPiece.x++;
          break;
        case "ArrowDown":
          if (!checkCollision(currentPiece, 0, 1, currentPiece.shape)) {
            currentPiece.y++;
            dropCounter = 0;
          }
          break;
        case "ArrowUp":
        case "r":
        case "R":
          rotatePiece();
          break;
        case "p":
        case "P":
          togglePause();
          break;
      }
      break;
  }
});

rotateButton.addEventListener("click", rotatePiece);
startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
playAgainButton.addEventListener("click", startGame);

// Initial
showView("game");
rotateButton.classList.add("hidden");
pauseButton.classList.add("hidden");
