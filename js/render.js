// ==================== ОТРИСОВКА ИГРЫ ====================

/**
 * Рисует одно дерево.
 * @param {CanvasRenderingContext2D} ctx - контекст рисования
 * @param {number} x - позиция X
 * @param {number} y - позиция Y
 * @param {number} scale - масштаб
 */
function drawTree(ctx, x, y, scale) {
    ctx.save(); 
    ctx.translate(x, y); 
    ctx.scale(scale, scale);
    
    // Ствол
    ctx.fillStyle = "#4a2f1d"; 
    ctx.fillRect(-5, 0, 10, 20);
    
    // Крона (три яруса)
    ctx.fillStyle = "#1e5939";
    ctx.beginPath(); 
    ctx.moveTo(0, -60); 
    ctx.lineTo(30, 0); 
    ctx.lineTo(-30, 0); 
    ctx.fill();
    
    ctx.beginPath(); 
    ctx.moveTo(0, -40); 
    ctx.lineTo(25, -5); 
    ctx.lineTo(-25, -5); 
    ctx.fill();
    
    ctx.beginPath(); 
    ctx.moveTo(0, -20); 
    ctx.lineTo(20, -10); 
    ctx.lineTo(-20, -10); 
    ctx.fill();
    
    // Снег на ветках
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath(); 
    ctx.moveTo(0, -60); 
    ctx.lineTo(15, -30); 
    ctx.lineTo(0, -35); 
    ctx.fill();
    
    ctx.restore();
}

/**
 * Основная функция отрисовки всего кадра.
 * Вызывается из игрового цикла.
 */
