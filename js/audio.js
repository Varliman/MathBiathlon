// ==================== ЗВУКОВАЯ СИСТЕМА ====================
// Использует глобальные SOUNDS и состояние игры (gameRunning, currentGameState)

let audioContext = null;
let soundBuffers = {};
let windSource = null;
let isAudioInitialized = false;
let windStarted = false;

/**
 * Инициализация аудиоконтекста и загрузка всех звуковых файлов.
 * Вызывается при первом взаимодействии пользователя.
 */
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
            if (!windStarted && 
                window.currentGameState !== GAME_STATE.GAME_OVER && 
                window.currentGameState !== GAME_STATE.LOSE) {
                startWindSound();
                windStarted = true;
            }
        }, 2000);
        
    } catch(e) {
        console.log("Web Audio API не поддерживается:", e);
    }
}

/**
 * Воспроизводит короткий звуковой эффект.
 * @param {string} soundName - ключ из SOUNDS.files
 */
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

/**
 * Запускает бесконечный цикл фонового звука ветра.
 */
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
        if (window.currentGameState === GAME_STATE.GAME_OVER || 
            window.currentGameState === GAME_STATE.LOSE) return;
        if (!window.gameRunning) return;
        
        const source = audioContext.createBufferSource();
        source.buffer = soundBuffers.wind;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = SOUNDS.volume;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.onended = () => {
            if (window.gameRunning && 
                window.currentGameState !== GAME_STATE.GAME_OVER && 
                window.currentGameState !== GAME_STATE.LOSE) {
                playWindLoop();
            }
        };
        
        source.start();
        windSource = source;
    }
    
    playWindLoop();
    console.log("🌬️ Фоновый ветер запущен");
}

/**
 * Останавливает звук ветра.
 */
function stopWindSound() {
    if (windSource) {
        try { windSource.stop(); } catch(e) {}
        windSource = null;
    }
    windStarted = false;
}

/**
 * Полностью останавливает все звуки и закрывает аудиоконтекст.
 */
function stopAllSounds() {
    stopWindSound();
    if (audioContext) {
        audioContext.close();
        audioContext = null;
        isAudioInitialized = false;
        windStarted = false;
    }
}

// Экспорт функций в глобальную область
window.initAudio = initAudio;
window.playSound = playSound;
window.startWindSound = startWindSound;
window.stopWindSound = stopWindSound;
window.stopAllSounds = stopAllSounds;