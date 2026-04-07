// === НАСТРОЙКИ ЗВУКОВ ===
const SOUNDS = {
    enabled: true,           // Включить/выключить все звуки
    volume: 0.3,             // Громкость фоновых звуков 0-1
    sfxVolume: 0.5,          // Громкость эффектов (выстрел, попадание)
    files: {
        win: "assets/sounds/win.mp3",
        lose: "assets/sounds/lose.mp3",  // Добавим звук проигрыша
        penalty: "assets/sounds/penalty.mp3",
        hit: "assets/sounds/hit.mp3",
        miss: "assets/sounds/miss.mp3",
        wind: "assets/sounds/wind.mp3",
        shot: "assets/sounds/shot.mp3"
    }
};

// === СЛОЖНОСТЬ (0=Лёгкая, 1=Средняя, 2=Сложная) ===
let currentDifficulty = parseInt(localStorage.getItem("difficulty") || "1");

// === ЗВУКОВАЯ СИСТЕМА ===
let audioContext = null;
let soundBuffers = {};
let windSource = null;
let isAudioInitialized = false;
let windStarted = false;

// Инициализация звуков
async function initAudio() {
    if (isAudioInitialized) return;
    if (!SOUNDS.enabled) return;
    
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        for (const [name, url] of Object.entries(SOUNDS.files)) {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const decoded = await audioContext.decodeAudioData(arrayBuffer);
                soundBuffers[name] = decoded;
                console.log(`✅ Звук загружен: ${name}`);
            } catch(e) {
                console.log(`❌ Не удалось загрузить звук ${name}:`, e);
            }
        }
        
        isAudioInitialized = true;
        
        // Запускаем ветер через 2 секунды после инициализации
        setTimeout(() => {
            if (!windStarted && currentGameState !== GAME_STATE.GAME_OVER) {
                startWindSound();
                windStarted = true;
            }
        }, 2000);
        
    } catch(e) {
        console.log("Web Audio API не поддерживается:", e);
    }
}

// Воспроизведение короткого звука
function playSound(soundName) {
    if (!SOUNDS.enabled) return;
    if (!audioContext || !soundBuffers[soundName]) return;
    if (soundName === 'wind') return;
    
    try {
        const source = audioContext.createBufferSource();
        source.buffer = soundBuffers[soundName];
        const gainNode = audioContext.createGain();
        gainNode.gain.value = SOUNDS.sfxVolume;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start();
    } catch(e) {
        console.log("Ошибка воспроизведения звука:", soundName);
    }
}

// Запуск фонового ветра
function startWindSound() {
    if (!SOUNDS.enabled) return;
    if (!audioContext || !soundBuffers.wind) {
        console.log("Звук ветра не загружен");
        return;
    }
    
    if (windSource) {
        try { windSource.stop(); } catch(e) {}
        windSource = null;
    }
    
    function playWindLoop() {
        if (!audioContext || !soundBuffers.wind) return;
        if (currentGameState === GAME_STATE.GAME_OVER) return;
        if (!gameRunning) return;
        
        const source = audioContext.createBufferSource();
        source.buffer = soundBuffers.wind;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = SOUNDS.volume;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.onended = () => {
            if (gameRunning && currentGameState !== GAME_STATE.GAME_OVER) {
                playWindLoop();
            }
        };
        
        source.start();
        windSource = source;
    }
    
    playWindLoop();
    console.log("🌬️ Фоновый ветер запущен");
}

function stopWindSound() {
    if (windSource) {
        try { windSource.stop(); } catch(e) {}
        windSource = null;
    }
    windStarted = false;
}

function stopAllSounds() {
    stopWindSound();
    if (audioContext) {
        audioContext.close();
        audioContext = null;
        isAudioInitialized = false;
        windStarted = false;
    }
}

// === ИГРОВЫЕ ПЕРЕМЕННЫЕ ===
let gameLoopId = null;
let gameRunning = true;
let canvas = null;
let ctx = null;

const GAME_STATE = {
    RACING: "racing",
    SHOOTING: "shooting",
    PENALTY: "penalty",
    GAME_OVER: "gameover",
    LOSE: "lose"  // Добавили состояние проигрыша
};

