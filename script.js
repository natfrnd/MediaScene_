// ==========================
// MEDIASCENE ANIMATION
// ==========================

const changingWord = document.getElementById("changingWord");
const wordInner = document.getElementById("wordInner");
const staticWord = document.getElementById("staticWord");

const sceneButton = document.getElementById("sceneButton");

const words = ["Coffee", "Food", "Music", "Punk", "Life", "My own"];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Timing (ms), atur di sini ---
const TYPE_SPEED = 55;       // kecepatan ngetik per huruf (intro)
const HOLD = 800;            // jeda diam antar kata
const FINAL_HOLD = 1400;     // jeda di "My own Scene" sebelum morph

const EXIT_MS = 160;         // kata lama keluar
const ENTER_MS = 240;        // kata baru masuk
const WIDTH_MS = 260;        // "Scene" geser ke posisi baru

const MORPH_MS = 900;        // durasi morph tiap huruf (My own -> Media)
const MORPH_STAGGER = 50;    // jeda antar huruf (efek gelombang)

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

let currentWord = wordInner;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


// ==========================
// FILTER "LIQUID" (dipasang otomatis, ga perlu edit HTML)
// ==========================

document.body.insertAdjacentHTML("beforeend", `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <defs>
        <filter id="goo-threshold" x="-20%" y="-30%" width="140%" height="160%"
                color-interpolation-filters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"/>
        </filter>
    </defs>
</svg>
`);


// ==========================
// HELPERS
// ==========================

// Lebar area kata ngikutin lebar teks (satuan em, aman pas resize)
function fitWidthTo(element, duration) {

    const fontSize = parseFloat(getComputedStyle(changingWord).fontSize);
    const width = element.getBoundingClientRect().width;

    changingWord.style.transitionDuration = `${duration}ms`;
    changingWord.style.width = `${width / fontSize}em`;

}

// Ketik teks huruf per huruf
async function typeText(element, text, speed, fit = false) {

    for (const char of text) {

        element.textContent += char;

        if (fit) fitWidthTo(element, 90);

        await sleep(speed);

    }

}


// ==========================
// INTRO: ngetik "Media Scene"
// ==========================

async function intro() {

    staticWord.textContent = "";

    currentWord.classList.add("typing");
    await typeText(currentWord, "Media", TYPE_SPEED, true);
    currentWord.classList.remove("typing");

    staticWord.classList.add("typing");
    await sleep(TYPE_SPEED * 2);               // jeda "spasi"
    await typeText(staticWord, "Scene", TYPE_SPEED);
    await sleep(350);
    staticWord.classList.remove("typing");

}


// ==========================
// GANTI KATA (crossfade cepat)
// ==========================

function transitionWord(newWord, isFinal = false) {

    const oldEl = currentWord;

    const newEl = document.createElement("span");
    newEl.className = "word-inner" + (isFinal ? " final-word" : "");
    newEl.textContent = newWord;
    changingWord.appendChild(newEl);

    fitWidthTo(newEl, WIDTH_MS);

    oldEl.animate(
        [
            { transform: "translateY(0)", opacity: 1, filter: "blur(0px)" },
            { transform: "translateY(40%)", opacity: 0, filter: "blur(6px)" }
        ],
        { duration: EXIT_MS, easing: EASE, fill: "forwards" }
    ).finished.then(() => oldEl.remove());

    const enter = newEl.animate(
        [
            { transform: "translateY(-40%)", opacity: 0, filter: "blur(6px)" },
            { transform: "translateY(0)", opacity: 1, filter: "blur(0px)" }
        ],
        { duration: ENTER_MS, easing: EASE, fill: "backwards" }
    );

    currentWord = newEl;

    return enter.finished;

}


// ==========================
// MORPH "My own" -> "Media" (liquid / meliuk)
// y->e, o->d, w->i, n->a, M tetap (warna balik normal)
//
// Tiap huruf lama meleleh (blur) sambil geser ke posisi huruf baru,
// huruf baru "mengeras" dari blur. Filter threshold bikin
// bentuk huruf menyatu & meliuk kayak cairan.
// ==========================

function splitChars(element, text) {

    element.textContent = "";

    return [...text].map((char) => {

        const span = document.createElement("span");

        span.textContent = char;
        span.style.display = "inline-block";
        span.style.whiteSpace = "pre";

        element.appendChild(span);

        return span;

    });

}

const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

