'use strict';

// =====================================================================
// Storage helper: chrome.storage.local inside the extension,
// localStorage as a fallback (e.g. when opening newtab.html directly).
// =====================================================================
const hasChromeStorage =
  typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

const storage = {
  async get(key) {
    if (hasChromeStorage) {
      const result = await chrome.storage.local.get(key);
      return result[key];
    }
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  },
  async set(key, value) {
    if (hasChromeStorage) return chrome.storage.local.set({ [key]: value });
    localStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key) {
    if (hasChromeStorage) return chrome.storage.local.remove(key);
    localStorage.removeItem(key);
  },
};

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

let toastTimer;
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
}

// =====================================================================
// Feature 1: Clock + personalized greeting
// =====================================================================
let userName = '';

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  if (hour >= 18 && hour < 22) return 'Good evening';
  return 'Good night';
}

function updateClock() {
  const now = new Date();
  $('clock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  $('greeting-text').textContent = greetingFor(now.getHours());
}

function renderName() {
  const hasName = Boolean(userName);
  $('name').textContent = userName;
  $('greeting').hidden = !hasName;
  $('name-form').hidden = hasName;
  $('focus').hidden = !hasName; // focus appears once we know the user
}

function startNameEdit() {
  const input = $('name-input');
  input.value = userName;
  $('greeting').hidden = true;
  $('name-form').hidden = false;
  input.focus();
  input.select();
}

$('name').addEventListener('click', startNameEdit);

$('name-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = $('name-input').value.trim();
  if (!value) return;
  userName = value;
  await storage.set('name', userName);
  renderName();
});

$('name-input').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && userName) renderName();
});
$('name-input').addEventListener('blur', () => {
  if (userName) renderName(); // leaving the field cancels an edit
});

// =====================================================================
// Feature 2: Background image (drag & drop)
// =====================================================================
const DEFAULT_BACKGROUND = 'images/default-bg.svg';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 2560; // px, longest side, keeps storage small

function applyBackground(src) {
  const bg = $('background');
  const img = new Image();
  img.onload = () => {
    bg.style.backgroundImage = `url("${src}")`;
    bg.classList.add('ready');
  };
  img.src = src;
}

// Shrinks big photos and converts them to JPEG so they fit in storage.
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1d2733'; // behind transparent PNGs
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

let dragDepth = 0;
const isFileDrag = (event) =>
  event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files');

document.addEventListener('dragenter', (event) => {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  dragDepth++;
  $('drop-hint').hidden = false;
});

document.addEventListener('dragover', (event) => {
  if (!isFileDrag(event)) return;
  event.preventDefault(); // allow dropping (and stop Chrome opening the file)
  event.dataTransfer.dropEffect = 'copy';
});

document.addEventListener('dragleave', (event) => {
  if (!isFileDrag(event)) return;
  dragDepth--;
  if (dragDepth <= 0) {
    dragDepth = 0;
    $('drop-hint').hidden = true;
  }
});

document.addEventListener('drop', async (event) => {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  dragDepth = 0;
  $('drop-hint').hidden = true;

  const file = event.dataTransfer.files[0];
  if (!file) return;
  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast('Please drop a JPG, PNG or WEBP image.');
    return;
  }

  try {
    const dataUrl = await resizeImage(file);
    applyBackground(dataUrl);
    await storage.set('background', dataUrl);
    showToast('Background updated');
  } catch (error) {
    showToast("Sorry, that image couldn't be used.");
  }
});

$('reset-bg').addEventListener('click', async () => {
  applyBackground(DEFAULT_BACKGROUND);
  await storage.remove('background');
  showToast('Background reset');
});

// =====================================================================
// Feature 3: Daily focus
// =====================================================================
let focus = null; // { text, done, date }
let currentDay = todayKey();

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function loadFocus() {
  const saved = await storage.get('focus');
  if (saved && saved.date === todayKey()) {
    focus = saved;
  } else {
    focus = null;
    if (saved) await storage.remove('focus'); // yesterday's focus is cleared
  }
  renderFocus();
}

function renderFocus() {
  const hasFocus = Boolean(focus);
  $('focus-form').hidden = hasFocus;
  $('focus-display').hidden = !hasFocus;
  if (!hasFocus) {
    $('focus-input').value = '';
    return;
  }
  $('focus-text').textContent = focus.text;
  $('focus-done').checked = focus.done;
  $('focus-text').classList.toggle('done', focus.done);
  $('focus-message').hidden = !focus.done;
}

