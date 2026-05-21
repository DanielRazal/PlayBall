'use strict';

// ─── Player input ─────────────────────────────────────────────────────────────

function applyKick(p) {
  if (!p.keys.kick) { p.kickJustPressed = false; return; }

  const now  = performance.now();
  const b    = state.ball;
  const dx   = b.x - p.x;
  const dy   = b.y - p.y;
  const dist = Math.hypot(dx, dy);

  if (dist > KICK_RANGE) return;
  if ((now - (p.lastKickTime || 0)) < KICK_COOLDOWN) return;
  p.lastKickTime    = now;
  p.kickJustPressed = false;

  b.vx += (dx / dist) * KICK_IMPULSE;
  b.vy += (dy / dist) * KICK_IMPULSE;

  const bspd = Math.hypot(b.vx, b.vy);
  if (bspd > BALL_MAX_SPD) {
    b.vx = (b.vx / bspd) * BALL_MAX_SPD;
    b.vy = (b.vy / bspd) * BALL_MAX_SPD;
  }
}

// ─── Collision resolution ─────────────────────────────────────────────────────

function resolveCircleCollision(a, b) {
  const dx   = b.x - a.x;
  const dy   = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minD = a.radius + b.radius;

  if (dist >= minD || dist < 0.001) return;

  const nx = dx / dist;
  const ny = dy / dist;

  const dvx = b.vx - a.vx;
  const dvy = b.vy - a.vy;
  const dot = dvx * nx + dvy * ny;

  if (dot >= 0) {
    // bodies are separating — only correct overlap
    const overlap = (minD - dist) / 2;
    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;
    return;
  }

  const impulse = -(1 + RESTITUTION_DEFAULT) * dot / (1 / a.mass + 1 / b.mass);

  a.vx -= (impulse / a.mass) * nx;
  a.vy -= (impulse / a.mass) * ny;
  b.vx += (impulse / b.mass) * nx;
  b.vy += (impulse / b.mass) * ny;

  const bspd = Math.hypot(b.vx, b.vy);
  if (bspd > BALL_MAX_SPD) {
    b.vx = (b.vx / bspd) * BALL_MAX_SPD;
    b.vy = (b.vy / bspd) * BALL_MAX_SPD;
  }

  const overlap = (minD - dist) / 2;
  a.x -= nx * overlap;
  a.y -= ny * overlap;
  b.x += nx * overlap;
  b.y += ny * overlap;
}

function resolveBallWalls() {
  const b  = state.ball;
  const gt = GOAL_TOP();
  const gb = GOAL_BOT();
  const r  = b.radius;

  if (b.y - r < FIELD.top) {
    b.y  = FIELD.top + r;
    b.vy = Math.abs(b.vy) * RESTITUTION_DEFAULT;
  }
  if (b.y + r > FIELD.bottom) {
    b.y  = FIELD.bottom - r;
    b.vy = -Math.abs(b.vy) * RESTITUTION_DEFAULT;
  }
  if (b.x - r < FIELD.left) {
    if (!(b.y > gt && b.y < gb)) {
      b.x  = FIELD.left + r;
      b.vx = Math.abs(b.vx) * RESTITUTION_DEFAULT;
    }
  }
  if (b.x + r > FIELD.right) {
    if (!(b.y > gt && b.y < gb)) {
      b.x  = FIELD.right - r;
      b.vx = -Math.abs(b.vx) * RESTITUTION_DEFAULT;
    }
  }
}

function clampPlayerToField(p) {
  const r = p.radius;
  if (p.x - r < FIELD.left)   { p.x = FIELD.left   + r; if (p.vx < 0) p.vx = 0; }
  if (p.x + r > FIELD.right)  { p.x = FIELD.right  - r; if (p.vx > 0) p.vx = 0; }
  if (p.y - r < FIELD.top)    { p.y = FIELD.top    + r; if (p.vy < 0) p.vy = 0; }
  if (p.y + r > FIELD.bottom) { p.y = FIELD.bottom - r; if (p.vy > 0) p.vy = 0; }
}

function applyPlayerInput(p) {
  const k = p.keys;
  if (k.up)    p.vy -= PLAYER_ACCEL;
  if (k.down)  p.vy += PLAYER_ACCEL;
  if (k.left)  p.vx -= PLAYER_ACCEL;
  if (k.right) p.vx += PLAYER_ACCEL;

  const spd = Math.hypot(p.vx, p.vy);
  if (spd > PLAYER_MAX_SPD) {
    p.vx = (p.vx / spd) * PLAYER_MAX_SPD;
    p.vy = (p.vy / spd) * PLAYER_MAX_SPD;
  }
}

// ─── AI ───────────────────────────────────────────────────────────────────────

const AI_LEVELS = {
  easy:   { frameSkip: 4, speedMult: 0.55, posRadius: 120, noise: 45 },
  medium: { frameSkip: 2, speedMult: 0.82, posRadius: 90,  noise: 12 },
  hard:   { frameSkip: 1, speedMult: 1.0,  posRadius: 70,  noise: 0  },
};

function applyAIInput(p) {
  const cfg = AI_LEVELS[state.settings.aiDifficulty] || AI_LEVELS.medium;

  state.aiFrameSkip = (state.aiFrameSkip + 1) % cfg.frameSkip;
  if (state.aiFrameSkip !== 0) return;

  const b = state.ball;
  const k = p.keys;
  k.up = k.down = k.left = k.right = false;

  const ballDist = Math.hypot(b.x - p.x, b.y - p.y);

  let targetX, targetY;

  const dangerZone = p.team === 'blue'
    ? b.x > FIELD.right - 170
    : b.x < FIELD.left  + 170;

  if (ballDist < cfg.posRadius) {
    if (dangerZone) {
      // ball near own goal — clear sideways rather than shooting into own net
      const clearX = p.team === 'blue' ? -1 : 1;
      const clearY = b.y > FIELD.centerY ? -1 : 1;
      targetX = b.x + clearX * (BALL_R + PLAYER_R + 6);
      targetY = b.y + clearY * (BALL_R + PLAYER_R + 6);
    } else {
      // approach ball from behind, aiming at opponent's goal
      const goalX  = p.team === 'blue' ? FIELD.left : FIELD.right;
      const btgX   = goalX - b.x;
      const btgY   = FIELD.centerY - b.y;
      const btgLen = Math.hypot(btgX, btgY) || 1;
      const approach = BALL_R + PLAYER_R + 6;
      targetX = b.x - (btgX / btgLen) * approach + (Math.random() - 0.5) * cfg.noise;
      targetY = b.y - (btgY / btgLen) * approach + (Math.random() - 0.5) * cfg.noise;
    }
  } else {
    targetX = b.x + (Math.random() - 0.5) * cfg.noise;
    targetY = b.y + (Math.random() - 0.5) * cfg.noise;
  }

  const dx        = targetX - p.x;
  const dy        = targetY - p.y;
  const threshold = 3 / cfg.speedMult;

  k.right = dx >  threshold;
  k.left  = dx < -threshold;
  k.down  = dy >  threshold;
  k.up    = dy < -threshold;

  if (cfg.speedMult < 1.0 && Math.random() > cfg.speedMult) {
    k.up = k.down = k.left = k.right = false;
  }

  k.kick = ballDist < KICK_RANGE;
}
