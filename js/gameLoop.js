// ==================== ИГРОВОЙ ЦИКЛ ====================
// Использует функции обновления состояния и отрисовки (будет в render.js)

let lastTimestamp = 0;

/**
 * Основной игровой цикл, вызывается через requestAnimationFrame.
 * @param {number} timestamp - время кадра
 */
function gameLoop(timestamp) {
    if (!window.gameRunning) return;
    
    let delta = Math.min(0.033, (timestamp - lastTimestamp) / 1000);
    if (lastTimestamp === 0) delta = 0.016;
    lastTimestamp = timestamp;
    
    updateGame(delta);
    
    // Функция drawGame будет определена в render.js
    if (typeof window.drawGame === 'function') {
        window.drawGame();
    }
    
    window.gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * Обновление игровой логики: таймеры, движение объектов, смена состояний.
 * @param {number} delta - время в секундах с прошлого кадра
 */
function updateGame(delta) {
    if (window.currentGameState === GAME_STATE.GAME_OVER || 
        window.currentGameState === GAME_STATE.LOSE) return;
    
    const w = window.canvas ? window.canvas.width : 1000;

    window.gameTime += delta;
    window.updateHUD(); // проверяет время и может вызвать loseGame

    if (window.currentGameState === GAME_STATE.RACING) {
        window.racingTime += delta; 
        
        // Движение фона (снег / лыжня)
        window.bgOffset -= 400 * delta; 
        if (window.bgOffset <= -100) window.bgOffset += 100;

        // Движение облаков
        window.clouds.forEach(c => { 
            c.x -= c.speed * delta; 
            if (c.x < -150) { 
                c.x = w + 100; 
                c.y = Math.random() * ((window.canvas ? window.canvas.height : 600) * 0.3); 
            } 
        });
        
        // Движение деревьев
        window.trees.forEach(t => { 
            t.x -= 300 * delta * t.scale; 
            if (t.x < -100) { 
                t.x = w + Math.random() * 200; 
                t.y = (window.canvas ? window.canvas.height : 600) * 0.5 + 
                      Math.random() * ((window.canvas ? window.canvas.height : 600) * 0.15); 
            } 
        });

        if (window.racingTime >= window.lapInterval) {
            window.currentGameState = GAME_STATE.SHOOTING;
            // generateMathProblem определена в problems.js
            window.currentProblem = window.generateMathProblem(false);
            window.racingTime = 0;
        }
    }
    
    window.updateHUD();
}

// Экспорт функций в глобальную область
window.gameLoop = gameLoop;
window.updateGame = updateGame;