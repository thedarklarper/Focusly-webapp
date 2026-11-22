import Phaser from "phaser";
import { HUD_H, STAGE_H, STAGE_W } from "./constants";
import { MatchConfig } from "./match";
import { FightOutcome, InputState } from "./types";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { FightScene } from "./scenes/FightScene";
import { HudScene } from "./scenes/HudScene";

/** Registry key the scenes read their setup from. */
export const REG_SETUP = "duckoff:setup";

export type SceneSetup = {
  match: MatchConfig;
  playerSprite: string;
  opponentSprite: string;
  /** Mirrors the DOM control deck into the sim each tick. */
  readInput: () => InputState;
  onRoundStart?: (round: number) => void;
  onRoundEnd?: (winner: "player" | "opponent" | "draw", rounds: [number, number]) => void;
  /** Fired exactly once when the match is decided, after the fade-out. */
  onFinish?: (outcome: FightOutcome) => void;
};

/**
 * Portrait stage: the canvas covers the HUD band plus the arena. The control
 * deck is DOM below it, which keeps the buttons crisp on Retina and reachable
 * with a thumb.
 *
 * No Arcade gravity: fighters are simulated deterministically in `sim.ts`, and
 * Arcade is used only for the (optional) body bookkeeping. This avoids the
 * classic "physics fights the animation" bug.
 */
export const buildGameConfig = (parent: HTMLElement, setup: SceneSetup): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: "#9ED9F4",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: STAGE_W,
    height: STAGE_H,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  render: { antialias: true, roundPixels: true, pixelArt: false },
  audio: { noAudio: true },
  scene: [BootScene, PreloadScene, FightScene, HudScene],
  callbacks: {
    preBoot: (game) => {
      game.registry.set(REG_SETUP, setup);
    },
    postBoot: (game) => {
      if (typeof window !== "undefined") {
        // The playtest harness finds the game on window; scene restarts keep it fresh.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__PHASER_GAME__ = game;
      }
    },
  },
});

export { HUD_H, STAGE_W, STAGE_H };