function drawGame() {
    if (!window.canvas || !window.ctx) return;
    const ctx = window.ctx;
    const w = window.canvas.width; 
    const h = window.canvas.height;
    
    // ===== ФОН (НЕБО, СОЛНЦЕ, ОБЛАКА) =====
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, "#4facfe"); 
    sky.addColorStop(1, "#00f2fe");
    ctx.fillStyle = sky; 
    ctx.fillRect(0, 0, w, h);
    
    // Солнце
    ctx.save(); 
    ctx.translate(120, 100); 
    ctx.rotate(window.gameTime * 0.2); 
    const sun = ctx.createRadialGradient(0, 0, 10, 0, 0, 60);
    sun.addColorStop(0, "rgba(255, 255, 200, 1)"); 
    sun.addColorStop(1, "rgba(255, 200, 50, 0)");
    ctx.fillStyle = sun; 
    ctx.beginPath(); 
    ctx.arc(0, 0, 60, 0, Math.PI * 2); 
    ctx.fill();
    ctx.fillStyle = "#FFFDE7"; 
    ctx.beginPath(); 
    ctx.arc(0, 0, 25, 0, Math.PI * 2); 
    ctx.fill(); 
    ctx.restore();

    // Облака
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    window.clouds.forEach(c => { 
        ctx.beginPath(); 
        ctx.arc(c.x, c.y, 30 * c.scale, 0, Math.PI * 2); 
        ctx.arc(c.x + 25 * c.scale, c.y - 10 * c.scale, 35 * c.scale, 0, Math.PI * 2); 
        ctx.arc(c.x + 50 * c.scale, c.y, 25 * c.scale, 0, Math.PI * 2); 
        ctx.fill(); 
    });

    // ===== ГОРЫ =====
    ctx.fillStyle = "#b0c4de"; 
    ctx.beginPath(); 
    ctx.moveTo(0, h * 0.6); 
    ctx.lineTo(w * 0.2, h * 0.3); 
    ctx.lineTo(w * 0.5, h * 0.6); 
    ctx.lineTo(w * 0.8, h * 0.2); 
    ctx.lineTo(w, h * 0.6); 
    ctx.fill();

    // ===== ДЕРЕВЬЯ (сортировка по масштабу для глубины) =====
    window.trees.sort((a, b) => a.scale - b.scale).forEach(t => { 
        drawTree(ctx, t.x, t.y, t.scale); 
    });

    // ===== СНЕЖНАЯ ПОВЕРХНОСТЬ И ЛЫЖНЯ =====
    ctx.fillStyle = "#ffffff"; 
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
    ctx.fillStyle = "rgba(200, 220, 240, 0.5)"; 
    ctx.fillRect(0, h * 0.6, w, 15);

    ctx.beginPath(); 
    ctx.strokeStyle = "#d0e0f0"; 
    ctx.lineWidth = 10; 
    ctx.setLineDash([30, 40]);
    ctx.lineDashOffset = -window.bgOffset; 
    ctx.moveTo(0, h * 0.8); 
    ctx.lineTo(w, h * 0.8); 
    ctx.stroke(); 
    ctx.setLineDash([]);

    // ===== ЛЫЖНИК =====
    const bounceY = (window.currentGameState === GAME_STATE.RACING) ? Math.sin(window.gameTime * 15) * 5 : 0;
    ctx.save(); 
    ctx.translate(w * 0.3, h * 0.75 + bounceY);
    
    // Лыжи
    ctx.fillStyle = "#333"; 
    ctx.fillRect(-35, 18, 70, 4);
    
    // Тело
    ctx.fillStyle = "#ff3366"; 
    ctx.beginPath(); 
    ctx.moveTo(-10, -30); 
    ctx.lineTo(15, -30); 
    ctx.lineTo(10, 15); 
    ctx.lineTo(-15, 15); 
    ctx.fill();
    
    // Голова
    ctx.fillStyle = "#222"; 
    ctx.beginPath(); 
    ctx.arc(5, -40, 12, 0, Math.PI * 2); 
    ctx.fill();
    
    // Палки (только в режиме бега)
    if (window.currentGameState === GAME_STATE.RACING) {
        const pole = Math.sin(window.gameTime * 15) * 0.5;
        ctx.strokeStyle = "#555"; 
        ctx.lineWidth = 3; 
        ctx.beginPath(); 
        ctx.moveTo(0, -15); 
        ctx.lineTo(Math.cos(pole) * 30, Math.sin(pole) * 30 + 10); 
        ctx.stroke();
    }
    ctx.restore();

    // ===== РЕЖИМ СТРЕЛЬБЫ / ШТРАФА =====
    if ((window.currentGameState === GAME_STATE.SHOOTING || window.currentGameState === GAME_STATE.PENALTY) && window.currentProblem) {
        // Затемнение фона
        ctx.fillStyle = window.currentGameState === GAME_STATE.PENALTY ? "rgba(100,0,0,0.7)" : "rgba(0,0,0,0.7)"; 
        ctx.fillRect(0, 0, w, h);
        
        // Текст задачи
        ctx.fillStyle = "#fff";
        ctx.font = "bold 52px 'Oswald'";
        ctx.textAlign = "center";
        ctx.shadowColor = window.currentGameState === GAME_STATE.PENALTY ? "#ff0000" : "#00f2fe";
        ctx.shadowBlur = 20;
        const formattedText = window.formatMathExpression(window.currentProblem.text);
        ctx.fillText(formattedText, w / 2, h * 0.35);
        ctx.shadowBlur = 0;
        
        // Подпись типа задачи (производная/интеграл)
        if (window.currentProblem.type === 'derivative') {
            ctx.font = "20px 'Oswald'";
            ctx.fillStyle = "#aaa";
            ctx.fillText("Найдите производную:", w / 2, h * 0.25);
        } else if (window.currentProblem.type === 'integral') {
            ctx.font = "20px 'Oswald'";
            ctx.fillStyle = "#aaa";
            ctx.fillText("Найдите интеграл:", w / 2, h * 0.25);
        }
        
        // Мишени с ответами
        window.currentProblem.targets.forEach((target, i) => {
            const outerRadius = 50;
            const innerRadius = 42;
            const centerRadius = 25;
            
            // Внешний круг
            ctx.beginPath(); 
            ctx.arc(target.x, target.y, outerRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#fff"; 
            ctx.fill();
            
            // Внутренний круг
            ctx.beginPath(); 
            ctx.arc(target.x, target.y, innerRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#222"; 
            ctx.fill();

            // Центральная обводка
            ctx.beginPath(); 
            ctx.arc(target.x, target.y, centerRadius, 0, Math.PI * 2);
            ctx.strokeStyle = "#aaa"; 
            ctx.lineWidth = 2; 
            ctx.stroke();
            
            // Текст ответа
            ctx.fillStyle = "#fff"; 
            ctx.font = "bold 26px 'Oswald'";
            // Вместо: ctx.fillText(target.val, target.x, target.y + 12);
            const formattedVal = window.formatMathExpression(String(target.val));
            ctx.fillText(formattedVal, target.x, target.y + 12);
            
            // Номер варианта (клавиша 1-4)
            ctx.fillStyle = "#ff3366"; 
            ctx.fillRect(target.x - 16, target.y - 75, 32, 32);
            ctx.fillStyle = "#fff"; 
            ctx.font = "bold 20px 'Oswald'"; 
            ctx.fillText(i + 1, target.x, target.y - 55);
        });
        
        // Счетчик штрафных задач
        if (window.currentGameState === GAME_STATE.PENALTY) {
            ctx.font = "24px 'Oswald'";
            ctx.fillStyle = "#ffaa00";
            ctx.fillText(`Осталось штрафных: ${window.penaltyQueue}`, w / 2, h * 0.85);
        }

        // Шпаргалка для сложного режима
        if (window.currentDifficulty === 2) {
            ctx.save();
            ctx.font = "14px 'Oswald'";
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.textAlign = "right";
            
            let hintY = h * 0.15;
            const hints = [
                "(xⁿ)′ = n·xⁿ⁻¹",
                "∫xⁿ dx = xⁿ⁺¹/(n+1) + C",
                "(sin x)′ = cos x",
                "(cos x)′ = -sin x"
            ];
            
            hints.forEach(hint => {
                ctx.fillText(hint, w - 20, hintY);
                hintY += 20;
            });
            ctx.restore();
        }
    }

    // ===== ЭКРАН ПОБЕДЫ =====
    if (window.currentGameState === GAME_STATE.GAME_OVER) {
    ctx.fillStyle = "rgba(0,0,0,0.8)"; 
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffd700"; 
    ctx.font = "bold 80px 'Oswald'"; 
    ctx.textAlign = "center";
    ctx.fillText("ПОБЕДА!", w / 2, h * 0.3);
    ctx.fillStyle = "#fff"; 
    ctx.font = "30px 'Oswald'";
    ctx.fillText(`Счёт: ${window.score} | Время: ${window.timerElement.textContent}`, w / 2, h * 0.45);
    ctx.font = "36px 'Oswald'";
    ctx.fillStyle = "#ffd700";
    ctx.fillText(`Оценка: ${window.finalGrade || '—'}`, w / 2, h * 0.6);
    ctx.font = "24px 'Oswald'";
    ctx.fillStyle = "#aaa";
    ctx.fillText("Нажмите R для перезапуска", w / 2, h * 0.75);
    }
    
    // ===== ЭКРАН ПОРАЖЕНИЯ =====
    if (window.currentGameState === GAME_STATE.LOSE) {
    ctx.fillStyle = "rgba(0,0,0,0.85)"; 
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ff4444"; 
    ctx.font = "bold 80px 'Oswald'"; 
    ctx.textAlign = "center";
    ctx.fillText("ПОРАЖЕНИЕ", w / 2, h * 0.3);
    ctx.fillStyle = "#fff"; 
    ctx.font = "30px 'Oswald'";
    ctx.fillText(`Время вышло! Счёт: ${window.score}`, w / 2, h * 0.45);
    ctx.font = "36px 'Oswald'";
    ctx.fillStyle = "#ffd700";
    ctx.fillText(`Оценка: ${window.finalGrade || '—'}`, w / 2, h * 0.6);
    ctx.font = "24px 'Oswald'";
    ctx.fillStyle = "#aaa";
    ctx.fillText("Нажмите R для перезапуска", w / 2, h * 0.75);
    }
}

// Экспорт в глобальную область
window.drawTree = drawTree;
window.drawGame = drawGame;