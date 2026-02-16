// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBwskNndOxOXmGonLMEscu9c2GHMIYr1rM",
  authDomain: "loveos-98.firebaseapp.com",
  projectId: "loveos-98",
  storageBucket: "loveos-98.firebasestorage.app",
  messagingSenderId: "629215418720",
  appId: "1:629215418720:web:cabed0cfd2bd05eecd6605",
  measurementId: "G-G317KDMCE9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- GLOBAL STATE ---
const USERS = { 'Venance': 'letmein', 'Rehema': 'letmein' };
let selectedUser = null;
let highestZ = 100;

let photoGallery = [];
let currentPhotoIndex = 0;

let envelopeAnimating = false;

// No-button roaming state
let noBtnRoaming = false;
let noBtnRAF = null;
let noBtnX = 0, noBtnY = 0;
let noBtnVX = 0, noBtnVY = 0;


// ================================================================
//  1. BOOT & LOGIN
// ================================================================
function initSystem() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('boot-screen').style.display = 'none';
        document.getElementById('login-overlay').style.display = 'none';
        showDesktop();
    } else {
        runBootSequence();
    }
}

function runBootSequence() {
    const bootLines = document.getElementById('boot-lines');
    const lines = [
        "BIOS Date 02/14/98 12:00:00 Ver: 1.0.0",
        "CPU: Pentium II 333MHz",
        "64MB RAM System OK",
        "Starting Windows 98..."
    ];
    let i = 0;
    const interval = setInterval(() => {
        bootLines.innerText += lines[i] + "\n";
        i++;
        if (i >= lines.length) { clearInterval(interval); setTimeout(showLoginScreen, 1000); }
    }, 500);
}

function showLoginScreen() {
    document.getElementById('boot-screen').style.display = 'none';
    document.getElementById('login-overlay').style.display = 'flex';
    initUserTiles();
}

function initUserTiles() {
    document.querySelectorAll('.user-tile').forEach(tile => {
        tile.onclick = () => selectUser(tile.dataset.user);
    });
}

function selectUser(user) {
    selectedUser = user;
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('password-overlay').style.display = 'flex';
    document.getElementById('pwd-title').innerText = `Welcome ${user}!`;
    document.getElementById('login-pass').value = '';
    document.getElementById('pwd-error').innerText = '';
    document.getElementById('login-pass').focus();
}

function goBackToUserSelect() {
    document.getElementById('password-overlay').style.display = 'none';
    document.getElementById('login-overlay').style.display = 'flex';
    selectedUser = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const loginOkBtn = document.getElementById('btn-login-ok');
    if (loginOkBtn) loginOkBtn.addEventListener('click', attemptLogin);
    const passInput = document.getElementById('login-pass');
    if (passInput) passInput.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
});

function attemptLogin() {
    const pass = document.getElementById('login-pass').value;
    if (selectedUser && USERS[selectedUser] === pass) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('activeUser', selectedUser);
        document.getElementById('password-overlay').style.display = 'none';
        showDesktop();
    } else {
        document.getElementById('pwd-error').innerText = "Incorrect Password";
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    location.reload();
}


// ================================================================
//  2. SHOW DESKTOP
// ================================================================
function showDesktop() {
    document.getElementById('desktop').style.display = 'flex';
    document.querySelector('.taskbar').style.display = 'flex';
    updateClock();
    setInterval(updateClock, 1000);

    initDraggableWindows();

    listenForSharedFiles();
    listenForStickyNotes();
    listenForCalendar();
    listenForWallpaper();
    listenForPhotos();

    setTimeout(showEnvelopeOverlay, 1000);
}


// ================================================================
//  3. DRAGGABLE WINDOWS — mouse + touch
// ================================================================
function initDraggableWindows() {
    document.querySelectorAll('.draggable').forEach(win => {
        const titleBar = win.querySelector('.title-bar');
        win.addEventListener('mousedown', () => bringToFront(win));
        win.addEventListener('touchstart', () => bringToFront(win), { passive: true });
        if (titleBar) {
            titleBar.addEventListener('mousedown', e => dragWindowStart(e, win));
            titleBar.addEventListener('touchstart', e => dragWindowTouchStart(e, win), { passive: false });
        }
    });
}

