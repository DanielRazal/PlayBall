'use strict';

// ─── Reset helpers ────────────────────────────────────────────────────────────

function resetBall() {
  const b = state.ball;
  b.x     = FIELD.centerX;
  b.y     = FIELD.centerY;
  b.vx    = 0;
  b.vy    = 0;
  b.angle = 0;
}

function resetPlayers() {
  for (const p of state.players) {
    p.x  = p.team === 'red' ? FIELD.centerX - 130 : FIELD.centerX + 130;
    p.y  = FIELD.centerY;
    p.vx = p.vy = 0;
  }
}

// ─── Game start ───────────────────────────────────────────────────────────────

function startGame(mode) {
  state.settings.timeMins   = parseInt(document.getElementById('setting-time').value)  || 0;
  state.settings.scoreLimit = parseInt(document.getElementById('setting-goals').value) || 0;
  state.names.red  = document.getElementById('name-red').value.trim()  || 'Red';
  state.names.blue = document.getElementById('name-blue').value.trim() || 'Blue';
  if (mode === 'ai') {
    const aiTeam = state.settings.humanTeam === 'red' ? 'blue' : 'red';
    state.names[aiTeam] = 'AI';
  }

  const fs = FIELD_SIZES[state.settings.fieldSize] || FIELD_SIZES.medium;
  FIELD.left = fs.left; FIELD.right = fs.right;
  FIELD.top  = fs.top;  FIELD.bottom = fs.bottom;
  GOAL_H    = fs.goalH;
  GOAL_DEEP = fs.goalDeep;

  const human = state.settings.humanTeam;
  const ai    = human === 'red' ? 'blue' : 'red';

  state.players[0].team = human;
  state.players[0].isAI = false;
  state.players[1].team = ai;
  state.players[1].isAI = (mode === 'ai');

  state.mode       = mode;
  state.score      = { red: 0, blue: 0 };
  state.timeLeft   = state.settings.timeMins > 0 ? state.settings.timeMins * 60 : Infinity;
  state.goldenGoal = false;
  state.phase      = 'playing';
  resetBall();
  resetPlayers();
  updateHUD();
  hideOverlay();
}

// ─── Physics update ───────────────────────────────────────────────────────────

function updatePhysics() {
  const [p0, p1] = state.players;

  for (const p of state.players) {
    if (p.isAI) applyAIInput(p);
    applyPlayerInput(p);

    p.vx *= FRICTION_PLAYER;
    p.vy *= FRICTION_PLAYER;
    p.x  += p.vx;
    p.y  += p.vy;
    clampPlayerToField(p);
  }

  const b = state.ball;
  b.vx *= FRICTION_BALL;
  b.vy *= FRICTION_BALL;
  b.x  += b.vx;
  b.y  += b.vy;
  b.angle += Math.hypot(b.vx, b.vy) * 0.06;

  resolveBallWalls();

  applyKick(p0);
  applyKick(p1);
  resolveCircleCollision(p0, b);
  resolveCircleCollision(p1, b);
  resolveCircleCollision(p0, p1);

  checkGoal();
}

// ─── Goal detection ───────────────────────────────────────────────────────────

function checkGoal() {
  const b  = state.ball;
  const gt = GOAL_TOP();
  const gb = GOAL_BOT();

  if (b.x + b.radius < FIELD.left  && b.y > gt && b.y < gb) { triggerGoal('blue'); return; }
  if (b.x - b.radius > FIELD.right && b.y > gt && b.y < gb) { triggerGoal('red'); }
}

function triggerGoal(team) {
  state.score[team]++;
  state.lastGoalTeam = team;
  updateHUD();

  if (state.goldenGoal) {
    state.phase = 'gameover';
    showGameOver();
    return;
  }

  const limit = state.settings.scoreLimit;
  if (limit > 0 && state.score[team] >= limit) {
    state.phase = 'gameover';
    showGameOver();
    return;
  }

  state.phase = 'goal';
  state.goalTimer = GOAL_PAUSE_MS;
  showGoalOverlay(team);
}

// ─── Timer & HUD ─────────────────────────────────────────────────────────────

function updateTimer(dt) {
  if (state.timeLeft === Infinity) {
    elTimer().textContent = '∞';
    return;
  }
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    if (state.score.red === state.score.blue) {
      state.goldenGoal = true;
      state.timeLeft = Infinity;
      elTimer().textContent = 'GG';
      showGoldenGoalNotice();
    } else {
      endGame();
    }
  }
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.floor(state.timeLeft % 60);
  elTimer().textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateHUD() {
  elScoreRed().textContent  = state.score.red;
  elScoreBlue().textContent = state.score.blue;
}

// ─── Overlay helpers ──────────────────────────────────────────────────────────

const elPauseBtnRow = () => document.getElementById('pause-btn-row');

function setOverlayMode(mode) {
  elBtnRow().style.display      = mode === 'menu' || mode === 'gameover' ? 'flex' : 'none';
  elPauseBtnRow().style.display = mode === 'pause' ? 'flex' : 'none';
  const menuOnly = mode === 'menu' ? 'flex' : 'none';
  document.getElementById('name-row').style.display      = menuOnly;
  document.getElementById('settings-row').style.display  = menuOnly;
  document.getElementById('dropdowns-row').style.display = menuOnly;
  if (mode !== 'menu') document.getElementById('online-panel').style.display = 'none';
}

function showMainMenu() {
  elOverlay().classList.remove('hidden');
  elTitle().textContent = 'PLAYBALL';
  elMsg().textContent   = '';
  setOverlayMode('menu');
}

function showGoalOverlay(team) {
  elOverlay().classList.remove('hidden');
  const name = state.names[team] || team.toUpperCase();
  elTitle().textContent = 'GOAL!';
  elMsg().textContent   = `${name} scores!`;
  addSystemMessage(`⚽ ${name} scored! ${state.score.red} — ${state.score.blue}`);
  setOverlayMode('goal');
}

function showGameOver() {
  elOverlay().classList.remove('hidden');
  const { red, blue } = state.score;
  const rName = state.names.red  || 'Red';
  const bName = state.names.blue || 'Blue';
  let result;
  if (red > blue)      result = `${rName} wins!`;
  else if (blue > red) result = `${bName} wins!`;
  else                 result = 'Draw!';
  elTitle().textContent = result;
  elMsg().textContent   = `${red} — ${blue}`;
  setOverlayMode('gameover');
}

function showPause() {
  elOverlay().classList.remove('hidden');
  elTitle().textContent = 'PAUSE';
  elMsg().textContent   = '';
  setOverlayMode('pause');
}

function hideOverlay() {
  elOverlay().classList.add('hidden');
}

function showGoldenGoalNotice() {
  elOverlay().classList.remove('hidden');
  elTitle().textContent = 'GOLDEN GOAL!';
  elMsg().textContent   = 'Next goal wins';
  setOverlayMode('golden');
  setTimeout(() => {
    if (state.goldenGoal && state.phase === 'playing') hideOverlay();
  }, 2500);
}

function endGame() {
  state.phase = 'gameover';
  showGameOver();
}

function pauseGame() {
  if (state.phase !== 'playing') return;
  state.phase = 'paused';
  showPause();
}

function resumeGame() {
  if (state.phase !== 'paused') return;
  state.phase = 'playing';
  hideOverlay();
}

function restartGame() {
  startGame(state.mode);
}

function goToMenu() {
  state.phase = 'menu';
  showMainMenu();
}
