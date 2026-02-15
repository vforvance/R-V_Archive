/* --- 1. BOOT & LOGIN --- */
const USERS = { 'Venance': 'letmein', 'Rehema': 'letmein' };

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
    const lines = [ "BIOS Date 02/14/98 12:00:00 Ver: 1.0.0", "CPU: Pentium II 333MHz", "64MB RAM System OK", "Starting Windows 98..." ];
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

let selectedUser = null;

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
    document.getElementById('pwd-error').innerText = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const pwdInput = document.getElementById('login-pass');
    if (pwdInput) {
        pwdInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && selectedUser) {
                document.getElementById('btn-login-ok').click();
            }
        });
    }
    
    document.getElementById('btn-login-ok').addEventListener('click', () => {
        const pass = document.getElementById('login-pass').value;
        if (selectedUser && USERS[selectedUser] && USERS[selectedUser] === pass) {
            localStorage.setItem('isLoggedIn', 'true');
            document.getElementById('password-overlay').style.display = 'none';
            showDesktop();
        } else {
            document.getElementById('pwd-error').innerText = "Incorrect Password";
        }
    });
    
    const backBtn = document.getElementById('btn-login-back');
    if (backBtn) {
        backBtn.addEventListener('click', goBackToUserSelect);
    }
});

function logout() {
    localStorage.removeItem('isLoggedIn');
    location.reload(); // Reloads page to show boot screen again
}

function showDesktop() {
    document.getElementById('desktop').style.display = 'flex';
    document.querySelector('.taskbar').style.display = 'flex';
    loadSettings();
    populateStartMenu();
    setTimeout(showValentinePrompt, 800); // Show valentine prompt after desktop loads
}

/* --- VALENTINE PROMPT --- */
let valentineCount = 0; // Track how many times "No" is clicked

/* --- FLYING HEARTS & ROSES CELEBRATION --- */
function createFlyingHearts(startX, startY) {
    const heartCount = 90;
    const roseCount = 40;
    
    // Default to center if not provided
    if (!startX) startX = window.innerWidth / 2;
    if (!startY) startY = window.innerHeight / 2;
    
    // Create hearts
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.className = 'flying-heart';
        heart.innerHTML = '❤️';
        
        const angle = (i / heartCount) * Math.PI * 2;
        const velocity = Math.random() * 200 + 150;
        const duration = 5 + Math.random() * 3;
        
        heart.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            font-size: ${Math.random() * 30 + 20}px;
            pointer-events: none;
            z-index: 60000;
            opacity: 1;
            display: block;
        `;
        document.body.appendChild(heart);
        
        // Animate burst and bounce
        animateParticle(heart, startX, startY, angle, velocity, duration);
        
        setTimeout(() => {
            if (heart.parentNode) heart.remove();
        }, duration * 1000 + 100);
    }
    
    // Create roses
    for (let i = 0; i < roseCount; i++) {
        const rose = document.createElement('div');
        rose.className = 'flying-rose';
        rose.innerHTML = '🌹';
        
        const angle = (i / roseCount) * Math.PI * 2;
        const velocity = Math.random() * 180 + 140;
        const duration = 5.5 + Math.random() * 3;
        
        rose.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            font-size: ${Math.random() * 25 + 18}px;
            pointer-events: none;
            z-index: 60001;
            opacity: 1;
            display: block;
        `;
        document.body.appendChild(rose);
        
        // Animate burst and bounce
        animateParticle(rose, startX, startY, angle, velocity, duration);
        
        setTimeout(() => {
            if (rose.parentNode) rose.remove();
        }, duration * 1000 + 100);
    }
}