async function morphToMedia() {

    // Kata lama: "My own" dipecah per huruf
    const oldEl = currentWord;
    const oldChars = splitChars(oldEl, "My own");

    // Kata baru: "Media" dipecah per huruf
    const newEl = document.createElement("span");
    newEl.className = "word-inner";

    const newChars = splitChars(newEl, "Media");
    changingWord.appendChild(newEl);

    // "Scene" geser ke posisi baru bareng morph
    fitWidthTo(newEl, MORPH_MS);

    const fontSize = parseFloat(getComputedStyle(changingWord).fontSize);
    const blurScale = fontSize / 100;

    const finalColor = getComputedStyle(oldChars[0]).color;   // ungu
    const textColor = getComputedStyle(document.body).color;  // normal

    const xOf = (el, base) =>
        el.getBoundingClientRect().left - base.getBoundingClientRect().left;

    // Huruf yang berubah: [index "My own", index "Media"]
    // y->e, o->d, w->i, n->a  (index 2 = spasi, hilang)
    const pairs = [[1, 1], [3, 2], [4, 3], [5, 4]];

    const moves = pairs.map(([o, n]) => ({
        oldC: oldChars[o],
        newC: newChars[n],
        dx: xOf(newChars[n], newEl) - xOf(oldChars[o], oldEl)
    }));

    // Huruf M: tetap, cuma warna ungu -> normal
    const mOld = oldChars[0];
    const mDx = xOf(newChars[0], newEl) - xOf(mOld, oldEl);

    newChars[0].style.visibility = "hidden";

    mOld.style.color = finalColor;
    mOld.style.transition = `color ${MORPH_MS}ms ${EASE}`;
    void mOld.offsetWidth;
    mOld.style.color = textColor;

    // Huruf baru mulai dari tak terlihat
    moves.forEach((m) => { m.newC.style.opacity = "0"; });

    // Nyalain efek liquid selama morph
    changingWord.style.filter = "url(#goo-threshold) blur(0.6px)";

    const blurFor = (x) =>
        Math.min(8 / Math.max(x, 0.0001) - 8, 100) * blurScale;

    const total = MORPH_MS + (moves.length - 1) * MORPH_STAGGER;

    const render = (elapsed) => {

        moves.forEach((m, k) => {

            const t = Math.min(Math.max((elapsed - k * MORPH_STAGGER) / MORPH_MS, 0), 1);
            const f = easeInOutCubic(t);   // 0 -> 1
            const g = 1 - f;               // 1 -> 0

            // Huruf lama: geser ke posisi baru sambil meleleh
            m.oldC.style.transform = `translateX(${m.dx * f}px)`;
            m.oldC.style.opacity = Math.pow(g, 0.4);
            m.oldC.style.filter = `blur(${blurFor(g)}px)`;

            // Huruf baru: dari posisi huruf lama, mengeras
            m.newC.style.transform = `translateX(${-m.dx * g}px)`;
            m.newC.style.opacity = Math.pow(f, 0.4);
            m.newC.style.filter = `blur(${blurFor(f)}px)`;

        });

        const tm = Math.min(Math.max(elapsed / MORPH_MS, 0), 1);
        mOld.style.transform = `translateX(${mDx * easeInOutCubic(tm)}px)`;

    };

    render(0);

    await new Promise((resolve) => {

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

    // Bersihin
    changingWord.style.filter = "";
    oldEl.remove();

    newChars.forEach((c) => {
        c.style.opacity = "";
        c.style.filter = "";
        c.style.transform = "";
        c.style.visibility = "";
    });

    currentWord = newEl;

}


// ==========================
// WORD SEQUENCE
// ==========================

async function startWordSequence() {

    for (let i = 0; i < words.length; i++) {

        await sleep(HOLD);

        const isFinal = i === words.length - 1;

        await transitionWord(words[i], isFinal);

    }

    // Tahan "My own Scene" (ungu), lalu morph balik ke "Media Scene"
    await sleep(FINAL_HOLD);
    await morphToMedia();

    // Hasil akhir: "Media Scene", animasi berhenti.

}


// ==========================
// START
// ==========================

window.addEventListener("load", async () => {

    // pastikan Poppins sudah siap supaya ukuran teks akurat
    try {
        await document.fonts.load("600 16px Poppins");
        await document.fonts.ready;
    } catch (e) {}

    await sleep(400);

    // Kalau user matiin animasi di OS: langsung tampil "Media Scene"
    if (reduceMotion) {
        wordInner.textContent = "Media";
        staticWord.textContent = "Scene";
        fitWidthTo(wordInner, 0);
        return;
    }

    await intro();
    await startWordSequence();

});


// ==========================
// BUTTON: klik -> halaman portfolio
// ==========================

let leaving = false;

sceneButton.addEventListener("click", () => {

    if (leaving) return;
    leaving = true;

    document.body.classList.add("leaving");

    setTimeout(() => {
        window.location.href = "portfolio.html";
    }, reduceMotion ? 0 : 450);

});

// Kalau user balik pakai tombol Back browser (halaman dipulihkan dari cache)
window.addEventListener("pageshow", (event) => {

    if (event.persisted) {
        leaving = false;
        document.body.classList.remove("leaving");
    }

});