$('focus-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = $('focus-input').value.trim();
  if (!value) {
    $('focus-input').value = '';
    return;
  }
  focus = { text: value, done: false, date: todayKey() };
  await storage.set('focus', focus);
  renderFocus();
});

$('focus-done').addEventListener('change', async () => {
  focus.done = $('focus-done').checked;
  await storage.set('focus', focus);
  renderFocus();
});

$('focus-text').addEventListener('click', () => {
  const input = $('focus-input');
  input.value = focus.text;
  $('focus-display').hidden = true;
  $('focus-form').hidden = false;
  input.focus();
  input.select();
});

$('focus-input').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && focus) renderFocus();
});
$('focus-input').addEventListener('blur', () => {
  if (focus) renderFocus(); // leaving the field cancels an edit
});

$('focus-delete').addEventListener('click', async () => {
  focus = null;
  await storage.remove('focus');
  renderFocus();
  $('focus-input').focus();
});

// =====================================================================
// Feature 4: Focus timer (Pomodoro)
// =====================================================================
const MODES = {
  focus: { label: 'Focus', minutes: 25, next: 'break' },
  break: { label: 'Break', minutes: 5, next: 'focus' },
};

let mode = 'focus';
let remainingMs = MODES.focus.minutes * 60 * 1000;
let endTime = null; // timestamp when the running session ends
let timerId = null;
let audioCtx = null;

function formatMs(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
}

function renderTimer() {
  const running = endTime !== null;
  $('timer-display').textContent = formatMs(remainingMs);
  $('timer-mode').textContent = MODES[mode].label;
  $('timer').classList.toggle('is-break', mode === 'break');
  $('timer-start').textContent = running ? 'Pause' : 'Start';
  document.title = running ? `${formatMs(remainingMs)} - ${MODES[mode].label}` : 'New Tab';
}

function startTimer() {
  // Create the audio context on a click so Chrome allows the sound later.
  if (!audioCtx) audioCtx = new AudioContext();
  audioCtx.resume();
  endTime = Date.now() + remainingMs;
  timerId = setInterval(tickTimer, 250);
  renderTimer();
}

function stopInterval() {
  clearInterval(timerId);
  timerId = null;
  endTime = null;
}

function pauseTimer() {
  remainingMs = Math.max(0, endTime - Date.now());
  stopInterval();
  renderTimer();
}

function resetTimer() {
  stopInterval();
  remainingMs = MODES[mode].minutes * 60 * 1000;
  renderTimer();
}

function tickTimer() {
  remainingMs = Math.max(0, endTime - Date.now());
  if (remainingMs <= 0) {
    finishSession();
    return;
  }
  renderTimer();
}

function finishSession() {
  const finished = mode;
  stopInterval();
  playChime();
  mode = MODES[mode].next;
  remainingMs = MODES[mode].minutes * 60 * 1000;
  renderTimer();
  showToast(finished === 'focus'
    ? 'Focus session done! Time for a 5-minute break.'
    : 'Break is over. Ready to focus?');
}

// Three short rising beeps, generated in the browser (no audio file needed).
function playChime() {
  if (!audioCtx) return;
  const start = audioCtx.currentTime;
  [660, 880, 990].forEach((frequency, i) => {
    const t = start + i * 0.35;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  });
}

$('timer-start').addEventListener('click', () => {
  if (endTime !== null) pauseTimer();
  else startTimer();
});
$('timer-reset').addEventListener('click', resetTimer);

// =====================================================================
// Start-up
// =====================================================================
function tick() {
  updateClock();
  // At midnight, clear yesterday's focus without needing a reload.
  if (todayKey() !== currentDay) {
    currentDay = todayKey();
    loadFocus();
  }
}

async function init() {
  tick();
  setInterval(tick, 1000);
  renderTimer();

  const [savedName, savedBackground] = await Promise.all([
    storage.get('name'),
    storage.get('background'),
  ]);
  userName = savedName || '';
  applyBackground(savedBackground || DEFAULT_BACKGROUND);
  renderName();
  await loadFocus();
}

init();
