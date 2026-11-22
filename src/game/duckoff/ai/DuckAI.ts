import { Difficulty, InputState, MOVES, emptyInput } from "../types";
import { Fighter, isAttacking, walkSpeed } from "../sim";
import { AIProfile, AI_PROFILES } from "./profiles";

/** Mulberry32 — small, fast, deterministic. Seeded so playtests replay exactly. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The opponent's brain. Holds the current virtual button state until the next
 * decision frame, which is what gives each difficulty its characteristic
 * rhythm: easy feels sluggish and swingy, hard feels like it is reading inputs.
 */
export class DuckAI {
  readonly profile: AIProfile;
  private readonly rng: () => number;
  private cooldown = 0;
  private output: InputState = emptyInput();

  constructor(difficulty: Difficulty, seed = 1) {
    this.profile = AI_PROFILES[difficulty];
    this.rng = createRng(seed);
  }

  reset() {
    this.cooldown = 0;
    this.output = emptyInput();
  }

  /** Called once per logic tick. Returns the virtual controller state. */
  think(self: Fighter, opponent: Fighter): InputState {
    this.cooldown -= 1;
    if (this.cooldown <= 0) {
      this.cooldown = this.profile.reactFrames;
      this.output = this.decide(self, opponent);
    }
    return this.output;
  }

  private decide(self: Fighter, opponent: Fighter): InputState {
    const p = this.profile;
    const input = emptyInput();
    const distance = Math.abs(opponent.x - self.x);
    const toward = (opponent.x >= self.x ? "right" : "left") as "left" | "right";
    const away = toward === "right" ? "left" : "right";

    // An opponent in startup or an active window is a threat to guard against.
    const threat =
      isAttacking(opponent) &&
      opponent.move !== null &&
      opponent.frame <= opponent.move.startup + opponent.move.active;

    // A recovering opponent cannot block for a while: punish window.
    const vulnerable =
      isAttacking(opponent) &&
      opponent.move !== null &&
      opponent.frame > opponent.move.startup + opponent.move.active;

    const inKickRange = distance <= MOVES.kick.reach;
    const inPunchRange = distance <= MOVES.punch.reach;

    // 1. Keep the guard up against an incoming swing.
    if (threat && inKickRange && this.rng() < p.blockChance) {
      input.block = true;
      return input;
    }

    // 2. Punish a whiffed or recovering swing.
    if (vulnerable && inKickRange && this.rng() < p.whiffPunish) {
      if (inPunchRange) input.punch = true;
      else input.kick = true;
      return input;
    }

    // 3. Spend meter when it is available and the target is in range.
    if (p.meterUse && self.meter >= MOVES.special.meterCost && distance <= MOVES.special.reach) {
      if (this.rng() < 0.5) {
        input.special = true;
        return input;
      }
    }

    // 4. Close the gap or hold the preferred spacing.
    if (distance > p.preferRange) {
      if (this.rng() < p.aggression + 0.3) input[toward] = true;
      else input.block = true;
      return input;
    }

    // 5. In range: swing, or occasionally shuffle backwards.
    if (distance <= p.preferRange) {
      if (this.rng() < p.inputNoise) {
        input[away] = true;
        return input;
      }
      if (inPunchRange && this.rng() < 0.6) {
        input.punch = true;
        return input;
      }
      if (inKickRange) {
        input.kick = true;
        return input;
      }
      input[toward] = true;
      return input;
    }

    // 6. Fallback: drift toward the player.
    input[toward] = true;
    return input;
  }

  /** Exposed for tests: how fast this profile can close a 200px gap. */
  framesToClose(gap: number, self: Fighter) {
    const perFrame = walkSpeed(self) / 60;
    return Math.ceil(gap / perFrame) * this.profile.reactFrames;
  }
}
