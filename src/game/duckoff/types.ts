/**
 * Duck Off: Street Brawl — shared types.
 *
 * This module must stay free of Phaser imports so it can be used by the
 * server-rendered page, the reward engine and plain node tests.
 */

export type Difficulty = "easy" | "medium" | "hard";

export type MoveKind = "punch" | "kick" | "special";

export type FighterState =
  | "idle"
  | "walk"
  | "crouch"
  | "jump"
  | "punch"
  | "kick"
  | "special"
  | "block"
  | "hitstun"
  | "blockstun"
  | "ko";

export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  punch: boolean;
  kick: boolean;
  block: boolean;
  special: boolean;
};

export const emptyInput = (): InputState => ({
  left: false,
  right: false,
  up: false,
  down: false,
  punch: false,
  kick: false,
  block: false,
  special: false,
});

/** Frame data. All timings are integer frames at a fixed 60 Hz logic tick. */
export type MoveDef = {
  kind: MoveKind;
  label: string;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  meterGain: number;
  meterCost: number;
  /** Horizontal reach in px, measured from the fighter's centre. */
  reach: number;
  /** Vertical size of the hitbox in px. */
  hitboxHeight: number;
  knockback: number;
};

export const MOVES: Record<MoveKind, MoveDef> = {
  punch: {
    kind: "punch",
    label: "Punch",
    startup: 3,
    active: 2,
    recovery: 6,
    damage: 6,
    meterGain: 8,
    meterCost: 0,
    reach: 76,
    hitboxHeight: 46,
    knockback: 6,
  },
  kick: {
    kind: "kick",
    label: "Kick",
    startup: 7,
    active: 3,
    recovery: 11,
    damage: 11,
    meterGain: 12,
    meterCost: 0,
    reach: 96,
    hitboxHeight: 60,
    knockback: 14,
  },
  special: {
    kind: "special",
    label: "Quack Combo",
    startup: 9,
    active: 4,
    recovery: 14,
    damage: 22,
    meterGain: 0,
    meterCost: 100,
    reach: 104,
    hitboxHeight: 76,
    knockback: 24,
  },
};

export const totalFrames = (m: MoveDef) => m.startup + m.active + m.recovery;

export type FighterStats = {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
};

export type FighterSetup = {
  duckId: string;
  name: string;
  stats: FighterStats;
};

export type MatchConfig = {
  player: FighterSetup;
  opponent: FighterSetup;
  difficulty: Difficulty;
  seed?: number;
};

export type FightOutcome = {
  result: "win" | "loss";
  /** Player / opponent round wins. */
  rounds: [number, number];
  playerHp: number;
  opponentHp: number;
  playerMaxHp: number;
  opponentMaxHp: number;
  playerDamageDealt: number;
  opponentDamageDealt: number;
  durationMs: number;
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Rookie",
  medium: "Street",
  hard: "Champion",
};
