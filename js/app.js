/* ============================================================
   FOCUS DASHBOARD — app.js
   Features: Clock, Timer, To-Do (+ drag), Quick Links
             (+ drag), Light/Dark Mode, Custom Name
   ============================================================ */

/* ──────────────────────────────────────────
   SETTINGS  (theme + name)
────────────────────────────────────────── */
const SETTINGS_KEY = 'focus_settings';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch { return {}; }
}
function saveSettings(obj) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj));
}

let settings = loadSettings();

/* ── Theme ── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  settings.theme = theme;
  saveSettings(settings);
}

// Init theme (saved > system preference > dark)
(function initTheme() {
  const saved = settings.theme;
  if (saved) { applyTheme(saved); return; }
  const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(preferLight ? 'light' : 'dark');
})();

document.getElementById('btn-theme').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ── Custom Name ── */
const nameModal     = document.getElementById('name-modal');
const nameInput     = document.getElementById('name-input');
const toolbarLabel  = document.getElementById('toolbar-name-label');

function getUserName() { return settings.name || ''; }

function setUserName(name) {
  settings.name = name.trim();
  saveSettings(settings);
  updateToolbarNameLabel();
}

function updateToolbarNameLabel() {
  const n = getUserName();
  toolbarLabel.textContent = n ? n : 'Set name';
}

function openNameModal() {
  nameInput.value = getUserName();
  nameModal.classList.add('open');
  nameModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => nameInput.focus(), 80);
}
function closeNameModal() {
  nameModal.classList.remove('open');
  nameModal.setAttribute('aria-hidden', 'true');
}

document.getElementById('btn-edit-name').addEventListener('click', openNameModal);
document.getElementById('btn-cancel-name').addEventListener('click', closeNameModal);
document.getElementById('btn-save-name').addEventListener('click', () => {
  setUserName(nameInput.value);
  closeNameModal();
  updateGreeting();
});
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-save-name').click();
  if (e.key === 'Escape') closeNameModal();
});
nameModal.addEventListener('click', e => { if (e.target === nameModal) closeNameModal(); });

updateToolbarNameLabel();


/* ──────────────────────────────────────────
   1. CLOCK & GREETING
────────────────────────────────────────── */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getGreetingBase() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function updateGreeting() {
  const base = getGreetingBase();
  const name = getUserName();
  document.getElementById('greeting').textContent = name ? `${base}, ${name}` : base;
}

function updateClock() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, '0');
  const m   = String(now.getMinutes()).padStart(2, '0');
  const s   = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('clock').textContent         = `${h}:${m}`;
  document.getElementById('clock-seconds').textContent = s;

  const day   = DAYS[now.getDay()];
  const date  = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year  = now.getFullYear();
  document.getElementById('date-display').textContent  = `${day}, ${date} ${month} ${year}`;

  updateGreeting();
}

setInterval(updateClock, 1000);
updateClock();


/* ──────────────────────────────────────────
   2. FOCUS TIMER
────────────────────────────────────────── */
const RING_CIRC = 2 * Math.PI * 88;

let timerTotal    = 25 * 60;
let timerLeft     = timerTotal;
let timerRunning  = false;
let timerInterval = null;

const displayEl = document.getElementById('timer-display');
const statusEl  = document.getElementById('timer-status');
const ringEl    = document.getElementById('ring-progress');
const btnStart  = document.getElementById('btn-start');
const btnReset  = document.getElementById('btn-reset');

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

function updateRing() {
  ringEl.style.strokeDashoffset = RING_CIRC * (1 - timerLeft / timerTotal);
}

function setTimerState(state) {
  ringEl.classList.remove('running', 'paused', 'done');
  if (state) ringEl.classList.add(state);
}

function startTimer() {
  if (timerLeft <= 0) return;
  timerRunning = true;
  btnStart.textContent = 'Pause';
  setTimerState('running');
  statusEl.textContent = 'Focusing…';

  timerInterval = setInterval(() => {
    timerLeft--;
    displayEl.textContent = formatTime(timerLeft);
    updateRing();
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      btnStart.textContent = 'Start';
      setTimerState('done');
      statusEl.textContent = 'Session complete!';
      ringEl.style.strokeDashoffset = 0;
      notifyDone();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  btnStart.textContent = 'Resume';
  setTimerState('paused');
  statusEl.textContent = 'Paused';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerLeft = timerTotal;
  displayEl.textContent = formatTime(timerLeft);
  btnStart.textContent = 'Start';
  setTimerState('');
  statusEl.textContent = 'Ready';
  updateRing();
}

function notifyDone() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Focus session complete!', { body: 'Time for a break.' });
  }
}

btnStart.addEventListener('click', () => { timerRunning ? pauseTimer() : startTimer(); });
btnReset.addEventListener('click', resetTimer);

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (timerRunning) pauseTimer();
    timerTotal = parseInt(btn.dataset.minutes, 10) * 60;
    timerLeft  = timerTotal;
    displayEl.textContent = formatTime(timerLeft);
    statusEl.textContent = 'Ready';
    setTimerState('');
    updateRing();
    btnStart.textContent = 'Start';
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

