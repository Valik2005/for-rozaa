const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// ======================================================
// СТАРТ САЙТА
// ======================================================

window.addEventListener("load", () => {
    requestAnimationFrame(() => {
        document.body.classList.add("loaded");
    });
});

// ======================================================
// ПЕРЕХОДЫ МЕЖДУ ЭКРАНАМИ
// ======================================================

let transitionLocked = false;

async function showScreen(screenId) {
    while (transitionLocked) {
        await wait(20);
    }

    transitionLocked = true;

    const current = document.querySelector(".screen.active");
    const next = document.getElementById(screenId);

    if (!next) {
        transitionLocked = false;
        return;
    }

    if (current === next) {
        transitionLocked = false;
        return;
    }

    if (current) {
        current.classList.add("leaving");
        await wait(450);
        current.classList.remove("active", "leaving");
    }

    next.classList.add("active");

    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto"
    });

    await wait(650);
    transitionLocked = false;
}

// ======================================================
// МУЗЫКА
// ======================================================

const bgMusic = document.getElementById("bg-music");
const musicToggle = document.getElementById("music-toggle");

const MUSIC_VOLUME = 0.20;

let musicStarted = false;
let musicMuted = false;
let musicFadeFrame = null;

function fadeMusicIn() {
    if (!bgMusic) return;

    if (musicFadeFrame) {
        cancelAnimationFrame(musicFadeFrame);
    }

    bgMusic.volume = 0;

    const duration = 2500;
    const start = performance.now();

    function fade(now) {
        const progress = Math.min((now - start) / duration, 1);
        bgMusic.volume = MUSIC_VOLUME * progress;

        if (progress < 1) {
            musicFadeFrame = requestAnimationFrame(fade);
        }
    }

    musicFadeFrame = requestAnimationFrame(fade);
}

function startMusic() {
    if (!bgMusic || musicStarted) return;

    musicStarted = true;
    bgMusic.volume = 0;

    const playPromise = bgMusic.play();

    if (playPromise) {
        playPromise
            .then(() => {
                fadeMusicIn();
                musicToggle.classList.add("visible");
            })
            .catch(error => {
                musicStarted = false;
                console.log("Музыка не запустилась:", error);
            });
    }
}

musicToggle.addEventListener("click", async () => {
    if (!musicStarted) {
        startMusic();
        return;
    }

    if (musicMuted) {
        await bgMusic.play();
        bgMusic.volume = MUSIC_VOLUME;
        musicMuted = false;
        musicToggle.textContent = "♫";
        musicToggle.classList.remove("muted");
    } else {
        bgMusic.pause();
        musicMuted = true;
        musicToggle.textContent = "×";
        musicToggle.classList.add("muted");
    }
});

// ======================================================
// СЕКРЕТНОЕ СЛОВО
// ======================================================

const passwordInput = document.getElementById("password-input");
const passwordButton = document.getElementById("password-button");
const passwordError = document.getElementById("password-error");

const SECRET_WORD = "лисёнок";

function normalizeWord(word) {
    return word
        .trim()
        .toLowerCase()
        .replaceAll("ё", "е");
}

async function checkPassword() {
    if (passwordButton.disabled) return;
    const entered = normalizeWord(passwordInput.value);
    const correct = normalizeWord(SECRET_WORD);

    if (entered !== correct) {
        passwordError.textContent = "Не-а... попробуй ещё раз ❤️";

        passwordInput.animate(
            [
                { transform: "translateX(0)" },
                { transform: "translateX(-8px)" },
                { transform: "translateX(8px)" },
                { transform: "translateX(-5px)" },
                { transform: "translateX(5px)" },
                { transform: "translateX(0)" }
            ],
            { duration: 350 }
        );

        return;
    }

    passwordError.textContent = "";
    passwordInput.blur();
    passwordButton.disabled = true;

    // После пользовательского нажатия браузер разрешает звук.
    startMusic();

    await startGift();
}

