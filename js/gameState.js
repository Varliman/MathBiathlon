// ==================== УПРАВЛЕНИЕ СОСТОЯНИЕМ ИГРЫ ====================
// Использует глобальные переменные из config.js и функции из audio.js

/**
 * Инициализация окружения: облака, деревья.
 */
function initEnvironment() {
    window.clouds = [];
    window.trees = [];
    const w = window.canvas ? window.canvas.width : 1000;
    const h = window.canvas ? window.canvas.height : 600;
    
    for (let i = 0; i < 6; i++) {
        window.clouds.push({ 
            x: Math.random() * w, 
            y: Math.random() * (h * 0.3), 
            speed: 10 + Math.random() * 20, 
            scale: 0.5 + Math.random() * 0.8 
        });
    }
    for (let i = 0; i < 12; i++) {
        window.trees.push({ 
            x: Math.random() * w * 1.5, 
            y: h * 0.5 + Math.random() * (h * 0.15), 
            scale: 0.6 + Math.random() * 0.6 
        });
    }
}

/**
 * Обновление интерфейса (HUD).
 * Проверяет время на проигрыш.
 */
function updateHUD() {
    if (window.scoreElement) window.scoreElement.textContent = window.score;
    if (window.lapElement) window.lapElement.textContent = Math.min(window.currentLap, window.totalLaps);
    if (window.totalLapsElement) window.totalLapsElement.textContent = window.totalLaps;
    
    if (window.timerElement) {
        const m = Math.floor(window.gameTime / 60);
        const s = Math.floor(window.gameTime % 60);
        window.timerElement.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        // Проигрыш при превышении 120 секунд
        if (window.gameTime >= window.timeLimit && 
            window.currentGameState !== GAME_STATE.GAME_OVER && 
            window.currentGameState !== GAME_STATE.LOSE) {
            loseGame();
        }
    }
    
    if (window.statusElement) {
        if (window.currentGameState === GAME_STATE.RACING) { 
            window.statusElement.textContent = "🏃‍♂️ БЕГ"; 
            window.statusElement.style.background = "#33ff55"; 
        }
        else if (window.currentGameState === GAME_STATE.SHOOTING) { 
            window.statusElement.textContent = "🎯 СТРЕЛЬБА"; 
            window.statusElement.style.background = "#ff4444"; 
        }
        else if (window.currentGameState === GAME_STATE.PENALTY) { 
            window.statusElement.textContent = `⚠️ ШТРАФ: осталось ${window.penaltyQueue}`; 
            window.statusElement.style.background = "#ffaa00"; 
        }
        else if (window.currentGameState === GAME_STATE.GAME_OVER) { 
            window.statusElement.textContent = "🏆 ПОБЕДА"; 
            window.statusElement.style.background = "#888"; 
        }
        else if (window.currentGameState === GAME_STATE.LOSE) { 
            window.statusElement.textContent = "💀 ПОРАЖЕНИЕ"; 
            window.statusElement.style.background = "#444"; 
        }
    }
}



function showResultModal(isWin) {
    const modal = document.getElementById('result-modal');
    const title = document.getElementById('result-title');
    const gradeEl = document.getElementById('result-grade');
    const scoreEl = document.getElementById('result-score');
    const correctEl = document.getElementById('result-correct');
    const wrongEl = document.getElementById('result-wrong');
    const accuracyEl = document.getElementById('result-accuracy');
    const timeEl = document.getElementById('result-time');

    if (!modal) return;

    const totalCorrect = window.totalCorrect + window.penaltyCorrect;
    const totalWrong = window.totalWrong + window.penaltyWrong;
    const totalAnswers = totalCorrect + totalWrong;
    const accuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

    title.textContent = isWin ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ';
    gradeEl.textContent = window.finalGrade || (isWin ? 'Отлично' : '—');
    scoreEl.textContent = window.score;
    correctEl.textContent = totalCorrect;
    wrongEl.textContent = totalWrong;
    accuracyEl.textContent = accuracy + '%';
    timeEl.textContent = window.timerElement.textContent;

    modal.classList.remove('hidden');
}

// В winGame:


// В loseGame:
window.finalGrade = calculateGrade();
showResultModal(false);



/**
 * Функция победы (пройдены все круги).
 */
function winGame() {
    if (window.currentGameState === GAME_STATE.GAME_OVER || 
        window.currentGameState === GAME_STATE.LOSE) return;
    
    window.currentGameState = GAME_STATE.GAME_OVER;
    window.gameRunning = false;
    window.playSound("win");
    window.stopWindSound();
    window.finalGrade = calculateGrade();
    showResultModal(true);
    updateHUD();
    console.log("🏆 ПОБЕДА! Оценка:", window.finalGrade);
}

