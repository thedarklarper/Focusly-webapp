import { Difficulty, FighterSetup, FightOutcome, InputState } from "./types";
import { FLOOR_Y, ROUND_SECONDS, ROUNDS_TO_WIN, STEP, STAGE_W } from "./constants";
import { Fighter, SimEvent, createFighter, separate, stepMatch } from "./sim";
import { DuckAI, createRng } from "./ai/DuckAI";

export type MatchPhase = "intro" | "fight" | "roundEnd" | "matchEnd";

export type MatchState = {
  phase: MatchPhase;
  player: Fighter;
  opponent: Fighter;
  rounds: [number, number];
  round: number;
  /** Frames remaining in the current round. */
  clock: number;
  difficulty: Difficulty;
  /** Frames of "ROUND 1 / FIGHT!" banner left before control unlocks. */
  introFrames: number;
  roundEndFrames: number;
  lastRoundWinner: "player" | "opponent" | "draw" | null;
  finished: FightOutcome | null;
};

export type MatchConfig = {
  player: FighterSetup;
  opponent: FighterSetup;
  difficulty: Difficulty;
  seed?: number;
};

export const roundSecondsLeft = (m: MatchState) => Math.max(0, Math.ceil(m.clock / 60));

/**
 * Owns rounds, the clock and the win condition. The Phaser scene only calls
 * `tick()` and renders the result, which keeps the sim testable headlessly.
 */
export class DuckOffMatch {
  state: MatchState;
  private ai: DuckAI;
  private rng: () => number;

  constructor(config: MatchConfig) {
    const seed = config.seed ?? 1;
    this.rng = createRng(seed * 7919);
    this.ai = new DuckAI(config.difficulty, seed);
    this.state = {
      phase: "intro",
      player: createFighter("player", config.player, STAGE_W * 0.32, 1),
      opponent: createFighter("opponent", config.opponent, STAGE_W * 0.68, -1),
      rounds: [0, 0],
      round: 1,
      clock: ROUND_SECONDS * 60,
      difficulty: config.difficulty,
      introFrames: 110,
      roundEndFrames: 0,
      lastRoundWinner: null,
      finished: null,
    };
  }

  /** Advance exactly one 60 Hz tick. Returns renderable events. */
  tick(playerInput: InputState): SimEvent[] {
    const s = this.state;

    if (s.phase === "matchEnd") return [];

    if (s.phase === "intro") {
      s.introFrames -= 1;
      if (s.introFrames <= 0) s.phase = "fight";
      return [];
    }

    if (s.phase === "roundEnd") {
      s.roundEndFrames -= 1;
      if (s.roundEndFrames <= 0) this.startRound();
      return [];
    }

    // --- live round ---------------------------------------------------------
    const aiInput = this.ai.think(s.opponent, s.player);
    const events = stepMatch(s.player, s.opponent, playerInput, aiInput);
    separate(s.player, s.opponent);

    s.clock = Math.max(0, s.clock - 1);

    const ko = events.some((e) => e.type === "ko");
    if (ko) {
      const loser = s.player.hp <= 0 ? "player" : "opponent";
      this.endRound(loser === "player" ? "opponent" : "player");
      return events;
    }

    if (s.clock <= 0) {
      // Time up: higher remaining HP percentage takes the round.
      const p = s.player.hp / s.player.stats.maxHp;
      const o = s.opponent.hp / s.opponent.stats.maxHp;
      const winner = Math.abs(p - o) < 0.02 ? "draw" : p > o ? "player" : "opponent";
      this.endRound(winner);
    }

    return events;
  }

  private endRound(winner: "player" | "opponent" | "draw") {
    const s = this.state;
    s.phase = "roundEnd";
    s.roundEndFrames = 120;
    s.lastRoundWinner = winner;
    if (winner === "player") s.rounds[0] += 1;
    else if (winner === "opponent") s.rounds[1] += 1;

    if (s.rounds[0] >= ROUNDS_TO_WIN || s.rounds[1] >= ROUNDS_TO_WIN) {
      s.phase = "matchEnd";
      s.finished = {
        result: s.rounds[0] >= ROUNDS_TO_WIN ? "win" : "loss",
        rounds: [s.rounds[0], s.rounds[1]],
        playerHp: s.player.hp,
        opponentHp: s.opponent.hp,
        playerMaxHp: s.player.stats.maxHp,
        opponentMaxHp: s.opponent.stats.maxHp,
        playerDamageDealt: Math.round(s.player.stats.maxHp - s.player.hp + 0),
        opponentDamageDealt: 0,
        durationMs: 0,
      };
    }
  }

  private startRound() {
    const s = this.state;
    s.round += 1;
    s.phase = "intro";
    s.introFrames = 90;
    s.roundEndFrames = 0;
    s.clock = ROUND_SECONDS * 60;
    s.lastRoundWinner = null;
    s.player = resetFighter(s.player, STAGE_W * 0.32, 1);
    s.opponent = resetFighter(s.opponent, STAGE_W * 0.68, -1);
    this.ai.reset();
  }

  /** Damage the player has dealt across the whole match, for the rewards screen. */
  damageSummary() {
    const s = this.state;
    return {
      dealt: Math.round((1 - s.opponent.hp / s.opponent.stats.maxHp) * s.opponent.stats.maxHp),
      taken: Math.round((1 - s.player.hp / s.player.stats.maxHp) * s.player.stats.maxHp),
    };
  }

  /** Convenience for tests: run the whole match with a scripted input fn. */
  runToEnd(inputFn: (tick: number, s: MatchState) => InputState, maxTicks = 60 * 60 * 8) {
    let t = 0;
    while (this.state.phase !== "matchEnd" && t < maxTicks) {
      this.tick(inputFn(t, this.state));
      t += 1;
    }
    return this.state.finished;
  }

  get remainingSeconds() {
    return roundSecondsLeft(this.state);
  }
}

const resetFighter = (f: Fighter, x: number, facing: 1 | -1): Fighter => ({
  ...f,
  x,
  y: FLOOR_Y,
  vx: 0,
  vy: 0,
  facing,
  hp: f.stats.maxHp,
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

export { STEP };
