// --- 1. CORE FUNCTIONS ---
function openWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        win.style.display = 'block';
        bringToFront(id);
    }
}

function closeWindow(id) {
    const win = document.getElementById(id);
    if (win) win.style.display = 'none';
}

function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    if (menu) {
        menu.style.display = (menu.style.display === 'none' || menu.style.display === '') ? 'flex' : 'none';
    }
}

function bringToFront(id) {
    const all = document.querySelectorAll('.window, .sticky-note');
    all.forEach(el => el.style.zIndex = "10");
    const active = document.getElementById(id);
    if (active) active.style.zIndex = "100";
}

// --- 2. DRAGGABLE LOGIC ---
function makeDraggable(el) {
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    const header = el.querySelector(".title-bar") || el.querySelector(".sticky-header");
    
    if (!header) return;

    header.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        p3 = e.clientX; 
        p4 = e.clientY;
        document.onmousemove = (e) => {
            p1 = p3 - e.clientX; 
            p2 = p4 - e.clientY;
            p3 = e.clientX; 
            p4 = e.clientY;
            el.style.top = (el.offsetTop - p2) + "px";
            el.style.left = (el.offsetLeft - p1) + "px";
        };
        document.onmouseup = () => { 
            document.onmousemove = null; 
            if (el.classList.contains('sticky-note')) saveNotes(); 
        };
        bringToFront(el.id);
    };
}

// --- 3. GALLERY & BG ---
const photoList = ["Gemini_Generated_Image_5jaj355jaj355jaj.png"]; // Add more later
let photoIdx = 0;
function changePhoto(n) {
    photoIdx = (photoIdx + n + photoList.length) % photoList.length;
    document.getElementById('current-photo').src = photoList[photoIdx];
}

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

// --- 4. STICKY NOTES ---
function createStickyNote(text = "", t = "100px", l = "100px") {
    const id = "note-" + Date.now();
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.id = id;
    note.style.top = t; note.style.left = l;
    note.innerHTML = `<div class="sticky-header" onclick="bringToFront('${id}')"><span style="float:right;cursor:pointer;padding:2px;" onclick="this.closest('.sticky-note').remove();saveNotes();">X</span></div><textarea oninput="saveNotes()">${text}</textarea>`;
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

// --- 5. INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // Set Draggables
    document.querySelectorAll('.window').forEach(makeDraggable);
    
    // Load Wallpaper
    const bg = localStorage.getItem('os-bg');
    if (bg) document.body.style.backgroundImage = `url(${bg})`;

    // Load Notes
    const savedNotes = JSON.parse(localStorage.getItem('os-notes') || "[]");
    savedNotes.forEach(n => createStickyNote(n.text, n.t, n.l));

    // Clock
    setInterval(() => {
        const c = document.getElementById('clock');
        if (c) c.innerText = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }, 1000);
});
