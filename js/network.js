'use strict';

// ── Online multiplayer networking ─────────────────────────────────────────────
// Loaded only when the user starts an online game. socket.io is served by the
// server at /socket.io/socket.io.js so no CDN is needed.

let socket = null;
let myTeam = null;   // 'red' | 'blue'
let onlineMode = false;

// Last key state sent — only transmit on change
let lastSentKeys = null;

const SERVER_URL = window.location.hostname === 'localhost'
  ? window.location.origin                      // local dev
  : 'https://playball-9414.onrender.com';

function netConnect() {
  if (socket && socket.connected) return;
  socket = io(SERVER_URL);

  socket.on('room-created', ({ code, team }) => {
    myTeam = team;
    document.getElementById('net-status').textContent = `Room created: ${code}`;
    document.getElementById('net-code-display').textContent = code;
    document.getElementById('net-waiting').style.display = 'block';
    document.getElementById('net-join-panel').style.display = 'none';
  });

  socket.on('player-joined', ({ names }) => {
    state.names.red  = names.red;
    state.names.blue = names.blue;
    document.getElementById('net-waiting').style.display = 'none';
    startOnlineGame();
  });

  socket.on('room-joined', ({ code, team }) => {
    myTeam = team;
    document.getElementById('net-status').textContent = `Joined room ${code}`;
    startOnlineGame();
  });

  socket.on('join-error', (msg) => {
    document.getElementById('net-error').textContent = msg;
  });

  socket.on('state', (s) => {
    if (!onlineMode) return;
    // Apply server authoritative state
    state.phase    = s.phase;
    state.score    = s.score;
    state.timeLeft = s.timeLeft;
    state.goalTimer = s.goalTimer;
    if (s.names) state.names = s.names;

    state.ball.x     = s.ball.x;
    state.ball.y     = s.ball.y;
    state.ball.vx    = s.ball.vx;
    state.ball.vy    = s.ball.vy;
    state.ball.angle = s.ball.angle;

    for (const sp of s.players) {
      const lp = state.players.find(p => p.id === sp.id);
      if (lp) {
        lp.team = sp.team;
        lp.x    = sp.x;
        lp.y    = sp.y;
        lp.vx   = sp.vx;
        lp.vy   = sp.vy;
      }
    }

    updateHUD();

    if (s.phase === 'goal') {
      const team = s.score.red > (s._prevRed || 0) ? 'red' : 'blue';
      showGoalOverlay(s.score.red > (s._prevBlue || 0) ? 'red' : 'blue');
    } else if (s.phase === 'gameover') {
      showGameOver();
    } else if (s.phase === 'playing') {
      hideOverlay();
    }
  });

  socket.on('player-left', ({ team }) => {
    addSystemMessage(`⚠ ${team.toUpperCase()} player disconnected.`);
    state.phase = 'gameover';
    showGameOver();
    onlineMode = false;
  });

  socket.on('disconnect', () => {
    if (onlineMode) {
      addSystemMessage('⚠ Disconnected from server.');
      state.phase = 'gameover';
      showGameOver();
      onlineMode = false;
    }
  });
}

function netSendInput(keys) {
  if (!socket || !onlineMode) return;
  const k = JSON.stringify(keys);
  if (k === lastSentKeys) return;
  lastSentKeys = k;
  socket.emit('input', keys);
}

function netCreateRoom(settings, name) {
  netConnect();
  socket.emit('create-room', { settings, name });
}

function netJoinRoom(code, name) {
  netConnect();
  socket.emit('join-room', { code: code.trim().toUpperCase(), name });
}

function startOnlineGame() {
  onlineMode = true;
  lastSentKeys = null;
  // Apply field size from settings
  const fs = FIELD_SIZES[state.settings.fieldSize] || FIELD_SIZES.medium;
  FIELD.left = fs.left; FIELD.right = fs.right;
  FIELD.top  = fs.top;  FIELD.bottom = fs.bottom;
  GOAL_H    = fs.goalH;
  GOAL_DEEP = fs.goalDeep;
  state.phase = 'playing';
  hideOverlay();
}

function netLeave() {
  onlineMode = false;
  if (socket) socket.disconnect();
  socket = null;
  myTeam = null;
}

function isOnline() { return onlineMode; }
function getMyTeam() { return myTeam; }
