/**
 * Duck Off: Street Brawl — layout and simulation constants.
 *
 * Portrait stage, matching the phone frame in `src/app/layout.tsx`. The control
 * deck is DOM, so the canvas only needs to cover the HUD + arena.
 */

export const STAGE_W = 480;
export const STAGE_H = 640;

/** Height of the health-bar / timer band drawn by HudScene. */
export const HUD_H = 150;

/** Fighters' feet rest on this line. */
export const FLOOR_Y = 560;

/** Horizontal movement clamp for fighters. */
export const MIN_X = 76;
export const MAX_X = STAGE_W - 76;

/** Fixed logic step: 60 Hz. */
export const FPS = 60;
export const STEP_MS = 1000 / FPS;
export const STEP = 1 / FPS;

/** Manual kinematics (deterministic, no Arcade body sync). */
export const GRAVITY = 1900;
export const JUMP_VELOCITY = -640;

/** Base movement tuned by each duck's `speed` stat. */
export const BUTTON_WIDTH = 40;

export const ROUND_SECONDS = 60;
export const ROUNDS_TO_WIN = 2;

/** Registry keys shared between React and the Phaser scenes. */
export const REG_MATCH = "duckoff:match";
export const REG_FINISH = "duckoff:finish";

/** Event names on the Phaser game event bus. */
export const EVT_HUD = "duckoff:hud";
export const EVT_ROUND = "duckoff:round";
