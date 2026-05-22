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
    if (document.activeElement === document.getElementById('name-red')) return;
    if (document.activeElement === document.getElementById('player-number')) return;
    if (PREVENT.has(e.code)) e.preventDefault();
    if (e.code === 'Escape') {
      if (state.phase === 'playing') pauseGame();
      else if (state.phase === 'paused') resumeGame();
      else if (state.phase === 'menu' && document.getElementById('ai-row').style.display === 'flex') showMainMenu();
      return;
    }
    const m = KEY_MAP[e.code];
    if (m) {
      if (isOnline()) {
        const myP = state.players.find(p => p.team === getMyTeam());
        if (myP) myP.keys[m.a] = true;
      } else {
        const idx = resolvePlayerIdx(m.p);
        state.players[idx].keys[m.a] = true;
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (document.activeElement === document.getElementById('chat-input')) return;
    const m = KEY_MAP[e.code];
    if (m) {
      if (isOnline()) {
        const myP = state.players.find(p => p.team === getMyTeam());
        if (myP) myP.keys[m.a] = false;
      } else {
        const idx = resolvePlayerIdx(m.p);
        state.players[idx].keys[m.a] = false;
      }
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

  document.getElementById('btn-ai').addEventListener('click', () => {
    // Hide full menu, show only difficulty buttons
    document.getElementById('settings-row').style.display  = 'none';
    document.getElementById('name-row').style.display      = 'none';
    document.getElementById('dropdowns-row').style.display = 'none';
    document.getElementById('online-panel').style.display  = 'none';
    elBtnRow().style.display = 'none';
    elMsg().textContent      = '';
    elTitle().textContent    = 'CHOOSE DIFFICULTY';
    updateDiffButtons();
    document.getElementById('ai-row').style.display = 'flex';
  });

  function updateDiffButtons() {
    const cur = state.settings.aiDifficulty || 'medium';
    ['easy', 'medium', 'hard'].forEach(d => {
      document.getElementById('diff-' + d).classList.toggle('diff-active', d === cur);
    });
  }

  ['easy', 'medium', 'hard'].forEach(diff => {
    document.getElementById('diff-' + diff).addEventListener('click', () => {
      state.settings.aiDifficulty = diff;
      document.getElementById('sel-diff').value = diff;
      if (state.phase === 'gameover') {
        restartGame();
      } else {
        startGame('ai');
      }
    });
  });

  // Online mode toggle
  document.getElementById('btn-online').addEventListener('click', () => {
    const panel = document.getElementById('online-panel');
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  });

  document.getElementById('btn-create-room').addEventListener('click', () => {
    const name = document.getElementById('name-red').value || 'Player';
    const tag  = document.getElementById('player-number').value.trim().slice(0, 2);
    state.settings.humanTeam = 'red';
    netCreateRoom(state.settings, name, tag);
  });

  document.getElementById('btn-join-room').addEventListener('click', () => {
    const code = document.getElementById('net-join-code').value.trim();
    const name = document.getElementById('name-red').value || 'Player';
    const tag  = document.getElementById('player-number').value.trim().slice(0, 2);
    if (!code) return;
    state.settings.humanTeam = 'blue';
    netJoinRoom(code, name, tag);
  });

  document.getElementById('player-number').addEventListener('input', (e) => {
    const tag = e.target.value.slice(0, 2);
    e.target.value = tag;
    state.playerNumbers[state.settings.humanTeam] = tag;
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
      const min   = btn.dataset.min !== undefined ? parseInt(btn.dataset.min) : 0;
      const max   = btn.dataset.max !== undefined ? parseInt(btn.dataset.max) : 10;
      input.value = Math.max(min, Math.min(max, parseInt(input.value) + delta));
      if (input.type === 'hidden') updateSettingDisplay(btn.dataset.target);
      if (btn.dataset.target === 'setting-extrap') {
        state.settings.extrapolation = parseInt(input.value) || 0;
      }
    });
  });

  document.getElementById('setting-extrap').addEventListener('input', (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 500) val = 500;
    state.settings.extrapolation = val;
  });

  document.getElementById('name-red').addEventListener('input', (e) => {
    localStorage.setItem('playball_nickname', e.target.value);
  });

  function confirmName() {
    localStorage.setItem('playball_nickname', document.getElementById('name-red').value);
    setNameConfirmed(true);
    showMainMenu();
  }

  document.getElementById('btn-confirm-name').addEventListener('click', confirmName);

  document.getElementById('name-display').addEventListener('click', () => {
    setNameConfirmed(false);
    showMainMenu();
  });

  document.getElementById('name-red').addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.code === 'Enter' && document.getElementById('btn-confirm-name').style.display !== 'none') {
      e.preventDefault();
      confirmName();
    }
  });
}

