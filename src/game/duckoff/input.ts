import { InputState, emptyInput } from "./types";

/**
 * A tiny mutable input bus that both the DOM control deck, the keyboard and the
 * AI write into. `FightScene.update()` reads it once per logic tick.
 *
 * Why not React state: the buttons are held for many frames, and re-rendering
 * React on every press/release while a physics loop runs causes dropped inputs
 * on iOS Safari. A ref object plus pointer capture is both faster and more
 * reliable.
 */
export type InputBus = {
  /** Live state, read by the simulation each tick. */
  current: InputState;
  /** True on the tick a button first went down (edge-triggered actions). */
  pressed: InputState;
  /** Buffer an input for the next tick (used by programmatic/AI input). */
  queue: (patch: Partial<InputState>) => void;
  /** Called by the consumer at the end of every tick. */
  endTick: () => void;
};

export function createInputBus(): InputBus {
  const current = emptyInput();
  const pressed = emptyInput();
  let queued: Partial<InputState> | null = null;

  return {
    current,
    pressed,
    queue(patch) {
      queued = { ...(queued || {}), ...patch };
    },
    endTick() {
      for (const key of Object.keys(pressed) as (keyof InputState)[]) {
        pressed[key] = false;
      }
      if (queued) {
        for (const key of Object.keys(queued) as (keyof InputState)[]) {
          const value = queued[key];
          if (value === undefined) continue;
          if (value && !current[key]) pressed[key] = true;
          current[key] = value;
        }
        queued = null;
      }
    },
  };
}

/**
 * Attach a control-deck button to the bus. Uses pointer events with capture so
 * a thumb that slides off the button still releases it, which is the single
 * most common mobile input bug in fighting games.
 */
export function bindHold(target: HTMLElement, key: keyof InputState, bus: InputBus): () => void {
  const down = (e: PointerEvent) => {
    e.preventDefault();
    target.setPointerCapture?.(e.pointerId);
    if (!bus.current[key]) bus.pressed[key] = true;
    bus.current[key] = true;
  };
  const up = (e: PointerEvent) => {
    e.preventDefault();
    bus.current[key] = false;
  };

  target.addEventListener("pointerdown", down);
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", up);
  target.addEventListener("pointerleave", up);
  target.addEventListener("contextmenu", preventDefault);

  return () => {
    target.removeEventListener("pointerdown", down);
    target.removeEventListener("pointerup", up);
    target.removeEventListener("pointercancel", up);
    target.removeEventListener("pointerleave", up);
    target.removeEventListener("contextmenu", preventDefault);
  };
}

function preventDefault(e: Event) {
  e.preventDefault();
}

/** Keyboard map for desktop play. */
export const KEY_MAP: Record<string, keyof InputState> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  Space: "up",
  ArrowDown: "down",
  KeyS: "down",
  KeyJ: "punch",
  KeyK: "kick",
  KeyL: "block",
  ShiftLeft: "special",
  ShiftRight: "special",
  KeyU: "special",
};
