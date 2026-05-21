'use strict';

// ─── Theme helper ─────────────────────────────────────────────────────────────

function getTheme() {
  return FIELD_THEMES[state.settings.theme] || FIELD_THEMES.default;
}

// ─── Field drawing ────────────────────────────────────────────────────────────

function drawField() {
  const t = getTheme();
  ctx.fillStyle = t.outside;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = t.grass1;
  ctx.fillRect(FIELD.left, FIELD.top, FIELD.width, FIELD.height);

  const stripeW = FIELD.width / 8;
  ctx.fillStyle = t.stripe;
  for (let i = 0; i < 8; i += 2) {
    ctx.fillRect(FIELD.left + i * stripeW, FIELD.top, stripeW, FIELD.height);
  }
}

function drawFieldMarkings() {
  const t = getTheme();
  ctx.strokeStyle = t.lines;
  ctx.lineWidth = 2;

  ctx.strokeRect(FIELD.left, FIELD.top, FIELD.width, FIELD.height);

  ctx.beginPath();
  ctx.moveTo(FIELD.centerX, FIELD.top);
  ctx.lineTo(FIELD.centerX, FIELD.bottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(FIELD.centerX, FIELD.centerY, 58, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = t.lines;
  ctx.beginPath();
  ctx.arc(FIELD.centerX, FIELD.centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  const bw = 80, bh = 190;
  ctx.strokeRect(FIELD.left,       FIELD.centerY - bh / 2, bw, bh);
  ctx.strokeRect(FIELD.right - bw, FIELD.centerY - bh / 2, bw, bh);

  const sbw = 35, sbh = 100;
  ctx.strokeRect(FIELD.left,        FIELD.centerY - sbh / 2, sbw, sbh);
  ctx.strokeRect(FIELD.right - sbw, FIELD.centerY - sbh / 2, sbw, sbh);

  const cr = 14;
  const corners = [
    { x: FIELD.left,  y: FIELD.top,    sa: 0,            ea: Math.PI / 2 },
    { x: FIELD.right, y: FIELD.top,    sa: Math.PI / 2,  ea: Math.PI     },
    { x: FIELD.right, y: FIELD.bottom, sa: Math.PI,      ea: 3 * Math.PI / 2 },
    { x: FIELD.left,  y: FIELD.bottom, sa: 3 * Math.PI / 2, ea: 2 * Math.PI },
  ];
  for (const c of corners) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, cr, c.sa, c.ea);
    ctx.stroke();
  }
}

function drawGoals() {
  const t  = getTheme();
  const gt = GOAL_TOP();
  const gb = GOAL_BOT();
  const gd = GOAL_DEEP;

  ctx.fillStyle = t.netFill;
  ctx.fillRect(FIELD.left - gd, gt, gd, GOAL_H);
  ctx.fillRect(FIELD.right,     gt, gd, GOAL_H);

  ctx.strokeStyle = t.netLines;
  ctx.lineWidth = 1;
  const gridStep = 12;
  for (let side = 0; side < 2; side++) {
    const gx = side === 0 ? FIELD.left - gd : FIELD.right;
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx, gt, gd, GOAL_H);
    ctx.clip();
    for (let x = gx; x <= gx + gd; x += gridStep) {
      ctx.beginPath(); ctx.moveTo(x, gt); ctx.lineTo(x, gb); ctx.stroke();
    }
    for (let y = gt; y <= gb; y += gridStep) {
      ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gd, y); ctx.stroke();
    }
    ctx.restore();
  }

  ctx.strokeStyle = t.posts;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(FIELD.left, gt);
  ctx.lineTo(FIELD.left - gd, gt);
  ctx.lineTo(FIELD.left - gd, gb);
  ctx.lineTo(FIELD.left, gb);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(FIELD.right, gt);
  ctx.lineTo(FIELD.right + gd, gt);
  ctx.lineTo(FIELD.right + gd, gb);
  ctx.lineTo(FIELD.right, gb);
  ctx.stroke();

  ctx.strokeStyle = t.lines;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(FIELD.left, FIELD.top);    ctx.lineTo(FIELD.left, gt); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(FIELD.left, gb);           ctx.lineTo(FIELD.left, FIELD.bottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(FIELD.right, FIELD.top);   ctx.lineTo(FIELD.right, gt); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(FIELD.right, gb);          ctx.lineTo(FIELD.right, FIELD.bottom); ctx.stroke();
}

// ─── Entity drawing ───────────────────────────────────────────────────────────

function drawShadow(entity) {
  const r = entity.radius;
  const grd = ctx.createRadialGradient(
    entity.x + 4, entity.y + 5, 1,
    entity.x + 4, entity.y + 5, r * 1.1
  );
  grd.addColorStop(0, 'rgba(0,0,0,0.35)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(entity.x + 4, entity.y + 5, r * 1.1, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();
}

function drawBall() {
  const b = state.ball;

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle);

  ctx.beginPath();
  ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f0f0f0';
  ctx.fill();

  ctx.fillStyle = '#222222';
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px  = Math.cos(ang) * b.radius * 0.44;
    const py  = Math.sin(ang) * b.radius * 0.44;
    ctx.beginPath();
    ctx.arc(px, py, b.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-b.radius * 0.28, -b.radius * 0.32, b.radius * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();

  ctx.restore();
}

function drawPlayer(p) {
  const color     = p.team === 'red' ? '#ff4444' : '#4488ff';
  const darkColor = p.team === 'red' ? '#cc1111' : '#1155cc';
  const r = p.radius;

  const grd = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r * 1.5);
  grd.addColorStop(0, p.team === 'red' ? 'rgba(255,60,60,0.2)' : 'rgba(60,120,255,0.2)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  const bodyGrd = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.1, p.x, p.y, r);
  bodyGrd.addColorStop(0, p.team === 'red' ? '#ff8888' : '#88bbff');
  bodyGrd.addColorStop(1, color);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrd;
  ctx.fill();

  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const spd = Math.hypot(p.vx, p.vy);
  if (spd > 0.4) {
    const dx = p.vx / spd;
    const dy = p.vy / spd;
    ctx.beginPath();
    ctx.arc(p.x + dx * r * 0.52, p.y + dy * r * 0.52, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(p.x - r * 0.3, p.y - r * 0.35, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();

  const name = state.names[p.team] || p.team;
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(name, p.x + 1, p.y + r + 5);
  ctx.fillStyle = 'white';
  ctx.fillText(name, p.x, p.y + r + 4);
}

// ─── Main render ──────────────────────────────────────────────────────────────

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  drawField();
  drawFieldMarkings();
  drawGoals();

  const t       = getTheme();
  const logoImg = LOGO_IMGS[state.settings.theme];
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const r = 54;
    ctx.save();
    ctx.beginPath();
    ctx.arc(FIELD.centerX, FIELD.centerY, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(FIELD.centerX, FIELD.centerY, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(logoImg, FIELD.centerX - r, FIELD.centerY - r, r * 2, r * 2);
    ctx.restore();
  } else if (t.logoFn) {
    t.logoFn(FIELD.centerX, FIELD.centerY);
  }

  drawShadow(state.ball);
  for (const p of state.players) drawShadow(p);

  drawBall();
  for (const p of state.players) drawPlayer(p);
}
