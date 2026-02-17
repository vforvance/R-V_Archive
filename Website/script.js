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
const USERS = { 'Venance': '12298', 'Rehema': '9299' };
let selectedUser = null;
let highestZ = 100;

let photoGallery = [];
let currentPhotoIndex = 0;
let envelopeAnimating = false;

// No-button roaming
let noBtnRoaming = false, noBtnRAF = null;
let noBtnX = 0, noBtnY = 0, noBtnVX = 0, noBtnVY = 0;

// Minimized windows registry { windowId -> { label, icon } }
const minimizedWindows = {};

// Window icons map for taskbar buttons
const WINDOW_ICONS = {
    'calendar-window': 'https://win98icons.alexmeub.com/icons/png/calendar-0.png',
    'files-window':    'https://win98icons.alexmeub.com/icons/png/search_directory-0.png',
    'paint-window':    'https://win98icons.alexmeub.com/icons/png/paint_file-5.png',
    'bored-window':    'https://win98icons.alexmeub.com/icons/png/joystick-0.png',
    'settings-window': 'https://win98icons.alexmeub.com/icons/png/settings_gear-0.png',
    'music-window':    'https://win98icons.alexmeub.com/icons/png/cd_audio_cd_a-4.png',
    'photos-window':   'https://win98icons.alexmeub.com/icons/png/camera3-2.png',
    'poetry-window':   'https://win98icons.alexmeub.com/icons/png/notepad-2.png',
};

// Avatar state
const AVATAR_EMOJIS = { 'Venance': '👨🏾‍🦱', 'Rehema': '👩🏾‍🦱' };
const avatarState = {}; // keyed by username
let avatarRAF = null;
let myPresenceRef = null;


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
    const lines = ["BIOS Date 02/14/98 12:00:00 Ver: 1.0.0","CPU: Pentium II 333MHz","64MB RAM System OK","Starting Windows 98..."];
    let i = 0;
    const interval = setInterval(() => {
        bootLines.innerText += lines[i] + "\n"; i++;
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
    const btn = document.getElementById('btn-login-ok');
    if (btn) btn.addEventListener('click', attemptLogin);
    const inp = document.getElementById('login-pass');
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
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
    if (myPresenceRef) myPresenceRef.remove();
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
    initPresence();
    listenForAvatars();

    // CHANGED: Envelope icon visible from the start, doesn't auto-trigger anymore
    revealDesktopEnvelopeIcon();
}


// ================================================================
//  3. DRAGGABLE WINDOWS
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

function bringToFront(win) { highestZ++; win.style.zIndex = highestZ; }

function dragWindowStart(e, win) {
    if (e.target.closest('.title-bar-controls')) return;
    e.preventDefault();
    const shiftX = e.clientX - win.getBoundingClientRect().left;
    const shiftY = e.clientY - win.getBoundingClientRect().top;
    function onMove(e) {
        win.style.left = Math.max(0, Math.min(e.pageX - shiftX, window.innerWidth  - win.offsetWidth)) + 'px';
        win.style.top  = Math.max(0, Math.min(e.pageY - shiftY, window.innerHeight - win.offsetHeight - 30)) + 'px';
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', function c() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', c);
    });
}

function dragWindowTouchStart(e, win) {
    if (e.target.closest('.title-bar-controls')) return;
    e.preventDefault();
    const t = e.touches[0];
    const shiftX = t.clientX - win.getBoundingClientRect().left;
    const shiftY = t.clientY - win.getBoundingClientRect().top;
    function onMove(e) {
        const t = e.touches[0];
        win.style.left = Math.max(0, Math.min(t.clientX - shiftX, window.innerWidth  - win.offsetWidth)) + 'px';
        win.style.top  = Math.max(0, Math.min(t.clientY - shiftY, window.innerHeight - win.offsetHeight - 30)) + 'px';
    }
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', function c() {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', c);
    });
}

function handleIconTouch(e, windowId, fn) {
    e.preventDefault();
    if (windowId) openWindow(windowId);
    if (fn) fn();
}


// ================================================================
//  4. MINIMIZE / RESTORE — taskbar window buttons
// ================================================================
function minimizeWindow(id, label) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = 'none';
    minimizedWindows[id] = { label, icon: WINDOW_ICONS[id] || '' };
    renderTaskbarWindows();
}

function restoreWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = 'block';
    delete minimizedWindows[id];
    bringToFront(win);
    renderTaskbarWindows();
    // Clamp to viewport
    requestAnimationFrame(() => {
        const rect = win.getBoundingClientRect();
        if (rect.right  > window.innerWidth)  win.style.left = Math.max(0, window.innerWidth  - win.offsetWidth  - 10) + 'px';
        if (rect.bottom > window.innerHeight - 30) win.style.top  = Math.max(0, window.innerHeight - win.offsetHeight - 36) + 'px';
        if (rect.left < 0) win.style.left = '4px';
        if (rect.top  < 0) win.style.top  = '4px';
    });
}

function renderTaskbarWindows() {
    const bar = document.getElementById('taskbar-windows');
    bar.innerHTML = '';
    Object.entries(minimizedWindows).forEach(([id, info]) => {
        const btn = document.createElement('button');
        btn.className = 'taskbar-win-btn';
        btn.title = info.label;
        btn.innerHTML = info.icon ? `<img src="${info.icon}"> ${info.label}` : info.label;
        btn.onclick = () => restoreWindow(id);
        bar.appendChild(btn);
    });
}


// ================================================================
//  5. ENVELOPE — now only shows when user clicks icon, not auto
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
    document.getElementById('env-win98-el').classList.add('is-open');
    setTimeout(() => {
        document.getElementById('envelope-overlay').style.display = 'none';
        envelopeAnimating = false;
        showValentinePrompt();
    }, 1500);
}

// CHANGED: This is now the entry point when clicking the desktop icon
function triggerEnvelopeSequence() { showEnvelopeOverlay(); }

// CHANGED: Icon is now visible from desktop load
function revealDesktopEnvelopeIcon() {
    document.getElementById('envelope-desktop-icon').style.display = 'flex';
    document.getElementById('start-envelope-item').style.display = 'flex';
}


// ================================================================
//  6. VALENTINE PROMPT — No button roams entire screen
// ================================================================
function showValentinePrompt() {
    const dialog = document.createElement('div');
    dialog.className = 'window valentine-dialog';
    dialog.id = 'valentine-dialog-el';
    dialog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:min(320px,90vw);z-index:50000;';
    dialog.innerHTML = `
        <div class="title-bar"><div class="title-bar-text">❤️ You've Got Mail!</div></div>
        <div class="window-body" style="text-align:center;padding:10px;">
            <div style="font-size:48px;margin:6px 0;">❤️</div>
            <p style="font-family:'cursive',cursive;margin:6px 0 14px;color:#880e4f;">Will you be my Valentine?</p>
            <div style="display:flex;gap:12px;justify-content:center;margin-top:10px;">
                <button id="val-yes" class="valentine-yes">Yes ❤️</button>
                <button id="val-no"  class="valentine-no">No</button>
            </div>
        </div>`;
    document.body.appendChild(dialog);

    dialog.querySelector('#val-yes').onclick = () => {
        stopNoBtnRoam();
        createFlyingHearts();
        showGlowingText();
        dialog.remove();
    };

    setTimeout(() => startNoBtnRoam(dialog.querySelector('#val-no')), 100);
}

