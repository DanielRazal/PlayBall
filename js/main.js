'use strict';

// ─── Input setup ─────────────────────────────────────────────────────────────

function setupInput() {
  const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Escape']);

  function resolvePlayerIdx(mappedIdx) {
    if (state.players[mappedIdx].isAI) return 1 - mappedIdx;
    return mappedIdx;
  }

  document.addEventListener('keydown', (e) => {
    if (document.activeElement === document.getElementById('chat-input')) return;
    if (PREVENT.has(e.code)) e.preventDefault();
    if (e.code === 'Escape') {
      if (state.phase === 'playing') pauseGame();
      else if (state.phase === 'paused') resumeGame();
      return;
    }
    const m = KEY_MAP[e.code];
    if (m) {
      const idx = resolvePlayerIdx(m.p);
      state.players[idx].keys[m.a] = true;
    }
  });

  document.addEventListener('keyup', (e) => {
    if (document.activeElement === document.getElementById('chat-input')) return;
    const m = KEY_MAP[e.code];
    if (m) {
      const idx = resolvePlayerIdx(m.p);
      state.players[idx].keys[m.a] = false;
    }
  });

  document.getElementById('btn-resume').addEventListener('click', resumeGame);
  document.getElementById('btn-restart').addEventListener('click', restartGame);
  document.getElementById('btn-menu').addEventListener('click', goToMenu);

  document.getElementById('sel-theme').addEventListener('change', e => {
    state.settings.theme = e.target.value;
  });
  document.getElementById('sel-size').addEventListener('change', e => {
    state.settings.fieldSize = e.target.value;
  });
  document.getElementById('sel-diff').addEventListener('change', e => {
    state.settings.aiDifficulty = e.target.value;
  });

  document.getElementById('btn-2p').addEventListener('click', () => startGame('2p'));
  document.getElementById('btn-ai').addEventListener('click', () => startGame('ai'));

  // Online mode toggle
  document.getElementById('btn-online').addEventListener('click', () => {
    const panel = document.getElementById('online-panel');
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  });

  document.getElementById('btn-create-room').addEventListener('click', () => {
    const name = document.getElementById('name-red').value.trim() || 'Red';
    state.settings.humanTeam = 'red';
    netCreateRoom(state.settings, name);
  });

  document.getElementById('btn-join-room').addEventListener('click', () => {
    const code = document.getElementById('net-join-code').value.trim();
    const name = document.getElementById('name-blue').value.trim() || 'Blue';
    if (!code) return;
    state.settings.humanTeam = 'blue';
    netJoinRoom(code, name);
  });

  function updateSettingDisplay(inputId) {
    const input = document.getElementById(inputId);
    const disp  = document.getElementById(inputId + '-display');
    const val   = parseInt(input.value);
    if (inputId === 'setting-time') {
      disp.textContent = val === 0 ? '∞' : `${val}:00`;
    } else {
      disp.textContent = val === 0 ? '∞' : val;
    }
  }

  document.querySelectorAll('.setting-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const delta = parseInt(btn.dataset.delta);
      input.value = Math.max(0, Math.min(10, parseInt(input.value) + delta));
      updateSettingDisplay(btn.dataset.target);
    });
  });
}

// ─── Chat setup ───────────────────────────────────────────────────────────────

function setupChat() {
  const input     = document.getElementById('chat-input');
  const sendBtn   = document.getElementById('chat-send');
  const playerBtn = document.getElementById('chat-player-btn');

  let activeSide = 'red';

  syncPlayerBtn();

  playerBtn.addEventListener('click', () => {
    activeSide = activeSide === 'red' ? 'blue' : 'red';
    syncPlayerBtn();
  });

  function syncPlayerBtn() {
    playerBtn.textContent = activeSide === 'red'
      ? (state.names.red  || 'RED')
      : (state.names.blue || 'BLUE');
    playerBtn.className = 'chat-player ' + activeSide;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function sendMessage() {
    const text = input.value.trim();
    input.value = '';
    input.blur();
    if (!text) return;

    syncPlayerBtn();
    const name = activeSide === 'red'
      ? (state.names.red  || 'Red')
      : (state.names.blue || 'Blue');

    const log = document.getElementById('chat-log');
    const msg = document.createElement('div');
    msg.className = 'chat-msg ' + activeSide;

    const now  = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    msg.innerHTML =
      `<span class="chat-time">${time}</span>` +
      `<span class="chat-name">${escapeHtml(name)}:</span>` +
      `<span class="chat-text">${escapeHtml(text)}</span>`;
    log.appendChild(msg);
    while (log.children.length > 80) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.code === 'Enter')  { e.preventDefault(); sendMessage(); }
    if (e.code === 'Escape') { e.preventDefault(); input.value = ''; input.blur(); }
  });
}

function addSystemMessage(text) {
  const log = document.getElementById('chat-log');
  const msg = document.createElement('div');
  msg.className = 'chat-msg system';
  msg.textContent = text;
  log.appendChild(msg);
  while (log.children.length > 80) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}

// ─── Game loop ────────────────────────────────────────────────────────────────

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
  state.lastTime = timestamp;

  if (state.phase === 'playing') {
    if (isOnline()) {
      // Send local player's keys to server; server runs all physics
      const myP = state.players.find(p => p.team === getMyTeam());
      if (myP) netSendInput({ ...myP.keys });
    } else {
      updateTimer(dt);
      updatePhysics();
    }
  } else if (state.phase === 'goal') {
    state.goalTimer -= dt * 1000;
    if (state.goalTimer <= 0) {
      state.phase = 'playing';
      resetBall();
      resetPlayers();
      hideOverlay();
    }
  } else if (state.phase === 'paused') {
    // reset delta so resuming doesn't cause a time jump
    state.lastTime = timestamp;
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
  canvas = document.getElementById('gameCanvas');
  ctx    = canvas.getContext('2d');
  preloadLogos();
  setupInput();
  setupChat();
  showMainMenu();
  render();
  requestAnimationFrame((ts) => {
    state.lastTime = ts;
    requestAnimationFrame(gameLoop);
  });
});