function animateParticle(element, startX, startY, angle, velocity, duration) {
    let x = startX;
    let y = startY;
    let vx = Math.cos(angle) * velocity;
    let vy = Math.sin(angle) * velocity;
    let time = 0;
    const gravity = 300;
    const bounce = 0.7;
    
    function updateParticle(timestamp) {
        const deltaTime = 0.016;
        time += deltaTime;
        
        if (time > duration) return;
        
        // Apply gravity
        vy += gravity * deltaTime;
        
        // Update position
        x += vx * deltaTime;
        y += vy * deltaTime;
        
        // Boundary bouncing
        if (x < 0 || x > window.innerWidth) {
            vx *= -bounce;
            x = Math.max(0, Math.min(window.innerWidth, x));
        }
        if (y < 0 || y > window.innerHeight) {
            vy *= -bounce;
            y = Math.max(0, Math.min(window.innerHeight, y));
        }
        
        // Apply damping
        vx *= 0.98;
        vy *= 0.98;
        
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        
        requestAnimationFrame(updateParticle);
    }
    
    requestAnimationFrame(updateParticle);
}

function showValentinePrompt() {
    valentineCount += 1;
    
    // Create the valentine dialog with Windows 98 styling
    const dialog = document.createElement('div');
    dialog.className = 'window valentine-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 350px;
        z-index: 50000;
    `;
    
    dialog.innerHTML = `
        <div class="title-bar">
            <div class="title-bar-text">❤️ Valentine</div>
        </div>
        <div class="window-body">
            <div style="text-align: center; padding: 15px;">
                <div style="font-size: 60px; margin-bottom: 15px;">❤️</div>
                <p style="font-size: 14px; margin: 15px 0; font-family: 'MS Sans Serif', Arial, sans-serif;">Will you be my Valentine?</p>
                <div style="display: flex; gap: 8px; justify-content: center; margin-top: 20px;">
                    <button id="val-yes" class="valentine-yes" style="min-width: 80px; padding: 6px 12px;">Yes ❤️</button>
                    <button id="val-no" class="valentine-no" style="min-width: 80px; padding: 6px 12px;">No</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    const yesBtn = dialog.querySelector('#val-yes');
    const noBtn = dialog.querySelector('#val-no');
    
    yesBtn.onclick = () => {
        const rect = yesBtn.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        createFlyingHearts(startX, startY);
        setTimeout(() => {
            dialog.remove();
            valentineCount = 0;
            alert('❤️ Yay! Lets celebrate together! ❤️');
        }, 500);
    };
    
    // No button runs away but stays in bounded area around the dialog
    const dialogCenterX = window.innerWidth / 2;
    const dialogCenterY = window.innerHeight / 2;
    const boundaryRadius = 175; // Stay within 250px of dialog center
    
    const moveNoButton = () => {
        // Generate random position within bounded area
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * boundaryRadius;
        const randomX = dialogCenterX + Math.cos(angle) * distance - 80;
        const randomY = dialogCenterY + Math.sin(angle) * distance - 55;
        
        noBtn.style.position = 'fixed';
        noBtn.style.left = Math.max(0, Math.min(randomX, window.innerWidth - 100)) + 'px';
        noBtn.style.top = Math.max(0, Math.min(randomY, window.innerHeight - 75)) + 'px';
        noBtn.style.zIndex = '50005';
    };
    
    noBtn.onmouseover = moveNoButton;
    noBtn.onclick = (e) => {
        e.preventDefault();
        moveNoButton();
    };
}

/* --- 2. NOTIFICATION SYSTEM (Pager) --- */
function sendNotification() {
    // 1. CHANGE 'loveos_pager_channel' TO A UNIQUE SECRET NAME
    const topic = 'loveos_pager_channel'; 
    
    fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: '❤️ You have a new notification from LoveOS!',
        headers: { 'Title': 'LoveOS Request', 'Priority': 'high' }
    })
    .then(response => {
        if(response.ok) alert("Page sent successfully! He will be with you shortly.");
        else alert("Pager network is busy.");
    })
    .catch(err => alert("Connection Error: Check internet."));
}

/* --- 3. MY FILES SYSTEM (LocalStorage) --- */
function getFiles() {
    return JSON.parse(localStorage.getItem('myFiles') || "[]");
}

function saveFiles(files) {
    localStorage.setItem('myFiles', JSON.stringify(files));
    renderFiles();
}

function createNewFile() {
    const name = prompt("Enter file name (e.g., Note.txt):", "New Note.txt");
    if (!name) return;
    const files = getFiles();
    files.push({ id: Date.now(), name: name, type: 'text', content: '' });
    saveFiles(files);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const files = getFiles();
        files.push({ id: Date.now(), name: file.name, type: 'image', content: e.target.result });
        saveFiles(files);
    };
    reader.readAsDataURL(file);
}