// ─── Chat setup ───────────────────────────────────────────────────────────────

function syncChatMode() {
  const chatWrap  = document.getElementById('chat-wrap');
  const input     = document.getElementById('chat-input');
  const sendBtn   = document.getElementById('chat-send');
  const playerBtn = document.getElementById('chat-player-btn');
  const online    = isOnline();

  chatWrap.style.display = online ? '' : 'none';

  input.disabled    = !online;
  sendBtn.disabled  = !online;
  input.placeholder = online ? 'Press Enter to chat...' : '';

  const side = online ? (getMyTeam() || 'red') : 'red';
  playerBtn.textContent = side === 'red'
    ? (state.names.red  || 'RED')
    : (state.names.blue || 'BLUE');
  playerBtn.className = 'chat-player ' + side;
}

function setupChat() {
  const input     = document.getElementById('chat-input');
  const sendBtn   = document.getElementById('chat-send');
  const playerBtn = document.getElementById('chat-player-btn');

  // Not clickable — just a label showing your own team
  playerBtn.style.cursor = 'default';
  playerBtn.style.pointerEvents = 'none';

  function sendMessage() {
    if (!isOnline()) return;
    const text = input.value.trim();
    input.value = '';
    input.blur();
    if (!text) return;

    const side = getMyTeam() || 'red';
    const name = side === 'red'
      ? (state.names.red  || 'Red')
      : (state.names.blue || 'Blue');

    addChatMessage(side, name, text);
    netSendChat(side, name, text);
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.code === 'Enter')  { e.preventDefault(); sendMessage(); }
    if (e.code === 'Escape') { e.preventDefault(); input.value = ''; input.blur(); }
  });

  syncChatMode();
}

function addChatMessage(team, name, text) {
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const log = document.getElementById('chat-log');
  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + team;
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

function addSystemMessage(text) {
  const log = document.getElementById('chat-log');
  const msg = document.createElement('div');
  msg.className = 'chat-msg system';
  msg.textContent = text;
  log.appendChild(msg);
  while (log.children.length > 80) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}

// ─── Client-side extrapolation (online mode) ─────────────────────────────────

function applyNetExtrapolation() {
  const snap  = state.netSnapshot;
  if (!snap) return;
  const maxMs = state.settings.extrapolation || 0;
  if (maxMs === 0) return;
  const frames = Math.min((performance.now() - snap.t) / (1000 / 60), maxMs / (1000 / 60));
  if (frames < 0.01) return;

  function extrap(pos, vel, friction) {
    return pos + vel * (1 - Math.pow(friction, frames)) / (1 - friction);
  }

  const b = state.ball;
  b.x     = extrap(snap.ball.x, snap.ball.vx, FRICTION_BALL);
  b.y     = extrap(snap.ball.y, snap.ball.vy, FRICTION_BALL);
  b.angle = snap.ball.angle + Math.hypot(snap.ball.vx, snap.ball.vy) * 0.06 * frames;

  for (const sp of snap.players) {
    const lp = state.players.find(p => p.id === sp.id);
    if (lp) {
      lp.x = extrap(sp.x, sp.vx, FRICTION_PLAYER);
      lp.y = extrap(sp.y, sp.vy, FRICTION_PLAYER);
    }
  }
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
      applyNetExtrapolation();
    } else {
      updateTimer(dt);
      updatePhysics();
    }
  } else if (state.phase === 'notif') {
    // physics frozen during notification; keep lastTime ticking so no time jump on resume
    state.lastTime = timestamp;
  } else if (state.phase === 'paused') {
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
  const _savedName = localStorage.getItem('playball_nickname');
  if (_savedName !== null) {
    document.getElementById('name-red').value = _savedName;
    setNameConfirmed(true);
  }
  setupInput();
  setupChat();
  showMainMenu();
  render();
  requestAnimationFrame((ts) => {
    state.lastTime = ts;
    requestAnimationFrame(gameLoop);
  });
});
