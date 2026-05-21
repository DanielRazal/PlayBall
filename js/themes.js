'use strict';

// ─── Canvas logo fallback functions ──────────────────────────────────────────

function logoCtx(x, y, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = a;
}

function drawLogoDefault(x, y) {
  logoCtx(x, y, 0.22);
  ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = 'bold 52px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⚽', 0, 3);
  ctx.restore();
}

function drawLogoArsenal(x, y) {
  logoCtx(x, y, 0.35);
  ctx.beginPath();
  ctx.moveTo(0, 54); ctx.bezierCurveTo(-34, 46, -44, 24, -44, 0);
  ctx.lineTo(-44, -30); ctx.lineTo(-16, -44); ctx.lineTo(0, -40);
  ctx.lineTo(16, -44); ctx.lineTo(44, -30); ctx.lineTo(44, 0);
  ctx.bezierCurveTo(44, 24, 34, 46, 0, 54); ctx.closePath();
  ctx.fillStyle = '#cc0000'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,210,0.7)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(-30, -8, 46, 14, 5); ctx.fill();
  ctx.beginPath(); ctx.roundRect(14, -12, 14, 22, 4); ctx.fill();
  ctx.fillStyle = '#ffcc55';
  ctx.beginPath(); ctx.roundRect(-24, 5, 36, 8, 3); ctx.fill();
  for (const wx of [-14, 10]) {
    ctx.beginPath(); ctx.arc(wx, 20, 11, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * 11, 20 + Math.sin(a) * 11);
      ctx.lineTo(wx - Math.cos(a) * 11, 20 - Math.sin(a) * 11);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawLogoBarcelona(x, y) {
  logoCtx(x, y, 0.35);
  function shield() {
    ctx.beginPath();
    ctx.moveTo(0, 54); ctx.bezierCurveTo(-34, 46, -42, 24, -42, 0);
    ctx.lineTo(-42, -30); ctx.lineTo(-30, -42); ctx.lineTo(0, -42);
    ctx.lineTo(30, -42); ctx.lineTo(42, -30); ctx.lineTo(42, 0);
    ctx.bezierCurveTo(42, 24, 34, 46, 0, 54); ctx.closePath();
  }
  shield(); ctx.fillStyle = '#003399'; ctx.fill();
  ctx.save(); shield(); ctx.clip();
  ctx.fillStyle = '#fcbd00'; ctx.fillRect(-42, -42, 84, 20);
  ctx.fillStyle = '#cc0000'; ctx.fillRect(-42, -42, 16, 96);
  ctx.fillRect(-42, -22, 84, 14);
  const cols = ['#a50044', '#003399', '#a50044', '#003399', '#a50044', '#003399'];
  for (let i = 0; i < cols.length; i++) {
    ctx.fillStyle = cols[i];
    ctx.fillRect(-26 + i * 12, -8, 12, 62);
  }
  ctx.restore();
  shield(); ctx.strokeStyle = '#fcbd00'; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('FCB', 0, 16);
  ctx.restore();
}

function drawLogoRealMadrid(x, y) {
  logoCtx(x, y, 0.32);
  ctx.beginPath();
  ctx.moveTo(0, 54); ctx.bezierCurveTo(-34, 44, -44, 22, -44, 0);
  ctx.lineTo(-44, -28); ctx.lineTo(0, -44); ctx.lineTo(44, -28);
  ctx.lineTo(44, 0); ctx.bezierCurveTo(44, 22, 34, 44, 0, 54); ctx.closePath();
  ctx.fillStyle = '#f8f5e8'; ctx.fill();
  ctx.strokeStyle = '#c8a800'; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.fillStyle = '#7b3fb0';
  ctx.beginPath();
  ctx.moveTo(-26, 10); ctx.lineTo(-26, -6);
  ctx.lineTo(-18, -20); ctx.lineTo(-9, -8);
  ctx.lineTo(0, -28); ctx.lineTo(9, -8);
  ctx.lineTo(18, -20); ctx.lineTo(26, -6);
  ctx.lineTo(26, 10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c8a800'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#f5d000';
  ctx.beginPath(); ctx.arc(0, -28, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-18, -20, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(18, -20, 4, 0, Math.PI * 2); ctx.fill();
  ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#7b3fb0';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('RMCF', 0, 30);
  ctx.restore();
}

function drawLogoLiverpool(x, y) {
  logoCtx(x, y, 0.35);
  ctx.beginPath();
  ctx.moveTo(0, 54); ctx.bezierCurveTo(-34, 44, -44, 22, -44, 0);
  ctx.lineTo(-44, -28); ctx.lineTo(-16, -44); ctx.lineTo(0, -38);
  ctx.lineTo(16, -44); ctx.lineTo(44, -28); ctx.lineTo(44, 0);
  ctx.bezierCurveTo(44, 22, 34, 44, 0, 54); ctx.closePath();
  ctx.fillStyle = '#cc0000'; ctx.fill();
  ctx.strokeStyle = 'rgba(245,210,0,0.8)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#f5d200';
  ctx.beginPath(); ctx.ellipse(4, 12, 11, 19, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -10, 13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(26, -13); ctx.lineTo(42, -7); ctx.lineTo(26, -3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-11, 4, 8, 18, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, 28); ctx.lineTo(-16, 42); ctx.lineTo(6, 32); ctx.closePath(); ctx.fill();
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#f5d200';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('LFC', 0, 44);
  ctx.restore();
}

function drawLogoManCity(x, y) {
  logoCtx(x, y, 0.32);
  ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#6cabdd'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-6, 2); ctx.quadraticCurveTo(-40, -10, -34, 20);
  ctx.quadraticCurveTo(-20, 14, -6, 18); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, 2); ctx.quadraticCurveTo(40, -10, 34, 20);
  ctx.quadraticCurveTo(20, 14, 6, 18); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 10, 9, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -12, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8, -14); ctx.lineTo(18, -10); ctx.lineTo(8, -7); ctx.closePath();
  ctx.fillStyle = '#ffcc44'; ctx.fill();
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('MCFC', 0, 36);
  ctx.restore();
}

function drawLogoChelsea(x, y) {
  logoCtx(x, y, 0.32);
  ctx.beginPath();
  ctx.moveTo(0, 54); ctx.bezierCurveTo(-34, 44, -44, 22, -44, 0);
  ctx.lineTo(-44, -28); ctx.lineTo(0, -44); ctx.lineTo(44, -28);
  ctx.lineTo(44, 0); ctx.bezierCurveTo(44, 22, 34, 44, 0, 54); ctx.closePath();
  ctx.fillStyle = '#034694'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(4, 14, 13, 21, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-4, -12, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,80,0.9)'; ctx.lineWidth = 5;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(-4 + Math.cos(a) * 15, -12 + Math.sin(a) * 15);
    ctx.lineTo(-4 + Math.cos(a) * 24, -12 + Math.sin(a) * 24); ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(-20, -6, 6, 13, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffdd55'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-30, 26); ctx.lineTo(-20, -24); ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(14, 30); ctx.quadraticCurveTo(36, 22, 30, 6);
  ctx.quadraticCurveTo(22, 2, 16, 10); ctx.closePath(); ctx.fill();
  ctx.font = 'bold 11px Arial'; ctx.fillStyle = 'rgba(255,220,80,0.9)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('CFC', 0, 44);
  ctx.restore();
}

function drawLogoBayern(x, y) {
  logoCtx(x, y, 0.36);
  ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#cc0000'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, 37, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#003399'; ctx.fillRect(-37, -37, 37, 37); ctx.fillRect(0, 0, 37, 37);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -37, 37, 37); ctx.fillRect(-37, 0, 37, 37);
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, 37, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.strokeStyle = '#aa0000'; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#cc0000';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('FCB', 0, 0);
  ctx.restore();
}

// ─── Field themes ─────────────────────────────────────────────────────────────

const FIELD_THEMES = {
  default:     { label: 'Default',       outside: '#2a5a18', grass1: '#3a7d23', stripe: 'rgba(0,0,0,0.04)',       lines: 'rgba(255,255,255,0.75)', posts: '#ffffff', netFill: 'rgba(255,255,255,0.08)', netLines: 'rgba(255,255,255,0.18)', logoColors: ['#ffffff', '#cccccc'], logoFn: drawLogoDefault    },
  arsenal:     { label: 'Arsenal',       outside: '#1a1a1a', grass1: '#2e6b1e', stripe: 'rgba(180,0,0,0.10)',     lines: 'rgba(255,255,255,0.85)', posts: '#ee0000', netFill: 'rgba(238,0,0,0.10)',     netLines: 'rgba(238,0,0,0.25)',     logoColors: ['#ee0000', '#ffffff'], logoFn: drawLogoArsenal    },
  barcelona:   { label: 'Barcelona',     outside: '#0a0a2a', grass1: '#286020', stripe: 'rgba(0,60,200,0.09)',    lines: 'rgba(255,255,255,0.85)', posts: '#003399', netFill: 'rgba(0,50,180,0.10)',    netLines: 'rgba(100,140,255,0.25)', logoColors: ['#003399', '#cc0000'], logoFn: drawLogoBarcelona  },
  realmadrid:  { label: 'Real Madrid',   outside: '#1a1a0a', grass1: '#2d7a22', stripe: 'rgba(200,170,0,0.09)',   lines: 'rgba(255,255,255,0.9)',  posts: '#f5d000', netFill: 'rgba(245,208,0,0.10)',   netLines: 'rgba(245,208,0,0.28)',   logoColors: ['#f5d000', '#ffffff'], logoFn: drawLogoRealMadrid },
  liverpool:   { label: 'Liverpool',     outside: '#1a0808', grass1: '#2b6a1a', stripe: 'rgba(200,20,20,0.10)',   lines: 'rgba(255,255,255,0.85)', posts: '#cc2200', netFill: 'rgba(200,30,0,0.10)',    netLines: 'rgba(220,60,40,0.25)',   logoColors: ['#cc2200', '#f5d000'], logoFn: drawLogoLiverpool  },
  mancity:     { label: 'Man City',      outside: '#081828', grass1: '#2a6e28', stripe: 'rgba(100,185,230,0.10)', lines: 'rgba(255,255,255,0.85)', posts: '#6cbce8', netFill: 'rgba(100,185,230,0.10)', netLines: 'rgba(120,200,240,0.28)', logoColors: ['#6cbce8', '#ffffff'], logoFn: drawLogoManCity    },
  chelsea:     { label: 'Chelsea',       outside: '#080820', grass1: '#28682a', stripe: 'rgba(0,60,180,0.09)',    lines: 'rgba(255,255,255,0.85)', posts: '#0044aa', netFill: 'rgba(0,60,180,0.10)',    netLines: 'rgba(60,120,220,0.25)',  logoColors: ['#0044aa', '#ffffff'], logoFn: drawLogoChelsea    },
  bayernmunich:{ label: 'Bayern Munich', outside: '#1a0808', grass1: '#2e6e1e', stripe: 'rgba(180,0,0,0.10)',     lines: 'rgba(255,255,255,0.85)', posts: '#cc0000', netFill: 'rgba(200,0,0,0.10)',     netLines: 'rgba(220,40,40,0.25)',   logoColors: ['#cc0000', '#ffffff'], logoFn: drawLogoBayern     },
  manutd:      { label: 'Man United',    outside: '#1a0505', grass1: '#2b6b1a', stripe: 'rgba(200,0,0,0.10)',     lines: 'rgba(255,255,255,0.85)', posts: '#dd0000', netFill: 'rgba(200,0,0,0.10)',     netLines: 'rgba(220,30,30,0.25)',   logoColors: ['#dd0000', '#ffdd00'], logoFn: drawLogoDefault    },
  psg:         { label: 'PSG',           outside: '#05051a', grass1: '#246e24', stripe: 'rgba(0,30,150,0.10)',     lines: 'rgba(255,255,255,0.85)', posts: '#003087', netFill: 'rgba(0,40,130,0.10)',    netLines: 'rgba(50,90,200,0.25)',   logoColors: ['#003087', '#cc0000'], logoFn: drawLogoDefault    },
  dortmund:    { label: 'Dortmund',      outside: '#1a1500', grass1: '#2a6e1a', stripe: 'rgba(255,200,0,0.12)',    lines: 'rgba(255,255,255,0.85)', posts: '#fde100', netFill: 'rgba(255,210,0,0.10)',   netLines: 'rgba(255,220,30,0.28)',  logoColors: ['#fde100', '#000000'], logoFn: drawLogoDefault    },
  acmilan:     { label: 'AC Milan',      outside: '#0f0505', grass1: '#2b6a1a', stripe: 'rgba(180,0,0,0.10)',     lines: 'rgba(255,255,255,0.85)', posts: '#cc0000', netFill: 'rgba(180,0,0,0.10)',     netLines: 'rgba(200,30,30,0.25)',   logoColors: ['#cc0000', '#000000'], logoFn: drawLogoDefault    },
  inter:       { label: 'Inter Milan',   outside: '#030a1a', grass1: '#28682a', stripe: 'rgba(0,50,150,0.10)',     lines: 'rgba(255,255,255,0.85)', posts: '#0066cc', netFill: 'rgba(0,60,180,0.10)',    netLines: 'rgba(40,100,200,0.25)',  logoColors: ['#0066cc', '#000000'], logoFn: drawLogoDefault    },
};

// ─── Real logo images ─────────────────────────────────────────────────────────

const LOGO_SRCS = {
  arsenal:      'logos/arsenal.svg',
  barcelona:    'logos/barcelona.svg',
  realmadrid:   'logos/realmadrid.svg',
  liverpool:    'logos/liverpool.svg',
  mancity:      'logos/mancity.svg',
  chelsea:      'logos/chelsea.svg',
  bayernmunich: 'logos/bayernmunich.svg',
  manutd:       'logos/manutd.svg',
  psg:          'logos/psg.svg',
  dortmund:     'logos/dortmund.svg',
  acmilan:      'logos/acmilan.svg',
  inter:        'logos/inter.svg',
};

const LOGO_IMGS = {};

function preloadLogos() {
  for (const [key, url] of Object.entries(LOGO_SRCS)) {
    const img = new Image();
    img.src = url;
    LOGO_IMGS[key] = img;
  }
}