let currentGameState = GAME_STATE.RACING;
let score = 0;
let currentLap = 1;
let totalLaps = 5;
let gameTime = 0;
let racingTime = 0;

// Переменные для окружения
let bgOffset = 0;
let clouds = [];
let trees = [];

// Логика стрельбы
let currentProblem = null;
let penaltyQueue = 0;

// === ГЕНЕРАТОР ЗАДАЧ ===
function generateMathProblem(isPenalty = false) {
    const w = canvas ? canvas.width : 1000;
    const h = canvas ? canvas.height : 600;
    
    if (isPenalty) {
        const op = ['+', '-'][Math.floor(Math.random() * 2)];
        let a, b, answer;
        
        if (op === '+') {
            a = Math.floor(Math.random() * 20) + 1;
            b = Math.floor(Math.random() * 20) + 1;
            answer = a + b;
        } else {
            a = Math.floor(Math.random() * 20) + 10;
            b = Math.floor(Math.random() * a);
            answer = a - b;
        }
        
        const options = [answer];
        while (options.length < 4) {
            let fake = answer + (Math.floor(Math.random() * 10) - 5);
            if (fake !== answer && fake > 0 && !options.includes(fake)) {
                options.push(fake);
            }
        }
        options.sort(() => Math.random() - 0.5);
        
        const startX = w * 0.2;
        const step = w * 0.18;
        const targets = options.map((opt, index) => ({
            val: opt,
            x: startX + index * step,
            y: h * 0.65,
            radius: 55
        }));
        
        return { text: `${a} ${op} ${b} = ?`, answer: answer, targets: targets };
    }
    
    // ОСНОВНЫЕ ЗАДАЧИ
    let op, a, b, answer;
    
    if (currentDifficulty === 0) {
        op = ['+', '-'][Math.floor(Math.random() * 2)];
        if (op === '+') {
            a = Math.floor(Math.random() * 20) + 1;
            b = Math.floor(Math.random() * 20) + 1;
            answer = a + b;
        } else {
            a = Math.floor(Math.random() * 20) + 10;
            b = Math.floor(Math.random() * a);
            answer = a - b;
        }
    } 
    else if (currentDifficulty === 1) {
        const ops = ['+', '-', '*'];
        op = ops[Math.floor(Math.random() * ops.length)];
        
        if (op === '+') {
            a = Math.floor(Math.random() * 30) + 1;
            b = Math.floor(Math.random() * 30) + 1;
            answer = a + b;
        } else if (op === '-') {
            a = Math.floor(Math.random() * 30) + 15;
            b = Math.floor(Math.random() * a);
            answer = a - b;
        } else {
            a = Math.floor(Math.random() * 12) + 2;
            b = Math.floor(Math.random() * 12) + 2;
            answer = a * b;
        }
    } 
    else {
        const ops = ['+', '-', '*'];
        op = ops[Math.floor(Math.random() * ops.length)];
        
        if (op === '+') {
            a = Math.floor(Math.random() * 50) + 10;
            b = Math.floor(Math.random() * 50) + 10;
            answer = a + b;
        } else if (op === '-') {
            a = Math.floor(Math.random() * 50) + 30;
            b = Math.floor(Math.random() * a);
            answer = a - b;
        } else {
            a = Math.floor(Math.random() * 15) + 3;
            b = Math.floor(Math.random() * 15) + 3;
            answer = a * b;
        }
    }
    
    let options = [answer];
    while (options.length < 4) {
        let fake;
        if (currentDifficulty === 0) {
            fake = answer + (Math.floor(Math.random() * 6) - 3);
        } else {
            fake = answer + (Math.floor(Math.random() * 12) - 6);
        }
        if (fake !== answer && fake > 0 && !options.includes(fake)) {
            options.push(fake);
        }
    }
    options.sort(() => Math.random() - 0.5);
    
    const startX = w * 0.2;
    const step = w * 0.18;
    const targets = options.map((opt, index) => ({
        val: opt,
        x: startX + index * step,
        y: h * 0.65,
        radius: 55
    }));
    
    return { text: `${a} ${op} ${b} = ?`, answer: answer, targets: targets };
}

