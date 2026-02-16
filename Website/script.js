// --- FIREBASE INITIALIZATION ---
// Replace this with your actual Firebase config from the console!
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

// --- 1. BOOT & LOGIN ---
const USERS = { 'Venance': 'letmein', 'Rehema': 'letmein' };
let selectedUser = null;

function initSystem() {
    // Ensuring desktop is hidden by default is handled by CSS, 
    // but we double check logic here.
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
    const lines = [ "BIOS Date 02/14/98 12:00:00 Ver: 1.0.0", "CPU: Pentium II 333MHz", "64MB RAM System OK", "Starting Windows 98..." ];
    let i = 0;
    const interval = setInterval(() => {
        bootLines.innerText += (lines[i] + "\n");
        i++;
        if (i >= lines.length) { 
            clearInterval(interval); 
            setTimeout(showLoginScreen, 1000); 
        }
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
    if (loginOkBtn) {
        loginOkBtn.addEventListener('click', () => {
            const pass = document.getElementById('login-pass').value;
            if (selectedUser && USERS[selectedUser] === pass) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('activeUser', selectedUser);
                document.getElementById('password-overlay').style.display = 'none';
                showDesktop();
            } else {
                document.getElementById('pwd-error').innerText = "Incorrect Password";
            }
        });
    }
});

function logout() {
    localStorage.removeItem('isLoggedIn');
    location.reload();
}

function showDesktop() {
    document.getElementById('desktop').style.display = 'flex';
    document.querySelector('.taskbar').style.display = 'flex';
    updateClock();
    setInterval(updateClock, 1000);
    
    // --- START FIREBASE LISTENERS ---
    listenForSharedFiles();
    listenForStickyNotes();
    listenForCalendar();
    
    // Call Envelope Trigger instead of direct Prompt
    setTimeout(showEnvelope, 1000);
}

// --- 2. ENVELOPE LOGIC (New) ---
function showEnvelope() {
    document.getElementById('envelope-overlay').style.display = 'flex';
}

function openEnvelope() {
    const env = document.getElementById('envelope');
    // Animate scale up and fade out
    env.style.transform = "scale(3)";
    env.style.opacity = "0";
    
    setTimeout(() => {
        document.getElementById('envelope-overlay').style.display = 'none';
        showValentinePrompt();
    }, 600);
}

// --- 3. GLOBAL CALENDAR (New) ---
function listenForCalendar() {
    db.ref('calendar').on('value', (snapshot) => {
        const events = snapshot.val() || {};
        renderCalendarEvents(events);
    });
}

function addCalendarEvent() {
    const dateVal = document.getElementById('cal-date').value;
    const descVal = document.getElementById('cal-desc').value;

    if (!dateVal || !descVal) {
        alert("Please enter a date and a description!");
        return;
    }

    const newEventRef = db.ref('calendar').push();
    newEventRef.set({
        id: newEventRef.key,
        date: dateVal,
        description: descVal,
        author: localStorage.getItem('activeUser')
    });
    
    // clear input
    document.getElementById('cal-desc').value = '';
}

function renderCalendarEvents(eventsObj) {
    const list = document.getElementById('calendar-list');
    list.innerHTML = '';
    
    // Convert object to array and sort by date
    const eventsArr = Object.values(eventsObj).sort((a,b) => new Date(a.date) - new Date(b.date));

    eventsArr.forEach(ev => {
        const item = document.createElement('div');
        item.className = 'calendar-event';
        item.innerHTML = `
            <div>
                <strong>${ev.date}:</strong> ${ev.description}
            </div>
            <button onclick="deleteCalendarEvent('${ev.id}')" style="min-width:20px; padding:0 5px;">x</button>
        `;
        list.appendChild(item);
    });
}

function deleteCalendarEvent(id) {
    if(confirm("Delete this event?")) {
        db.ref(`calendar/${id}`).remove();
    }
}