function bringToFront(win) {
    highestZ++;
    win.style.zIndex = highestZ;
}

function dragWindowStart(e, win) {
    if (e.target.closest('button[aria-label="Close"]')) return;
    e.preventDefault();
    const shiftX = e.clientX - win.getBoundingClientRect().left;
    const shiftY = e.clientY - win.getBoundingClientRect().top;
    function onMouseMove(e) {
        win.style.left = Math.max(0, Math.min(e.pageX - shiftX, window.innerWidth  - win.offsetWidth))  + 'px';
        win.style.top  = Math.max(0, Math.min(e.pageY - shiftY, window.innerHeight - win.offsetHeight - 30)) + 'px';
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', function cleanup() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', cleanup);
    });
}

function dragWindowTouchStart(e, win) {
    if (e.target.closest('button[aria-label="Close"]')) return;
    e.preventDefault();
    const touch = e.touches[0];
    const shiftX = touch.clientX - win.getBoundingClientRect().left;
    const shiftY = touch.clientY - win.getBoundingClientRect().top;
    function onTouchMove(e) {
        const t = e.touches[0];
        win.style.left = Math.max(0, Math.min(t.clientX - shiftX, window.innerWidth  - win.offsetWidth))  + 'px';
        win.style.top  = Math.max(0, Math.min(t.clientY - shiftY, window.innerHeight - win.offsetHeight - 30)) + 'px';
    }
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', function cleanup() {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', cleanup);
    });
}

function handleIconTouch(e, windowId, fn) {
    e.preventDefault();
    if (windowId) openWindow(windowId);
    if (fn) fn();
}


// ================================================================
//  4. ENVELOPE — Win98 overlay, letter slides out
// ================================================================
function showEnvelopeOverlay() {
    envelopeAnimating = false;
    const overlay = document.getElementById('envelope-overlay');
    const envEl   = document.getElementById('env-win98-el');
    envEl.classList.remove('is-open');
    overlay.style.display = 'flex';
}

function openEnvelopeLetter() {
    if (envelopeAnimating) return;
    envelopeAnimating = true;
    const envEl = document.getElementById('env-win98-el');
    envEl.classList.add('is-open');
    setTimeout(() => {
        document.getElementById('envelope-overlay').style.display = 'none';
        envelopeAnimating = false;
        showValentinePrompt();
    }, 1500);
}

function triggerEnvelopeSequence() {
    showEnvelopeOverlay();
}

function revealDesktopEnvelopeIcon() {
    document.getElementById('envelope-desktop-icon').style.display = 'flex';
    document.getElementById('start-envelope-item').style.display = 'flex';
}


