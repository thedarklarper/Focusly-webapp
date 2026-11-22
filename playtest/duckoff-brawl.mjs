/**
 * Headless playtest for Duck Off: Street Brawl.
 *
 * Run against a dev server with the autostart params so the Phaser game is
 * live before the harness's base checks run:
 *
 *   npm run dev
 *   node .agents/skills/phaser-playtest/scripts/playtest.mjs \
 *     --url "http://localhost:3000/duck-off?brawl=1&autostart=1" \
 *     --device iphone --settle 6000 --scenario playtest/duckoff-brawl.mjs
 */
export default [
  // Intro banner ("ROUND 1 / FIGHT!") lasts ~110 sim frames ≈ 1.9s after boot.
  { name: "let the round start", action: "wait", ms: 2500 },

  { name: "walk right into range", action: "key", key: "ArrowRight", duration: 700 },

  // Held presses: a 200ms hold spans ~12 logic ticks so the 60Hz sim sees them.
  { name: "throw a punch", action: "key", key: "KeyJ", duration: 200 },
  { name: "throw a kick", action: "key", key: "KeyK", duration: 200 },
  { name: "brief guard", action: "key", key: "KeyL", duration: 300 },

  { name: "mid-fight", action: "screenshot", name: "midfight" },

  { name: "frame rate holds", action: "expect", expect: { expression: "game.loop.actualFps", atLeast: 55 } },

  { name: "player is alive", action: "expect", expect: { expression: "game.scene.getScene('FightScene').match.state.player.hp > 0", equals: true } },

  { name: "player walked (x advanced from spawn 153.6)", action: "expect", expect: { expression: "game.scene.getScene('FightScene').match.state.player.x > 160", equals: true } },

  { name: "opponent AI is fighting back (took or dealt damage)", action: "expect", expect: { expression: "game.scene.getScene('FightScene').match.state.opponent.hp < game.scene.getScene('FightScene').match.state.opponent.stats.maxHp || game.scene.getScene('FightScene').match.state.player.hp < game.scene.getScene('FightScene').match.state.player.stats.maxHp", equals: true } },
];