passwordButton.addEventListener("click", checkPassword);

passwordInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        checkPassword();
    }
});

passwordInput.addEventListener("input", () => {
    passwordError.textContent = "";
});

// ======================================================
// ИНТРО: «РОЗА, ТЕБЕ ПИСЬМО»
// ======================================================

async function startGift() {
    await showScreen("screen-message");
    await wait(1850);

    const messageScreen = document.getElementById("screen-message");
    messageScreen.classList.add("intro-out");

    await wait(650);
    await showScreen("screen-envelope");

    messageScreen.classList.remove("intro-out");
}

// ======================================================
// КОНВЕРТ
// ======================================================

const mailScene = document.getElementById("mail-scene");
const envelope = document.getElementById("envelope");

let mailOpened = false;

envelope.addEventListener("click", openMail);

async function openMail() {
    if (mailOpened) return;

    mailOpened = true;
    envelope.style.pointerEvents = "none";

    // 1. Печать раскалывается.
    mailScene.classList.add("break-seal");
    await wait(550);

    // 2. Клапан открывается назад.
    mailScene.classList.add("open-flap");
    await wait(760);

    // 3. Только теперь показываем спрятанный сложенный лист.
    mailScene.classList.add("paper-visible");
    await wait(80);

    // 4. Лист поднимается из конверта.
    mailScene.classList.add("paper-rise");
    await wait(950);

    // 5. Лист становится перед конвертом.
    mailScene.classList.add("paper-front");
    await wait(100);

    // 6. Конверт уходит вниз и исчезает.
    mailScene.classList.add("envelope-away");
    await wait(520);

    // 7. Тот же лист раскрывается по сгибу.
    mailScene.classList.add("unfold-paper");
    await wait(1400);

    // 8. После полного раскрытия включаем содержимое.
    mailScene.classList.add("paper-ready");
    await wait(250);

    // 9. Текст появляется по словам.
    await revealWords();
}

// ======================================================
// ТЕКСТ ПИСЬМА ПО СЛОВАМ
// ======================================================

const wordBlocks = document.querySelectorAll("#paper-content .word-reveal");

function prepareWords() {
    wordBlocks.forEach(block => {
        const text = block.textContent.trim();
        block.innerHTML = "";

        const words = text.split(/\s+/);

        words.forEach((word, index) => {
            const span = document.createElement("span");
            span.className = "reveal-word";
            span.textContent = word;
            block.appendChild(span);

            if (index < words.length - 1) {
                block.appendChild(document.createTextNode(" "));
            }
        });
    });
}

prepareWords();

const letterActions = document.getElementById("letter-actions");
let wordsAlreadyShown = false;

async function revealWords() {
    if (wordsAlreadyShown) return;
    wordsAlreadyShown = true;

    const blocks = document.querySelectorAll("#paper-content .word-reveal");
    const WORD_DELAY = 52;
    const PARAGRAPH_DELAY = 110;

    for (const block of blocks) {
        const words = block.querySelectorAll(".reveal-word");

        for (const word of words) {
            word.classList.add("visible");
            await wait(WORD_DELAY);
        }

        await wait(PARAGRAPH_DELAY);
    }

    await wait(260);
    letterActions.classList.add("ready");
}

// ======================================================
// КНОПКИ ПИСЬМА
// ======================================================

const wantButton = document.getElementById("want-button");
const noButton = document.getElementById("no-button");

wantButton.addEventListener("click", async () => {
    updateMeetingLabel();
    await showScreen("screen-time");
    selectTime("17:00", false);
});

let noCount = 0;

const noSteps = [
    { text: "Точно? 👀", x: 20, y: -5, scale: 0.82 },
    { text: "Подумай ещё 😏", x: -28, y: 12, scale: 0.66 },
    { text: "Ну Роза...", x: 32, y: 20, scale: 0.48 }
];