// ================================================================
//  5. VALENTINE PROMPT — letter dialog, No button roams entire screen
// ================================================================
function showValentinePrompt() {
    const dialog = document.createElement('div');
    dialog.className = 'window valentine-dialog';
    dialog.id = 'valentine-dialog-el';
    dialog.style.cssText = `
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: min(320px, 90vw);
        z-index: 50000;
    `;
    dialog.innerHTML = `
        <div class="title-bar"><div class="title-bar-text">❤️ You've Got Mail!</div></div>
        <div class="window-body" style="text-align:center; padding:10px;">
            <div style="font-size:48px; margin:6px 0;">❤️</div>
            <p style="font-family:'Comic Sans MS',cursive; margin:6px 0 14px; color:#880e4f;">Will you be my Valentine?</p>
            <div style="display:flex; gap:12px; justify-content:center; margin-top:10px;">
                <button id="val-yes" class="valentine-yes">Yes ❤️</button>
                <button id="val-no"  class="valentine-no">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    const yesBtn = dialog.querySelector('#val-yes');
    const noBtn  = dialog.querySelector('#val-no');

    // YES — celebrate and reveal envelope icon
    yesBtn.onclick = () => {
        stopNoBtnRoam();
        createFlyingHearts();
        showGlowingText();
        dialog.remove();
        revealDesktopEnvelopeIcon();
    };

    // NO — launch the button into free-roaming mode across the whole screen
    // Give it a tiny delay so it's rendered first
    setTimeout(() => startNoBtnRoam(noBtn), 100);
}


// ================================================================
//  5a. NO BUTTON — free-roaming physics across entire viewport
// ================================================================
function startNoBtnRoam(btn) {
    if (noBtnRoaming) return;
    noBtnRoaming = true;

    // Detach from dialog, place on body so it can go anywhere
    document.body.appendChild(btn);
    btn.style.position   = 'fixed';
    btn.style.zIndex     = '99999';
    btn.style.transition = 'none'; // we drive position manually

    // Start near centre
    noBtnX  = window.innerWidth  / 2 - 30;
    noBtnY  = window.innerHeight / 2 + 40;

    // Random initial velocity
    const speed = 3;
    const angle = Math.random() * Math.PI * 2;
    noBtnVX = Math.cos(angle) * speed;
    noBtnVY = Math.sin(angle) * speed;

    btn.style.left = noBtnX + 'px';
    btn.style.top  = noBtnY + 'px';

    // Cursor flee radius
    let cursorX = -999, cursorY = -999;

    function onMouseMove(e) { cursorX = e.clientX; cursorY = e.clientY; }
    function onTouchMove(e) { cursorX = e.touches[0].clientX; cursorY = e.touches[0].clientY; }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: true });

    // Store cleanup refs on the button itself
    btn._cleanup = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('touchmove', onTouchMove);
    };

    const FLEE_RADIUS = 120;   // px — how close cursor needs to be to spook it
    const FLEE_FORCE  = 8;     // how hard it runs away
    const MAX_SPEED   = 14;    // terminal velocity
    const FRICTION    = 0.985; // slight slowdown each frame
    const TASKBAR_H   = 30;    // keep above taskbar

    function roamLoop() {
        if (!noBtnRoaming) return;

        const bw = btn.offsetWidth  || 60;
        const bh = btn.offsetHeight || 24;

        // Flee from cursor
        const dx = noBtnX + bw / 2 - cursorX;
        const dy = noBtnY + bh / 2 - cursorY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < FLEE_RADIUS && dist > 0) {
            // Push away from cursor proportional to closeness
            const force = (FLEE_RADIUS - dist) / FLEE_RADIUS * FLEE_FORCE;
            noBtnVX += (dx / dist) * force;
            noBtnVY += (dy / dist) * force;
        }

        // Apply friction
        noBtnVX *= FRICTION;
        noBtnVY *= FRICTION;

        // Clamp to max speed
        const spd = Math.sqrt(noBtnVX * noBtnVX + noBtnVY * noBtnVY);
        if (spd > MAX_SPEED) {
            noBtnVX = (noBtnVX / spd) * MAX_SPEED;
            noBtnVY = (noBtnVY / spd) * MAX_SPEED;
        }

        // Ensure it's always moving a little (minimum drift)
        const minSpeed = 1.2;
        if (spd < minSpeed) {
            const a = Math.random() * Math.PI * 2;
            noBtnVX += Math.cos(a) * minSpeed;
            noBtnVY += Math.sin(a) * minSpeed;
        }

        // Move
        noBtnX += noBtnVX;
        noBtnY += noBtnVY;

        // Bounce off viewport walls
        if (noBtnX < 0) {
            noBtnX  = 0;
            noBtnVX = Math.abs(noBtnVX) * 0.9;
        }
        if (noBtnX + bw > window.innerWidth) {
            noBtnX  = window.innerWidth - bw;
            noBtnVX = -Math.abs(noBtnVX) * 0.9;
        }
        if (noBtnY < 0) {
            noBtnY  = 0;
            noBtnVY = Math.abs(noBtnVY) * 0.9;
        }
        if (noBtnY + bh > window.innerHeight - TASKBAR_H) {
            noBtnY  = window.innerHeight - TASKBAR_H - bh;
            noBtnVY = -Math.abs(noBtnVY) * 0.9;
        }

        btn.style.left = noBtnX + 'px';
        btn.style.top  = noBtnY + 'px';

        noBtnRAF = requestAnimationFrame(roamLoop);
    }

    noBtnRAF = requestAnimationFrame(roamLoop);
}

function stopNoBtnRoam() {
    noBtnRoaming = false;
    if (noBtnRAF) { cancelAnimationFrame(noBtnRAF); noBtnRAF = null; }
    const btn = document.getElementById('val-no');
    if (btn) {
        if (btn._cleanup) btn._cleanup();
        btn.remove();
    }
}


// ================================================================
//  6. CALENDAR (Firebase)
// ================================================================
function listenForCalendar() {
    db.ref('calendar').on('value', snapshot => {
        renderCalendarEvents(snapshot.val() || {});
    });
}

function addCalendarEvent() {
    const dateVal = document.getElementById('cal-date').value;
    const descVal = document.getElementById('cal-desc').value;
    if (!dateVal || !descVal) { alert("Please enter a date and a description!"); return; }
    const ref = db.ref('calendar').push();
    ref.set({ id: ref.key, date: dateVal, description: descVal, author: localStorage.getItem('activeUser') });
    document.getElementById('cal-date').value = '';
    document.getElementById('cal-desc').value = '';
}

function renderCalendarEvents(eventsObj) {
    const list = document.getElementById('calendar-list');
    list.innerHTML = '';
    Object.values(eventsObj)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(ev => {
            const item = document.createElement('div');
            item.className = 'calendar-event';
            item.innerHTML = `
                <div><strong>${ev.date}:</strong> ${ev.description}
                <em style="color:#888;font-size:10px;"> (${ev.author || ''})</em></div>
                <button onclick="deleteCalendarEvent('${ev.id}')" style="min-width:20px;padding:0 5px;">x</button>
            `;
            list.appendChild(item);
        });
}

function deleteCalendarEvent(id) {
    if (confirm("Delete this event?")) db.ref(`calendar/${id}`).remove();
}


// ================================================================
//  7. SHARED FILES (Firebase)
// ================================================================
function listenForSharedFiles() {
    db.ref('sharedFiles').on('value', snapshot => {
        renderFiles(Object.values(snapshot.val() || {}));
    });
}

function createNewFile() {
    const name = prompt("Enter file name:", "New Note.txt");
    if (!name) return;
    const ref = db.ref('sharedFiles').push();
    ref.set({ id: ref.key, name, type: 'text', content: '', author: localStorage.getItem('activeUser'), timestamp: Date.now() });
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const ref = db.ref('sharedFiles').push();
        ref.set({ id: ref.key, name: file.name, type: 'image', content: e.target.result, author: localStorage.getItem('activeUser'), timestamp: Date.now() });
    };
    reader.readAsDataURL(file);
}

function renderFiles(files) {
    const container = document.getElementById('file-list');
    if (!container) return;
    container.innerHTML = '';
    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        const iconSrc = file.type === 'image'
            ? 'https://win98icons.alexmeub.com/icons/png/image_gif-0.png'
            : 'https://win98icons.alexmeub.com/icons/png/notepad_file-2.png';
        div.innerHTML = `<img src="${iconSrc}"><span>${file.name}</span>`;
        div.ondblclick = () => openFile(file);
        div.addEventListener('touchend', e => { e.preventDefault(); openFile(file); });
        div.oncontextmenu = e => {
            e.preventDefault();
            if (confirm(`Delete ${file.name} for everyone?`)) db.ref(`sharedFiles/${file.id}`).remove();
        };
        container.appendChild(div);
    });
}

function openFile(file) {
    if (file.type === 'text') {
        openWindow('poetry-window');
        const ta = document.getElementById('notepad-content');
        ta.value = file.content;
        ta.dataset.currentFileId = file.id;
    } else if (file.type === 'image') {
        openWindow('photos-window');
        document.getElementById('current-photo').src = file.content;
    }
}

function saveCurrentNotepad() {
    const ta = document.getElementById('notepad-content');
    const id = ta.dataset.currentFileId;
    if (id) {
        db.ref(`sharedFiles/${id}`).update({ content: ta.value, lastUpdated: Date.now(), lastUpdatedBy: localStorage.getItem('activeUser') });
        alert("File updated for both users!");
    } else {
        const name = prompt("Save as:", "Letter.txt");
        if (!name) return;
        const ref = db.ref('sharedFiles').push();
        ref.set({ id: ref.key, name, type: 'text', content: ta.value, author: localStorage.getItem('activeUser'), timestamp: Date.now() })
           .then(() => { ta.dataset.currentFileId = ref.key; alert("File saved for both users!"); });
    }
}

function clearAllFiles() {
    if (confirm("Format Disk? This deletes EVERYTHING in the cloud.")) db.ref('sharedFiles').remove();
}


// ================================================================
//  8. STICKY NOTES (Firebase)
// ================================================================
function listenForStickyNotes() {
    db.ref('stickyNotes').on('value', snapshot => {
        document.querySelectorAll('.sticky-note').forEach(n => n.remove());
        Object.values(snapshot.val() || {}).forEach(createStickyNoteElement);
    });
}

function newStickyNote() {
    const ref = db.ref('stickyNotes').push();
    ref.set({ id: ref.key, text: '', x: 150 + Math.random() * 100, y: 100 + Math.random() * 100, author: localStorage.getItem('activeUser'), timestamp: Date.now() });
}

function createStickyNoteElement(note) {
    const el = document.createElement('div');
    el.className = 'sticky-note';
    el.dataset.noteId = note.id;
    el.style.left = Math.max(0, Math.min(note.x || 150, window.innerWidth  - 170)) + 'px';
    el.style.top  = Math.max(0, Math.min(note.y || 100, window.innerHeight - 180)) + 'px';
    el.style.zIndex = ++highestZ;
    el.innerHTML = `
        <div class="sticky-header" data-note-id="${note.id}">
            <span class="close-note" onclick="deleteNote('${note.id}')">×</span>
        </div>
        <textarea oninput="updateNoteText('${note.id}', this.value)">${note.text || ''}</textarea>
    `;
    const header = el.querySelector('.sticky-header');
    header.addEventListener('mousedown', e => dragNoteStart(e, note.id));
    header.addEventListener('touchstart', e => dragNoteTouchStart(e, note.id), { passive: false });
    document.body.appendChild(el);
}

function updateNoteText(id, text) { db.ref(`stickyNotes/${id}`).update({ text }); }
function deleteNote(id)           { db.ref(`stickyNotes/${id}`).remove(); }

function dragNoteStart(e, id) {
    if (e.target.classList.contains('close-note')) return;
    const note = document.querySelector(`.sticky-note[data-note-id="${id}"]`);
    if (!note) return;
    note.style.zIndex = ++highestZ;
    const shiftX = e.clientX - note.getBoundingClientRect().left;
    const shiftY = e.clientY - note.getBoundingClientRect().top;
    function onMove(e) {
        note.style.left = Math.max(0, Math.min(e.pageX - shiftX, window.innerWidth  - note.offsetWidth))  + 'px';
        note.style.top  = Math.max(0, Math.min(e.pageY - shiftY, window.innerHeight - note.offsetHeight - 30)) + 'px';
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', function cleanup() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', cleanup);
        db.ref(`stickyNotes/${id}`).update({ x: parseInt(note.style.left), y: parseInt(note.style.top) });
    });
}

function dragNoteTouchStart(e, id) {
    if (e.target.classList.contains('close-note')) return;
    e.preventDefault();
    const note = document.querySelector(`.sticky-note[data-note-id="${id}"]`);
    if (!note) return;
    note.style.zIndex = ++highestZ;
    const t = e.touches[0];
    const shiftX = t.clientX - note.getBoundingClientRect().left;
    const shiftY = t.clientY - note.getBoundingClientRect().top;
    function onMove(e) {
        const t = e.touches[0];
        note.style.left = Math.max(0, Math.min(t.clientX - shiftX, window.innerWidth  - note.offsetWidth))  + 'px';
        note.style.top  = Math.max(0, Math.min(t.clientY - shiftY, window.innerHeight - note.offsetHeight - 30)) + 'px';
    }
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', function cleanup() {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', cleanup);
        db.ref(`stickyNotes/${id}`).update({ x: parseInt(note.style.left), y: parseInt(note.style.top) });
    });
}


// ================================================================
//  9. PHOTO GALLERY (Firebase — multiple photos)
// ================================================================
function listenForPhotos() {
    db.ref('photoGallery').on('value', snapshot => {
        const data = snapshot.val() || {};
        photoGallery = Object.values(data).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        if (photoGallery.length === 0) {
            photoGallery = [{ id: 'default', name: 'Default', src: 'pictures/Gemini_Generated_Image_5jaj355jaj355jaj.png', timestamp: 0 }];
        }
        currentPhotoIndex = Math.min(currentPhotoIndex, photoGallery.length - 1);
        renderPhotoViewer();
    });
}

function addPhotosToGallery(event) {
    Array.from(event.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            const ref = db.ref('photoGallery').push();
            ref.set({ id: ref.key, name: file.name, src: e.target.result, addedBy: localStorage.getItem('activeUser'), timestamp: Date.now() });
        };
        reader.readAsDataURL(file);
    });
    event.target.value = '';
}

function deleteCurrentPhoto() {
    if (photoGallery.length === 0) return;
    const photo = photoGallery[currentPhotoIndex];
    if (photo.id === 'default') { alert("Can't delete the default photo."); return; }
    if (!confirm(`Delete "${photo.name}"?`)) return;
    db.ref(`photoGallery/${photo.id}`).remove();
    if (currentPhotoIndex >= photoGallery.length - 1) currentPhotoIndex = Math.max(0, currentPhotoIndex - 1);
}

function changePhoto(direction) {
    if (photoGallery.length === 0) return;
    currentPhotoIndex = (currentPhotoIndex + direction + photoGallery.length) % photoGallery.length;
    renderPhotoViewer();
}

function renderPhotoViewer() {
    const img     = document.getElementById('current-photo');
    const noMsg   = document.getElementById('no-photos-msg');
    const counter = document.getElementById('photo-counter');
    const thumbs  = document.getElementById('photo-thumbs');
    if (!img) return;

    if (photoGallery.length === 0) {
        img.style.display = 'none';
        noMsg.style.display = 'block';
        counter.innerText = '0 photos';
        thumbs.innerHTML = '';
        return;
    }

    img.style.display = 'block';
    noMsg.style.display = 'none';
    img.src = photoGallery[currentPhotoIndex].src;
    counter.innerText = `${currentPhotoIndex + 1} / ${photoGallery.length}`;

    thumbs.innerHTML = '';
    photoGallery.forEach((photo, idx) => {
        const t = document.createElement('img');
        t.src = photo.src;
        t.title = photo.name;
        t.className = idx === currentPhotoIndex ? 'active-thumb' : '';
        t.onclick = () => { currentPhotoIndex = idx; renderPhotoViewer(); };
        thumbs.appendChild(t);
    });
}


// ================================================================
//  10. WALLPAPER — saved to Firebase, synced for all users
// ================================================================
function listenForWallpaper() {
    db.ref('wallpaper').on('value', snapshot => {
        const data = snapshot.val();
        const body = document.getElementById('desktop-bg');
        if (data && data.src) {
            body.style.backgroundImage = `url('${data.src}')`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
        } else {
            body.style.backgroundImage = "url('https://win98icons.alexmeub.com/images/clouds-wallpaper.jpg')";
            body.style.backgroundSize = 'cover';
        }
    });
}

function changeBackground(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        db.ref('wallpaper').set({ src: e.target.result, changedBy: localStorage.getItem('activeUser'), timestamp: Date.now() });
    };
    reader.readAsDataURL(file);
}

function resetBackground() {
    db.ref('wallpaper').remove();
}


// ================================================================
//  11. VALENTINE CELEBRATION
// ================================================================
function createFlyingHearts(startX, startY) {
    const heartCount = 90, roseCount = 40;
    startX = startX || window.innerWidth  / 2;
    startY = startY || window.innerHeight / 2;
    for (let i = 0; i < heartCount + roseCount; i++) {
        const p = document.createElement('div');
        p.className = i < heartCount ? 'flying-heart' : 'flying-rose';
        p.innerHTML = i < heartCount ? '❤️' : '🌹';
        const angle    = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 300 + 200;
        const duration = 5 + Math.random() * 3;
        p.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;font-size:${Math.random()*30+20}px;z-index:60000;pointer-events:none;`;
        document.body.appendChild(p);
        animateParticle(p, startX, startY, angle, velocity, duration);
        setTimeout(() => p.remove(), duration * 1000);
    }
}

