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
  const k    = p.keys;
  const mult = p.isAI ? (AI_LEVELS[state.settings.aiDifficulty]?.speedMult ?? 1) : 1;
  const accel  = PLAYER_ACCEL * mult;
  const maxSpd = PLAYER_MAX_SPD * mult;

  if (k.up)    p.vy -= accel;
  if (k.down)  p.vy += accel;
  if (k.left)  p.vx -= accel;
  if (k.right) p.vx += accel;

  const spd = Math.hypot(p.vx, p.vy);
  if (spd > maxSpd) {
    p.vx = (p.vx / spd) * maxSpd;
    p.vy = (p.vy / spd) * maxSpd;
  }
}

// ─── AI ───────────────────────────────────────────────────────────────────────

const AI_LEVELS = {
  //        frameSkip  speedMult  posRadius  noise  predictFrames  aimOffset  aimRefresh  defendOffset  pressRadius
  easy:   { frameSkip: 5, speedMult: 0.68, posRadius: 130, noise: 38, predictFrames: 6,  aimOffset: 18, aimRefresh: 40, defendOffset: 70, pressRadius: 28 },
  medium: { frameSkip: 3, speedMult: 0.88, posRadius: 90,  noise: 10, predictFrames: 28, aimOffset: 42, aimRefresh: 25, defendOffset: 65, pressRadius: 45 },
  hard:   { frameSkip: 1, speedMult: 1.10, posRadius: 70,  noise: 0,  predictFrames: 60, aimOffset: 62, aimRefresh: 12, defendOffset: 55, pressRadius: 65 },
};

// Simulate ball position accounting for wall bounces and friction
function _predictBall(b, frames) {
  if (frames === 0) return { x: b.x, y: b.y };
  let x = b.x, y = b.y, vx = b.vx, vy = b.vy;
  for (let i = 0; i < frames; i++) {
    x += vx; y += vy;
    vx *= 0.985; vy *= 0.985;
    if (y <= FIELD.top    + BALL_R) { y = FIELD.top    + BALL_R; vy =  Math.abs(vy); }
    if (y >= FIELD.bottom - BALL_R) { y = FIELD.bottom - BALL_R; vy = -Math.abs(vy); }
    if (x <= FIELD.left   + BALL_R) { x = FIELD.left   + BALL_R; vx =  Math.abs(vx); }
    if (x >= FIELD.right  - BALL_R) { x = FIELD.right  - BALL_R; vx = -Math.abs(vx); }
  }
  return { x, y };
}

// Stable aim target — refreshed every ~30 frames so the AI commits to a corner
let _aiAimY    = 0;
let _aiAimTimer = 30;