function startNoBtnRoam(btn) {
    if (noBtnRoaming) return;
    noBtnRoaming = true;
    document.body.appendChild(btn);
    btn.style.position = 'fixed';
    btn.style.zIndex   = '99999';
    btn.style.transition = 'none';

    noBtnX = window.innerWidth / 2 - 30;
    noBtnY = window.innerHeight / 2 + 40;
    const angle = Math.random() * Math.PI * 2;
    noBtnVX = Math.cos(angle) * 3;
    noBtnVY = Math.sin(angle) * 3;
    btn.style.left = noBtnX + 'px';
    btn.style.top  = noBtnY + 'px';

    let cursorX = -999, cursorY = -999;
    function onMM(e) { cursorX = e.clientX; cursorY = e.clientY; }
    function onTM(e) { cursorX = e.touches[0].clientX; cursorY = e.touches[0].clientY; }
    document.addEventListener('mousemove', onMM);
    document.addEventListener('touchmove', onTM, { passive: true });
    btn._cleanup = () => { document.removeEventListener('mousemove', onMM); document.removeEventListener('touchmove', onTM); };

    function loop() {
        if (!noBtnRoaming) return;
        const bw = btn.offsetWidth || 60, bh = btn.offsetHeight || 24;
        const dx = noBtnX + bw/2 - cursorX, dy = noBtnY + bh/2 - cursorY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120 && dist > 0) {
            const f = (120 - dist) / 120 * 8;
            noBtnVX += (dx/dist)*f; noBtnVY += (dy/dist)*f;
        }
        noBtnVX *= 0.985; noBtnVY *= 0.985;
        const spd = Math.sqrt(noBtnVX*noBtnVX + noBtnVY*noBtnVY);
        if (spd > 14) { noBtnVX = noBtnVX/spd*14; noBtnVY = noBtnVY/spd*14; }
        if (spd < 1.2) { const a = Math.random()*Math.PI*2; noBtnVX += Math.cos(a)*1.2; noBtnVY += Math.sin(a)*1.2; }
        noBtnX += noBtnVX; noBtnY += noBtnVY;
        if (noBtnX < 0)                       { noBtnX = 0;                             noBtnVX = Math.abs(noBtnVX)*0.9; }
        if (noBtnX + bw > window.innerWidth)  { noBtnX = window.innerWidth - bw;        noBtnVX = -Math.abs(noBtnVX)*0.9; }
        if (noBtnY < 0)                       { noBtnY = 0;                             noBtnVY = Math.abs(noBtnVY)*0.9; }
        if (noBtnY + bh > window.innerHeight - 30) { noBtnY = window.innerHeight-30-bh; noBtnVY = -Math.abs(noBtnVY)*0.9; }
        btn.style.left = noBtnX + 'px';
        btn.style.top  = noBtnY + 'px';
        noBtnRAF = requestAnimationFrame(loop);
    }
    noBtnRAF = requestAnimationFrame(loop);
}

function stopNoBtnRoam() {
    noBtnRoaming = false;
    if (noBtnRAF) { cancelAnimationFrame(noBtnRAF); noBtnRAF = null; }
    const btn = document.getElementById('val-no');
    if (btn) { if (btn._cleanup) btn._cleanup(); btn.remove(); }
}


// ================================================================
//  7. CALENDAR (Firebase)
// ================================================================
function listenForCalendar() {
    db.ref('calendar').on('value', s => renderCalendarEvents(s.val() || {}));
}
function addCalendarEvent() {
    const d = document.getElementById('cal-date').value, desc = document.getElementById('cal-desc').value;
    if (!d || !desc) { alert("Please enter a date and description!"); return; }
    const ref = db.ref('calendar').push();
    ref.set({ id: ref.key, date: d, description: desc, author: localStorage.getItem('activeUser') });
    document.getElementById('cal-date').value = '';
    document.getElementById('cal-desc').value = '';
}
function renderCalendarEvents(obj) {
    const list = document.getElementById('calendar-list');
    list.innerHTML = '';
    Object.values(obj).sort((a,b) => new Date(a.date)-new Date(b.date)).forEach(ev => {
        const item = document.createElement('div');
        item.className = 'calendar-event';
        item.innerHTML = `<div><strong>${ev.date}:</strong> ${ev.description} <em style="color:#888;font-size:10px;">(${ev.author||''})</em></div><button onclick="deleteCalendarEvent('${ev.id}')" style="min-width:20px;padding:0 5px;">x</button>`;
        list.appendChild(item);
    });
}
function deleteCalendarEvent(id) { if (confirm("Delete this event?")) db.ref(`calendar/${id}`).remove(); }