// === ЭЛЕМЕНТЫ HUD ===
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const lapElement = document.getElementById("lap");
const totalLapsElement = document.getElementById("totalLaps");
const statusElement = document.getElementById("status");
const gameExitBtn = document.getElementById("game-exit");
canvas = document.getElementById("gameCanvas");
if (canvas) ctx = canvas.getContext("2d");

// === ИНИЦИАЛИЗАЦИЯ ===
function initEnvironment() {
    clouds = []; trees = [];
    const w = canvas ? canvas.width : 1000;
    const h = canvas ? canvas.height : 600;
    for (let i = 0; i < 6; i++) {
        clouds.push({ x: Math.random() * w, y: Math.random() * (h * 0.3), speed: 10 + Math.random() * 20, scale: 0.5 + Math.random() * 0.8 });
    }
    for (let i = 0; i < 12; i++) {
        trees.push({ x: Math.random() * w * 1.5, y: h * 0.5 + Math.random() * (h * 0.15), scale: 0.6 + Math.random() * 0.6 });
    }
}

function updateHUD() {
    if (scoreElement) scoreElement.textContent = score;
    if (lapElement) lapElement.textContent = Math.min(currentLap, totalLaps);
    if (totalLapsElement) totalLapsElement.textContent = totalLaps;
    if (timerElement) {
        const m = Math.floor(gameTime / 60);
        const s = Math.floor(gameTime % 60);
        timerElement.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        // Если время превысило 120 секунд (2 минуты) — проигрыш
        if (gameTime >= 120 && currentGameState !== GAME_STATE.GAME_OVER && currentGameState !== GAME_STATE.LOSE) {
            loseGame();
        }
    }
    if (statusElement) {
        if (currentGameState === GAME_STATE.RACING) { 
            statusElement.textContent = "🏃‍♂️ БЕГ"; 
            statusElement.style.background = "#33ff55"; 
        }
        else if (currentGameState === GAME_STATE.SHOOTING) { 
            statusElement.textContent = "🎯 СТРЕЛЬБА"; 
            statusElement.style.background = "#ff4444"; 
        }
        else if (currentGameState === GAME_STATE.PENALTY) { 
            statusElement.textContent = `⚠️ ШТРАФ: осталось ${penaltyQueue}`; 
            statusElement.style.background = "#ffaa00"; 
        }
        else if (currentGameState === GAME_STATE.GAME_OVER) { 
            statusElement.textContent = "🏆 ПОБЕДА"; 
            statusElement.style.background = "#888"; 
        }
        else if (currentGameState === GAME_STATE.LOSE) { 
            statusElement.textContent = "💀 ПОРАЖЕНИЕ"; 
            statusElement.style.background = "#444"; 
        }
    }
}

// === ПРОИГРЫШ ===
function loseGame() {
    if (currentGameState === GAME_STATE.GAME_OVER || currentGameState === GAME_STATE.LOSE) return;
    currentGameState = GAME_STATE.LOSE;
    gameRunning = false;
    playSound("lose");
    stopWindSound();
    updateHUD();
    console.log("💀 ВРЕМЯ ВЫШЛО! ПРОИГРЫШ!");
}

// === ПОБЕДА ===
function winGame() {
    if (currentGameState === GAME_STATE.GAME_OVER || currentGameState === GAME_STATE.LOSE) return;
    currentGameState = GAME_STATE.GAME_OVER;
    gameRunning = false;
    playSound("win");
    stopWindSound();
    updateHUD();
    console.log("🏆 ПОБЕДА!");
}

// === ОБРАБОТКА ОТВЕТОВ ===
function checkAnswer(selectedVal) {
    if (currentGameState !== GAME_STATE.SHOOTING && currentGameState !== GAME_STATE.PENALTY) return;

    if (selectedVal === currentProblem.answer) {
        playSound("hit");
        score += 10;
        
        if (currentGameState === GAME_STATE.PENALTY) {
            penaltyQueue--;
            if (penaltyQueue <= 0) {
                currentGameState = GAME_STATE.RACING;
                racingTime = 0;
                currentProblem = null;
            } else {
                currentProblem = generateMathProblem(true);
            }
        } else {
            finishLap();
        }
    } else {
        playSound("miss");
        score = Math.max(0, score - 5);
        
        if (currentGameState === GAME_STATE.SHOOTING) {
            playSound("penalty");
            currentGameState = GAME_STATE.PENALTY;
            penaltyQueue = 3;
            currentProblem = generateMathProblem(true);
        } else if (currentGameState === GAME_STATE.PENALTY) {
            penaltyQueue++;
            currentProblem = generateMathProblem(true);
        }
    }
    updateHUD();
}

