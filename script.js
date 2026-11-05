
// ==========================
// MEDIASCENE ANIMATION
// ==========================


// ==========================
// 1. ELEMENTS & SETTINGS
// ==========================

const changingWord = document.getElementById("changingWord");
const wordInner = document.getElementById("wordInner");
const staticWord = document.getElementById("staticWord");
const sceneButton = document.getElementById("sceneButton");

const words = ["Coffee", "Food", "Music", "Punk", "Life", "My own"];

const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;


// Animation timing (ms)

const TYPE_SPEED = 55;
const HOLD = 800;
const FINAL_HOLD = 1400;

const EXIT_MS = 160;
const ENTER_MS = 240;
const WIDTH_MS = 260;

const MORPH_MS = 900;
const MORPH_STAGGER = 50;

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

let currentWord = wordInner;

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));


// Pastikan elemen utama tersedia

if (!changingWord || !wordInner || !staticWord || !sceneButton) {
    console.error("Media Scene: Elemen HTML tidak ditemukan.");
}


// ==========================
// 2. LIQUID FILTER
// ==========================

document.body.insertAdjacentHTML("beforeend", `
    <svg
        width="0"
        height="0"
        style="position:absolute"
        aria-hidden="true"
        focusable="false"
    >
        <defs>
            <filter
                id="goo-threshold"
                x="-20%"
                y="-30%"
                width="140%"
                height="160%"
                color-interpolation-filters="sRGB"
            >
                <feColorMatrix
                    in="SourceGraphic"
                    type="matrix"
                    values="
                        1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 255 -140
                    "
                />
            </filter>
        </defs>
    </svg>
`);


// ==========================
// 3. HELPERS
// ==========================


// Menyesuaikan lebar area kata

function fitWidthTo(element, duration) {

    const fontSize = parseFloat(
        getComputedStyle(changingWord).fontSize
    );

    const width = element.getBoundingClientRect().width;

    changingWord.style.transitionDuration = `${duration}ms`;
    changingWord.style.width = `${width / fontSize}em`;

}


// Mengetik teks per karakter

async function typeText(element, text, speed, fit = false) {

    for (const char of text) {

        element.textContent += char;

        if (fit) {
            fitWidthTo(element, 90);
        }

        await sleep(speed);

    }

}


// Memecah teks menjadi elemen per karakter

function splitChars(element, text) {

    element.textContent = "";

    return [...text].map(char => {

        const span = document.createElement("span");

        span.textContent = char;
        span.style.display = "inline-block";
        span.style.whiteSpace = "pre";

        element.appendChild(span);

        return span;

    });

}


// Easing untuk liquid morph

const easeInOutCubic = t =>
    t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;


// ==========================
// 4. INTRO: MEDIA SCENE
// ==========================

async function intro() {

    staticWord.textContent = "";

    currentWord.classList.add("typing");

    await typeText(
        currentWord,
        "Media",
        TYPE_SPEED,
        true
    );

    currentWord.classList.remove("typing");

    staticWord.classList.add("typing");

    await sleep(TYPE_SPEED * 2);

    await typeText(
        staticWord,
        "Scene",
        TYPE_SPEED
    );

    await sleep(350);

    staticWord.classList.remove("typing");

}


// ==========================
// 5. WORD TRANSITION
// ==========================

function transitionWord(newWord, isFinal = false) {

    const oldEl = currentWord;

    const newEl = document.createElement("span");

    newEl.className = "word-inner";

    if (isFinal) {
        newEl.classList.add("final-word");
    }

    newEl.textContent = newWord;

    changingWord.appendChild(newEl);

    fitWidthTo(newEl, WIDTH_MS);


    // Kata lama keluar

    oldEl.animate(
        [
            {
                transform: "translateY(0)",
                opacity: 1,
                filter: "blur(0px)"
            },
            {
                transform: "translateY(40%)",
                opacity: 0,
                filter: "blur(6px)"
            }
        ],
        {
            duration: EXIT_MS,
            easing: EASE,
            fill: "forwards"
        }
    ).finished.then(() => oldEl.remove());


    // Kata baru masuk

    const enter = newEl.animate(
        [
            {
                transform: "translateY(-40%)",
                opacity: 0,
                filter: "blur(6px)"
            },
            {
                transform: "translateY(0)",
                opacity: 1,
                filter: "blur(0px)"
            }
        ],
        {
            duration: ENTER_MS,
            easing: EASE,
            fill: "backwards"
        }
    );

    currentWord = newEl;

    return enter.finished;

}


// ==========================
// 6. LIQUID MORPH
// MY OWN -> MEDIA
// ==========================