noButton.addEventListener("click", () => {
    noCount++;

    if (noCount >= 4) {
        noButton.animate(
            [
                { opacity: 1 },
                { opacity: 0, transform: "scale(0)" }
            ],
            {
                duration: 350,
                fill: "forwards"
            }
        );

        setTimeout(() => {
            noButton.style.display = "none";
        }, 350);

        return;
    }

    const step = noSteps[noCount - 1];
    noButton.textContent = step.text;
    noButton.style.transform = `translate(${step.x}px, ${step.y}px) scale(${step.scale})`;
});

// ======================================================
// ДАТА
// ======================================================

const selectedDate = "2 октября";
const selectedDay = 2;
let selectedTime = "17:00";
const selectedDateText = document.getElementById("selected-date-text");

function meetingLabel(now = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(now).map(part => [part.type, part.value]));
    const remaining = Math.round((Date.UTC(2026, 9, 2) -
        Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))) / 86400000);
    return remaining === 1 ? "Завтра, 2 октября ❤️" :
        remaining === 0 ? "Сегодня, 2 октября ❤️" : "2 октября 2026 ❤️";
}

function updateMeetingLabel() {
    selectedDateText.textContent = meetingLabel();
}
updateMeetingLabel();
setInterval(updateMeetingLabel, 30000);
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateMeetingLabel();
});

// ======================================================
// МОБИЛЬНОЕ КОЛЕСО ВРЕМЕНИ
// ======================================================

const timeWheel = document.getElementById("time-wheel");
const timeOptions = Array.from(document.querySelectorAll(".time-option"));
const timePickedValue = document.getElementById("time-picked-value");
const resultDate = document.getElementById("result-date");
const resultTime = document.getElementById("result-time");
const timeConfirmButton = document.getElementById("time-confirm-button");

let scrollTimer = null;
let scrollFrame = null;

function updateSelectedTime() {
    const wheelRect = timeWheel.getBoundingClientRect();
    const wheelCenter = wheelRect.top + wheelRect.height / 2;

    let closest = null;
    let closestDistance = Infinity;

    timeOptions.forEach(option => {
        const rect = option.getBoundingClientRect();
        const optionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(optionCenter - wheelCenter);

        if (distance < closestDistance) {
            closestDistance = distance;
            closest = option;
        }
    });

    if (!closest) return;

    timeOptions.forEach(option => option.classList.remove("selected"));
    closest.classList.add("selected");

    selectedTime = closest.dataset.time;
    timePickedValue.textContent = selectedTime;
}

function selectTime(time, smooth = true) {
    const option = timeOptions.find(item => item.dataset.time === time);
    if (!option) return;

    selectedTime = time;

    timeOptions.forEach(item => item.classList.remove("selected"));
    option.classList.add("selected");
    timePickedValue.textContent = time;

    const target =
        option.offsetTop -
        timeWheel.clientHeight / 2 +
        option.clientHeight / 2;

    timeWheel.scrollTo({
        top: target,
        behavior: smooth ? "smooth" : "auto"
    });
}

function snapTime() {
    const selected = document.querySelector(".time-option.selected");
    if (!selected) return;

    const target =
        selected.offsetTop -
        timeWheel.clientHeight / 2 +
        selected.clientHeight / 2;

    timeWheel.scrollTo({
        top: target,
        behavior: "smooth"
    });
}

timeWheel.addEventListener(
    "scroll",
    () => {
        if (scrollFrame) {
            cancelAnimationFrame(scrollFrame);
        }

        scrollFrame = requestAnimationFrame(updateSelectedTime);

        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(snapTime, 140);
    },
    { passive: true }
);

timeOptions.forEach(option => {
    option.addEventListener("click", () => {
        selectTime(option.dataset.time, true);
    });
});

timeConfirmButton.addEventListener("click", async () => {
    resultDate.textContent = selectedDate;
    resultTime.textContent = selectedTime;

    await showScreen("screen-confirmation");
});

// ======================================================
// ФИНАЛЬНЫЙ ЭКРАН
// ======================================================

