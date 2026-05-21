'use strict';

// ─── Canvas & field geometry ─────────────────────────────────────────────────

const CANVAS_W = 800;
const CANVAS_H = 500;

const FIELD = {
  left:   42,
  right:  758,
  top:    42,
  bottom: 458,
  get width()   { return this.right - this.left; },
  get height()  { return this.bottom - this.top; },
  get centerX() { return (this.left + this.right) / 2; },
  get centerY() { return (this.top + this.bottom) / 2; },
};

let GOAL_H    = 130;
let GOAL_DEEP = 32;
const GOAL_TOP = () => FIELD.centerY - GOAL_H / 2;
const GOAL_BOT = () => FIELD.centerY + GOAL_H / 2;

const FIELD_SIZES = {
  small:  { left: 130, right: 670, top: 90, bottom: 410, goalH: 100, goalDeep: 28 },
  medium: { left: 42,  right: 758, top: 42, bottom: 458, goalH: 130, goalDeep: 32 },
  large:  { left: 38,  right: 762, top: 8,  bottom: 492, goalH: 155, goalDeep: 32 },
};

// ─── Entity sizes & masses ───────────────────────────────────────────────────

const PLAYER_R = 16;
const BALL_R   = 12;
const PLAYER_M = 2.5;
const BALL_M   = 1.0;

// ─── Physics tuning ──────────────────────────────────────────────────────────

const FRICTION_BALL       = 0.99;
const FRICTION_PLAYER     = 0.78;
const RESTITUTION_DEFAULT = 0.5;
const PLAYER_ACCEL        = 1.6;
const PLAYER_MAX_SPD      = 5.2;
const KICK_IMPULSE        = 14;
const KICK_RANGE          = PLAYER_R + BALL_R + 12;
const KICK_COOLDOWN       = 120;
const BALL_MAX_SPD        = 30;

// ─── Game timing ─────────────────────────────────────────────────────────────

const GAME_DURATION  = 180;  // seconds
const GOAL_PAUSE_MS  = 2200;