// ================================================================
//  8. SHARED FILES (Firebase)
// ================================================================
function listenForSharedFiles() {
    db.ref('sharedFiles').on('value', s => renderFiles(Object.values(s.val() || {})));
}
function createNewFile() {
    const name = prompt("Enter file name:", "New Note.txt");
    if (!name) return;
    const ref = db.ref('sharedFiles').push();
    ref.set({ id: ref.key, name, type: 'text', content: '', author: localStorage.getItem('activeUser'), timestamp: Date.now() });
}
function handleFileUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const ref = db.ref('sharedFiles').push();
        ref.set({ id: ref.key, name: file.name, type: 'image', content: e.target.result, author: localStorage.getItem('activeUser'), timestamp: Date.now() });
    };
    reader.readAsDataURL(file);
}
function renderFiles(files) {
    const c = document.getElementById('file-list'); if (!c) return;
    c.innerHTML = '';
    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `<img src="${file.type==='image'?'https://win98icons.alexmeub.com/icons/png/image_gif-0.png':'https://win98icons.alexmeub.com/icons/png/notepad_file-2.png'}"><span>${file.name}</span>`;
        div.ondblclick = () => openFile(file);
        div.addEventListener('touchend', e => { e.preventDefault(); openFile(file); });
        div.oncontextmenu = e => { e.preventDefault(); if (confirm(`Delete ${file.name} for everyone?`)) db.ref(`sharedFiles/${file.id}`).remove(); };
        c.appendChild(div);
    });
}
function openFile(file) {
    if (file.type === 'text') {
        openWindow('poetry-window');
        const ta = document.getElementById('notepad-content');
        if (ta.dataset.currentFileId !== file.id) {
            ta.value = file.content;
            ta.dataset.currentFileId = file.id;
        }
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
        const name = prompt("Save as:", "Letter.txt"); if (!name) return;
        const ref = db.ref('sharedFiles').push();
        ref.set({ id: ref.key, name, type: 'text', content: ta.value, author: localStorage.getItem('activeUser'), timestamp: Date.now() })
           .then(() => { ta.dataset.currentFileId = ref.key; alert("File saved for both users!"); });
    }
}
function clearAllFiles() { if (confirm("Format Disk? This deletes EVERYTHING in the cloud.")) db.ref('sharedFiles').remove(); }


// ================================================================
//  9. STICKY NOTES — debounced DB sync so typing never stutters
// ================================================================
const _noteDebounceTimers = {};

function listenForStickyNotes() {
    db.ref('stickyNotes').on('value', snapshot => {
        const notes = snapshot.val() || {};
        Object.values(notes).forEach(note => {
            const existing = document.querySelector(`.sticky-note[data-note-id="${note.id}"]`);
            if (existing) {
                const ta = existing.querySelector('textarea');
                if (document.activeElement !== ta) {
                    ta.value = note.text || '';
                }
            } else {
                createStickyNoteElement(note);
            }
        });
        document.querySelectorAll('.sticky-note').forEach(el => {
            if (!notes[el.dataset.noteId]) el.remove();
        });
    });
}

function newStickyNote() {
    const ref = db.ref('stickyNotes').push();
    ref.set({ id: ref.key, text: '', x: 150 + Math.random()*100, y: 100 + Math.random()*100, author: localStorage.getItem('activeUser'), timestamp: Date.now() });
}

function createStickyNoteElement(note) {
    const el = document.createElement('div');
    el.className = 'sticky-note';
    el.dataset.noteId = note.id;
    el.style.left = Math.max(0, Math.min(note.x||150, window.innerWidth -170)) + 'px';
    el.style.top  = Math.max(0, Math.min(note.y||100, window.innerHeight-180)) + 'px';
    el.style.zIndex = ++highestZ;
    el.innerHTML = `
        <div class="sticky-header" data-note-id="${note.id}">
            <span class="close-note" onclick="deleteNote('${note.id}')">×</span>
        </div>
        <textarea placeholder="Type here...">${note.text||''}</textarea>`;
    const ta = el.querySelector('textarea');

    ta.addEventListener('input', () => {
        clearTimeout(_noteDebounceTimers[note.id]);
        _noteDebounceTimers[note.id] = setTimeout(() => {
            db.ref(`stickyNotes/${note.id}`).update({ text: ta.value });
        }, 600);
    });

    const header = el.querySelector('.sticky-header');
    header.addEventListener('mousedown', e => dragNoteStart(e, note.id));
    header.addEventListener('touchstart', e => dragNoteTouchStart(e, note.id), { passive: false });
    document.body.appendChild(el);
}

function deleteNote(id) {
    clearTimeout(_noteDebounceTimers[id]);
    db.ref(`stickyNotes/${id}`).remove();
}

function dragNoteStart(e, id) {
    if (e.target.classList.contains('close-note')) return;
    const note = document.querySelector(`.sticky-note[data-note-id="${id}"]`); if (!note) return;
    note.style.zIndex = ++highestZ;
    const sx = e.clientX - note.getBoundingClientRect().left, sy = e.clientY - note.getBoundingClientRect().top;
    function onMove(e) {
        note.style.left = Math.max(0, Math.min(e.pageX-sx, window.innerWidth -note.offsetWidth)) +'px';
        note.style.top  = Math.max(0, Math.min(e.pageY-sy, window.innerHeight-note.offsetHeight-30))+'px';
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', function c() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', c);
        db.ref(`stickyNotes/${id}`).update({ x: parseInt(note.style.left), y: parseInt(note.style.top) });
    });
}