const finalButton = document.getElementById("final-button");
const finalDate = document.getElementById("final-date");
const finalTime = document.getElementById("final-time");

finalButton.addEventListener("click", async () => {
    finalDate.textContent = selectedDate;
    finalTime.textContent = selectedTime;

    // Сбрасываем фото ДО показа финального экрана, чтобы оно не мигнуло.
    resetPhotoReveal();

    await showScreen("screen-final");
    await wait(100);

    startCountdown();
});

// ======================================================
// ТАЙМЕР ДО ВЫБРАННОЙ ДАТЫ И ВРЕМЕНИ
// ======================================================

const countdownCard = document.getElementById("countdown-card");
const countdownDays = document.getElementById("countdown-days");
const countdownHours = document.getElementById("countdown-hours");
const countdownMinutes = document.getElementById("countdown-minutes");
const countdownSeconds = document.getElementById("countdown-seconds");

let countdownInterval = null;

function getSelectedTargetDate() {
    const [hours, minutes] = selectedTime.split(":").map(Number);

    // Подарок рассчитан на октябрь 2026 года.
    return new Date(`2026-10-02T${pad2(hours)}:${pad2(minutes)}:00+03:00`);
}

function pad2(value) {
    return String(value).padStart(2, "0");
}

function updateCountdown() {
    const target = getSelectedTargetDate();
    const now = new Date();
    const difference = target.getTime() - now.getTime();

    if (difference <= 0) {
        countdownDays.textContent = "00";
        countdownHours.textContent = "00";
        countdownMinutes.textContent = "00";
        countdownSeconds.textContent = "00";
        countdownCard.classList.add("finished");

        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        return;
    }

    countdownCard.classList.remove("finished");

    const totalSeconds = Math.floor(difference / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownDays.textContent = pad2(days);
    countdownHours.textContent = pad2(hours);
    countdownMinutes.textContent = pad2(minutes);
    countdownSeconds.textContent = pad2(seconds);
}

function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// ======================================================
// РАСКРЫТИЕ ФОТО — КАК В ВИДЕО
// Каждый тап добавляет отдельные фрагменты с общим направлением снизу вверх.
// Место нажатия не влияет на то, где раскрывается фотография.
// ======================================================

const photoRevealStage = document.getElementById("photo-reveal-stage");
const revealPhoto = document.getElementById("reveal-photo");

const photoGlow = document.getElementById("photo-glow");
const revealCounter = document.getElementById("reveal-counter");
const photoCaption = document.getElementById("photo-caption");
const revealFinalSignature = document.getElementById("reveal-final-signature");

/*
   По ощущению из видео первый тап показывает только нижнюю часть,
   а дальше граница поднимается всё выше. Первый счётчик — 1128,
   как на референсе.
*/
const TOTAL_REVEAL_TAPS = 8;
const REVEAL_STEPS = [0, 12, 25, 39, 53, 68, 82, 93, 100];
const COUNTER_STEPS = [0, 1128, 2384, 3699, 5032, 6427, 7861, 9014, 9999];

let revealTapCount = 0;
let photoCompleted = false;
let counterAnimationFrame = null;
let fragmentsShown = 0;
const fragmentGroup = document.getElementById("photo-fragments");
const fragmentAnimations = new Set();

// Shared jittered vertices tile the entire photo without missing areas.
// Height biases the order; independent noise makes islands at different heights.
function createFragmentLayout() {
    let seed = 61423;
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    const cols = 12, rows = 16;
    const vertices = Array.from({length: rows + 1}, (_, y) =>
        Array.from({length: cols + 1}, (_, x) => [
            x * 360 / cols + (x === 0 || x === cols ? 0 : (random() - .5) * 20),
            y * 450 / rows + (y === 0 || y === rows ? 0 : (random() - .5) * 18)
        ]));
    const pieces = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            pieces.push({
                x, y,
                points: [vertices[y][x], vertices[y][x+1], vertices[y+1][x+1], vertices[y+1][x]],
                order: (rows - 1 - y) / rows + random() * .48
            });
        }
    }
    return pieces.sort((a,b) => a.order - b.order);
}

