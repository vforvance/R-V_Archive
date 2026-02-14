// --- WINDOW CONTROLS ---
function openWindow(id) {
    document.getElementById(id).style.display = 'block';
    bringToFront(id);
}

function closeWindow(id) {
    document.getElementById(id).style.display = 'none';
}

function toggleStartMenu() {
    const m = document.getElementById('start-menu');
    m.style.display = (m.style.display === 'none') ? 'flex' : 'none';
}

function bringToFront(id) {
    const items = document.querySelectorAll('.window, .sticky-note');
    items.forEach(i => i.style.zIndex = "10");
    document.getElementById(id).style.zIndex = "100";
}

// --- PHOTO GALLERY ---
const photoList = ["Gemini_Generated_Image_5jaj355jaj355jaj.png", "photo2.jpg", "photo3.jpg"];
let photoIdx = 0;
function changePhoto(n) {
    photoIdx = (photoIdx + n + photoList.length) % photoList.length;
    document.getElementById('current-photo').src = photoList[photoIdx];
}

// --- WALLPAPER ---
function uploadBackground(e) {
    const reader = new FileReader();
    reader.onload = () => {
        document.body.style.backgroundImage = `url(${reader.result})`;
        localStorage.setItem('os-bg', reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
}

function resetBackground() {
    document.body.style.backgroundImage = '';
    localStorage.removeItem('os-bg');
}

// --- STICKY NOTES ---
function createStickyNote(text = "", t = "100px", l = "100px") {
    const id = "note-" + Date.now();
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.id = id;
    note.style.top = t; note.style.left = l;
    note.innerHTML = `
        <div class="sticky-header"><span class="close-note" onclick="this.closest('.sticky-note').remove(); saveNotes();">X</span></div>
        <textarea oninput="saveNotes()">${text}</textarea>`;
    document.body.appendChild(note);
    makeDraggable(note);
}

function saveNotes() {
    const notes = Array.from(document.querySelectorAll('.sticky-note')).map(n => ({
        text: n.querySelector('textarea').value,
        t: n.style.top, l: n.style.left
    }));
    localStorage.setItem('os-notes', JSON.stringify(notes));
}

// --- DRAGGABLE ---
function makeDraggable(el) {
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    const header = el.querySelector(".title-bar") || el.querySelector(".sticky-header");
    header.onmousedown = (e) => {
        p3 = e.clientX; p4 = e.clientY;
        document.onmousemove = (e) => {
            p1 = p3 - e.clientX; p2 = p4 - e.clientY;
            p3 = e.clientX; p4 = e.clientY;
            el.style.top = (el.offsetTop - p2) + "px";
            el.style.left = (el.offsetLeft - p1) + "px";
        };
        document.onmouseup = () => { document.onmousemove = null; saveNotes(); };
        bringToFront(el.id);
    };
}

// --- INIT ---
window.onload = () => {
    document.querySelectorAll('.window').forEach(makeDraggable);
    const bg = localStorage.getItem('os-bg');
    if (bg) document.body.style.backgroundImage = `url(${bg})`;
    JSON.parse(localStorage.getItem('os-notes') || "[]").forEach(n => createStickyNote(n.text, n.t, n.l));
    setInterval(() => {
        document.getElementById('clock').innerText = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }, 1000);
};