function finishLap() {
    currentLap++;
    if (currentLap > totalLaps) {
        winGame();
    } else {
        currentGameState = GAME_STATE.RACING;
        racingTime = 0;
        currentProblem = null;
    }
    updateHUD();
}

// === УПРАВЛЕНИЕ ===
if (canvas) {
    canvas.addEventListener('mousedown', (e) => {
        if ((currentGameState !== GAME_STATE.SHOOTING && currentGameState !== GAME_STATE.PENALTY) || 
            currentGameState === GAME_STATE.GAME_OVER || currentGameState === GAME_STATE.LOSE) return;
        if (!currentProblem) return;
        
        if (!isAudioInitialized && SOUNDS.enabled) {
            initAudio();
        }
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

        currentProblem.targets.forEach((target, index) => {
            const halfSize = 55;
            const left = target.x - halfSize;
            const right = target.x + halfSize;
            const top = target.y - halfSize;
            const bottom = target.y + halfSize;
            
            if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom) {
                playSound("shot");
                checkAnswer(target.val);
            }
        });
    });
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if ((currentGameState !== GAME_STATE.SHOOTING && currentGameState !== GAME_STATE.PENALTY) ||
            currentGameState === GAME_STATE.GAME_OVER || currentGameState === GAME_STATE.LOSE) return;
        if (!currentProblem) return;
        
        if (!isAudioInitialized && SOUNDS.enabled) {
            initAudio();
        }
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const touchY = (touch.clientY - rect.top) * (canvas.height / rect.height);

        currentProblem.targets.forEach((target, index) => {
            const halfSize = 60;
            const left = target.x - halfSize;
            const right = target.x + halfSize;
            const top = target.y - halfSize;
            const bottom = target.y + halfSize;
            
            if (touchX >= left && touchX <= right && touchY >= top && touchY <= bottom) {
                playSound("shot");
                checkAnswer(target.val);
            }
        });
    });
}

window.addEventListener('keydown', (e) => {
    if (!isAudioInitialized && SOUNDS.enabled) {
        initAudio();
    }
   
    if ((currentGameState !== GAME_STATE.SHOOTING && currentGameState !== GAME_STATE.PENALTY) ||
        currentGameState === GAME_STATE.GAME_OVER || currentGameState === GAME_STATE.LOSE) return;
    if (!currentProblem) return;
    
    const keyNum = parseInt(e.key);
    if (keyNum >= 1 && keyNum <= 4 && keyNum <= currentProblem.targets.length) {
        playSound("shot");
        checkAnswer(currentProblem.targets[keyNum - 1].val);
    }
    
    // Клавиша R для перезапуска
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        restartGame();
    }
});

// === ПЕРЕЗАПУСК ИГРЫ ===
function restartGame() {
    console.log("🔄 ПЕРЕЗАПУСК ИГРЫ");
    stopWindSound();
    windStarted = false;
    initGame();
}

function initGame() {
    console.log("=== ИГРА ЗАПУЩЕНА ===");
    console.log(`Сложность: ${currentDifficulty === 0 ? "ЛЁГКАЯ" : currentDifficulty === 1 ? "СРЕДНЯЯ" : "СЛОЖНАЯ"}`);
    
    score = 0; 
    currentLap = 1; 
    gameTime = 0; 
    racingTime = 0; 
    bgOffset = 0;
    penaltyQueue = 0;
    currentProblem = null;
    currentGameState = GAME_STATE.RACING; 
    gameRunning = true;
    
    if (canvas) { 
        canvas.width = 1000; 
        canvas.height = 600; 
    }
    
    initEnvironment(); 
    updateHUD();
    
    // Запускаем звуки через 2 секунды
    if (SOUNDS.enabled && !isAudioInitialized) {
        setTimeout(() => {
            if (!isAudioInitialized) {
                initAudio();
            }
        }, 100);
    }
    
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(gameLoop);
}

