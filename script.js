// 1. OPEN & CLOSE WINDOWS
function openWindow(id) {
    document.getElementById(id).style.display = 'block';
    bringToFront(id);
}

function closeWindow(id) {
    document.getElementById(id).style.display = 'none';
}

// 2. TOGGLE START MENU
function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    if (menu.style.display === 'none') {
        menu.style.display = 'flex';
        bringToFront('start-menu'); // Ensure it pops over windows
    } else {
        menu.style.display = 'none';
    }
}

// Close Start Menu if clicking elsewhere
document.addEventListener('click', function(event) {
    const menu = document.getElementById('start-menu');
    const startBtn = document.querySelector('.start-button');
    if (!menu.contains(event.target) && !startBtn.contains(event.target)) {
        menu.style.display = 'none';
    }
});


function bringToFront(id) {
    const windows = document.querySelectorAll('.window');
    windows.forEach(w => w.style.zIndex = 10);
    const element = document.getElementById(id);
    if(element) element.style.zIndex = 20;
}

// 3. DRAGGABLE WINDOWS LOGIC
const windows = document.querySelectorAll('.window');
windows.forEach(dragElement);

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = elmnt.querySelector(".title-bar");
  if (header) {
    header.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
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
  }
}

// 4. CLOCK
function updateTime() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateTime, 1000);
updateTime();