function animateParticle(el, startX, startY, angle, velocity, duration) {
    let x = startX, y = startY, vx = Math.cos(angle) * velocity, vy = Math.sin(angle) * velocity, time = 0;
    const gravity = 150, bounce = 0.85;
    function update() {
        time += 0.016;
        if (time > duration) return;
        vy += gravity * 0.016;
        x += vx * 0.016; y += vy * 0.016;
        if (x < 0 || x > window.innerWidth)  vx *= -bounce;
        if (y < 0 || y > window.innerHeight) vy *= -bounce;
        el.style.left = x + 'px';
        el.style.top  = y + 'px';
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function showGlowingText() {
    const el = document.createElement('div');
    el.className = 'glowing-text-overlay';
    el.innerHTML = '☺️☺️😏☺️☺️WHOOHOO☺️☺️😏☺️☺️';
    el.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(32px,7vw,80px);font-weight:bold;color:#ff1493;z-index:70000;animation:glowPulse 0.6s infinite;text-align:center;pointer-events:none;white-space:nowrap;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}


// ================================================================
//  12. NOTIFICATION
// ================================================================
function sendNotification() {
    const user = localStorage.getItem('activeUser') || 'Someone';
    fetch('https://ntfy.sh/loveos_pager_channel', {
        method: 'POST',
        body: `❤️ ${user} wants attention! ❤️`,
        headers: { 'Title': 'LoveOS 98 Alert', 'Priority': 'high' }
    })
    .then(r => r.ok ? alert("Page Sent!") : alert("Failed to send."))
    .catch(() => alert("Connection Error."));
}


// ================================================================
//  13. UTILITIES
// ================================================================
function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = 'block';
    bringToFront(win);
    requestAnimationFrame(() => {
        const rect = win.getBoundingClientRect();
        if (rect.right  > window.innerWidth)  win.style.left = Math.max(0, window.innerWidth  - win.offsetWidth  - 10) + 'px';
        if (rect.bottom > window.innerHeight - 30) win.style.top = Math.max(0, window.innerHeight - win.offsetHeight - 36) + 'px';
        if (rect.left < 0) win.style.left = '4px';
        if (rect.top  < 0) win.style.top  = '4px';
    });
}

function closeWindow(id) {
    document.getElementById(id).style.display = 'none';
}

function toggleStartMenu() {
    const m = document.getElementById('start-menu');
    m.style.display = (m.style.display === 'none' || m.style.display === '') ? 'flex' : 'none';
}

document.addEventListener('click', e => {
    const sm = document.getElementById('start-menu');
    const sb = document.querySelector('.start-button');
    if (sm && !sm.contains(e.target) && sb && !sb.contains(e.target)) {
        sm.style.display = 'none';
    }
});

window.onload = initSystem;