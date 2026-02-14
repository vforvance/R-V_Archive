// 1. OPEN & CLOSE WINDOWS
function openWindow(id) {
    document.getElementById(id).style.display = 'block';
    bringToFront(id);
}

function closeWindow(id) {
    document.getElementById(id).style.display = 'none';
}

function bringToFront(id) {
    const windows = document.querySelectorAll('.window');
    windows.forEach(w => w.style.zIndex = 10);
    document.getElementById(id).style.zIndex = 20;
}

// 2. DRAGGABLE WINDOWS LOGIC
const windows = document.querySelectorAll('.window');

windows.forEach(dragElement);

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  // Move from the title bar
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
    bringToFront(elmnt.id); // Click to focus
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

// 3. CLOCK
function updateTime() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateTime, 1000);
updateTime();