// --- 4. GLOBAL FILE SYSTEM (Firebase) ---
function listenForSharedFiles() {
    db.ref('sharedFiles').on('value', (snapshot) => {
        const files = snapshot.val() || {};
        renderFiles(Object.values(files));
    });
}

function createNewFile() {
    const name = prompt("Enter file name:", "New Note.txt");
    if (!name) return;
    const newFileRef = db.ref('sharedFiles').push();
    newFileRef.set({
        id: newFileRef.key,
        name: name,
        type: 'text',
        content: '',
        author: localStorage.getItem('activeUser')
    });
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const newFileRef = db.ref('sharedFiles').push();
        newFileRef.set({
            id: newFileRef.key,
            name: file.name,
            type: 'image',
            content: e.target.result,
            author: localStorage.getItem('activeUser')
        });
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
        div.oncontextmenu = (e) => {
            e.preventDefault();
            if(confirm(`Delete ${file.name} for everyone?`)) {
                db.ref(`sharedFiles/${file.id}`).remove();
            }
        };
        container.appendChild(div);
    });
}

function openFile(file) {
    if (file.type === 'text') {
        openWindow('poetry-window');
        const textarea = document.getElementById('notepad-content');
        textarea.value = file.content;
        textarea.dataset.currentFileId = file.id;
    } else if (file.type === 'image') {
        openWindow('photos-window');
        document.getElementById('current-photo').src = file.content;
    }
}

function saveCurrentNotepad() {
    const textarea = document.getElementById('notepad-content');
    const id = textarea.dataset.currentFileId;
    if (id) {
        db.ref(`sharedFiles/${id}`).update({ content: textarea.value });
        alert("File updated for both users!");
    } else {
        createNewFile();
    }
}

function clearAllFiles() {
    if(confirm("Format Disk? This deletes EVERYTHING in the cloud.")) {
        db.ref('sharedFiles').remove();
    }
}

// --- 5. GLOBAL STICKY NOTES (Firebase) ---
function listenForStickyNotes() {
    db.ref('stickyNotes').on('value', (snapshot) => {
        const notes = snapshot.val() || {};
        document.querySelectorAll('.sticky-note').forEach(n => n.remove());
        Object.values(notes).forEach(note => createStickyNoteElement(note));
    });
}

function newStickyNote() {
    const newNoteRef = db.ref('stickyNotes').push();
    newNoteRef.set({
        id: newNoteRef.key,
        text: '',
        x: 150 + Math.random() * 100,
        y: 150 + Math.random() * 100
    });
}

function createStickyNoteElement(note) {
    const el = document.createElement('div');
    el.className = 'sticky-note';
    el.style.left = note.x + 'px';
    el.style.top = note.y + 'px';
    el.innerHTML = `
        <div class="sticky-header" onmousedown="dragNoteStart(event, '${note.id}')">
            <span class="close-note" onclick="deleteNote('${note.id}')">×</span>
        </div>
        <textarea oninput="updateNoteText('${note.id}', this.value)">${note.text}</textarea>
    `;
    document.body.appendChild(el);
}

function updateNoteText(id, text) {
    db.ref(`stickyNotes/${id}`).update({ text: text });
}

function deleteNote(id) {
    db.ref(`stickyNotes/${id}`).remove();
}

function dragNoteStart(e, id) {
    const note = e.target.closest('.sticky-note');
    let shiftX = e.clientX - note.getBoundingClientRect().left;
    let shiftY = e.clientY - note.getBoundingClientRect().top;
    function onMouseMove(e) {
        note.style.left = (e.pageX - shiftX) + 'px';
        note.style.top = (e.pageY - shiftY) + 'px';
    }
    document.addEventListener('mousemove', onMouseMove);
    document.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        db.ref(`stickyNotes/${id}`).update({
            x: parseInt(note.style.left),
            y: parseInt(note.style.top)
        });
        document.onmouseup = null;
    };
}

