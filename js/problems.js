// ==================== ГЕНЕРАТОР ЗАДАЧ ====================

// Вспомогательные функции для арифметики
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Форматирование математических выражений для отображения
function formatMathExpression(text) {
    return text
        .replace(/x\^(\d+)/g, (_, p1) => {
            const sup = ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹'];
            return 'x' + p1.split('').map(d => sup[parseInt(d)] || d).join('');
        })
        .replace(/√/g, '√')
        .replace(/∫/g, '∫')
        .replace(/∞/g, '∞')
        .replace(/·/g, '·')
        .replace(/\//g, '⁄'); // опционально для дробей
}

// Генерация арифметической задачи с прогрессией
function generateArithmeticProblem(level) {
    // level — относительный уровень сложности (0, 1, 2, ...)
    const ops = ['+', '-', '*', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;
    const maxNum = 10 + level * 5; // с каждым уровнем числа растут

    switch (op) {
        case '+':
            a = randomInt(1, maxNum);
            b = randomInt(1, maxNum);
            answer = a + b;
            break;
        case '-':
            a = randomInt(maxNum/2, maxNum);
            b = randomInt(1, a);
            answer = a - b;
            break;
        case '*':
            a = randomInt(1, Math.min(12, maxNum/2));
            b = randomInt(1, Math.min(12, maxNum/2));
            answer = a * b;
            break;
        case '/':
            b = randomInt(1, Math.min(10, maxNum/2));
            answer = randomInt(1, maxNum/b);
            a = b * answer;
            break;
    }

    const options = [answer];
    let loopProtection = 0; // Защита от зависания на всякий случай

    while (options.length < 4 && loopProtection < 100) {
        loopProtection++;
        let fake;
        
        // Даем гарантированный разброс хотя бы в 5 единиц в обе стороны
        if (op === '/') {
            fake = answer + randomInt(-5, 5);
        } else {
            fake = answer + randomInt(-Math.floor(maxNum/3) - 3, Math.floor(maxNum/3) + 3);
        }
        
        // fake не должен быть равен правильному ответу и должен быть > 0
        if (fake !== answer && fake > 0 && !options.includes(fake)) {
            options.push(fake);
        }
    }

    // Если вдруг уникальных не хватило (очень редкий кейс), добиваем числами по порядку
    while(options.length < 4) {
        let fallback = answer + options.length + 1;
        if (!options.includes(fallback)) options.push(fallback);
    }

    options.sort(() => Math.random() - 0.5);

    return {
        text: `${a} ${op} ${b} = ?`,
        answer,
        options,
        type: 'arithmetic'
    };
}

function generateDerivativeProblem(level) {
    const types = level === 0 ? ['power', 'trig', 'exp'] :
                  level === 1 ? ['power_coeff', 'trig_coeff', 'ln', 'exp'] :
                                ['sum', 'product'];
    const type = types[Math.floor(Math.random() * types.length)];
    let question, answer, wrongs = [];

    const n = randomInt(2, 5);
    const k = randomInt(2, 5);

    switch (type) {
        case 'power':
            question = `y = x^${n}`;
            answer = `${n}x^${n-1}`;
            wrongs = [
                `${n-1}x^${n-1}`,    // неправильная степень
                `${n}x^${n}`,        // забыли уменьшить степень
                `x^${n-1}`           // забыли коэффициент
            ];
            break;
        case 'power_coeff':
            question = `y = ${k}x^${n}`;
            answer = `${k*n}x^${n-1}`;
            wrongs = [
                `${k}x^${n-1}`,      // забыли умножить на степень
                `${n}x^${n-1}`,      // потеряли коэффициент k
                `${k*n}x^${n}`       // не уменьшили степень
            ];
            break;
        case 'trig':
            if (Math.random() > 0.5) {
                question = `y = sin x`;
                answer = `cos x`;
                wrongs = [`-cos x`, `sin x`, `-sin x`];
            } else {
                question = `y = cos x`;
                answer = `-sin x`;
                wrongs = [`sin x`, `cos x`, `-cos x`];
            }
            break;
        case 'trig_coeff':
            if (Math.random() > 0.5) {
                question = `y = sin ${k}x`;
                answer = `${k}cos ${k}x`;
                wrongs = [
                    `cos ${k}x`,           // забыли k
                    `-${k}sin ${k}x`,      // перепутали функцию
                    `${k}sin ${k}x`        // не та функция
                ];
            } else {
                question = `y = cos ${k}x`;
                answer = `-${k}sin ${k}x`;
                wrongs = [
                    `${k}sin ${k}x`,       // забыли минус
                    `-sin ${k}x`,          // потеряли k
                    `-${k}cos ${k}x`       // не та функция
                ];
            }
            break;
        case 'exp':
            question = `y = e^x`;
            answer = `e^x`;
            wrongs = [`x*e^(x-1)`, `e^(x-1)`, `1`];
            break;
        case 'ln':
            question = `y = ln x`;
            answer = `1/x`;
            wrongs = [`x`, `ln x`, `1/x^2`];
            break;
        case 'sum':
            const n1 = randomInt(2,4);
            const n2 = randomInt(1,3);
            question = `y = x^${n1} + x^${n2}`;
            answer = `${n1}x^${n1-1} + ${n2}x^${n2-1}`;
            wrongs = [
                `${n1}x^${n1} + ${n2}x^${n2}`,        // не уменьшили степени
                `${n1-1}x^${n1-1} + ${n2-1}x^${n2-1}`,// неправильные коэффициенты
                `${n1}x^${n1-1} - ${n2}x^${n2-1}`     // неправильный знак
            ];
            break;
        case 'product':
            question = `y = x·sin x`;
            answer = `sin x + x·cos x`;
            wrongs = [
                `cos x`,                  // только производная синуса
                `x·cos x`,                // забыли sin x
                `sin x - x·cos x`         // неправильный знак
            ];
            break;
        default:
            question = `y = x^2`;
            answer = `2x`;
            wrongs = [`x`, `2`, `x^2`];
    }

    const options = [answer];
    while (options.length < 4) {
        const w = wrongs[Math.floor(Math.random() * wrongs.length)];
        if (!options.includes(w)) options.push(w);
    }
    options.sort(() => Math.random() - 0.5);

    return { text: question, answer, options, type: 'derivative' };
}

function generateIntegralProblem(level) {
    const types = level === 0 ? ['power', 'trig', 'exp'] :
                  level === 1 ? ['power_coeff', 'trig_coeff', 'ln'] :
                                ['sum'];
    const type = types[Math.floor(Math.random() * types.length)];
    let question, answer, wrongs = [];

    const n = randomInt(2, 5);
    const k = randomInt(2, 5);

    switch (type) {
        case 'power':
            question = `∫ x^${n} dx`;
            answer = `x^${n+1}/${n+1} + C`;
            wrongs = [
                `${n}x^${n-1} + C`,       // перепутали с производной
                `x^${n} + C`,             // не применили формулу
                `x^${n+1}/${n} + C`       // неправильный знаменатель
            ];
            break;
        case 'power_coeff':
            question = `∫ ${k}x^${n} dx`;
            answer = `${k}x^${n+1}/${n+1} + C`;
            wrongs = [
                `x^${n+1}/${n+1} + C`,        // потеряли k
                `${k*n}x^${n-1} + C`,         // производная
                `${k}x^${n+1}/${n} + C`       // ошибка в знаменателе
            ];
            break;
        case 'trig':
            if (Math.random() > 0.5) {
                question = `∫ sin x dx`;
                answer = `-cos x + C`;
                wrongs = [`cos x + C`, `sin x + C`, `-sin x + C`];
            } else {
                question = `∫ cos x dx`;
                answer = `sin x + C`;
                wrongs = [`-sin x + C`, `cos x + C`, `-cos x + C`];
            }
            break;
        case 'trig_coeff':
            if (Math.random() > 0.5) {
                question = `∫ sin ${k}x dx`;
                answer = `-cos ${k}x/${k} + C`;
                wrongs = [
                    `cos ${k}x/${k} + C`,      // потеряли минус
                    `-cos ${k}x + C`,          // забыли делить на k
                    `-sin ${k}x/${k} + C`      // не та функция
                ];
            } else {
                question = `∫ cos ${k}x dx`;
                answer = `sin ${k}x/${k} + C`;
                wrongs = [
                    `-sin ${k}x/${k} + C`,     // лишний минус
                    `sin ${k}x + C`,           // забыли делить на k
                    `cos ${k}x/${k} + C`       // не та функция
                ];
            }
            break;
        case 'exp':
            question = `∫ e^x dx`;
            answer = `e^x + C`;
            wrongs = [`x*e^x + C`, `e^(x-1) + C`, `1 + C`];
            break;
        case 'ln':
            question = `∫ 1/x dx`;
            answer = `ln|x| + C`;
            wrongs = [`1/x^2 + C`, `x + C`, `ln x + C`]; // последнее без модуля
            break;
        case 'sum':
            const n1 = randomInt(2,4);
            const n2 = randomInt(1,3);
            question = `∫ (x^${n1} + x^${n2}) dx`;
            answer = `x^${n1+1}/${n1+1} + x^${n2+1}/${n2+1} + C`;
            wrongs = [
                `${n1}x^${n1-1} + ${n2}x^${n2-1} + C`,   // производная
                `x^${n1+1}/${n1} + x^${n2+1}/${n2} + C`, // неправильные знаменатели
                `x^${n1+1}/${n1+1} - x^${n2+1}/${n2+1} + C` // неправильный знак
            ];
            break;
        default:
            question = `∫ x dx`;
            answer = `x^2/2 + C`;
            wrongs = [`2x + C`, `x^2 + C`, `x + C`];
    }

    const options = [answer];
    while (options.length < 4) {
        const w = wrongs[Math.floor(Math.random() * wrongs.length)];
        if (!options.includes(w)) options.push(w);
    }
    options.sort(() => Math.random() - 0.5);

    return { text: question, answer, options, type: 'integral' };
}


// Основной генератор
function generateMathProblem(isPenalty = false) {
    const w = window.canvas ? window.canvas.width : 1000;
    const h = window.canvas ? window.canvas.height : 600;

    // ШТРАФНЫЕ ЗАДАЧИ (простые арифметические)
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
        
        return { 
            text: `${a} ${op} ${b} = ?`, 
            answer: answer, 
            targets: targets,
            type: 'arithmetic'
        };
    }

    const diff = window.currentDifficulty;       // 0,1,2
    const currentLap = window.currentLap;
    const step = window.difficultyStep || 2;
    // Уровень сложности внутри режима: 0,1,2...
    const innerLevel = Math.floor((currentLap - 1) / step);

    let problem;
    if (diff === 0) {
        problem = generateArithmeticProblem(innerLevel);
    } else if (diff === 1) {
        problem = generateDerivativeProblem(innerLevel);
    } else {
        problem = generateIntegralProblem(innerLevel);
    }

    // Создание мишеней
    const startX = w * 0.15;
    const stepX = w * 0.21;
    const targets = problem.options.map((opt, index) => ({
        val: opt,
        x: startX + index * stepX,
        y: h * 0.65,
        radius: 55
    }));

    return {
        text: problem.text,
        answer: problem.answer,
        targets,
        type: problem.type
    };
}



// Экспорт
window.generateMathProblem = generateMathProblem;
window.formatMathExpression = formatMathExpression; // остаётся