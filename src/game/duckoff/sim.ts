import {
  InputState,
  MoveDef,
  MoveKind,
  MOVES,
  FighterState,
  FighterStats,
  totalFrames,
} from "./types";
import { FLOOR_Y, GRAVITY, JUMP_VELOCITY, MAX_X, MIN_X, STEP } from "./constants";

/**
 * Deterministic fighter simulation. No Phaser, no `Math.random`, no `Date.now`
 * — the caller feeds a fixed 60 Hz tick. That is what makes seeded playtests
 * and the AI tests reproducible.
 */

export type Fighter = {
  side: "player" | "opponent";
  duckId: string;
  name: string;
  stats: FighterStats;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  meter: number;
  state: FighterState;
  /** Frames elapsed inside the current move or stun. */
  frame: number;
  /** Frames of hit/block stun still to serve. */
  stun: number;
  move: MoveDef | null;
  /** Set once a swing has connected, so one swing hits at most once. */
  hasHit: boolean;
  guarding: boolean;
  /** Frames of white hit-flash left, for the renderer. */
  hitFlash: number;
  /** Frames of freeze-frame left (impact juice). */
  hitstop: number;
};

export type SimEvent =
  | {
      type: "hit";
      attacker: "player" | "opponent";
      move: MoveKind;
      damage: number;
      blocked: boolean;
      x: number;
      y: number;
    }
  | { type: "ko"; loser: "player" | "opponent" };

const clampX = (x: number) => Math.max(MIN_X, Math.min(MAX_X, x));

export const isAirborne = (f: Fighter) => f.state === "jump";

export const isActionable = (f: Fighter) =>
  f.state === "idle" || f.state === "walk" || f.state === "crouch" || f.state === "block";

export const isAttacking = (f: Fighter) =>
  f.state === "punch" || f.state === "kick" || f.state === "special";

export const isHittable = (f: Fighter) => f.state !== "ko";

export const createFighter = (
  side: "player" | "opponent",
  setup: { duckId: string; name: string; stats: FighterStats },
  x: number,
  facing: 1 | -1
): Fighter => ({
  side,
  duckId: setup.duckId,
  name: setup.name,
  stats: setup.stats,
  x,
  y: FLOOR_Y,
  vx: 0,
  vy: 0,
  facing,
  hp: setup.stats.maxHp,
  meter: 0,
  state: "idle",
  frame: 0,
  stun: 0,
  move: null,
  hasHit: false,
  guarding: false,
  hitFlash: 0,
  hitstop: 0,
});

/** Walk speed derived from the duck's speed stat (18..48 → 150..216 px/s). */
export const walkSpeed = (f: Fighter) => 110 + f.stats.speed * 2.2;

export const computeDamage = (move: MoveDef, attacker: Fighter, defender: Fighter, blocked: boolean) => {
  const raw = move.damage * (0.7 + attacker.stats.attack / 120);
  const mitigation = 1 - Math.min(0.6, defender.stats.defense / 300);
  const dealt = raw * mitigation * (blocked ? 0.2 : 1);
  return Math.max(1, Math.round(dealt));
};

const startMove = (f: Fighter, move: MoveDef) => {
  f.state = move.kind as FighterState;
  f.move = move;
  f.frame = 0;
  f.hasHit = false;
  f.guarding = false;
  f.meter = Math.max(0, f.meter - move.meterCost);
};

/**
 * Advance one fighter by a single logic tick.
 *
 * Ordering matters for determinism: facing is resolved first, then stun and
 * committed states, then airborne motion, then grounded actions with the
 * attack buttons ahead of movement. Combat resolution happens separately in
 * `stepMatch` so both fighters step symmetrically.
 */
