// ==================== НАСТРОЙКИ ЗВУКОВ ====================
const SOUNDS = {
    enabled: true,           // Включить/выключить все звуки
    volume: 0.3,             // Громкость фоновых звуков 0-1
    sfxVolume: 0.5,          // Громкость эффектов (выстрел, попадание)
    files: {
        win: "assets/sounds/win.mp3",
        lose: "assets/sounds/lose.mp3",
        penalty: "assets/sounds/penalty.mp3",
        hit: "assets/sounds/hit.mp3",
        miss: "assets/sounds/miss.mp3",
        wind: "assets/sounds/wind.mp3",
        shot: "assets/sounds/shot.mp3"
    }
};

// ==================== СЛОЖНОСТЬ ====================
// 0 = Лёгкая, 1 = Средняя, 2 = Сложная
let currentDifficulty = parseInt(localStorage.getItem("difficulty") || "1");

// ==================== ИГРОВЫЕ СОСТОЯНИЯ ====================
const GAME_STATE = {
    RACING: "racing",
    SHOOTING: "shooting",
    PENALTY: "penalty",
    GAME_OVER: "gameover",
    LOSE: "lose"
};

// ==================== DOM-ЭЛЕМЕНТЫ HUD ====================
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const lapElement = document.getElementById("lap");
const totalLapsElement = document.getElementById("totalLaps");
const statusElement = document.getElementById("status");
const gameExitBtn = document.getElementById("game-exit");

// ==================== CANVAS ====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ИГРЫ ====================
// Эти переменные будут использоваться разными модулями,
// их значения будут изменяться в процессе игры.

let gameLoopId = null;
let gameRunning = true;

let currentGameState = GAME_STATE.RACING;
let score = 0;
let currentLap = 1;

// Добавить после объявления window.totalLaps:
let totalLaps = parseInt(localStorage.getItem('totalLaps')) || 5;
let timeLimit = parseInt(localStorage.getItem('timeLimit')) || 120;
let lapInterval = parseInt(localStorage.getItem('lapInterval')) || 5;

// Экспортировать в window
window.totalLaps = totalLaps;
window.timeLimit = timeLimit;
window.lapInterval = lapInterval;

let difficultyStep = parseInt(localStorage.getItem('difficultyStep')) || 2;

// Экспорт
window.difficultyStep = difficultyStep;

let gameTime = 0;
let racingTime = 0;

// Окружение
let bgOffset = 0;
let clouds = [];
let trees = [];

// Стрельба
let currentProblem = null;
let penaltyQueue = 0;

// Статистика для оценки
let totalCorrect = 0;
let totalWrong = 0;
let penaltyCorrect = 0;
let penaltyWrong = 0;

window.totalCorrect = totalCorrect;
window.totalWrong = totalWrong;
window.penaltyCorrect = penaltyCorrect;
window.penaltyWrong = penaltyWrong;

// Экспортируем в глобальную область видимости для доступа из других модулей
window.SOUNDS = SOUNDS;
window.currentDifficulty = currentDifficulty;
window.GAME_STATE = GAME_STATE;

window.scoreElement = scoreElement;
window.timerElement = timerElement;
window.lapElement = lapElement;
window.totalLapsElement = totalLapsElement;
window.statusElement = statusElement;
window.gameExitBtn = gameExitBtn;

window.canvas = canvas;
window.ctx = ctx;

window.gameLoopId = gameLoopId;
window.gameRunning = gameRunning;
window.currentGameState = currentGameState;
window.score = score;
window.currentLap = currentLap;
window.totalLaps = totalLaps;
window.gameTime = gameTime;
window.racingTime = racingTime;

window.bgOffset = bgOffset;
window.clouds = clouds;
window.trees = trees;

window.currentProblem = currentProblem;
window.penaltyQueue = penaltyQueue;