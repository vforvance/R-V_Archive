// --- 1. CORE WINDOW CONTROLS ---
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
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'flex';
        bringToFront('start-menu');
    } else {
        menu.style.display = 'none';
    }
}

// Global click listener to close start menu
document.addEventListener('click', function(event) {
    const menu = document.getElementById('start-menu');
    const startBtn = document.querySelector('.start-button');
    if (menu.style.display === 'flex') {
        if (!menu.contains(event.target) && !startBtn.contains(event.target)) {
            menu.style.display = 'none';
        }
    }
});

function bringToFront(id) {
    // Select both windows and sticky notes
    const items = document.querySelectorAll('.window, .sticky-note');
    items.forEach(item => {
        item.style.zIndex = "10";
    });
    const activeItem = document.getElementById(id);
    if (activeItem) activeItem.style.zIndex = "100";
}

// --- 2. DRAGGABLE LOGIC (Fixed for all elements) ---
function makeDraggable(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    // Look for a title bar or a sticky header
    const header = elmnt.querySelector(".title-bar") || elmnt.querySelector(".sticky-header");

    if (header) {
        header.onmousedown = dragMouseDown;
    } else {
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        // Don't drag if clicking buttons or textarea
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;
        
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        bringToFront(elmnt.id);
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        if (elmnt.classList.contains('sticky-note')) saveNotes();
    }
}

// Apply draggable to existing windows
document.querySelectorAll('.window').forEach(makeDraggable);

// --- 3. PHOTO GALLERY ---
const photoList = [
    "Gemini_Generated_Image_5jaj355jaj355jaj.png", 
    "https://win98icons.alexmeub.com/icons/png/joy-0.png", // Example 1
    "https://win98icons.alexmeub.com/icons/png/msagent-2.png" // Example 2
];
let currentPhotoIdx = 0;

function changePhoto(direction) {
    currentPhotoIdx += direction;
    if (currentPhotoIdx < 0) currentPhotoIdx = photoList.length - 1;
    if (currentPhotoIdx >= photoList.length) currentPhotoIdx = 0;
    document.getElementById('current-photo').src = photoList[currentPhotoIdx];
}

// --- 4. WALLPAPER & SETTINGS ---
function uploadBackground(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const url = e.target.result;
        document.body.style.backgroundImage = `url('${url}')`;
        document.body.style.backgroundSize = "cover";
        localStorage.setItem('customBG', url);
    };
    reader.readAsDataURL(file);
}

function resetBackground() {
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "#ffb7b2";
    localStorage.removeItem('customBG');
}

// --- 5. STICKY NOTES ---
function createStickyNote(text = "", top = "100px", left = "100px") {
    const id = 'note-' + Date.now();
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.id = id;
    note.style.top = top;
    note.style.left = left;

    note.innerHTML = `
        <div class="sticky-header">
            <span class="close-note" onclick="document.getElementById('${id}').remove(); saveNotes();">X</span>
        </div>
        <textarea oninput="saveNotes()">${text}</textarea>
    `;
    
    document.body.appendChild(note);
    makeDraggable(note);
    saveNotes();
}

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

// --- 6. INITIALIZATION ---
function updateTime() {
    const clock = document.getElementById('clock');
    if (clock) {
        const now = new Date();
        clock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

window.onload = function() {
    // Load Wallpaper
    const savedBG = localStorage.getItem('customBG');
    if (savedBG) {
        document.body.style.backgroundImage = `url('${savedBG}')`;
        document.body.style.backgroundSize = "cover";
    }

    // Load Notes
    const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || "[]");
    savedNotes.forEach(n => createStickyNote(n.text, n.top, n.left));
    
    // Start Clock
    setInterval(updateTime, 1000);
    updateTime();
};
