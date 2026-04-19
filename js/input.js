// ==================== ОБРАБОТКА ВВОДА ====================
// Мышь, касания, клавиатура

/**
 * Настройка всех обработчиков событий.
 * Вызывается один раз при инициализации.
 */
function setupInput() {
    if (!window.canvas) {
        console.warn("Canvas не найден, обработчики ввода не установлены");
        return;
    }

    // Обработка клика мыши по canvas
    window.canvas.addEventListener('mousedown', (e) => {
        if (window.currentGameState !== GAME_STATE.SHOOTING && 
            window.currentGameState !== GAME_STATE.PENALTY) return;
        if (window.currentGameState === GAME_STATE.GAME_OVER || 
            window.currentGameState === GAME_STATE.LOSE) return;
        if (!window.currentProblem) return;
        
        // Инициализация звука при первом взаимодействии
        if (typeof window.initAudio === 'function' && window.SOUNDS && window.SOUNDS.enabled) {
            // initAudio вызывается асинхронно, но нам не нужно ждать
            window.initAudio();
        }
        
        const rect = window.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (window.canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (window.canvas.height / rect.height);

        window.currentProblem.targets.forEach((target) => {
            const halfSize = 55;
            const left = target.x - halfSize;
            const right = target.x + halfSize;
            const top = target.y - halfSize;
            const bottom = target.y + halfSize;
            
            if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom) {
                if (typeof window.playSound === 'function') {
                    window.playSound("shot");
                }
                if (typeof window.checkAnswer === 'function') {
                    window.checkAnswer(target.val);
                }
            }
        });
    });

    // Обработка касания (мобильные устройства)
    window.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // предотвращаем зум и скролл
        if (window.currentGameState !== GAME_STATE.SHOOTING && 
            window.currentGameState !== GAME_STATE.PENALTY) return;
        if (window.currentGameState === GAME_STATE.GAME_OVER || 
            window.currentGameState === GAME_STATE.LOSE) return;
        if (!window.currentProblem) return;
        
        if (typeof window.initAudio === 'function' && window.SOUNDS && window.SOUNDS.enabled) {
            window.initAudio();
        }
        
        const rect = window.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = (touch.clientX - rect.left) * (window.canvas.width / rect.width);
        const touchY = (touch.clientY - rect.top) * (window.canvas.height / rect.height);

        window.currentProblem.targets.forEach((target) => {
            const halfSize = 60; // чуть больше для удобства пальца
            const left = target.x - halfSize;
            const right = target.x + halfSize;
            const top = target.y - halfSize;
            const bottom = target.y + halfSize;
            
            if (touchX >= left && touchX <= right && touchY >= top && touchY <= bottom) {
                if (typeof window.playSound === 'function') {
                    window.playSound("shot");
                }
                if (typeof window.checkAnswer === 'function') {
                    window.checkAnswer(target.val);
                }
            }
        });
    }, { passive: false });

    // Обработка клавиатуры
    window.addEventListener('keydown', (e) => {
        // Инициализация звука по любой клавише (если ещё нет)
        if (typeof window.initAudio === 'function' && window.SOUNDS && window.SOUNDS.enabled) {
            window.initAudio();
        }
       
        // Клавиши 1-4 для выбора ответа
        if (window.currentGameState === GAME_STATE.SHOOTING || 
            window.currentGameState === GAME_STATE.PENALTY) {
            if (!window.currentProblem) return;
            
            const keyNum = parseInt(e.key);
            if (keyNum >= 1 && keyNum <= 4 && keyNum <= window.currentProblem.targets.length) {
                if (typeof window.playSound === 'function') {
                    window.playSound("shot");
                }
                if (typeof window.checkAnswer === 'function') {
                    window.checkAnswer(window.currentProblem.targets[keyNum - 1].val);
                }
                e.preventDefault();
            }
        }
        
        // Клавиша R для перезапуска (доступна всегда)
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            if (typeof window.restartGame === 'function') {
                window.restartGame();
            }
        }
        
        // Клавиша Escape для выхода (можно добавить при желании)
        if (e.key === 'Escape') {
            e.preventDefault();
            if (typeof window.exitGame === 'function') {
                window.exitGame();
            }
        }
    });
}

// Экспорт в глобальную область
window.setupInput = setupInput;