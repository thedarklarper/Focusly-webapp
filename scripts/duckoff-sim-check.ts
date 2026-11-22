/**
 * Headless smoke test for the Duck Off simulation.
 * Run: npx tsx scripts/duckoff-sim-check.ts
 *
 * Verifies the pure-logic layer without a browser: fighters close distance,
 * swings land, the AI behaves differently per difficulty, and every difficulty
 * produces a decided match. This is what keeps gameplay bugs out of the Phaser
 * render layer.
 */
import { DuckOffMatch } from "../src/game/duckoff/match";
import { emptyInput, FighterState } from "../src/game/duckoff/types";
import { AI_PROFILES } from "../src/game/duckoff/ai/profiles";

const PLAYER = { duckId: "prototype", name: "Prototype", stats: { maxHp: 120, attack: 32, defense: 28, speed: 30 } };
const OPPONENT = { duckId: "pirate", name: "Pirate Duck", stats: { maxHp: 105, attack: 45, defense: 20, speed: 36 } };

let failures = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
};

// 1. A passive player must still take damage: proves the AI approaches and swings.
{
  const m = new DuckOffMatch({ player: PLAYER, opponent: OPPONENT, difficulty: "hard", seed: 42 });
  let taken = 0;
  for (let i = 0; i < 600; i += 1) {
    for (const e of m.tick(emptyInput())) {
      if (e.type === "hit" && e.attacker === "opponent") taken += e.damage;
    }
  }
  check("hard AI closes distance and damages an idle player", taken > 0, `${taken} damage in 10s`);
}

// 2. Same seed must produce identical results (determinism).
{
  const run = () => {
    const m = new DuckOffMatch({ player: PLAYER, opponent: OPPONENT, difficulty: "medium", seed: 7 });
    for (let i = 0; i < 900; i += 1) {
      const input = emptyInput();
      input.punch = i % 40 === 0;
      input.right = i % 9 < 4;
      m.tick(input);
    }
    return `${m.state.player.hp}:${m.state.opponent.hp}:${m.state.rounds.join("-")}`;
  };
  check("seeded runs are identical", run() === run(), run());
}

// 3. Punches in range must damage the opponent.
{
  const m = new DuckOffMatch({ player: PLAYER, opponent: OPPONENT, difficulty: "easy", seed: 3 });
  m.state.phase = "fight";
  // Walk into range, then spam punch.
  let landed = false;
  for (let i = 0; i < 600 && !landed; i += 1) {
    const input = emptyInput();
    if (Math.abs(m.state.opponent.x - m.state.player.x) > 70) input.right = true;
    else input.punch = i % 12 === 0;
    m.tick(input);
    if (m.state.opponent.hp < OPPONENT.stats.maxHp) landed = true;
  }
  check("player punch lands and deals damage", landed, `opponent hp ${m.state.opponent.hp}`);
}

// 4. Blocking reduces incoming damage.
{
  const damageWith = (blocking: boolean) => {
    let taken = 0;
    for (const seed of [11, 12, 13]) {
      const m = new DuckOffMatch({ player: PLAYER, opponent: OPPONENT, difficulty: "hard", seed });
      m.state.phase = "fight";
      for (let i = 0; i < 420; i += 1) {
        const input = emptyInput();
        input.block = blocking;
        for (const e of m.tick(input)) {
          if (e.type === "hit" && e.attacker === "opponent") taken += e.damage;
        }
      }
    }
    return taken;
  };
  const open = damageWith(false);
  const guarded = damageWith(true);
  check("blocking reduces damage taken", guarded > 0 && guarded < open, `open ${open} vs block ${guarded}`);
}

// 5. Difficulty must actually differ: easy is gentler than hard.
{
  const punish = (d: "easy" | "medium" | "hard") => {
    let total = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      const m = new DuckOffMatch({ player: PLAYER, opponent: OPPONENT, difficulty: d, seed });
      m.state.phase = "fight";
      for (let i = 0; i < 900; i += 1) {
        const input = emptyInput();
        // A sloppy, telegraphed player: long-range kicks that whiff.
        input.kick = i % 55 === 0;
        if (i % 120 < 40) input.right = true;
        m.tick(input);
      }
      total += PLAYER.stats.maxHp - m.state.player.hp;
    }
    return total;
  };
  const easy = punish("easy");
  const hard = punish("hard");
  check("hard hurts more than easy", hard > easy, `easy ${easy} vs hard ${hard}`);

  check(
    "reaction frames are ordered easy > medium > hard",
    AI_PROFILES.easy.reactFrames > AI_PROFILES.medium.reactFrames &&
      AI_PROFILES.medium.reactFrames > AI_PROFILES.hard.reactFrames
  );
}

// 6. Every difficulty must reach a decided match (no infinite stalemate).
{
  for (const d of ["easy", "medium", "hard"] as const) {
    const m = new DuckOffMatch({ player: PLAYER, opponent: OPPONENT, difficulty: d, seed: 5 });
    const outcome = m.runToEnd(() => {
      const input = emptyInput();
      input.right = true;
      return input;
    });
    check(`${d} match reaches a decided result`, outcome !== null && (outcome.result === "win" || outcome.result === "loss"), outcome ? `${outcome.result} ${outcome.rounds.join("-")}` : "timeout");
  }
}

// 7. Special costs meter and is not spammable.
{
  const m = new DuckOffMatch({ player: PLAYER, opponent: OPPONENT, difficulty: "easy", seed: 2 });
  m.state.phase = "fight";
  m.state.player.meter = 0;
  const input = emptyInput();
  input.special = true;
  m.tick(input);
  check("special is unavailable at 0 meter", m.state.player.state !== "special", `state ${m.state.player.state}`);

  m.state.player.meter = 100;
  m.state.player.state = "idle";
  m.tick(input);
  // Read through a widened variable: the `state = "idle"` write above narrows
  // further reads inside this closure, so compare via a FighterState-typed copy.
  const fighterAfterTick: { state: FighterState } = m.state.player;
  const stateAfterTick = fighterAfterTick.state;
  check("special fires at full meter and spends it", stateAfterTick === "special" && m.state.player.meter === 0, `state ${stateAfterTick} meter ${m.state.player.meter}`);
}

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
