
// ==========================
// MEDIASCENE — PORTFOLIO PAGE
// ==========================


// ==========================
// 1. CLIENT DATA
// ==========================

const CLIENTS = [
    {
        name: "Lekker 88",
        photo: "jpg/lekker88.webp",
        video: "MP4/lekker88.mp4"
    },
    {
        name: "Sama Space",
        photo: "jpg/samaspace.webp",
        video: "MP4/samaspace.mp4"
    },
    {
        name: "Corney",
        photo: "jpg/corney.webp",
        video: "MP4/corney.mp4"
    },
    {
        name: "Press",
        photo: "jpg/press.webp",
        video: "MP4/press.mp4"
    }
];


// ==========================
// 2. ELEMENTS
// ==========================

const grid = document.getElementById("clientGrid");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const navCount = document.getElementById("navCount");

const clientsMain = document.querySelector(".clients");

const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;


// Pastikan elemen tersedia

if (!grid || !prevBtn || !nextBtn || !navCount) {
    throw new Error("Media Scene: Portfolio elements not found.");
}


// ==========================
// 3. STATE
// ==========================

const cards = [];
const videos = [];

let target = 0;
let visual = -1;

let programmatic = false;
let idleTimer;
let wheelLock = false;

const pad = number =>
    String(number).padStart(2, "0");

const clampIndex = index =>
    Math.max(0, Math.min(cards.length - 1, index));

const stepSize = () =>
    cards.length > 1
        ? cards[1].offsetLeft - cards[0].offsetLeft
        : 1;


// ==========================
// 4. PLACEHOLDER
// ==========================

function placeholderGradient(index) {

    const gradients = [
        "linear-gradient(135deg, #e8e8e8, #cfcfcf)",
        "linear-gradient(135deg, #dedede, #bdbdbd)",
        "linear-gradient(135deg, #ededed, #d2d2d2)",
        "linear-gradient(135deg, #e5e5e5, #c5c5c5)"
    ];

    return gradients[index % gradients.length];

}


// ==========================
// 5. CARD MEDIA
// ==========================

function addPhoto(face, client, index) {

    if (!client.photo) return;

    const img = document.createElement("img");

    img.className = "card-photo";
    img.src = client.photo;
    img.alt = `${client.name} portfolio`;
    img.draggable = false;
    img.decoding = "async";

    img.loading = index === 0 ? "eager" : "lazy";

    img.addEventListener("error", () => {
        img.remove();
    });

    face.appendChild(img);

}


function addVideo(face, client, index) {

    if (!client.video) {
        addPhoto(face, client, index);
        videos[index] = null;
        return;
    }

    const video = document.createElement("video");

    video.className = "card-photo card-video";

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;

    video.preload = "none";
    video.disablePictureInPicture = true;

    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("aria-hidden", "true");

    if (client.photo) {
        video.poster = client.photo;
    }

    video.dataset.src = client.video;

    video.addEventListener("error", () => {

        video.remove();

        videos[index] = null;

        addPhoto(face, client, index);

    });

    face.appendChild(video);

    videos[index] = video;

}


// ==========================
// 6. BUILD CLIENT CARDS
// ==========================

function buildClients() {

    grid.textContent = "";

    cards.length = 0;
    videos.length = 0;

    CLIENTS.forEach((client, index) => {

        // Card container

        const slot = document.createElement("div");

        slot.className = "client-card";


        // Card face

        const face = document.createElement(
            client.url ? "a" : "article"
        );

        face.className = "card-face";

        face.style.background = placeholderGradient(index);


        // Optional external link

        if (client.url) {

            face.href = client.url;
            face.target = "_blank";
            face.rel = "noopener noreferrer";

        }


        // Add video or photo

        addVideo(face, client, index);


        // Card top content

        const top = document.createElement("div");

        top.className = "card-top";


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


        // Client name

        const name = document.createElement("h2");

        name.className = "card-name";
        name.textContent = client.name;


        face.append(top, name);

        slot.appendChild(face);


        // Click inactive card to navigate to it

        slot.addEventListener("click", event => {

            if (index !== visual) {

                event.preventDefault();

                go(index);

            }

        });


        grid.appendChild(slot);

        cards.push(slot);

    });


    setActive(0);

}


// ==========================
// 7. VIDEO PLAYBACK
// ==========================

function updateVideos() {

    videos.forEach(video => {

        if (!video) return;


        // Load video if not loaded

        if (!video.getAttribute("src")) {

            video.preload = "auto";
            video.src = video.dataset.src;

            video.load();

        }


        // Keep videos playing

        if (!reduceMotion && !document.hidden) {

            const playing = video.play();

            if (playing) {
                playing.catch(() => {});
            }

        } else {

            video.pause();

        }

    });

}


// ==========================
// 8. ACTIVE CARD
// ==========================

function setActive(index) {

    if (!cards.length) return;

    index = clampIndex(index);

    if (index === visual) return;

    visual = index;


    // Update navigation counter

    navCount.textContent =
        `${pad(index + 1)} / ${pad(cards.length)}`;


    // Update navigation buttons

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === cards.length - 1;


    // Update video playback

    updateVideos();

}


// ==========================
// 9. NAVIGATION
// ==========================

function syncToScroll() {

    if (!cards.length) return;

    programmatic = false;

    const index = clampIndex(
        Math.round(grid.scrollLeft / stepSize())
    );

    target = index;

    setActive(index);

}


function go(index, instant = false) {

    if (!cards.length) return;

    target = clampIndex(index);

    programmatic = true;

    grid.scrollTo({

        left: target * stepSize(),

        behavior: instant || reduceMotion
            ? "auto"
            : "smooth"

    });

    setActive(target);


    // Fallback synchronization

    clearTimeout(idleTimer);

    idleTimer = setTimeout(syncToScroll, 900);

}


// ==========================
// 10. SCROLL & SWIPE
// ==========================

grid.addEventListener("scroll", () => {

    if (!programmatic) {

        const index = clampIndex(
            Math.round(grid.scrollLeft / stepSize())
        );

        setActive(index);

    }

    clearTimeout(idleTimer);

    idleTimer = setTimeout(syncToScroll, 140);

}, { passive: true });


// ==========================
// 11. BUTTON CONTROLS
// ==========================

prevBtn.addEventListener("click", () => {
    go(target - 1);
});

nextBtn.addEventListener("click", () => {
    go(target + 1);
});


// ==========================
// 12. KEYBOARD CONTROLS
// ==========================

document.addEventListener("keydown", event => {

    if (event.key === "ArrowRight") {
        go(target + 1);
    }

    if (event.key === "ArrowLeft") {
        go(target - 1);
    }

});


// ==========================
// 13. MOUSE WHEEL
// ==========================

clientsMain.addEventListener("wheel", event => {

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
    }

    event.preventDefault();

    if (wheelLock || Math.abs(event.deltaY) < 8) {
        return;
    }

    wheelLock = true;

    go(target + Math.sign(event.deltaY));

    setTimeout(() => {
        wheelLock = false;
    }, 650);

}, { passive: false });


// ==========================
// 14. PAGE VISIBILITY
// ==========================

document.addEventListener("visibilitychange", () => {

    updateVideos();

});


// ==========================
// 15. INITIALIZE
// ==========================

buildClients();


// ==========================
// 16. RESIZE
// ==========================

let resizeTimer;

window.addEventListener("resize", () => {

    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {

        go(target, true);

    }, 250);

});