function applyAIInput(p) {
  const cfg    = AI_LEVELS[state.settings.aiDifficulty] || AI_LEVELS.medium;
  const b      = state.ball;
  const k      = p.keys;
  const humanP = state.players.find(pl => pl.team === state.settings.humanTeam);

  const ownGoalX = p.team === 'blue' ? FIELD.right : FIELD.left;
  const oppGoalX = p.team === 'blue' ? FIELD.left  : FIELD.right;
  const sign     = p.team === 'blue' ? 1 : -1;

  // ── Aim refresh ───────────────────────────────────────────────────────────────
  if (++_aiAimTimer >= cfg.aimRefresh) {
    _aiAimTimer = 0;
    if (cfg.noise === 0) {
      const humanY    = humanP ? humanP.y : FIELD.centerY;
      const topCorner = GOAL_TOP() + 18;
      const botCorner = GOAL_BOT() - 18;
      const openCorner = Math.abs(humanY - topCorner) > Math.abs(humanY - botCorner) ? topCorner : botCorner;
      // 30% chance: wall-bounce shot
      if (Math.random() < 0.30) {
        _aiAimY = openCorner < FIELD.centerY
          ? 2 * FIELD.top    - openCorner
          : 2 * FIELD.bottom - openCorner;
      } else {
        _aiAimY = openCorner;
      }
    } else {
      _aiAimY = FIELD.centerY + (Math.random() > 0.5 ? 1 : -1) * cfg.aimOffset;
    }
  }

  state.aiFrameSkip = (state.aiFrameSkip + 1) % cfg.frameSkip;
  if (state.aiFrameSkip !== 0) {
    k.kick = Math.hypot(b.x - p.x, b.y - p.y) < KICK_RANGE;
    return;
  }

  k.up = k.down = k.left = k.right = false;

  // ── Ball prediction ───────────────────────────────────────────────────────────
  const pred = cfg.noise === 0
    ? _predictBall(b, cfg.predictFrames)
    : { x: b.x + b.vx * cfg.predictFrames, y: b.y + b.vy * cfg.predictFrames };
  const predBallX = Math.max(FIELD.left+BALL_R, Math.min(FIELD.right-BALL_R, pred.x));
  const predBallY = Math.max(FIELD.top+BALL_R,  Math.min(FIELD.bottom-BALL_R, pred.y));

  const ballDist  = Math.hypot(b.x - p.x, b.y - p.y);
  const ballSpeed = Math.hypot(b.vx, b.vy);

  // ── Situation flags ───────────────────────────────────────────────────────────
  const dangerZone        = p.team === 'blue' ? b.x > FIELD.right - 170 : b.x < FIELD.left + 170;
  const ballInOwnHalf     = p.team === 'blue' ? b.x > FIELD.centerX     : b.x < FIELD.centerX;
  const ballRushingToGoal = (p.team === 'blue' ? b.vx > 1.5 : b.vx < -1.5) && ballSpeed > 2.5;
  const ballMovingAway    = (p.team === 'blue' ? b.vx < -1  : b.vx > 1)   && ballSpeed > 2;
  const ballThreat        = ballInOwnHalf && ballRushingToGoal;
  const humanDistToBall   = humanP ? Math.hypot(humanP.x - b.x, humanP.y - b.y) : Infinity;
  const shouldPress       = humanDistToBall < cfg.pressRadius;
  const goalMouthDist     = p.team === 'blue' ? FIELD.right - b.x : b.x - FIELD.left;
  const inGoalVertical    = b.y > GOAL_TOP() - PLAYER_R && b.y < GOAL_BOT() + PLAYER_R;
  const goalieSituation   = goalMouthDist < 110 && inGoalVertical && ballDist >= cfg.posRadius;

  let targetX, targetY;

  if (ballDist < cfg.posRadius) {
    if (dangerZone) {
      // CLEAR — stand between ball and own goal, kick away
      const clearY = b.y > FIELD.centerY ? -1 : 1;
      targetX = b.x + sign * (BALL_R + PLAYER_R + 6);
      targetY = b.y + clearY * (BALL_R + PLAYER_R + 6);
    } else {
      // SHOOT — approach ball from correct side before kicking
      const wrongSide = p.team === 'blue' ? p.x < b.x - PLAYER_R : p.x > b.x + PLAYER_R;
      if (wrongSide) {
        // Detour: get behind ball diagonally to avoid pushing it the wrong way
        const sideOff = (p.y < b.y ? 1 : -1) * (BALL_R + PLAYER_R + 8);
        targetX = b.x + sign * (BALL_R + PLAYER_R + 6) + (Math.random() - 0.5) * cfg.noise;
        targetY = b.y + sideOff + (Math.random() - 0.5) * cfg.noise;
      } else {
        const btgX   = oppGoalX - b.x;
        const btgY   = _aiAimY  - b.y;
        const btgLen = Math.hypot(btgX, btgY) || 1;
        targetX = b.x - (btgX / btgLen) * (BALL_R + PLAYER_R + 6) + (Math.random() - 0.5) * cfg.noise;
        targetY = b.y - (btgY / btgLen) * (BALL_R + PLAYER_R + 6) + (Math.random() - 0.5) * cfg.noise;
      }
    }
  } else if (goalieSituation) {
    // GOALIE — stand in goal mouth and track ball's Y to block shots
    targetX = ownGoalX - sign * (PLAYER_R + 6);
    targetY = Math.max(GOAL_TOP() + PLAYER_R, Math.min(GOAL_BOT() - PLAYER_R, b.y));
  } else if (ballThreat) {
    // EMERGENCY — rush to intercept ball heading for own goal
    targetX = predBallX + (Math.random() - 0.5) * cfg.noise * 0.5;
    targetY = predBallY + (Math.random() - 0.5) * cfg.noise * 0.5;
  } else if (shouldPress) {
    // PRESS — rush to challenge human and steal the ball
    targetX = b.x + (Math.random() - 0.5) * cfg.noise * 0.5;
    targetY = b.y + (Math.random() - 0.5) * cfg.noise * 0.5;
  } else if (ballInOwnHalf && !ballMovingAway) {
    // DEFEND — cover shooting angle: position along ball→goal vector at ~55% depth
    const toGoalX   = ownGoalX - b.x;
    const toGoalY   = FIELD.centerY - b.y;
    const toGoalLen = Math.hypot(toGoalX, toGoalY) || 1;
    const coverDist = Math.min(toGoalLen * 0.55, cfg.defendOffset);
    targetX = b.x + (toGoalX / toGoalLen) * coverDist + (Math.random() - 0.5) * cfg.noise;
    targetY = b.y + (toGoalY / toGoalLen) * coverDist + (Math.random() - 0.5) * cfg.noise;
  } else {
    // ATTACK / FOLLOW-UP — run to shooting position behind predicted ball
    targetX = predBallX + sign * (BALL_R + PLAYER_R) + (Math.random() - 0.5) * cfg.noise;
    targetY = predBallY + (Math.random() - 0.5) * cfg.noise;
  }

  targetX = Math.max(FIELD.left + PLAYER_R, Math.min(FIELD.right - PLAYER_R, targetX));
  targetY = Math.max(FIELD.top  + PLAYER_R, Math.min(FIELD.bottom - PLAYER_R, targetY));

  // ── Opponent avoidance — dodge around human if blocking path ─────────────────
  if (humanP) {
    const pathX     = targetX - p.x;
    const pathY     = targetY - p.y;
    const pathLen   = Math.hypot(pathX, pathY) || 1;
    const toHumanX  = humanP.x - p.x;
    const toHumanY  = humanP.y - p.y;
    const humanDist = Math.hypot(toHumanX, toHumanY);
    const proj      = (toHumanX * pathX + toHumanY * pathY) / (pathLen * pathLen);
    if (proj > 0.1 && proj < 0.9 && humanDist < PLAYER_R * 3.5) {
      const perpX = -pathY / pathLen;
      const perpY =  pathX / pathLen;
      const side  = (toHumanX * perpX + toHumanY * perpY) > 0 ? -1 : 1;
      const dodge = PLAYER_R * 2.5 + cfg.noise * 0.3;
      targetX = Math.max(FIELD.left + PLAYER_R, Math.min(FIELD.right - PLAYER_R, targetX + perpX * side * dodge));
      targetY = Math.max(FIELD.top  + PLAYER_R, Math.min(FIELD.bottom - PLAYER_R, targetY + perpY * side * dodge));
    }
  }

  const dx        = targetX - p.x;
  const dy        = targetY - p.y;
  const threshold = 3 / cfg.speedMult;

  k.right = dx >  threshold;
  k.left  = dx < -threshold;
  k.down  = dy >  threshold;
  k.up    = dy < -threshold;

  // ── Kick ──────────────────────────────────────────────────────────────────────
  if (ballDist < KICK_RANGE) {
    const kickDirX = b.x - p.x;
    const kickDirY = b.y - p.y;
    const toGoalX  = oppGoalX - b.x;
    const toGoalY  = _aiAimY  - b.y;
    const dot      = kickDirX * toGoalX + kickDirY * toGoalY;
    const mag      = (Math.hypot(kickDirX, kickDirY) || 1) * (Math.hypot(toGoalX, toGoalY) || 1);
    const aligned  = dot / mag > 0.35;
    const safeKick = (ownGoalX - b.x) * kickDirX < 0;

    if (cfg.predictFrames <= 6) {
      k.kick = true;
    } else if (cfg.noise > 0) {
      k.kick = dangerZone ? safeKick : (safeKick && aligned) || Math.random() > 0.80;
    } else {
      k.kick = dangerZone ? safeKick : (safeKick && aligned);
    }
  } else {
    k.kick = false;
  }
}