updateRing();

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}


/* ──────────────────────────────────────────
   3. TO-DO LIST
────────────────────────────────────────── */
const TODO_KEY  = 'focus_todos';

let todos     = loadTodos();
let editingId = null;

function loadTodos() {
  try { return JSON.parse(localStorage.getItem(TODO_KEY)) || []; }
  catch { return []; }
}
function saveTodos() { localStorage.setItem(TODO_KEY, JSON.stringify(todos)); }

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function renderTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  if (todos.length === 0) {
    list.innerHTML = `<div class="empty-state"><span>✦</span>No tasks yet. Add one above.</div>`;
  } else {
    todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = `todo-item${todo.done ? ' done' : ''}`;
      li.dataset.id = todo.id;
      li.setAttribute('draggable', 'true');
      li.innerHTML = `
        <span class="drag-handle" aria-hidden="true">⠿</span>
        <button class="todo-check" aria-label="Toggle done"></button>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <div class="todo-actions">
          <button class="icon-btn edit"   aria-label="Edit"   title="Edit">✎</button>
          <button class="icon-btn delete" aria-label="Delete" title="Delete">✕</button>
        </div>`;
      li.querySelector('.todo-check').addEventListener('click', () => toggleTodo(todo.id));
      li.querySelector('.icon-btn.edit').addEventListener('click',   () => openEditModal(todo.id));
      li.querySelector('.icon-btn.delete').addEventListener('click', () => deleteTodo(todo.id));
      list.appendChild(li);
    });
    initTodoDnD(list);
  }
  updateTodoCount();
}

/* ──────────────────────────────────────────
   DRAG AND DROP — To-Do List
────────────────────────────────────────── */
function initTodoDnD(list) {
  let dragSrc = null;

  list.querySelectorAll('.todo-item[draggable]').forEach(item => {
    item.addEventListener('dragstart', e => {
      dragSrc = item;
      // Defer adding class so browser can snapshot the element first
      requestAnimationFrame(() => item.classList.add('dragging'));
      list.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.id);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      list.classList.remove('is-dragging');
      list.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
        el.classList.remove('drag-over-above', 'drag-over-below');
      });
      dragSrc = null;
    });

    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragSrc || item === dragSrc) return;
      e.dataTransfer.dropEffect = 'move';

      const rect   = item.getBoundingClientRect();
      const isAbove = e.clientY < rect.top + rect.height / 2;

      list.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
        el.classList.remove('drag-over-above', 'drag-over-below');
      });
      item.classList.add(isAbove ? 'drag-over-above' : 'drag-over-below');
    });

    item.addEventListener('dragleave', e => {
      // Only remove class if leaving to outside the item entirely
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove('drag-over-above', 'drag-over-below');
      }
    });

    item.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragSrc || item === dragSrc) return;

      const rect    = item.getBoundingClientRect();
      const isAbove = e.clientY < rect.top + rect.height / 2;

      const srcId = dragSrc.dataset.id;
      const tgtId = item.dataset.id;

      const srcIdx = todos.findIndex(t => t.id === srcId);
      const tgtIdx = todos.findIndex(t => t.id === tgtId);
      if (srcIdx === -1 || tgtIdx === -1) return;

      // Remove source item
      const [moved] = todos.splice(srcIdx, 1);
      // Find target index after removal, then insert before or after
      const newTgtIdx = todos.findIndex(t => t.id === tgtId);
      todos.splice(isAbove ? newTgtIdx : newTgtIdx + 1, 0, moved);

      saveTodos();
      renderTodos();
    });
  });
}

function updateTodoCount() {
  const total = todos.length;
  const done  = todos.filter(t => t.done).length;
  document.getElementById('todo-count').textContent =
    total === 0 ? '0 tasks' : `${done}/${total} done`;
}

function addTodo(text) {
  text = text.trim();
  if (!text) return;
  todos.unshift({ id: generateId(), text, done: false });
  saveTodos(); renderTodos();
}

function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTodos(); renderTodos(); }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos(); renderTodos();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Add task
const todoInput = document.getElementById('todo-input');
document.getElementById('btn-add-task').addEventListener('click', () => {
  addTodo(todoInput.value); todoInput.value = '';
});
todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { addTodo(todoInput.value); todoInput.value = ''; }
});

// Clear done
document.getElementById('btn-clear-done').addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  saveTodos(); renderTodos();
});

// Edit modal
const editModal     = document.getElementById('edit-modal');
const editTaskInput = document.getElementById('edit-task-input');

function openEditModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  editingId = id;
  editTaskInput.value = todo.text;
  editModal.classList.add('open');
  editModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => editTaskInput.focus(), 80);
}
function closeEditModal() {
  editModal.classList.remove('open');
  editModal.setAttribute('aria-hidden', 'true');
  editingId = null;
}

document.getElementById('btn-cancel-edit').addEventListener('click', closeEditModal);
document.getElementById('btn-save-edit').addEventListener('click', () => {
  const text = editTaskInput.value.trim();
  if (!text || !editingId) { closeEditModal(); return; }
  const todo = todos.find(t => t.id === editingId);
  if (todo) { todo.text = text; saveTodos(); renderTodos(); }
  closeEditModal();
});
editTaskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-save-edit').click();
  if (e.key === 'Escape') closeEditModal();
});
editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });

renderTodos();


/* ──────────────────────────────────────────
   4. QUICK LINKS
────────────────────────────────────────── */
const LINKS_KEY = 'focus_links';
let links = loadLinks();

function loadLinks() {
  try { return JSON.parse(localStorage.getItem(LINKS_KEY)) || getDefaultLinks(); }
  catch { return getDefaultLinks(); }
}
function getDefaultLinks() {
  return [
    { id: generateId(), name: 'Google',  url: 'https://google.com'  },
    { id: generateId(), name: 'Gmail',   url: 'https://gmail.com'   },
    { id: generateId(), name: 'YouTube', url: 'https://youtube.com' },
    { id: generateId(), name: 'GitHub',  url: 'https://github.com'  },
  ];
}
function saveLinks() { localStorage.setItem(LINKS_KEY, JSON.stringify(links)); }

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch { return null; }
}

function renderLinks() {
  const grid = document.getElementById('links-grid');
  grid.innerHTML = '';
  if (links.length === 0) {
    grid.innerHTML = `<div class="empty-state"><span>✦</span>No links yet.</div>`;
    return;
  }
  links.forEach(link => {
    const faviconUrl = getFaviconUrl(link.url);
    const a = document.createElement('a');
    a.className = 'link-item';
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.dataset.id = link.id;
    a.setAttribute('draggable', 'true');
    a.innerHTML = `
      <span class="drag-handle" aria-hidden="true">⠿</span>
      <div class="link-favicon">
        ${faviconUrl
          ? `<img src="${faviconUrl}" alt="" onerror="this.style.display='none'" />`
          : `<span>↗</span>`}
      </div>
      <span class="link-name">${escapeHtml(link.name)}</span>
      <span class="link-arrow">↗</span>
      <button class="link-delete" aria-label="Delete link" title="Remove link">✕</button>`;
    a.querySelector('.link-delete').addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      deleteLink(link.id);
    });
    grid.appendChild(a);
  });
  initLinksDnD(grid);
}

/* ──────────────────────────────────────────
   DRAG AND DROP — Quick Links
────────────────────────────────────────── */
function initLinksDnD(grid) {
  let dragSrc = null;

  grid.querySelectorAll('.link-item[draggable]').forEach(item => {
    item.addEventListener('dragstart', e => {
      dragSrc = item;
      requestAnimationFrame(() => item.classList.add('dragging'));
      grid.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.id);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      grid.classList.remove('is-dragging');
      grid.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
        el.classList.remove('drag-over-above', 'drag-over-below');
      });
      dragSrc = null;
    });

    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragSrc || item === dragSrc) return;
      e.dataTransfer.dropEffect = 'move';

      const rect    = item.getBoundingClientRect();
      const isAbove = e.clientY < rect.top + rect.height / 2;

      grid.querySelectorAll('.drag-over-above, .drag-over-below').forEach(el => {
        el.classList.remove('drag-over-above', 'drag-over-below');
      });
      item.classList.add(isAbove ? 'drag-over-above' : 'drag-over-below');
    });

    item.addEventListener('dragleave', e => {
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove('drag-over-above', 'drag-over-below');
      }
    });

    item.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragSrc || item === dragSrc) return;

      const rect    = item.getBoundingClientRect();
      const isAbove = e.clientY < rect.top + rect.height / 2;

      const srcId = dragSrc.dataset.id;
      const tgtId = item.dataset.id;

      const srcIdx = links.findIndex(l => l.id === srcId);
      const tgtIdx = links.findIndex(l => l.id === tgtId);
      if (srcIdx === -1 || tgtIdx === -1) return;

      const [moved] = links.splice(srcIdx, 1);
      const newTgtIdx = links.findIndex(l => l.id === tgtId);
      links.splice(isAbove ? newTgtIdx : newTgtIdx + 1, 0, moved);

      saveLinks();
      renderLinks();
    });
  });
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks(); renderLinks();
}

const linkModal     = document.getElementById('link-modal');
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');

document.getElementById('btn-add-link').addEventListener('click', () => {
  linkNameInput.value = ''; linkUrlInput.value = '';
  linkModal.classList.add('open');
  linkModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => linkNameInput.focus(), 80);
});
function closeLinkModal() {
  linkModal.classList.remove('open');
  linkModal.setAttribute('aria-hidden', 'true');
}
document.getElementById('btn-cancel-link').addEventListener('click', closeLinkModal);
document.getElementById('btn-save-link').addEventListener('click', () => {
  const name = linkNameInput.value.trim();
  let   url  = linkUrlInput.value.trim();
  if (!name || !url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  links.push({ id: generateId(), name, url });
  saveLinks(); renderLinks(); closeLinkModal();
});
linkUrlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-save-link').click();
  if (e.key === 'Escape') closeLinkModal();
});
linkNameInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLinkModal();
});
linkModal.addEventListener('click', e => { if (e.target === linkModal) closeLinkModal(); });

renderLinks();