// --- 6. VALENTINE CELEBRATION & EFFECTS ---
function createFlyingHearts(startX, startY) {
    const heartCount = 90;
    const roseCount = 40;
    if (!startX) startX = window.innerWidth / 2;
    if (!startY) startY = window.innerHeight / 2;

    for (let i = 0; i < heartCount + roseCount; i++) {
        const p = document.createElement('div');
        p.className = (i < heartCount) ? 'flying-heart' : 'flying-rose';
        p.innerHTML = (i < heartCount) ? '❤️' : '🌹';
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 300 + 200;
        const duration = 5 + Math.random() * 3;
        
        p.style.cssText = `position:fixed; left:${startX}px; top:${startY}px; font-size:${Math.random()*30+20}px; z-index:60000; pointer-events:none;`;
        document.body.appendChild(p);
        animateParticle(p, startX, startY, angle, velocity, duration);
        setTimeout(() => p.remove(), duration * 1000);
    }
}

function animateParticle(element, startX, startY, angle, velocity, duration) {
    let x = startX, y = startY, vx = Math.cos(angle) * velocity, vy = Math.sin(angle) * velocity;
    let time = 0;
    const gravity = 150, bounce = 0.85;
    
    function update() {
        time += 0.016;
        if (time > duration) return;
        vy += gravity * 0.016;
        x += vx * 0.016; y += vy * 0.016;
        if (x < 0 || x > window.innerWidth) vx *= -bounce;
        if (y < 0 || y > window.innerHeight) vy *= -bounce;
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function showGlowingText() {
    const textOverlay = document.createElement('div');
    textOverlay.className = 'glowing-text-overlay';
    textOverlay.innerHTML = '☺️☺️😏☺️☺️WHOOHOO☺️☺️😏☺️☺️';
    textOverlay.style.cssText = `position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); font-size:80px; font-weight:bold; color:#ff1493; z-index:70000; animation:glowPulse 0.6s infinite; text-align:center; pointer-events:none;`;
    document.body.appendChild(textOverlay);
    setTimeout(() => textOverlay.remove(), 5000);
}

function showValentinePrompt() {
    const dialog = document.createElement('div');
    dialog.className = 'window valentine-dialog';
    dialog.style.cssText = `position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:320px; z-index:50000;`;
    dialog.innerHTML = `
        <div class="title-bar"><div class="title-bar-text">❤️ Valentine Request</div></div>
        <div class="window-body" style="text-align:center;">
            <div style="font-size:50px; margin:10px;">❤️</div>
            <p>Will you be my Valentine?</p>
            <div style="display:flex; gap:10px; justify-content:center; margin-top:15px;">
                <button id="val-yes" class="valentine-yes">Yes ❤️</button>
                <button id="val-no" class="valentine-no">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    
    const yesBtn = dialog.querySelector('#val-yes');
    const noBtn = dialog.querySelector('#val-no');
    
    yesBtn.onclick = () => {
        createFlyingHearts();
        showGlowingText();
        dialog.remove();
    };
    
    noBtn.onmouseover = () => {
        noBtn.style.position = 'fixed';
        noBtn.style.left = Math.random() * (window.innerWidth - 100) + 'px';
        noBtn.style.top = Math.random() * (window.innerHeight - 50) + 'px';
    };
}

// --- 7. NOTIFICATION SYSTEM (Pager) ---
function sendNotification() {
    const topic = 'loveos_pager_channel'; 
    const user = localStorage.getItem('activeUser') || 'Someone';
    fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: `❤️ ${user} wants attention! ❤️`,
        headers: { 'Title': 'LoveOS 98 Alert', 'Priority': 'high' }
    })
    .then(r => r.ok ? alert("Page Sent!") : alert("Failed to send."))
    .catch(() => alert("Connection Error."));
}

// --- 8. UTILITIES ---
function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function openWindow(id) { document.getElementById(id).style.display = 'block'; }
function closeWindow(id) { document.getElementById(id).style.display = 'none'; }
function toggleStartMenu() {
    const m = document.getElementById('start-menu');
    m.style.display = (m.style.display === 'none') ? 'flex' : 'none';
}

window.onload = initSystem;