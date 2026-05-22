'use strict';

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');

const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer);

app.use(express.static(path.join(__dirname)));

// ── Constants (mirrored from client) ──────────────────────────────────────────

const PLAYER_R          = 16;
const BALL_R            = 12;
const PLAYER_M          = 2.5;
const BALL_M            = 1.0;
const FRICTION_BALL     = 0.99;
const FRICTION_PLAYER   = 0.78;
const RESTITUTION       = 0.5;
const PLAYER_ACCEL      = 1.6;
const PLAYER_MAX_SPD    = 5.2;
const KICK_IMPULSE      = 14;
const KICK_RANGE        = PLAYER_R + BALL_R + 12;
const KICK_COOLDOWN     = 120;
const BALL_MAX_SPD      = 30;
const GOAL_PAUSE_MS     = 1000;
const TICK_RATE         = 60;   // server ticks per second

const FIELD_SIZES = {
  small:  { left: 130, right: 670, top: 90,  bottom: 410, goalH: 100, goalDeep: 28 },
  medium: { left: 42,  right: 758, top: 42,  bottom: 458, goalH: 130, goalDeep: 32 },
  large:  { left: 38,  right: 762, top: 8,   bottom: 492, goalH: 155, goalDeep: 32 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function goalTop(room) { return (room.field.top + room.field.bottom) / 2 - room.goalH / 2; }
function goalBot(room) { return (room.field.top + room.field.bottom) / 2 + room.goalH / 2; }
function centerX(room) { return (room.field.left + room.field.right) / 2; }
function centerY(room) { return (room.field.top  + room.field.bottom) / 2; }

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

// ── Room factory ──────────────────────────────────────────────────────────────

function createRoom(settings) {
  const fs = FIELD_SIZES[settings.fieldSize] || FIELD_SIZES.medium;
  const field = { left: fs.left, right: fs.right, top: fs.top, bottom: fs.bottom };
  const cx = (field.left + field.right) / 2;
  const cy = (field.top  + field.bottom) / 2;
  return {
    phase:    'waiting',
    settings,
    field,
    goalH:    fs.goalH,
    goalDeep: fs.goalDeep,
    score:          { red: 0, blue: 0 },
    goldenGoal:     false,
    kickoffTeam:    'red',
    kickoffPending: true,
    timeLeft:       settings.timeMins > 0 ? settings.timeMins * 60 : Infinity,
    goalTimer: 0,
    names:    { red: 'Red', blue: 'Blue' },
    sockets:  { red: null, blue: null },
    ball: { x: cx, y: cy, vx: 0, vy: 0, radius: BALL_R, mass: BALL_M, angle: 0 },
    players: [
      { id: 0, team: 'red',  x: cx - 130, y: cy, vx: 0, vy: 0, radius: PLAYER_R, mass: PLAYER_M, keys: { up:false,down:false,left:false,right:false,kick:false }, lastKickTime: 0 },
      { id: 1, team: 'blue', x: cx + 130, y: cy, vx: 0, vy: 0, radius: PLAYER_R, mass: PLAYER_M, keys: { up:false,down:false,left:false,right:false,kick:false }, lastKickTime: 0 },
    ],
    tickInterval: null,
    lastTick: Date.now(),
  };
}

// ── Physics ───────────────────────────────────────────────────────────────────

function applyInput(p) {
  const k = p.keys;
  if (k.up)    p.vy -= PLAYER_ACCEL;
  if (k.down)  p.vy += PLAYER_ACCEL;
  if (k.left)  p.vx -= PLAYER_ACCEL;
  if (k.right) p.vx += PLAYER_ACCEL;
  const spd = Math.hypot(p.vx, p.vy);
  if (spd > PLAYER_MAX_SPD) { p.vx = p.vx / spd * PLAYER_MAX_SPD; p.vy = p.vy / spd * PLAYER_MAX_SPD; }
}

function applyKick(p, b, now, room) {
  if (!p.keys.kick) return;
  if (room && room.kickoffPending && p.team !== room.kickoffTeam) return;
  const dx = b.x - p.x, dy = b.y - p.y;
  const dist = Math.hypot(dx, dy);
  if (dist > KICK_RANGE || now - p.lastKickTime < KICK_COOLDOWN) return;
  p.lastKickTime = now;
  b.vx += dx / dist * KICK_IMPULSE;
  b.vy += dy / dist * KICK_IMPULSE;
  const spd = Math.hypot(b.vx, b.vy);
  if (spd > BALL_MAX_SPD) { b.vx = b.vx / spd * BALL_MAX_SPD; b.vy = b.vy / spd * BALL_MAX_SPD; }
  if (room && room.kickoffPending) room.kickoffPending = false;
}

function resolveCollision(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minD = a.radius + b.radius;
  if (dist >= minD || dist < 0.001) return;
  const nx = dx / dist, ny = dy / dist;
  const dot = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  const overlap = (minD - dist) / 2;
  if (dot >= 0) {
    a.x -= nx * overlap; a.y -= ny * overlap;
    b.x += nx * overlap; b.y += ny * overlap;
    return;
  }
  const imp = -(1 + RESTITUTION) * dot / (1 / a.mass + 1 / b.mass);
  a.vx -= imp / a.mass * nx; a.vy -= imp / a.mass * ny;
  b.vx += imp / b.mass * nx; b.vy += imp / b.mass * ny;
  const spd = Math.hypot(b.vx, b.vy);
  if (spd > BALL_MAX_SPD) { b.vx = b.vx / spd * BALL_MAX_SPD; b.vy = b.vy / spd * BALL_MAX_SPD; }
  a.x -= nx * overlap; a.y -= ny * overlap;
  b.x += nx * overlap; b.y += ny * overlap;
}

function resolveBallWalls(room) {
  const b = room.ball, f = room.field;
  const gt = goalTop(room), gb = goalBot(room), r = b.radius;
  if (b.y - r < f.top)    { b.y = f.top + r;    b.vy =  Math.abs(b.vy) * RESTITUTION; }
  if (b.y + r > f.bottom) { b.y = f.bottom - r;  b.vy = -Math.abs(b.vy) * RESTITUTION; }
  if (b.x - r < f.left  && !(b.y > gt && b.y < gb)) { b.x = f.left + r;  b.vx =  Math.abs(b.vx) * RESTITUTION; }
  if (b.x + r > f.right && !(b.y > gt && b.y < gb)) { b.x = f.right - r; b.vx = -Math.abs(b.vx) * RESTITUTION; }
}

function clampPlayer(p, f) {
  const r = p.radius;
  if (p.x - r < f.left)   { p.x = f.left   + r; if (p.vx < 0) p.vx = 0; }
  if (p.x + r > f.right)  { p.x = f.right  - r; if (p.vx > 0) p.vx = 0; }
  if (p.y - r < f.top)    { p.y = f.top    + r; if (p.vy < 0) p.vy = 0; }
  if (p.y + r > f.bottom) { p.y = f.bottom - r; if (p.vy > 0) p.vy = 0; }
}

// ── Room reset ────────────────────────────────────────────────────────────────

function resetBall(room) {
  const b = room.ball;
  b.x = centerX(room); b.y = centerY(room);
  b.vx = 0; b.vy = 0; b.angle = 0;
}

function resetPlayers(room) {
  const cx = centerX(room), cy = centerY(room);
  room.players[0].x = cx - 130; room.players[0].y = cy; room.players[0].vx = 0; room.players[0].vy = 0;
  room.players[1].x = cx + 130; room.players[1].y = cy; room.players[1].vx = 0; room.players[1].vy = 0;
}

// ── Tick ─────────────────────────────────────────────────────────────────────

function broadcast(code, room) {
  io.to(code).emit('state', {
    phase:          room.phase,
    score:          room.score,
    goldenGoal:     room.goldenGoal,
    kickoffTeam:    room.kickoffTeam,
    kickoffPending: room.kickoffPending,
    timeLeft:       room.timeLeft,
    goalTimer:  room.goalTimer,
    names:      room.names,
    ball:      { x: room.ball.x, y: room.ball.y, vx: room.ball.vx, vy: room.ball.vy, angle: room.ball.angle },
    players:   room.players.map(p => ({ id: p.id, team: p.team, x: p.x, y: p.y, vx: p.vx, vy: p.vy })),
  });
}

function tickRoom(code, room) {
  const now = Date.now();
  const dt  = Math.min((now - room.lastTick) / 1000, 0.05);
  room.lastTick = now;

  if (room.phase === 'goal') {
    room.goalTimer -= dt * 1000;
    if (room.goalTimer <= 0) {
      room.phase          = 'playing';
      room.kickoffPending = true;
      resetBall(room);
      resetPlayers(room);
    }
    broadcast(code, room);
    return;
  }

  if (room.phase !== 'playing') return;

  // Timer
  if (room.timeLeft !== Infinity) {
    if (!room.kickoffPending) room.timeLeft -= dt;
    if (room.timeLeft <= 0) {
      room.timeLeft = 0;
      if (room.score.red === room.score.blue) {
        room.goldenGoal = true;
        room.timeLeft   = Infinity;
      } else {
        room.phase = 'gameover';
        broadcast(code, room);
        return;
      }
    }
  }

  // Players
  const [p0, p1] = room.players;
  for (const p of room.players) {
    applyInput(p);
    p.vx *= FRICTION_PLAYER; p.vy *= FRICTION_PLAYER;
    p.x  += p.vx;            p.y  += p.vy;
    clampPlayer(p, room.field);
    if (room.kickoffPending) {
      const cx = (room.field.left + room.field.right) / 2;
      const cy = (room.field.top  + room.field.bottom) / 2;
      // both teams stay in their own half
      if (p.team === 'red'  && p.x + p.radius > cx) { p.x = cx - p.radius; if (p.vx > 0) p.vx = 0; }
      if (p.team === 'blue' && p.x - p.radius < cx) { p.x = cx + p.radius; if (p.vx < 0) p.vx = 0; }
      // non-kickoff team also can't enter the center circle
      if (p.team !== room.kickoffTeam) {
        const cdx = p.x - cx, cdy = p.y - cy;
        const cdist = Math.hypot(cdx, cdy);
        const minDist = 58 + p.radius;
        if (cdist < minDist) {
          const nx = cdist > 0.001 ? cdx / cdist : (p.team === 'blue' ? 1 : -1);
          const ny = cdist > 0.001 ? cdy / cdist : 0;
          p.x = cx + nx * minDist;
          p.y = cy + ny * minDist;
          const vel = p.vx * nx + p.vy * ny;
          if (vel < 0) { p.vx -= vel * nx; p.vy -= vel * ny; }
        }
      }
    }
  }

  // Ball
  const b = room.ball;
  b.vx *= FRICTION_BALL; b.vy *= FRICTION_BALL;
  b.x  += b.vx;          b.y  += b.vy;
  b.angle += Math.hypot(b.vx, b.vy) * 0.06;

  resolveBallWalls(room);
  applyKick(p0, b, now, room); applyKick(p1, b, now, room);
  if (!room.kickoffPending || p0.team === room.kickoffTeam) resolveCollision(p0, b);
  if (!room.kickoffPending || p1.team === room.kickoffTeam) resolveCollision(p1, b);
  resolveCollision(p0, p1);

  if (room.kickoffPending) {
    for (const p of room.players) {
      if (p.team === room.kickoffTeam && Math.hypot(b.x - p.x, b.y - p.y) < p.radius + b.radius + 1) {
        room.kickoffPending = false;
        break;
      }
    }
  }

  // Goal check
  const gt = goalTop(room), gb = goalBot(room);
  if (b.x + b.radius < room.field.left  && b.y > gt && b.y < gb) { triggerGoal(code, room, 'blue'); return; }
  if (b.x - b.radius > room.field.right && b.y > gt && b.y < gb) { triggerGoal(code, room, 'red');  return; }

  broadcast(code, room);
}

function triggerGoal(code, room, team) {
  room.score[team]++;
  io.to(code).emit('goal', { team, score: room.score, names: room.names, goldenGoal: room.goldenGoal });

  if (room.goldenGoal) {
    room.phase = 'gameover';
  } else {
    const limit = room.settings.scoreLimit;
    if (limit > 0 && room.score[team] >= limit) {
      room.phase = 'gameover';
    } else {
      room.kickoffTeam    = team === 'red' ? 'blue' : 'red';
      room.kickoffPending = true;
      resetBall(room);
      resetPlayers(room);
    }
  }
  broadcast(code, room);
}

function stopRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  if (room.tickInterval) clearInterval(room.tickInterval);
  rooms.delete(code);
}

// ── Room map ──────────────────────────────────────────────────────────────────

const rooms = new Map();

// ── Sockets ───────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  let myCode = null;
  let myTeam = null;

  socket.on('create-room', ({ settings, name }) => {
    let code;
    do { code = makeCode(); } while (rooms.has(code));

    const room = createRoom(settings);
    room.sockets.red = socket.id;
    room.names.red   = name || 'Red';
    rooms.set(code, room);

    myCode = code;
    myTeam = 'red';
    socket.join(code);
    socket.emit('room-created', { code, team: 'red' });
  });

  socket.on('join-room', ({ code, name }) => {
    const room = rooms.get(code.toUpperCase());
    if (!room)              { socket.emit('join-error', 'Room not found');  return; }
    if (room.sockets.blue)  { socket.emit('join-error', 'Room is full');    return; }
    if (room.phase !== 'waiting') { socket.emit('join-error', 'Game already started'); return; }

    room.sockets.blue = socket.id;
    room.names.blue   = name || 'Blue';
    myCode = code.toUpperCase();
    myTeam = 'blue';

    socket.join(myCode);
    socket.emit('room-joined', { code: myCode, team: 'blue' });
    io.to(myCode).emit('player-joined', { names: room.names });

    // Both players ready — start
    room.phase    = 'playing';
    room.lastTick = Date.now();
    resetBall(room);
    resetPlayers(room);
    room.tickInterval = setInterval(() => tickRoom(myCode, room), 1000 / TICK_RATE);
    broadcast(myCode, room);
  });

  socket.on('input', (keys) => {
    if (!myCode || !myTeam) return;
    const room = rooms.get(myCode);
    if (!room) return;
    const p = room.players.find(p => p.team === myTeam);
    if (p) p.keys = keys;
  });

  socket.on('chat', ({ team, name, text }) => {
    if (!myCode) return;
    socket.to(myCode).emit('chat', { team, name, text });
  });

  socket.on('disconnect', () => {
    if (!myCode) return;
    io.to(myCode).emit('player-left', { team: myTeam });
    stopRoom(myCode);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`PlayBall server → http://localhost:${PORT}`);
});