export function stepFighter(f: Fighter, input: InputState, opponent: Fighter) {
  if (f.hitstop > 0) {
    f.hitstop -= 1;
    return;
  }
  if (f.hitFlash > 0) f.hitFlash -= 1;
  if (f.state === "ko") return;

  f.facing = (opponent.x >= f.x ? 1 : -1) as 1 | -1;

  // --- stun: cannot act until frames run out ------------------------------
  if (f.state === "hitstun" || f.state === "blockstun") {
    f.stun -= 1;
    if (f.stun <= 0) {
      f.state = "idle";
      f.frame = 0;
      f.move = null;
      f.hasHit = false;
    }
    return;
  }

  // --- committed attacks play out frame by frame --------------------------
  if (isAttacking(f) && f.move) {
    f.frame += 1;
    if (f.frame >= totalFrames(f.move)) {
      f.state = "idle";
      f.frame = 0;
      f.move = null;
      f.hasHit = false;
    }
    return;
  }

  // --- airborne: ballistic arc, limited air control -----------------------
  if (isAirborne(f)) {
    f.vy += GRAVITY * STEP;
    f.y += f.vy * STEP;
    if (input.left) f.vx -= 900 * STEP;
    if (input.right) f.vx += 900 * STEP;
    f.vx = Math.max(-230, Math.min(230, f.vx));
    f.x = clampX(f.x + f.vx * STEP);
    if (f.y >= FLOOR_Y) {
      f.y = FLOOR_Y;
      f.vy = 0;
      f.vx = 0;
      f.state = "idle";
      f.guarding = false;
    }
    return;
  }

  // --- jump is highest priority so it can cancel a block -------------------
  if (input.up) {
    f.state = "jump";
    f.vy = JUMP_VELOCITY;
    f.vx = 0;
    f.y = FLOOR_Y - 1;
    f.guarding = false;
    return;
  }

  // --- attack buttons ------------------------------------------------------
  if (input.special && f.meter >= MOVES.special.meterCost) {
    startMove(f, MOVES.special);
    return;
  }
  if (input.kick) {
    startMove(f, MOVES.kick);
    return;
  }
  if (input.punch) {
    startMove(f, MOVES.punch);
    return;
  }

  // --- guard, crouch, walk -------------------------------------------------
  if (input.block) {
    f.state = "block";
    f.guarding = true;
    f.vx = 0;
    return;
  }

  f.guarding = false;

  if (input.down) {
    f.state = "crouch";
    f.vx = 0;
    return;
  }

  const speed = walkSpeed(f);
  let dir = 0;
  if (input.left) dir -= 1;
  if (input.right) dir += 1;

  if (dir !== 0) {
    f.state = "walk";
    f.vx = dir * speed;
    f.x = clampX(f.x + f.vx * STEP);
  } else {
    f.state = "idle";
    f.vx = 0;
  }
}

/** The active hitbox of a fighter this tick, or null when not in an active window. */
export function activeMove(f: Fighter): MoveDef | null {
  if (!f.move || !isAttacking(f)) return null;
  const m = f.move;
  const inWindow = f.frame > m.startup && f.frame <= m.startup + m.active;
  return inWindow ? m : null;
}

/** True when the defender is holding guard toward the attacker. */
const isGuarding = (defender: Fighter, attacker: Fighter) => defender.state === "block" && defender.facing !== attacker.facing;

/**
 * Resolve one attacker's active hitbox against a defender.
 * Returns null when there is no connection this tick.
 */
export function resolveHit(attacker: Fighter, defender: Fighter): SimEvent | null {
  const move = activeMove(attacker);
  if (!move || attacker.hasHit) return null;
  if (!isHittable(defender)) return null;

  const distance = Math.abs(attacker.x - defender.x);
  if (distance > move.reach) return null;

  // Both fighters face each other automatically, so a hit only lands when the
  // attacker is turned toward the defender.
  const towardDefender = (defender.x >= attacker.x ? 1 : -1) as 1 | -1;
  if (attacker.facing !== towardDefender) return null;

  attacker.hasHit = true;
  const blocked = isGuarding(defender, attacker);
  const damage = computeDamage(move, attacker, defender, blocked);

  defender.hp = Math.max(0, defender.hp - damage);
  attacker.meter = Math.min(100, attacker.meter + move.meterGain);
  defender.meter = Math.min(100, defender.meter + Math.round(move.meterGain * 0.35));
  defender.hitFlash = 6;
  defender.hitstop = blocked ? 3 : 5;
  attacker.hitstop = 4;

  const shove = blocked ? move.knockback * 0.4 : move.knockback;
  defender.x = clampX(defender.x - attacker.facing * shove);
  defender.state = blocked ? "blockstun" : "hitstun";
  defender.stun = blocked ? 6 : 12;
  defender.frame = 0;

  if (defender.hp <= 0) {
    defender.state = "ko";
    defender.frame = 0;
    return { type: "ko", loser: defender.side };
  }

  return {
    type: "hit",
    attacker: attacker.side,
    move: move.kind,
    damage,
    blocked,
    x: defender.x,
    y: defender.y - 96,
  };
}

/** One full logic tick: both fighters step, then each swing is resolved. */
export function stepMatch(
  player: Fighter,
  opponent: Fighter,
  playerInput: InputState,
  aiInput: InputState
): SimEvent[] {
  stepFighter(player, playerInput, opponent);
  stepFighter(opponent, aiInput, player);

  const events: SimEvent[] = [];
  const playerHit = resolveHit(player, opponent);
  if (playerHit) events.push(playerHit);
  const opponentHit = resolveHit(opponent, player);
  if (opponentHit) events.push(opponentHit);
  return events;
}

/** Keep fighters from overlapping: the fighter further back is pushed away. */
export function separate(player: Fighter, opponent: Fighter, minGap = 46) {
  const gap = opponent.x - player.x;
  if (Math.abs(gap) >= minGap) return;
  const push = (minGap - Math.abs(gap)) / 2;
  const dir = gap >= 0 ? 1 : -1;
  player.x = clampX(player.x - dir * push);
  opponent.x = clampX(opponent.x + dir * push);
}