function dragNoteTouchStart(e, id) {
    if (e.target.classList.contains('close-note')) return;
    e.preventDefault();
    const note = document.querySelector(`.sticky-note[data-note-id="${id}"]`); if (!note) return;
    note.style.zIndex = ++highestZ;
    const t = e.touches[0];
    const sx = t.clientX - note.getBoundingClientRect().left, sy = t.clientY - note.getBoundingClientRect().top;
    function onMove(e) {
        const t = e.touches[0];
        note.style.left = Math.max(0, Math.min(t.clientX-sx, window.innerWidth -note.offsetWidth)) +'px';
        note.style.top  = Math.max(0, Math.min(t.clientY-sy, window.innerHeight-note.offsetHeight-30))+'px';
    }
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', function c() {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', c);
        db.ref(`stickyNotes/${id}`).update({ x: parseInt(note.style.left), y: parseInt(note.style.top) });
    });
}


// ================================================================
//  10. PHOTO GALLERY (Firebase)
// ================================================================
function listenForPhotos() {
    db.ref('photoGallery').on('value', s => {
        const data = s.val() || {};
        photoGallery = Object.values(data).sort((a,b)=>(a.timestamp||0)-(b.timestamp||0));
        if (!photoGallery.length) photoGallery = [{ id:'default', name:'Default', src:'pictures/Gemini_Generated_Image_5jaj355jaj355jaj.png', timestamp:0 }];
        currentPhotoIndex = Math.min(currentPhotoIndex, photoGallery.length-1);
        renderPhotoViewer();
    });
}
function addPhotosToGallery(event) {
    Array.from(event.target.files).forEach(file => {
        const r = new FileReader();
        r.onload = e => { const ref = db.ref('photoGallery').push(); ref.set({ id:ref.key, name:file.name, src:e.target.result, addedBy:localStorage.getItem('activeUser'), timestamp:Date.now() }); };
        r.readAsDataURL(file);
    });
    event.target.value = '';
}
function deleteCurrentPhoto() {
    if (!photoGallery.length) return;
    const p = photoGallery[currentPhotoIndex];
    if (p.id === 'default') { alert("Can't delete the default photo."); return; }
    if (!confirm(`Delete "${p.name}"?`)) return;
    db.ref(`photoGallery/${p.id}`).remove();
    if (currentPhotoIndex >= photoGallery.length-1) currentPhotoIndex = Math.max(0, currentPhotoIndex-1);
}
function changePhoto(dir) {
    if (!photoGallery.length) return;
    currentPhotoIndex = (currentPhotoIndex+dir+photoGallery.length) % photoGallery.length;
    renderPhotoViewer();
}
function renderPhotoViewer() {
    const img = document.getElementById('current-photo');
    const noMsg = document.getElementById('no-photos-msg');
    const counter = document.getElementById('photo-counter');
    const thumbs = document.getElementById('photo-thumbs');
    if (!img) return;
    if (!photoGallery.length) { img.style.display='none'; noMsg.style.display='block'; counter.innerText='0 photos'; thumbs.innerHTML=''; return; }
    img.style.display='block'; noMsg.style.display='none';
    img.src = photoGallery[currentPhotoIndex].src;
    counter.innerText = `${currentPhotoIndex+1} / ${photoGallery.length}`;
    thumbs.innerHTML = '';
    photoGallery.forEach((p,i) => {
        const t = document.createElement('img');
        t.src = p.src; t.title = p.name;
        t.className = i===currentPhotoIndex ? 'active-thumb' : '';
        t.onclick = () => { currentPhotoIndex=i; renderPhotoViewer(); };
        thumbs.appendChild(t);
    });
}


// ================================================================
//  11. WALLPAPER (Firebase — synced)
// ================================================================
function listenForWallpaper() {
    db.ref('wallpaper').on('value', s => {
        const d = s.val(), body = document.getElementById('desktop-bg');
        body.style.backgroundImage = d && d.src ? `url('${d.src}')` : "url('https://win98icons.alexmeub.com/images/clouds-wallpaper.jpg')";
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
    });
}
function changeBackground(event) {
    const file = event.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = e => db.ref('wallpaper').set({ src: e.target.result, changedBy: localStorage.getItem('activeUser'), timestamp: Date.now() });
    r.readAsDataURL(file);
}
function resetBackground() { db.ref('wallpaper').remove(); }


