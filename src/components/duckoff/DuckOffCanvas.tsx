"use client";

import { useEffect, useRef, useState } from "react";
import type { Difficulty, FighterSetup, FightOutcome } from "@/game/duckoff/types";
import { createInputBus, KEY_MAP, type InputBus } from "@/game/duckoff/input";

export type DuckOffCanvasProps = {
  match: { player: FighterSetup; opponent: FighterSetup; difficulty: Difficulty; seed?: number };
  playerSprite: string;
  opponentSprite: string;
  /** Fires once when the match is decided, after the scene fade-out. */
  onFinish: (outcome: FightOutcome) => void;
  onRoundStart?: (round: number) => void;
  /** Called with the live InputBus so the parent can hand it to the DOM deck. */
  onInputBus?: (input: InputBus | null) => void;
};

const STAGE_W = 480;
const STAGE_H = 640;

/**
 * Mounts the Phaser game inside a useEffect with a dynamic import — nothing
 * from `phaser` is ever evaluated at module scope, so /duck-off stays
 * statically prerenderable under cacheComponents.
 *
 * The game is destroyed on unmount (game.destroy(true)) so toggling between
 * Classic and Street Brawl never leaves a scene running in the background.
 */
export function DuckOffCanvas({ match, playerSprite, opponentSprite, onFinish, onRoundStart, onInputBus }: DuckOffCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<{ destroy: (arg: boolean) => void } | null>(null);
  const onFinishRef = useRef(onFinish);
  const onRoundStartRef = useRef(onRoundStart);
  const onInputBusRef = useRef(onInputBus);
  onFinishRef.current = onFinish;
  onRoundStartRef.current = onRoundStart;
  onInputBusRef.current = onInputBus;

  const inputRef = useRef<InputBus>(createInputBus());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Parent needs the bus immediately (it wires the DOM deck to it).
    onInputBusRef.current?.(inputRef.current);
    return () => onInputBusRef.current?.(null);
  }, []);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    let cancelled = false;
    let game: { destroy: (arg: boolean) => void } | null = null;
    const input = inputRef.current;

    const keyHandler = (down: boolean) => (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code as keyof typeof KEY_MAP];
      if (!key) return;
      e.preventDefault();
      // Write the live state only. The scene reads `current` each tick and
      // owns the `pressed` lifecycle via its own endTick, so we never call
      // endTick here — doing so could swallow an edge before the sim sees it.
      if (down && !input.current[key]) input.pressed[key] = true;
      input.current[key] = down;
    };
    const onDown = keyHandler(true);
    const onUp = keyHandler(false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    (async () => {
      try {
        // Dynamic imports keep phaser out of the server bundle entirely.
        const PhaserModule = await import("phaser");
        const Phaser = PhaserModule.default;
        const { buildGameConfig } = await import("@/game/duckoff/config");
        if (cancelled || !parent) return;

        const config = buildGameConfig(parent, {
          match: { ...match, seed: match.seed ?? 1 },
          playerSprite,
          opponentSprite,
          readInput: () => input.current,
          onRoundStart: (round) => onRoundStartRef.current?.(round),
          onFinish: (outcome) => {
            if (outcome) onFinishRef.current(outcome);
          },
        });

        game = new Phaser.Game(config);
        gameRef.current = game;
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not mount Street Brawl");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      gameRef.current = null;
      if (game) game.destroy(true);
      else if (parent) parent.innerHTML = "";
    };
    // Re-mount the game only when the fighters change; callbacks stay fresh via refs.
  }, [match.player.duckId, match.player.stats.maxHp, match.opponent.duckId, match.opponent.stats.maxHp, match.difficulty, playerSprite, opponentSprite]);

  return (
    <div className="relative w-full overflow-hidden rounded-[10px] bg-[#9ED9F4]" style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}>
      <div ref={parentRef} className="absolute inset-0" style={{ touchAction: "none" }} />
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#16253D]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F8C84A] border-t-transparent" aria-hidden="true" />
          <p className="text-[13px] font-black uppercase tracking-[0.12em] text-[#FFF9EF]">Loading the pond…</p>
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#16253D] p-5 text-center">
          <p className="text-[13px] font-bold text-[#FFF9EF]">Street Brawl could not start. ({error})</p>
        </div>
      ) : null}
    </div>
  );
}
