// ==================== ТОЧКА ВХОДА И УПРАВЛЕНИЕ ЖИЗНЕННЫМ ЦИКЛОМ ====================

/**
 * Перезапуск игры.
 * Сбрасывает состояние и начинает заново.
 */
function restartGame() {
    console.log("🔄 ПЕРЕЗАПУСК ИГРЫ");
    
    // Остановка звуков
    if (typeof window.stopWindSound === 'function') {
        window.stopWindSound();
    }
    window.windStarted = false;
    
    // Если уже был запущен цикл, отменяем
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
        window.gameLoopId = null;
    }
    
    initGame();
}

/**
 * Инициализация новой игры.
 * Устанавливает начальные значения и запускает игровой цикл.
 */
function initGame() {
    console.log("=== ИГРА ЗАПУЩЕНА ===");
    console.log(`Сложность: ${window.currentDifficulty === 0 ? "ЛЁГКАЯ" : window.currentDifficulty === 1 ? "СРЕДНЯЯ" : "СЛОЖНАЯ"}`);
    const modal = document.getElementById('result-modal');
    if (modal) modal.classList.add('hidden');

    // Сброс переменных
    window.totalCorrect = 0;
    window.totalWrong = 0;
    window.penaltyCorrect = 0;
    window.penaltyWrong = 0;
    window.score = 0; 
    window.currentLap = 1; 
    window.gameTime = 0; 
    window.racingTime = 0; 
    window.bgOffset = 0;
    window.penaltyQueue = 0;
    window.currentProblem = null;
    window.currentGameState = GAME_STATE.RACING; 
    window.gameRunning = true;
    
    // Настройка canvas
    if (window.canvas) { 
        window.canvas.width = 1000; 
        window.canvas.height = 600; 
    }
    
    // Инициализация окружения
    if (typeof window.initEnvironment === 'function') {
        window.initEnvironment();
    }
    
    // Обновление HUD
    if (typeof window.updateHUD === 'function') {
        window.updateHUD();
    }
    
    // Запуск звуков с небольшой задержкой
    if (window.SOUNDS && window.SOUNDS.enabled) {
        setTimeout(() => {
            if (typeof window.initAudio === 'function') {
                window.initAudio();
            }
        }, 100);
    }
    
    // Запуск игрового цикла
    if (typeof window.gameLoop === 'function') {
        window.gameLoopId = requestAnimationFrame(window.gameLoop);
    } else {
        console.error("gameLoop не найден!");
    }
}

/**
 * Выход из игры (закрытие окна).
 */
function exitGame() {
    console.log("🚪 Выход из игры");
    
    // Остановка всех звуков
    if (typeof window.stopAllSounds === 'function') {
        window.stopAllSounds();
    }
    
    // Попытка закрыть окно (может быть заблокировано браузером)
    window.close();
}

/**
 * Инициализация при загрузке страницы.
 */
function onDOMReady() {
    console.log("DOM загружен, настройка игры...");
    
    // Убедимся, что canvas доступен
    if (!window.canvas) {
        console.error("Canvas не найден!");
        return;
    }
    
    // Настройка обработчиков ввода
    if (typeof window.setupInput === 'function') {
        window.setupInput();
    }
    
    // Привязка кнопки выхода (если есть)
    if (window.gameExitBtn) {
        window.gameExitBtn.addEventListener("click", exitGame);
    }

    const resultModal = document.getElementById('result-modal');
    const resultRestart = document.getElementById('result-restart');
    const resultMenu = document.getElementById('result-menu');

    if (resultRestart) {
        resultRestart.addEventListener('click', () => {
            resultModal.classList.add('hidden');
            restartGame();  // функция мягкого перезапуска (уже существует)
        });
    }

    if (resultMenu) {
        resultMenu.addEventListener('click', () => {
            // Закрываем текущее окно игры и возвращаемся в главное меню
            window.location.href = '../index.html';  
            // Альтернатива: window.close();
        });
    }
    
    // Запуск игры
    initGame();
}

// Экспорт функций в глобальную область
window.restartGame = restartGame;
window.initGame = initGame;
window.exitGame = exitGame;

// Ждём загрузки DOM и запускаем
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
} else {
    onDOMReady();
}