// ================================================================
//  12. AVATARS — walking sprites, Firebase presence
// ================================================================
const AVATAR_CONFIG = {
    'Venance': { emoji: '👨🏾‍🦱', color: '#880e4f' },
    'Rehema':  { emoji: '👩🏾‍🦱', color: '#1565c0' }
};

const GREETINGS = ['Hi! 👋','❤️','Miss you!','😘','Heyy!','💕','Hi bubb!', 'Big Mama, No kids💅🏾'];
let bubbleTimeout = null;
let lastBubbleTime = 0;

function initPresence() {
    const user = localStorage.getItem('activeUser');
    if (!user) return;
    myPresenceRef = db.ref(`presence/${user}`);
    const startX = 100 + Math.random() * (window.innerWidth - 200);
    myPresenceRef.set({ x: startX, dir: 1, online: true, ts: Date.now() });
    myPresenceRef.onDisconnect().remove();
    startMyAvatarMovement(user, startX);
}

function startMyAvatarMovement(user, startX) {
    let x = startX;
    let vx = (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.8);
    let lastUpdate = 0;
    const DB_UPDATE_INTERVAL = 200;

    function walk(now) {
        x += vx;
        if (x < 20)                       { x = 20;                        vx = Math.abs(vx); }
        if (x > window.innerWidth - 60)   { x = window.innerWidth - 60;    vx = -Math.abs(vx); }
        if (Math.random() < 0.003) vx = (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.8);
        updateAvatarSprite(user, x, vx > 0 ? 1 : -1);
        if (now - lastUpdate > DB_UPDATE_INTERVAL) {
            lastUpdate = now;
            if (myPresenceRef) myPresenceRef.update({ x: Math.round(x), dir: vx > 0 ? 1 : -1, ts: Date.now() });
        }
        avatarRAF = requestAnimationFrame(walk);
    }
    avatarRAF = requestAnimationFrame(walk);
}

function listenForAvatars() {
    db.ref('presence').on('value', snapshot => {
        const online = snapshot.val() || {};
        const myUser = localStorage.getItem('activeUser');
        Object.entries(online).forEach(([user, data]) => {
            if (user === myUser) return;
            updateAvatarSprite(user, data.x, data.dir || 1);
        });
        document.querySelectorAll('.avatar-sprite').forEach(el => {
            const u = el.dataset.user;
            if (!online[u] && u !== myUser) el.remove();
        });
        if (myUser && Object.keys(online).length >= 2) {
            checkAvatarProximity(online, myUser);
        }
    });
}

function updateAvatarSprite(user, x, dir) {
    const cfg = AVATAR_CONFIG[user] || { emoji: '🙂', color: '#555' };
    let el = document.querySelector(`.avatar-sprite[data-user="${user}"]`);
    if (!el) {
        el = document.createElement('div');
        el.className = 'avatar-sprite';
        el.dataset.user = user;
        el.innerHTML = `
            <div class="avatar-figure">${cfg.emoji}</div>
            <div class="avatar-label" style="background:${cfg.color};">${user}</div>`;
        document.body.appendChild(el);
    }
    el.style.left = x + 'px';
    const fig = el.querySelector('.avatar-figure');
    if (dir < 0) { fig.classList.add('flipped'); } else { fig.classList.remove('flipped'); }
}

function checkAvatarProximity(online, myUser) {
    const myData = online[myUser];
    if (!myData) return;
    Object.entries(online).forEach(([user, data]) => {
        if (user === myUser) return;
        const dist = Math.abs((myData.x||0) - (data.x||0));
        if (dist < 80 && Date.now() - lastBubbleTime > 5000) {
            lastBubbleTime = Date.now();
            showAvatarBubble(myUser, myData.x, user);
        }
    });
}

function showAvatarBubble(fromUser, x, toUser) {
    document.querySelectorAll('.avatar-bubble').forEach(b => b.remove());
    clearTimeout(bubbleTimeout);
    const msg = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    const bubble = document.createElement('div');
    bubble.className = 'avatar-bubble';
    bubble.innerText = msg;
    const bx = Math.max(10, Math.min(x - 30, window.innerWidth - 120));
    bubble.style.left   = bx + 'px';
    bubble.style.bottom = '68px';
    document.body.appendChild(bubble);
    bubbleTimeout = setTimeout(() => bubble.remove(), 3000);
}