/**
 * Функция проигрыша (истечение времени).
 */
function loseGame() {
    if (window.currentGameState === GAME_STATE.GAME_OVER || 
        window.currentGameState === GAME_STATE.LOSE) return;
    
    window.currentGameState = GAME_STATE.LOSE;
    window.gameRunning = false;
    window.playSound("lose");
    window.stopWindSound();
    window.finalGrade = calculateGrade();
    showResultModal(false);
    updateHUD();
    console.log("💀 ПОРАЖЕНИЕ! Оценка:", window.finalGrade);
}

/**
 * Обработка выбора ответа.
 * @param {number|string} selectedVal - выбранное значение ответа
 */
function checkAnswer(selectedVal) {
    if (window.currentGameState !== GAME_STATE.SHOOTING && 
        window.currentGameState !== GAME_STATE.PENALTY) return;

    const isPenalty = (window.currentGameState === GAME_STATE.PENALTY);
    const isCorrect = (selectedVal === window.currentProblem.answer);

    // Звук и очки
    if (isCorrect) {
        window.playSound("hit");
        window.score += isPenalty ? 2 : 10;   // 2 за штраф, 10 за обычную
        if (isPenalty) {
            window.penaltyCorrect++;
        } else {
            window.totalCorrect++;
        }
    } else {
        window.playSound("miss");
        window.score = Math.max(0, window.score - 5);
        if (isPenalty) {
            window.penaltyWrong++;
        } else {
            window.totalWrong++;
        }
    }

    // Логика перехода состояний
    if (isCorrect) {
        if (isPenalty) {
            window.penaltyQueue--;
            if (window.penaltyQueue <= 0) {
                window.currentGameState = GAME_STATE.RACING;
                window.racingTime = 0;
                window.currentProblem = null;
            } else {
                window.currentProblem = window.generateMathProblem(true);
            }
        } else {
            finishLap();
        }
    } else {
        if (!isPenalty) {
            window.playSound("penalty");
            window.currentGameState = GAME_STATE.PENALTY;
            window.penaltyQueue = 3;
            window.currentProblem = window.generateMathProblem(true);
        } else {
            window.penaltyQueue++;
            window.currentProblem = window.generateMathProblem(true);
        }
    }
    updateHUD();
}

function calculateGrade() {
    const totalAnswers = window.totalCorrect + window.totalWrong + 
                         window.penaltyCorrect + window.penaltyWrong;
    const correctAnswers = window.totalCorrect + window.penaltyCorrect;
    
    if (totalAnswers === 0) return "—";
    
    const accuracy = correctAnswers / totalAnswers;
    const difficulty = window.currentDifficulty; // 0,1,2
    const timeRatio = window.gameTime / window.timeLimit; // 0..1
    const errorPenalty = (window.totalWrong * 2 + window.penaltyWrong) / totalAnswers;
    
    let score = 0;
    
    // Базовая оценка по точности
    if (accuracy >= 0.9) score = 5;
    else if (accuracy >= 0.7) score = 4;
    else if (accuracy >= 0.5) score = 3;
    else score = 2;
    
    // Модификаторы
    if (difficulty === 2) score += 0.5;      // сложный режим
    else if (difficulty === 1) score += 0.2; // средний режим
    
    if (timeRatio < 0.5) score += 0.3;       // быстрое прохождение
    if (errorPenalty > 0.3) score -= 0.5;    // много ошибок
    
    // Округление до целого с ограничением 2..5
    let finalGrade = Math.round(score);
    if (finalGrade > 5) finalGrade = 5;
    if (finalGrade < 2) finalGrade = 2;
    
    const grades = ["", "", "Неуд.", "Удовл.", "Хорошо", "Отлично"];
    return grades[finalGrade] || finalGrade;
}

/**
 * Завершение круга (правильный ответ в основном режиме).
 */
function finishLap() {
    window.currentLap++;
    if (window.currentLap > window.totalLaps) {
        winGame();
    } else {
        window.currentGameState = GAME_STATE.RACING;
        window.racingTime = 0;
        window.currentProblem = null;
    }
    updateHUD();
}

// Экспорт функций в глобальную область
window.initEnvironment = initEnvironment;
window.updateHUD = updateHUD;
window.loseGame = loseGame;
window.winGame = winGame;
window.checkAnswer = checkAnswer;
window.finishLap = finishLap;
window.calculateGrade = calculateGrade;