function exitGame() {
    stopAllSounds();
    window.close();
}

if (gameExitBtn) gameExitBtn.addEventListener("click", exitGame);

// === ИГРОВОЙ ЦИКЛ ===
let lastTimestamp = 0;

function gameLoop(timestamp) {
    if (!gameRunning) return;
    let delta = Math.min(0.033, (timestamp - lastTimestamp) / 1000);
    if (lastTimestamp === 0) delta = 0.016;
    lastTimestamp = timestamp;
    
    updateGame(delta);
    drawGame();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function updateGame(delta) {
    if (currentGameState === GAME_STATE.GAME_OVER || currentGameState === GAME_STATE.LOSE) return;
    const w = canvas ? canvas.width : 1000;

    gameTime += delta;
    updateHUD(); // Проверяет время и вызывает проигрыш

    if (currentGameState === GAME_STATE.RACING) {
        racingTime += delta; 
        
        bgOffset -= 400 * delta; 
        if (bgOffset <= -100) bgOffset += 100;

        clouds.forEach(c => { c.x -= c.speed * delta; if (c.x < -150) { c.x = w + 100; c.y = Math.random() * ((canvas ? canvas.height : 600) * 0.3); } });
        trees.forEach(t => { t.x -= 300 * delta * t.scale; if (t.x < -100) { t.x = w + Math.random() * 200; t.y = (canvas ? canvas.height : 600) * 0.5 + Math.random() * ((canvas ? canvas.height : 600) * 0.15); } });

        if (racingTime >= 5) {
            currentGameState = GAME_STATE.SHOOTING;
            currentProblem = generateMathProblem(false);
            racingTime = 0;
        }
    }
    updateHUD();
}

// === ОТРИСОВКА ===
function drawTree(ctx, x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#4a2f1d"; ctx.fillRect(-5, 0, 10, 20);
    ctx.fillStyle = "#1e5939";
    ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(30, 0); ctx.lineTo(-30, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(25, -5); ctx.lineTo(-25, -5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(20, -10); ctx.lineTo(-20, -10); ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(15, -30); ctx.lineTo(0, -35); ctx.fill();
    ctx.restore();
}

function drawGame() {
    if (!canvas || !ctx) return;
    const w = canvas.width; const h = canvas.height;
    
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, "#4facfe"); sky.addColorStop(1, "#00f2fe");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    
    ctx.save(); ctx.translate(120, 100); ctx.rotate(gameTime * 0.2); 
    const sun = ctx.createRadialGradient(0, 0, 10, 0, 0, 60);
    sun.addColorStop(0, "rgba(255, 255, 200, 1)"); sun.addColorStop(1, "rgba(255, 200, 50, 0)");
    ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFFDE7"; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    clouds.forEach(c => { ctx.beginPath(); ctx.arc(c.x, c.y, 30*c.scale, 0, Math.PI*2); ctx.arc(c.x+25*c.scale, c.y-10*c.scale, 35*c.scale, 0, Math.PI*2); ctx.arc(c.x+50*c.scale, c.y, 25*c.scale, 0, Math.PI*2); ctx.fill(); });

    ctx.fillStyle = "#b0c4de"; ctx.beginPath(); ctx.moveTo(0, h*0.6); ctx.lineTo(w*0.2, h*0.3); ctx.lineTo(w*0.5, h*0.6); ctx.lineTo(w*0.8, h*0.2); ctx.lineTo(w, h*0.6); ctx.fill();

    trees.sort((a, b) => a.scale - b.scale).forEach(t => { drawTree(ctx, t.x, t.y, t.scale); });

    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, h * 0.6, w, h * 0.4);
    ctx.fillStyle = "rgba(200, 220, 240, 0.5)"; ctx.fillRect(0, h * 0.6, w, 15);

    ctx.beginPath(); ctx.strokeStyle = "#d0e0f0"; ctx.lineWidth = 10; ctx.setLineDash([30, 40]);
    ctx.lineDashOffset = -bgOffset; ctx.moveTo(0, h * 0.8); ctx.lineTo(w, h * 0.8); ctx.stroke(); ctx.setLineDash([]);

    const bounceY = (currentGameState === GAME_STATE.RACING) ? Math.sin(gameTime * 15) * 5 : 0;
    ctx.save(); ctx.translate(w * 0.3, h * 0.75 + bounceY);
    ctx.fillStyle = "#333"; ctx.fillRect(-35, 18, 70, 4);
    ctx.fillStyle = "#ff3366"; ctx.beginPath(); ctx.moveTo(-10, -30); ctx.lineTo(15, -30); ctx.lineTo(10, 15); ctx.lineTo(-15, 15); ctx.fill();
    ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(5, -40, 12, 0, Math.PI * 2); ctx.fill();
    if (currentGameState === GAME_STATE.RACING) {
        const pole = Math.sin(gameTime * 15) * 0.5;
        ctx.strokeStyle = "#555"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(Math.cos(pole)*30, Math.sin(pole)*30+10); ctx.stroke();
    }
    ctx.restore();

    if ((currentGameState === GAME_STATE.SHOOTING || currentGameState === GAME_STATE.PENALTY) && currentProblem) {
        ctx.fillStyle = currentGameState === GAME_STATE.PENALTY ? "rgba(100,0,0,0.7)" : "rgba(0,0,0,0.7)"; 
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = "#fff";
        ctx.font = "bold 60px 'Oswald'";
        ctx.textAlign = "center";
        ctx.shadowColor = currentGameState === GAME_STATE.PENALTY ? "#ff0000" : "#00f2fe";
        ctx.shadowBlur = 20;
        ctx.fillText(currentProblem.text, w / 2, h * 0.35);
        ctx.shadowBlur = 0; 
        
        currentProblem.targets.forEach((target, i) => {
            const outerRadius = 50;
            const innerRadius = 42;
            const centerRadius = 25;
            
            ctx.beginPath(); 
            ctx.arc(target.x, target.y, outerRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#fff"; 
            ctx.fill();
            
            ctx.beginPath(); 
            ctx.arc(target.x, target.y, innerRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#222"; 
            ctx.fill();

            ctx.beginPath(); 
            ctx.arc(target.x, target.y, centerRadius, 0, Math.PI * 2);
            ctx.strokeStyle = "#aaa"; 
            ctx.lineWidth = 2; 
            ctx.stroke();
            
            ctx.fillStyle = "#fff"; 
            ctx.font = "bold 28px 'Oswald'";
            ctx.fillText(target.val, target.x, target.y + 12);
            
            ctx.fillStyle = "#ff3366"; 
            ctx.fillRect(target.x - 16, target.y - 75, 32, 32);
            ctx.fillStyle = "#fff"; 
            ctx.font = "bold 20px 'Oswald'"; 
            ctx.fillText(i + 1, target.x, target.y - 55);
        });
        
        if (currentGameState === GAME_STATE.PENALTY) {
            ctx.font = "24px 'Oswald'";
            ctx.fillStyle = "#ffaa00";
            ctx.fillText(`Осталось штрафных: ${penaltyQueue}`, w / 2, h * 0.85);
        }
    }

    if (currentGameState === GAME_STATE.GAME_OVER) {
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ffd700"; ctx.font = "bold 80px 'Oswald'"; ctx.textAlign = "center";
        ctx.fillText("ПОБЕДА!", w / 2, h * 0.35);
        ctx.fillStyle = "#fff"; ctx.font = "30px 'Oswald'";
        ctx.fillText(`Счёт: ${score} | Время: ${timerElement.textContent}`, w / 2, h * 0.55);
        ctx.font = "24px 'Oswald'";
        ctx.fillStyle = "#aaa";
        ctx.fillText("Нажмите R для перезапуска", w / 2, h * 0.75);
    }
    
    if (currentGameState === GAME_STATE.LOSE) {
        ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ff4444"; ctx.font = "bold 80px 'Oswald'"; ctx.textAlign = "center";
        ctx.fillText("ПОРАЖЕНИЕ", w / 2, h * 0.35);
        ctx.fillStyle = "#fff"; ctx.font = "30px 'Oswald'";
        ctx.fillText(`Время вышло! Счёт: ${score}`, w / 2, h * 0.55);
        ctx.font = "24px 'Oswald'";
        ctx.fillStyle = "#aaa";
        ctx.fillText("Нажмите R для перезапуска", w / 2, h * 0.75);
    }
}

// Запуск игры
initGame();