function renderFiles() {
    const container = document.getElementById('file-list');
    container.innerHTML = '';
    const files = getFiles();
    
    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        // Icon based on type
        const iconSrc = file.type === 'image' 
            ? 'https://win98icons.alexmeub.com/icons/png/image_gif-0.png' 
            : 'https://win98icons.alexmeub.com/icons/png/notepad_file-2.png';
            
        div.innerHTML = `<img src="${iconSrc}"><span>${file.name}</span>`;
        
        div.ondblclick = () => openFile(file);
        
        // Right click to delete (simple implementation)
        div.oncontextmenu = (e) => {
            e.preventDefault();
            if(confirm(`Delete ${file.name}?`)) {
                const newFiles = files.filter(f => f.id !== file.id);
                saveFiles(newFiles);
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
        // Hook save button to update this specific file
        textarea.dataset.currentFileId = file.id;
    } else if (file.type === 'image') {
        openWindow('photos-window');
        document.getElementById('current-photo').src = file.content;
    }
}

function saveCurrentNotepad() {
    const textarea = document.getElementById('notepad-content');
    const content = textarea.value;
    const id = textarea.dataset.currentFileId;
    
    if (id) {
        // Update existing file
        const files = getFiles();
        const file = files.find(f => f.id == id);
        if (file) {
            file.content = content;
            saveFiles(files);
            alert("File saved!");
        }
    } else {
        // Save as new
        const name = prompt("Save as:", "Note.txt");
        if(name) {
            const files = getFiles();
            files.push({ id: Date.now(), name: name, type: 'text', content: content });
            saveFiles(files);
            alert("Saved to My Files!");
        }
    }
}

function clearAllFiles() {
    if(confirm("Are you sure you want to delete all files?")) {
        localStorage.removeItem('myFiles');
        renderFiles();
    }
}

/* --- 4. STANDARD WINDOW FUNCTIONS --- */
function openWindow(id) {
    const win = document.getElementById(id);
    if (win) {
        win.style.display = 'block';
        bringToFront(id);
    }
}
function closeWindow(id) { document.getElementById(id).style.display = 'none'; }

function bringToFront(id) {
    document.querySelectorAll('.window').forEach(w => w.style.zIndex = 10);
    const el = document.getElementById(id);
    if(el) el.style.zIndex = 1000;
}

function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
    if(menu.style.display === 'flex') bringToFront('start-menu');
}

/* --- 5. DRAGGABLE --- */
function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = elmnt.querySelector(".title-bar");
    if (header) header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        bringToFront(elmnt.id);
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
        pos3 = e.clientX; pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
}
document.querySelectorAll('.window').forEach(dragElement);

/* --- 6. BACKGROUND SETTINGS --- */
function changeBackground(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        document.body.style.backgroundImage = `url(${e.target.result})`;
        localStorage.setItem('customBG', e.target.result);
    };
    reader.readAsDataURL(file);
}
function resetBackground() {
    document.body.style.backgroundImage = "url('https://win98icons.alexmeub.com/images/clouds-wallpaper.jpg')";
    localStorage.removeItem('customBG');
}
function loadSettings() {
    const bg = localStorage.getItem('customBG');
    if(bg) document.body.style.backgroundImage = `url(${bg})`;
}

// Populate Start Menu
function populateStartMenu() {
    const container = document.querySelector('.menu-items');
    // Don't duplicate items if they exist
    if (container.querySelector('.generated')) return;

    const divider = container.querySelector('.divider');
    const icons = document.querySelectorAll('#desktop .icon');
    
    icons.forEach(icon => {
        const text = icon.querySelector('span').innerText;
        const img = icon.querySelector('img').src;
        const dblclick = icon.getAttribute('ondblclick');
        
        const item = document.createElement('div');
        item.className = 'menu-item generated';
        item.innerHTML = `<img src="${img}"> ${text}`;
        item.onclick = () => { eval(dblclick); toggleStartMenu(); };
        container.insertBefore(item, divider);
    });
}

// Clock
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}, 1000);

// Init
window.onload = initSystem;