async function morphToMedia() {

    const oldEl = currentWord;

    const oldChars = splitChars(oldEl, "My own");

    const newEl = document.createElement("span");

    newEl.className = "word-inner";

    const newChars = splitChars(newEl, "Media");

    changingWord.appendChild(newEl);

    fitWidthTo(newEl, MORPH_MS);


    const fontSize = parseFloat(
        getComputedStyle(changingWord).fontSize
    );

    const blurScale = fontSize / 100;

    const finalColor = getComputedStyle(oldChars[0]).color;
    const textColor = getComputedStyle(document.body).color;


    const xOf = (element, base) =>
        element.getBoundingClientRect().left -
        base.getBoundingClientRect().left;


    // Pasangan huruf yang berubah

    const pairs = [
        [1, 1],
        [3, 2],
        [4, 3],
        [5, 4]
    ];

    const moves = pairs.map(([oldIndex, newIndex]) => ({

        oldC: oldChars[oldIndex],
        newC: newChars[newIndex],

        dx:
            xOf(newChars[newIndex], newEl) -
            xOf(oldChars[oldIndex], oldEl)

    }));


    // Huruf M tetap, hanya berubah warna

    const mOld = oldChars[0];

    const mDx =
        xOf(newChars[0], newEl) -
        xOf(mOld, oldEl);

    newChars[0].style.visibility = "hidden";

    mOld.style.color = finalColor;
    mOld.style.transition = `color ${MORPH_MS}ms ${EASE}`;

    void mOld.offsetWidth;

    mOld.style.color = textColor;


    // Huruf baru mulai transparan

    moves.forEach(move => {
        move.newC.style.opacity = "0";
    });


    // Aktifkan liquid filter

    changingWord.style.filter =
        "url(#goo-threshold) blur(0.6px)";


    const blurFor = value =>
        Math.min(
            8 / Math.max(value, 0.0001) - 8,
            100
        ) * blurScale;


    const total =
        MORPH_MS +
        (moves.length - 1) * MORPH_STAGGER;


    // Render animasi setiap frame

    function render(elapsed) {

        moves.forEach((move, index) => {

            const t = Math.min(
                Math.max(
                    (elapsed - index * MORPH_STAGGER) / MORPH_MS,
                    0
                ),
                1
            );

            const f = easeInOutCubic(t);
            const g = 1 - f;


            // Huruf lama meleleh

            move.oldC.style.transform =
                `translateX(${move.dx * f}px)`;

            move.oldC.style.opacity =
                Math.pow(g, 0.4);

            move.oldC.style.filter =
                `blur(${blurFor(g)}px)`;


            // Huruf baru mengeras

            move.newC.style.transform =
                `translateX(${-move.dx * g}px)`;

            move.newC.style.opacity =
                Math.pow(f, 0.4);

            move.newC.style.filter =
                `blur(${blurFor(f)}px)`;

        });


        // Pergerakan huruf M

        const tm = Math.min(
            Math.max(elapsed / MORPH_MS, 0),
            1
        );

        mOld.style.transform =
            `translateX(${mDx * easeInOutCubic(tm)}px)`;

    }


    // Jalankan animasi

    await new Promise(resolve => {

        const start = performance.now();

        function frame(now) {

            const elapsed = now - start;

            render(elapsed);

            if (elapsed < total) {
                requestAnimationFrame(frame);
            } else {
                resolve();
            }

        }

        requestAnimationFrame(frame);

    });


    // Bersihkan style animasi

    changingWord.style.filter = "";

    oldEl.remove();

    newChars.forEach(char => {

        char.style.opacity = "";
        char.style.filter = "";
        char.style.transform = "";
        char.style.visibility = "";

    });

    currentWord = newEl;

}


// ==========================
// 7. WORD SEQUENCE
// ==========================

async function startWordSequence() {

    for (let i = 0; i < words.length; i++) {

        await sleep(HOLD);

        const isFinal = i === words.length - 1;

        await transitionWord(
            words[i],
            isFinal
        );

    }


    // Tahan My own Scene

    await sleep(FINAL_HOLD);


    // Morph kembali menjadi Media Scene

    await morphToMedia();


    // Intro selesai

    document.body.classList.add("intro-finished");

}


// ==========================
// 8. START ANIMATION
// ==========================

window.addEventListener("load", async () => {

    // Tunggu font Poppins siap

    try {

        await document.fonts.load("600 16px Poppins");
        await document.fonts.ready;

    } catch (error) {

        console.warn("Poppins font gagal dimuat:", error);

    }


    await sleep(400);


    // Reduced motion: tampilkan hasil akhir

    if (reduceMotion) {

        wordInner.textContent = "Media";
        staticWord.textContent = "Scene";

        fitWidthTo(wordInner, 0);

        document.body.classList.add("intro-finished");

        return;

    }


    await intro();

    await startWordSequence();

});


// ==========================
// 9. PORTFOLIO NAVIGATION
// ==========================

let leaving = false;

sceneButton.addEventListener("click", () => {

    if (leaving) return;

    leaving = true;

    window.location.href = "portfolio.html";

});
