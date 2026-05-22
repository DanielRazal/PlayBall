'use strict';

// ─── Player input ─────────────────────────────────────────────────────────────

function applyKick(p) {
  if (!p.keys.kick) { p.kickJustPressed = false; return; }
  if (state.kickoffPending && p.team !== state.kickoffTeam) return;

  const now  = performance.now();
  const b    = state.ball;
  const dx   = b.x - p.x;
  const dy   = b.y - p.y;
  const dist = Math.hypot(dx, dy);

  if (dist > KICK_RANGE) return;
  if ((now - (p.lastKickTime || 0)) < KICK_COOLDOWN) return;
  p.lastKickTime    = now;
  p.kickJustPressed = false;
  state.lastTouchTeam = p.team;

  b.vx += (dx / dist) * KICK_IMPULSE;
  b.vy += (dy / dist) * KICK_IMPULSE;

  if (state.kickoffPending) state.kickoffPending = false;

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

  let hitLeft = false, hitRight = false, hitTop = false, hitBot = false;

  if (b.y - r < FIELD.top)    { b.y = FIELD.top    + r; b.vy =  Math.abs(b.vy) * RESTITUTION_DEFAULT; hitTop   = true; }
  if (b.y + r > FIELD.bottom) { b.y = FIELD.bottom - r; b.vy = -Math.abs(b.vy) * RESTITUTION_DEFAULT; hitBot   = true; }
  if (b.x - r < FIELD.left  && !(b.y > gt && b.y < gb)) { b.x = FIELD.left  + r; b.vx =  Math.abs(b.vx) * RESTITUTION_DEFAULT; hitLeft  = true; }
  if (b.x + r > FIELD.right && !(b.y > gt && b.y < gb)) { b.x = FIELD.right - r; b.vx = -Math.abs(b.vx) * RESTITUTION_DEFAULT; hitRight = true; }

  // Corner escape: push ball away from corner so it doesn't get trapped
  if ((hitLeft || hitRight) && (hitTop || hitBot)) {
    b.vx += hitLeft  ?  2.5 : -2.5;
    b.vy += hitTop   ?  2.5 : -2.5;
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
  //                  frameSkip  speedMult  posRadius  noise  predictFrames  aimOffset
  easy:   { frameSkip: 6, speedMult: 0.55, posRadius: 140, noise: 50, predictFrames: 0,  aimOffset: 0  },
  medium: { frameSkip: 3, speedMult: 0.80, posRadius: 100, noise: 18, predictFrames: 18, aimOffset: 35 },
  hard:   { frameSkip: 1, speedMult: 1.00, posRadius: 80,  noise: 0,  predictFrames: 40, aimOffset: 55 },
};

// Stable aim target — refreshed every ~30 frames so the AI commits to a corner
let _aiAimY    = 0;
let _aiAimTimer = 30; // start at 30 so first call triggers immediate refresh

function applyAIInput(p) {
  const cfg = AI_LEVELS[state.settings.aiDifficulty] || AI_LEVELS.medium;
  const b   = state.ball;
  const k   = p.keys;

  // Refresh aim target (which corner of the opponent's goal to aim for)
  if (++_aiAimTimer >= 30) {
    _aiAimTimer = 0;
    _aiAimY = FIELD.centerY + (Math.random() > 0.5 ? 1 : -1) * cfg.aimOffset;
  }

  state.aiFrameSkip = (state.aiFrameSkip + 1) % cfg.frameSkip;
  if (state.aiFrameSkip !== 0) {
    // On skip frames keep current movement keys; only refresh kick
    k.kick = Math.hypot(b.x - p.x, b.y - p.y) < KICK_RANGE;
    return;
  }

  k.up = k.down = k.left = k.right = false;

  // Predict ball position (intercept rather than chase)
  const predBallX = Math.max(FIELD.left  + BALL_R, Math.min(FIELD.right  - BALL_R, b.x + b.vx * cfg.predictFrames));
  const predBallY = Math.max(FIELD.top   + BALL_R, Math.min(FIELD.bottom - BALL_R, b.y + b.vy * cfg.predictFrames));

  const ballDist = Math.hypot(b.x - p.x, b.y - p.y);
  let   targetX, targetY;

  const dangerZone = p.team === 'blue'
    ? b.x > FIELD.right - 170
    : b.x < FIELD.left  + 170;

  if (ballDist < cfg.posRadius) {
    if (dangerZone) {
      // Clear ball sideways away from own goal
      const clearX = p.team === 'blue' ? -1 : 1;
      const clearY = b.y > FIELD.centerY ? -1 : 1;
      targetX = b.x + clearX * (BALL_R + PLAYER_R + 6);
      targetY = b.y + clearY * (BALL_R + PLAYER_R + 6);
    } else {
      // Position behind ball to shoot toward goal corner
      const goalX  = p.team === 'blue' ? FIELD.left : FIELD.right;
      const btgX   = goalX - predBallX;
      const btgY   = _aiAimY - predBallY;
      const btgLen = Math.hypot(btgX, btgY) || 1;
      const approach = BALL_R + PLAYER_R + 6;
      targetX = predBallX - (btgX / btgLen) * approach + (Math.random() - 0.5) * cfg.noise;
      targetY = predBallY - (btgY / btgLen) * approach + (Math.random() - 0.5) * cfg.noise;
    }
  } else {
    // Move toward predicted ball position
    targetX = predBallX + (Math.random() - 0.5) * cfg.noise;
    targetY = predBallY + (Math.random() - 0.5) * cfg.noise;
  }

  // Keep target inside field so AI doesn't get stuck on walls
  targetX = Math.max(FIELD.left + PLAYER_R, Math.min(FIELD.right  - PLAYER_R, targetX));
  targetY = Math.max(FIELD.top  + PLAYER_R, Math.min(FIELD.bottom - PLAYER_R, targetY));

  const dx        = targetX - p.x;
  const dy        = targetY - p.y;
  const threshold = 3 / cfg.speedMult;

  k.right = dx >  threshold;
  k.left  = dx < -threshold;
  k.down  = dy >  threshold;
  k.up    = dy < -threshold;

  // Kick logic scaled to difficulty
  if (ballDist < KICK_RANGE) {
    const kickDirX = b.x - p.x;
    const ownGoalX = p.team === 'blue' ? FIELD.right : FIELD.left;
    const safeKick = (ownGoalX - b.x) * kickDirX < 0; // kick dir points away from own goal
    if (cfg.predictFrames === 0) {
      k.kick = true;                                    // easy: always kick
    } else if (cfg.predictFrames <= 20) {
      k.kick = safeKick || Math.random() > 0.75;       // medium: mostly safe, 25% random kick
    } else {
      k.kick = safeKick;                                // hard: only kick when well-positioned
    }
  } else {
    k.kick = false;
  }
}
