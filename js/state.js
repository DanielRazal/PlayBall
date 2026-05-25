'use strict';

// ─── Game state ───────────────────────────────────────────────────────────────

const state = {
  phase: 'menu',   // 'menu' | 'playing' | 'goal' | 'gameover' | 'paused'
  goldenGoal: false,
  kickoffPending: false,
  kickoffTeam: 'red',
  mode:  'menu',
  score: { red: 0, blue: 0 },
  timeLeft:  GAME_DURATION,
  goalTimer: 0,
  lastGoalTeam: null,
  lastTouchTeam: null,
  lastTime: 0,
  settings: { timeMins: 3, scoreLimit: 3, humanTeam: 'red', aiDifficulty: 'medium', fieldSize: 'medium', theme: 'arsenal', extrapolation: 200 },
  names: { red: 'Red', blue: 'Blue' },
  playerNumbers: { red: '', blue: '' },

  ball: {
    x: 0, y: 0, vx: 0, vy: 0,
    radius: BALL_R, mass: BALL_M,
    angle: 0,
  },

  players: [
    {
      id: 0, team: 'red',
      x: 0, y: 0, vx: 0, vy: 0,
      radius: PLAYER_R, mass: PLAYER_M,
      isAI: false,
      keys: { up: false, down: false, left: false, right: false, kick: false },
      kickJustPressed: false,
    },
    {
      id: 1, team: 'blue',
      x: 0, y: 0, vx: 0, vy: 0,
      radius: PLAYER_R, mass: PLAYER_M,
      isAI: false,
      keys: { up: false, down: false, left: false, right: false, kick: false },
      kickJustPressed: false,
    },
  ],

  aiFrameSkip: 0,
  netSnapshot: null,
};

// ─── Key bindings ─────────────────────────────────────────────────────────────

const KEY_MAP = {
  'KeyW':       { p: 0, a: 'up'    },
  'KeyS':       { p: 0, a: 'down'  },
  'KeyA':       { p: 0, a: 'left'  },
  'KeyD':       { p: 0, a: 'right' },
  'Space':      { p: 0, a: 'kick'  },
  'KeyX':       { p: 0, a: 'kick'  },
  'ArrowUp':    { p: 1, a: 'up'    },
  'ArrowDown':  { p: 1, a: 'down'  },
  'ArrowLeft':  { p: 1, a: 'left'  },
  'ArrowRight': { p: 1, a: 'right' },
  'Enter':      { p: 1, a: 'kick'  },
};

// ─── DOM references ───────────────────────────────────────────────────────────

let canvas, ctx;

const elScoreRed  = () => document.getElementById('score-red');
const elScoreBlue = () => document.getElementById('score-blue');
const elTimer     = () => document.getElementById('timer');
const elOverlay   = () => document.getElementById('overlay');
const elTitle     = () => document.getElementById('overlay-title');
const elMsg       = () => document.getElementById('overlay-msg');

function setOverlayTitle(text) {
  const el = elTitle();
  const maxSize = window.innerWidth <= 600 ? 34 : 52;
  el.textContent = text;
  requestAnimationFrame(() => {
    const maxWidth = elOverlay().clientWidth * 0.9;
    let size = maxSize;
    el.style.fontSize = size + 'px';
    while (el.scrollWidth > maxWidth && size > 14) {
      size -= 1;
      el.style.fontSize = size + 'px';
    }
  });
}
const elBtnRow    = () => document.getElementById('btn-row');