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
  tiny:   { left: 200, right: 600, top: 130, bottom: 370, goalH: 80,  goalDeep: 22 },
  small:  { left: 130, right: 670, top: 90,  bottom: 410, goalH: 100, goalDeep: 28 },
  medium: { left: 42,  right: 758, top: 42,  bottom: 458, goalH: 130, goalDeep: 32 },
  large:  { left: 38,  right: 762, top: 8,   bottom: 492, goalH: 155, goalDeep: 32 },
  xl:     { left: 32,  right: 768, top: 2,   bottom: 498, goalH: 175, goalDeep: 30 },
};

// ─── Entity sizes & masses ───────────────────────────────────────────────────

const PLAYER_R = 16;
const BALL_R   = 12;
const PLAYER_M = 2.5;
const BALL_M   = 1.0;

// ─── Physics tuning ──────────────────────────────────────────────────────────

const FRICTION_BALL          = 0.986;  // was 0.99 — ball decelerates faster for control
const FRICTION_PLAYER        = 0.96;
const RESTITUTION_DEFAULT    = 0.5;    // wall bounces
const RESTITUTION_PLAYER_BALL = 0.08; // soft touch — ball stays on foot, haxball-like dribble
const PLAYER_ACCEL           = 0.15;
const PLAYER_MAX_SPD         = 5.0;
const KICK_IMPULSE           = 4;     // was 6 — lighter kick, more dribble control
const KICK_RANGE             = PLAYER_R + BALL_R + 12;
const KICK_COOLDOWN          = 80;    // was 120 — faster taps for dribbling
const BALL_MAX_SPD           = 22;    // was 30 — cap max speed for controllable feel

// ─── Game timing ─────────────────────────────────────────────────────────────

const GAME_DURATION  = 180;  // seconds
const GOAL_PAUSE_MS  = 1000;