// ================================================================
//  13. VALENTINE CELEBRATION
// ================================================================
function createFlyingHearts(startX, startY) {
    startX = startX || window.innerWidth/2; startY = startY || window.innerHeight/2;
    for (let i = 0; i < 130; i++) {
        const p = document.createElement('div');
        p.className = i < 90 ? 'flying-heart' : 'flying-rose';
        p.innerHTML = i < 90 ? '❤️' : i < 110 ? '🌹' : '💞';
        const angle = Math.random()*Math.PI*2, velocity = Math.random()*300+200, duration = 5+Math.random()*3;
        p.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;font-size:${Math.random()*30+20}px;z-index:60000;pointer-events:none;`;
        document.body.appendChild(p);
        animateParticle(p, startX, startY, angle, velocity, duration);
        setTimeout(() => p.remove(), duration*1000);
    }
}
function animateParticle(el, sx, sy, angle, vel, dur) {
    let x=sx, y=sy, vx=Math.cos(angle)*vel, vy=Math.sin(angle)*vel, t=0;
    function upd() {
        t+=0.016; if (t>dur) return;
        vy+=150*0.016; x+=vx*0.016; y+=vy*0.016;
        if (x<0||x>window.innerWidth)  vx*=-0.85;
        if (y<0||y>window.innerHeight) vy*=-0.85;
        el.style.left=x+'px'; el.style.top=y+'px';
        requestAnimationFrame(upd);
    }
    requestAnimationFrame(upd);
}
function showGlowingText() {
    const el = document.createElement('div');
    el.className = 'glowing-text-overlay';
    el.innerHTML = '☺️☺️😏☺️☺️WHOOHOO☺️☺️😏☺️☺️';
    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:clamp(32px,7vw,80px);font-weight:bold;color:#ff1493;z-index:70000;animation:glowPulse 0.6s infinite;text-align:center;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}


// ================================================================
//  14. NOTIFICATION — CHANGED to send to specific user only
// ================================================================
function sendNotification() {
    const sender = localStorage.getItem('activeUser');
    if (!sender) { alert("Error: User not logged in."); return; }

    // Map sender to recipient's channel
    const CHANNEL_MAP = {
        'Venance': 'loveos_rehema_notifications',  // Venance's clicks go to Rehema's phone
        'Rehema':  'loveos_venance_notifications'  // Rehema's clicks go to Venance's phone
    };

    const targetChannel = CHANNEL_MAP[sender];
    if (!targetChannel) { alert("Error: Invalid user."); return; }

    fetch(`https://ntfy.sh/${targetChannel}`, {
        method: 'POST',
        body: `❤️ ${sender} wants attention! ❤️`,
        headers: {
            'Title': 'LoveOS 98 Alert',
            'Priority': 'high',
            'Tags': 'heart,love'
        }
    })
    .then(r => r.ok ? alert(`Notification sent to ${sender === 'Venance' ? 'Rehema' : 'Venance'}!`) : alert("Failed to send."))
    .catch(() => alert("Connection Error."));
}


// ================================================================
//  15. UTILITIES
// ================================================================
function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

function openWindow(id) {
    const win = document.getElementById(id); if (!win) return;
    if (minimizedWindows[id]) { restoreWindow(id); return; }
    win.style.display = 'block';
    bringToFront(win);
    requestAnimationFrame(() => {
        const r = win.getBoundingClientRect();
        if (r.right  > window.innerWidth)  win.style.left = Math.max(0, window.innerWidth  - win.offsetWidth  - 10) + 'px';
        if (r.bottom > window.innerHeight-30) win.style.top  = Math.max(0, window.innerHeight - win.offsetHeight - 36) + 'px';
        if (r.left < 0) win.style.left = '4px';
        if (r.top  < 0) win.style.top  = '4px';
    });
}

function closeWindow(id) { document.getElementById(id).style.display = 'none'; }

function toggleStartMenu() {
    const m = document.getElementById('start-menu');
    m.style.display = (m.style.display==='none'||m.style.display==='') ? 'flex' : 'none';
}

document.addEventListener('click', e => {
    const sm = document.getElementById('start-menu'), sb = document.querySelector('.start-button');
    if (sm && !sm.contains(e.target) && sb && !sb.contains(e.target)) sm.style.display = 'none';
});

window.onload = initSystem;