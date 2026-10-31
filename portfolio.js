// ==========================
// PORTFOLIO PAGE
// ==========================


// ==========================
// 1) FOTO HASIL PORTO (background)
// Taruh file di folder "images/" (sejajar dengan portfolio.html),
// lalu tulis namanya di sini. Contoh:
//   "images/poster-01.webp",
// Kalau masih kosong, background pakai tile warna placeholder.
// ==========================

const POSTERS = [
    // "images/poster-01.webp",
    // "images/poster-02.webp",
];


// ==========================
// 2) CLIENT (1 baris card besar, geser kiri/kanan)
// Opsional per client:
//   status: "Ongoing" atau "Past"   -> muncul badge kecil
//   url: "https://..."              -> card jadi bisa diklik
// ==========================

const CLIENTS = [
    { name: "Lekker" },
    { name: "Runguu" },
    { name: "CanHouse" },
    { name: "Client 04" },   // <- ganti dengan nama client asli
    { name: "Client 05" },
    { name: "Client 06" },
    { name: "Client 07" },
    { name: "Client 08" },
    { name: "Client 09" }
];


// ==========================
// BACKGROUND WALL
// ==========================

const wall = document.getElementById("posterWall");
const grid = document.getElementById("clientGrid");

const GAP = 18;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function placeholderGradient(col, row) {

    const hue = (col * 47 + row * 71) % 360;

    return `linear-gradient(160deg, hsl(${hue} 58% 58%), hsl(${(hue + 42) % 360} 62% 36%))`;

}

function makeTile(col, row) {

    const tile = document.createElement("div");
    tile.className = "tile";

    const tilt = ((col + row) % 2 ? -1 : 1) * (1 + ((col * row) % 3) * 0.4);
    tile.style.setProperty("--r", `${tilt}deg`);

    const usePlaceholder = () => {
        tile.classList.add("ph");
        tile.style.background = placeholderGradient(col, row);
    };

    if (POSTERS.length) {

        const img = document.createElement("img");

        img.src = POSTERS[(col * 5 + row) % POSTERS.length];
        img.alt = "";
        img.draggable = false;
        img.loading = "lazy";
        img.decoding = "async";

        img.addEventListener("error", () => {
            img.remove();
            usePlaceholder();
        });

        tile.appendChild(img);

    } else {

        usePlaceholder();

    }

    return tile;

}

let lastWidth = 0;

function buildWall() {

    lastWidth = window.innerWidth;

    wall.textContent = "";

    const colW = Math.min(Math.max(window.innerWidth * 0.15, 120), 240);
    const cols = Math.ceil((window.innerWidth * 1.7) / (colW + GAP));

    // tinggi visual 1 tile (aspect 2:3, dikurangi overlap 10%)
    const tileH = colW * 1.4;
    const perHalf = Math.max(4, Math.ceil((window.innerHeight * 1.8) / tileH));

    wall.style.setProperty("--col-w", `${colW}px`);
    wall.style.setProperty("--gap", `${GAP}px`);

    const tilt = document.createElement("div");
    tilt.className = "poster-tilt";

    for (let c = 0; c < cols; c++) {

        const col = document.createElement("div");
        col.className = "poster-col";
        col.style.setProperty("--i", c);
        col.style.setProperty("--from", c % 2 ? "-70px" : "70px");

        const track = document.createElement("div");
        track.className = "poster-track " + (c % 2 ? "down" : "up");
        track.style.setProperty("--dur", `${64 + (c % 3) * 12}s`);

        // 2 paruh identik -> loop mulus tanpa lompatan
        for (let half = 0; half < 2; half++) {
            for (let r = 0; r < perHalf; r++) {
                track.appendChild(makeTile(c, r));
            }
        }

        col.appendChild(track);
        tilt.appendChild(col);

    }

    wall.appendChild(tilt);

}


// ==========================
// CLIENT CARDS (1 baris besar, geser horizontal)
// Cara geser: panah di bawah, keyboard kiri/kanan, scroll mouse,
// swipe di HP/trackpad, atau klik card di sampingnya.
// ==========================