const photoFragments = createFragmentLayout().map(piece => {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", piece.points.map(point => point.join(",")).join(" "));
    polygon.setAttribute("fill", "white");
    polygon.setAttribute("stroke", "white");
    polygon.setAttribute("stroke-width", ".35");
    polygon.style.opacity = "0";
    fragmentGroup.appendChild(polygon);
    return polygon;
});

function revealFragments(percent) {
    const count = Math.round(photoFragments.length * percent / 100);
    const batch = photoFragments.slice(fragmentsShown, count);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    batch.forEach((polygon, index) => {
        if (reducedMotion) { polygon.style.opacity = "1"; return; }
        const animation = polygon.animate([{opacity: 0}, {opacity: 1}], {
            duration: 380,
            delay: (index * 137 % 521),
            easing: "ease-out",
            fill: "forwards"
        });
        fragmentAnimations.add(animation);
        animation.onfinish = () => {
            polygon.style.opacity = "1";
            animation.cancel();
            fragmentAnimations.delete(animation);
        };
    });
    fragmentsShown = count;
}

function resetPhotoReveal() {
    revealTapCount = 0;
    photoCompleted = false;
    fragmentsShown = 0;
    fragmentAnimations.forEach(animation => animation.cancel());
    fragmentAnimations.clear();
    photoFragments.forEach(polygon => { polygon.style.opacity = "0"; });
    if (counterAnimationFrame) cancelAnimationFrame(counterAnimationFrame);
    counterAnimationFrame = null;
    photoRevealStage.classList.remove("ready", "started", "completed");
    photoCaption.classList.remove("visible");
    revealFinalSignature.classList.remove("visible");
    document.querySelector(".paper-fox-finale").classList.remove("visible");
    revealCounter.textContent = "0";
    photoRevealStage.classList.add("ready");
}

function animateRevealCounter(targetValue) {
    if (counterAnimationFrame) {
        cancelAnimationFrame(counterAnimationFrame);
    }

    const startValue = Number(revealCounter.textContent) || 0;
    const duration = 580;
    const startTime = performance.now();

    function frame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(startValue + (targetValue - startValue) * eased);

        revealCounter.textContent = String(value);

        if (progress < 1) {
            counterAnimationFrame = requestAnimationFrame(frame);
        } else {
            counterAnimationFrame = null;
            revealCounter.classList.remove("bump");
            void revealCounter.offsetWidth;
            revealCounter.classList.add("bump");
        }
    }

    counterAnimationFrame = requestAnimationFrame(frame);
}

function revealNextPart() {
    if (photoCompleted) return;
    if (!photoRevealStage.classList.contains("ready")) return;

    revealTapCount = Math.min(revealTapCount + 1, TOTAL_REVEAL_TAPS);
    const revealPercent = REVEAL_STEPS[revealTapCount];

    photoRevealStage.classList.add("started");

    revealFragments(revealPercent);

    animateRevealCounter(COUNTER_STEPS[revealTapCount]);

    if (navigator.vibrate) {
        navigator.vibrate(12);
    }

    if (revealTapCount >= TOTAL_REVEAL_TAPS) {
        finishPhotoReveal();
    }
}

photoRevealStage.addEventListener("click", revealNextPart);
photoRevealStage.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        revealNextPart();
    }
});

async function finishPhotoReveal() {
    if (photoCompleted) return;

    photoCompleted = true;
    revealFragments(100);
    animateRevealCounter(9999);

    photoRevealStage.classList.add("completed");

    await wait(1000);
    photoCaption.classList.add("visible");

    await wait(300);
    revealFinalSignature.classList.add("visible");
    document.querySelector(".paper-fox-finale").classList.add("visible");
}

/* Начальное состояние ещё до первого перехода на финальный экран. */
resetPhotoReveal();
