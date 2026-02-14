// --- PHOTO GALLERY LOGIC ---
const photoList = [
    "Gemini_Generated_Image_5jaj355jaj355jaj.png",
    "https://via.placeholder.com/350x200/ffb7b2/ffffff?text=Photo+2",
    "https://via.placeholder.com/350x200/ff6961/ffffff?text=Photo+3"
];
let currentPhotoIdx = 0;

function changePhoto(direction) {
    currentPhotoIdx += direction;
    if (currentPhotoIdx < 0) currentPhotoIdx = photoList.length - 1;
    if (currentPhotoIdx >= photoList.length) currentPhotoIdx = 0;
    document.getElementById('current-photo').src = photoList[currentPhotoIdx];
}

// --- WALLPAPER SETTINGS ---
function uploadBackground(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const url = e.target.result;
        document.body.style.backgroundImage = `url('${url}')`;
        localStorage.setItem('customBG', url); // Save wallpaper
    };
    reader.readAsDataURL(file);
}

function resetBackground() {
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "#ffb7b2";
    localStorage.removeItem('customBG');
}

// --- STICKY NOTES LOGIC ---
function createStickyNote(text = "", top = "100px", left = "100px") {
    const id = 'note-' + Date.now();
    const note = document.createElement('div');
    note.className = 'sticky-note draggable';
    note.id = id;
    note.style.top = top;
    note.style.left = left;

    note.innerHTML = `
        <div class="sticky-header"><span class="close-note" onclick="this.parentElement.parentElement.remove()">X</span></div>
        <textarea oninput="saveNotes()">${text}</textarea>
    `;
    
    document.body.appendChild(note);
    dragElement(note);
    saveNotes();
}

// Save notes to LocalStorage
function saveNotes() {
    const notes = [];
    document.querySelectorAll('.sticky-note').forEach(n => {
        notes.push({
            text: n.querySelector('textarea').value,
            top: n.style.top,
            left: n.style.left
        });
    });
    localStorage.setItem('savedNotes', JSON.stringify(notes));
}

// Load everything on startup
window.onload = function() {
    // Load Wallpaper
    const savedBG = localStorage.getItem('customBG');
    if (savedBG) document.body.style.backgroundImage = `url('${savedBG}')`;

    // Load Notes
    const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || "[]");
    savedNotes.forEach(n => createStickyNote(n.text, n.top, n.left));
    
    updateTime();
};

// Existing functions: openWindow, closeWindow, toggleStartMenu, dragElement, updateTime
// (Keep your existing code for these below)

function openWindow(id) {
    document.getElementById(id).style.display = 'block';
    bringToFront(id);
}

function closeWindow(id) {
    document.getElementById(id).style.display = 'none';
}

function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    menu.style.display = (menu.style.display === 'none') ? 'flex' : 'none';
    if(menu.style.display === 'flex') bringToFront('start-menu');
}

function bringToFront(id) {
    const windows = document.querySelectorAll('.window, .sticky-note');
    windows.forEach(w => w.style.zIndex = 10);
    const element = document.getElementById(id);
    if(element) element.style.zIndex = 100;
}

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = elmnt.querySelector(".title-bar") || elmnt.querySelector(".sticky-header");
    if (header) { header.onmousedown = dragMouseDown; }

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; saveNotes(); };
        document.onmousemove = elementDrag;
        bringToFront(elmnt.id);
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
}

function updateTime() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateTime, 1000);