const scroller = grid;
const clientsMain = document.querySelector(".clients");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const navCount = document.getElementById("navCount");

const cards = [];

let target = 0;          // card yang dituju
let visual = -1;         // card yang lagi aktif secara visual
let programmatic = false;
let idleTimer;

const pad = (n) => String(n).padStart(2, "0");
const clampIndex = (i) => Math.max(0, Math.min(cards.length - 1, i));

const stepSize = () =>
    cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1;

function setActive(index) {

    if (index === visual) return;
    visual = index;

    cards.forEach((card, i) => card.classList.toggle("is-active", i === index));

    navCount.textContent = `${pad(index + 1)} / ${pad(cards.length)}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === cards.length - 1;

}

// Dipanggil saat scroll berhenti: sinkronkan state dengan posisi asli
function syncToScroll() {

    programmatic = false;

    const i = clampIndex(Math.round(scroller.scrollLeft / stepSize()));
    target = i;
    setActive(i);

}

function go(index, instant = false) {

    target = clampIndex(index);
    programmatic = true;

    scroller.scrollTo({
        left: target * stepSize(),
        behavior: instant || reduceMotion ? "auto" : "smooth"
    });

    setActive(target);

    // cadangan kalau ga ada event scroll (posisi sudah di tempat)
    clearTimeout(idleTimer);
    idleTimer = setTimeout(syncToScroll, 900);

}

function buildClients() {

    CLIENTS.forEach((client, i) => {

        const slot = document.createElement("div");
        slot.className = "client-card";
        slot.style.setProperty("--i", i);

        const face = document.createElement(client.url ? "a" : "article");
        face.className = "card-face";

        if (client.url) {
            face.href = client.url;
            face.target = "_blank";
            face.rel = "noopener noreferrer";
        }

        const top = document.createElement("div");
        top.className = "card-top";

        const index = document.createElement("span");
        index.textContent = pad(i + 1);
        top.appendChild(index);

        if (client.status) {
            const status = document.createElement("span");
            status.className = "card-status";
            status.textContent = client.status;
            top.appendChild(status);
        } else if (client.url) {
            const arrow = document.createElement("span");
            arrow.className = "card-arrow";
            arrow.textContent = "↗";
            top.appendChild(arrow);
        }

        const name = document.createElement("h2");
        name.className = "card-name";
        name.textContent = client.name;

        face.append(top, name);
        slot.appendChild(face);

        // Klik card di samping -> geser ke card itu (bukan buka link-nya)
        slot.addEventListener("click", (event) => {
            if (i !== visual) {
                event.preventDefault();
                go(i);
            }
        });

        grid.appendChild(slot);
        cards.push(slot);

    });

    setActive(0);

}


// Swipe / drag / trackpad horizontal (native) -> update state
scroller.addEventListener("scroll", () => {

    if (!programmatic) {
        setActive(clampIndex(Math.round(scroller.scrollLeft / stepSize())));
    }

    clearTimeout(idleTimer);
    idleTimer = setTimeout(syncToScroll, 140);

}, { passive: true });

prevBtn.addEventListener("click", () => go(target - 1));
nextBtn.addEventListener("click", () => go(target + 1));

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") go(target + 1);
    if (event.key === "ArrowLeft") go(target - 1);
});

// Scroll mouse (vertikal) -> pindah 1 card per gulir
let wheelLock = false;

clientsMain.addEventListener("wheel", (event) => {

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();

    if (wheelLock || Math.abs(event.deltaY) < 8) return;

    wheelLock = true;
    go(target + Math.sign(event.deltaY));

    setTimeout(() => { wheelLock = false; }, 650);

}, { passive: false });


// ==========================
// START
// ==========================

buildWall();
buildClients();

// Resize: rebuild wall kalau lebar berubah jauh, card tetap di tengah
let resizeTimer;

window.addEventListener("resize", () => {

    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
        if (Math.abs(window.innerWidth - lastWidth) > 60) buildWall();
        go(target, true);
    }, 250);

});