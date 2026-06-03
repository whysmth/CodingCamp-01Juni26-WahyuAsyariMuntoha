/* ============================================================
   FOCUS DASHBOARD — app.js
   Handles: Clock, Timer, To-Do, Quick Links, LocalStorage
   ============================================================ */

/* ──────────────────────────────────────────
   1. CLOCK & GREETING
────────────────────────────────────────── */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('clock').textContent         = `${h}:${m}`;
  document.getElementById('clock-seconds').textContent = s;

  const day   = DAYS[now.getDay()];
  const date  = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year  = now.getFullYear();
  document.getElementById('date-display').textContent  = `${day}, ${date} ${month} ${year}`;

  const hour = now.getHours();
  let greeting = 'Good evening';
  if (hour >= 5  && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  document.getElementById('greeting').textContent = greeting;
}

setInterval(updateClock, 1000);
updateClock();


/* ──────────────────────────────────────────
   2. FOCUS TIMER
────────────────────────────────────────── */
const RING_CIRC = 2 * Math.PI * 88; // ~552.92

let timerTotal    = 25 * 60; // seconds
let timerLeft     = timerTotal;
let timerRunning  = false;
let timerInterval = null;

const displayEl  = document.getElementById('timer-display');
const statusEl   = document.getElementById('timer-status');
const ringEl     = document.getElementById('ring-progress');
const btnStart   = document.getElementById('btn-start');
const btnReset   = document.getElementById('btn-reset');

function formatTime(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function updateRing() {
  const progress = timerLeft / timerTotal;
  const offset   = RING_CIRC * (1 - progress);
  ringEl.style.strokeDashoffset = offset;
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

btnStart.addEventListener('click', () => {
  timerRunning ? pauseTimer() : startTimer();
});
btnReset.addEventListener('click', resetTimer);

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (timerRunning) pauseTimer();
    const mins = parseInt(btn.dataset.minutes, 10);
    timerTotal = mins * 60;
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

// Init ring
updateRing();

// Request notification permission quietly
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}


/* ──────────────────────────────────────────
   3. TO-DO LIST
────────────────────────────────────────── */
const TODO_KEY = 'focus_todos';

let todos = loadTodos();
let editingId = null;

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(TODO_KEY)) || [];
  } catch { return []; }
}

function saveTodos() {
  localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}

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
      li.innerHTML = `
        <button class="todo-check" aria-label="Toggle done"></button>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <div class="todo-actions">
          <button class="icon-btn edit" aria-label="Edit" title="Edit">✎</button>
          <button class="icon-btn delete" aria-label="Delete" title="Delete">✕</button>
        </div>`;

      // Toggle done
      li.querySelector('.todo-check').addEventListener('click', () => toggleTodo(todo.id));
      // Edit
      li.querySelector('.icon-btn.edit').addEventListener('click', () => openEditModal(todo.id));
      // Delete
      li.querySelector('.icon-btn.delete').addEventListener('click', () => deleteTodo(todo.id));

      list.appendChild(li);
    });
  }

  updateTodoCount();
}

function updateTodoCount() {
  const total  = todos.length;
  const done   = todos.filter(t => t.done).length;
  const countEl = document.getElementById('todo-count');
  countEl.textContent = total === 0 ? '0 tasks' : `${done}/${total} done`;
}

function addTodo(text) {
  text = text.trim();
  if (!text) return;
  todos.unshift({ id: generateId(), text, done: false });
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) { todo.done = !todo.done; saveTodos(); renderTodos(); }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Add task
const todoInput = document.getElementById('todo-input');
document.getElementById('btn-add-task').addEventListener('click', () => {
  addTodo(todoInput.value);
  todoInput.value = '';
});
todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { addTodo(todoInput.value); todoInput.value = ''; }
});

// Clear done
document.getElementById('btn-clear-done').addEventListener('click', () => {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
});

// Edit modal
const editModal      = document.getElementById('edit-modal');
const editTaskInput  = document.getElementById('edit-task-input');

function openEditModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  editingId = id;
  editTaskInput.value = todo.text;
  editModal.classList.add('open');
  editModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => editTaskInput.focus(), 100);
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
  try {
    return JSON.parse(localStorage.getItem(LINKS_KEY)) || getDefaultLinks();
  } catch { return getDefaultLinks(); }
}

function getDefaultLinks() {
  return [
    { id: generateId(), name: 'Google',   url: 'https://google.com'   },
    { id: generateId(), name: 'Gmail',    url: 'https://gmail.com'    },
    { id: generateId(), name: 'YouTube',  url: 'https://youtube.com'  },
    { id: generateId(), name: 'GitHub',   url: 'https://github.com'   },
  ];
}

function saveLinks() {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

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
    a.innerHTML = `
      <div class="link-favicon">
        ${faviconUrl
          ? `<img src="${faviconUrl}" alt="" onerror="this.style.display='none'" />`
          : `<span>↗</span>`}
      </div>
      <span class="link-name">${escapeHtml(link.name)}</span>
      <span class="link-arrow">↗</span>
      <button class="link-delete" aria-label="Delete link" title="Remove link">✕</button>`;

    a.querySelector('.link-delete').addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    grid.appendChild(a);
  });
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

// Add link modal
const linkModal     = document.getElementById('link-modal');
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');

document.getElementById('btn-add-link').addEventListener('click', () => {
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkModal.classList.add('open');
  linkModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => linkNameInput.focus(), 100);
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
  saveLinks();
  renderLinks();
  closeLinkModal();
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
