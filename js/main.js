// Ждем, пока загрузится весь HTML
document.addEventListener("DOMContentLoaded", () => {
    
    // === Элементы для модального окна СПРАВКА ===
    const btnHelp = document.getElementById("btn-help");
    const modalInfo = document.getElementById("modal-info");
    const btnCloseInfo = document.getElementById("btn-close-info");

    if (btnHelp) {
        btnHelp.addEventListener("click", () => {
            modalInfo.classList.remove("hidden");
        });
    }

    if (btnCloseInfo) {
        btnCloseInfo.addEventListener("click", () => {
            modalInfo.classList.add("hidden");
        });
    }

    if (modalInfo) {
        modalInfo.addEventListener("click", (e) => {
            if (e.target === modalInfo) {
                modalInfo.classList.add("hidden");
            }
        });
    }

    // === Элементы для модального окна НАСТРОЙКИ ===
    const btnSettings = document.getElementById("btn-settings");
    const modalSettings = document.getElementById("modal-settings");
    const btnCloseSettings = document.getElementById("btn-close-settings");

    if (btnSettings) {
        btnSettings.addEventListener("click", () => {
            modalSettings.classList.remove("hidden");
        });
    }

    if (btnCloseSettings) {
        btnCloseSettings.addEventListener("click", () => {
            modalSettings.classList.add("hidden");
        });
    }

    if (modalSettings) {
        modalSettings.addEventListener("click", (e) => {
            if (e.target === modalSettings) {
                modalSettings.classList.add("hidden");
            }
        });
    }

    // === ЛОГИКА ПЕРЕКЛЮЧАТЕЛЕЙ (ТОГГЛОВ) ===
    let settings = {
        sound: true,
        music: true,
        speed: true
    };

    function updateToggle(toggleElement, isActive) {
        if (isActive) {
            toggleElement.classList.remove("toggle-red-active");
            toggleElement.classList.add("toggle-green-active");
        } else {
            toggleElement.classList.remove("toggle-green-active");
            toggleElement.classList.add("toggle-red-active");
        }
    }

    function setSoundEnabled(enabled) {
        console.log("Звук:", enabled ? "ВКЛЮЧЕН" : "ВЫКЛЮЧЕН");
        localStorage.setItem("soundEnabled", enabled);
    }

    function setMusicEnabled(enabled) {
        console.log("Музыка:", enabled ? "ВКЛЮЧЕНА" : "ВЫКЛЮЧЕНА");
        localStorage.setItem("musicEnabled", enabled);
    }

    function setSpeedEnabled(enabled) {
        console.log("Скорость трассы:", enabled ? "БЫСТРАЯ" : "МЕДЛЕННАЯ");
        localStorage.setItem("speedEnabled", enabled);
    }

    const toggleSound = document.getElementById("toggle-sound");
    const toggleMusic = document.getElementById("toggle-music");
    const toggleSpeed = document.getElementById("toggle-speed");

    // Загружаем сохранённые настройки
    const savedSound = localStorage.getItem("soundEnabled");
    const savedMusic = localStorage.getItem("musicEnabled");
    const savedSpeed = localStorage.getItem("speedEnabled");
    
    if (savedSound !== null) settings.sound = savedSound === "true";
    if (savedMusic !== null) settings.music = savedMusic === "true";
    if (savedSpeed !== null) settings.speed = savedSpeed === "true";

    if (toggleSound) {
        updateToggle(toggleSound, settings.sound);
        toggleSound.addEventListener("click", () => {
            settings.sound = !settings.sound;
            updateToggle(toggleSound, settings.sound);
            setSoundEnabled(settings.sound);
        });
    }

    if (toggleMusic) {
        updateToggle(toggleMusic, settings.music);
        toggleMusic.addEventListener("click", () => {
            settings.music = !settings.music;
            updateToggle(toggleMusic, settings.music);
            setMusicEnabled(settings.music);
        });
    }

    if (toggleSpeed) {
        updateToggle(toggleSpeed, settings.speed);
        toggleSpeed.addEventListener("click", () => {
            settings.speed = !settings.speed;
            updateToggle(toggleSpeed, settings.speed);
            setSpeedEnabled(settings.speed);
        });
    }

    // === ЛОГИКА ПОЛЗУНКА СЛОЖНОСТИ ===
    let currentDifficulty = 1;
    const difficultyBar = document.getElementById("difficulty-bar");
    const difficultyText = document.getElementById("difficulty-text");

    function updateDifficulty() {
        const levels = ["ЛЁГКАЯ", "СРЕДНЯЯ", "СЛОЖНАЯ"];
        if (difficultyText) {
            difficultyText.textContent = levels[currentDifficulty];
        }
        if (difficultyBar) {
            const colors = ["#00cc66", "#ffcc00", "#ff3300"];
            difficultyBar.style.backgroundColor = colors[currentDifficulty];
        }
        console.log("Сложность:", levels[currentDifficulty]);
        localStorage.setItem("difficulty", currentDifficulty);
    }

    // Загружаем сохранённую сложность
    const savedDifficulty = localStorage.getItem("difficulty");
    if (savedDifficulty !== null) {
        currentDifficulty = parseInt(savedDifficulty);
    }

    if (difficultyBar) {
        difficultyBar.addEventListener("click", () => {
            currentDifficulty = (currentDifficulty + 1) % 3;
            updateDifficulty();
        });
    }

    updateDifficulty();


    // ... (весь предыдущий код до кнопок СТАРТ/ВЫХОД)
    // === ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ ===
    const lapsInput = document.getElementById('laps-count');
    const timeLimitInput = document.getElementById('time-limit');
    const lapIntervalInput = document.getElementById('lap-interval');

    // Загружаем сохранённые значения
    const savedLaps = localStorage.getItem('totalLaps');
    const savedTimeLimit = localStorage.getItem('timeLimit');
    const savedLapInterval = localStorage.getItem('lapInterval');

    if (savedLaps !== null && lapsInput) lapsInput.value = savedLaps;
    if (savedTimeLimit !== null && timeLimitInput) timeLimitInput.value = savedTimeLimit;
    if (savedLapInterval !== null && lapIntervalInput) lapIntervalInput.value = savedLapInterval;

    // Сохраняем при изменении
    if (lapsInput) {
        lapsInput.addEventListener('change', () => {
            let val = parseInt(lapsInput.value);
            if (val < 3) val = 3;
            if (val > 100) val = 10;
            lapsInput.value = val;
            localStorage.setItem('totalLaps', val);
            console.log('Количество рубежей:', val);
        });
    }

    if (timeLimitInput) {
        timeLimitInput.addEventListener('change', () => {
            let val = parseInt(timeLimitInput.value);
            if (val < 30) val = 30;
            if (val > 3600) val = 300;
            timeLimitInput.value = val;
            localStorage.setItem('timeLimit', val);
            console.log('Лимит времени:', val);
        });
    }

    if (lapIntervalInput) {
        lapIntervalInput.addEventListener('change', () => {
            let val = parseInt(lapIntervalInput.value);
            if (val < 2) val = 2;
            if (val > 600) val = 10;
            lapIntervalInput.value = val;
            localStorage.setItem('lapInterval', val);
            console.log('Интервал до рубежа:', val);
        });
    }




    const resultRestart = document.getElementById('result-restart');
    const resultMenu = document.getElementById('result-menu');
    const resultModal = document.getElementById('result-modal');

    if (resultRestart) {
        resultRestart.addEventListener('click', () => {
            resultModal.classList.add('hidden');
            restartGame();
        });
    }

    if (resultMenu) {
        resultMenu.addEventListener('click', () => {
            window.close(); // или window.location.href = '../index.html';
        });
    }

    // После объявления остальных input'ов
    const difficultyStepInput = document.getElementById('difficulty-step');

    // Загрузка сохранённого
    const savedStep = localStorage.getItem('difficultyStep');
    if (savedStep !== null && difficultyStepInput) difficultyStepInput.value = savedStep;

    // Сохранение при изменении
    if (difficultyStepInput) {
        difficultyStepInput.addEventListener('change', () => {
            let val = parseInt(difficultyStepInput.value);
            if (val < 1) val = 1;
            if (val > 10) val = 5;
            difficultyStepInput.value = val;
            localStorage.setItem('difficultyStep', val);
            console.log('Шаг усложнения:', val);
        });
    }
    // === КНОПКИ СТАРТ И ВЫХОД ===
    // ... (остальной код)







    // === КНОПКИ СТАРТ И ВЫХОД ===
    const btnStart = document.getElementById("btn-start");
    const btnExit = document.getElementById("btn-exit");

    // Кнопка СТАРТ — открывает игру в новом окне
    if (btnStart) {
        btnStart.addEventListener("click", () => {
            console.log("Запуск игры в новом окне...");
            window.open("html/game.html", "_blank");
        });
    }

    // Кнопка ВЫХОД
    if (btnExit) {
        btnExit.addEventListener("click", () => {
            const confirmExit = confirm("Вы уверены, что хотите выйти?");
            if (confirmExit) {
                window.close();
            }
        });
    }
});