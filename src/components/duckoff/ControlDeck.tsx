"use client";

import { useEffect, useRef } from "react";
import { bindHold, type InputBus } from "@/game/duckoff/input";

/**
 * DOM control deck for Duck Off: Street Brawl. Buttons are plain
 * pointer-captured elements, not React state, so a held thumb is fed to the
 * 60Hz sim without re-rendering the page on every tick. pointer capture in
 * bindHold is the key: a thumb that slides off a button still releases it.
 */

type HoldBtnProps = {
  input: InputBus | null;
  keyName: Parameters<typeof bindHold>[1];
  enabled: boolean;
  className: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  ariaLabel: string;
};

function HoldBtn({ input, keyName, enabled, className, children, style, ariaLabel }: HoldBtnProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !input || !enabled) return;
    const unbind = bindHold(el, keyName, input);
    return unbind;
  }, [input, keyName, enabled]);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      disabled={!enabled}
      className={className}
      style={{ touchAction: "none", userSelect: "none", overscrollBehavior: "contain", ...style }}
    >
      {children}
    </button>
  );
}

export type ControlDeckProps = {
  input: InputBus | null;
  enabled?: boolean;
  specialReady?: boolean;
};

/**
 * Two-cluster layout: a circular thumb-stick D-pad on the left (four direction
 * buttons at N/W/E/S on a round navy base, like SF-mobile / Brawlhalla), and
 * PUNCH/KICK/BLOCK/SPECIAL as a 2x2 on the right. Left/right are the primary
 * movement, so they get the widest hit areas on the pad. Every target is
 * >=44px so it is thumb-reachable on iOS Safari; the deck never scrolls.
 *
 * Pad geometry: 156px round base. Up/down are 56px circles centered on the
 * N/S edges (offset 12px inward). Left/right are 64x60px rounded pills
 * centered on the W/E edges. A 40px decorative hub sits in the middle, so the
 * left/right buttons are >60px wide each.
 */
export function ControlDeck({ input, enabled = true, specialReady = false }: ControlDeckProps) {
  const btnBase =
    "flex select-none items-center justify-center rounded-[14px] font-black uppercase tracking-[0.08em] text-white transition-transform duration-75 active:translate-y-[2px] active:scale-[0.98] disabled:opacity-40";
  // Round direction buttons: squash inward a touch on press instead of the
  // card-style translate, so they read as keys sunk into a thumb-stick.
  const dirBtn =
    "absolute flex select-none items-center justify-center rounded-full text-[#E8E0D2] transition-transform duration-75 active:scale-95 disabled:opacity-40";

  return (
    <div
      className="grid w-full select-none grid-cols-2 items-start gap-4"
      style={{ touchAction: "none", userSelect: "none", overscrollBehavior: "contain" }}
    >
      {/* ---- Circular D-pad ---- */}
      <div className="flex justify-center">
        <div
          className="relative h-[156px] w-[156px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 32%, #213449 0%, #16253D 62%, #0E1A2C 100%)",
            boxShadow:
              "inset 0 2px 10px rgba(14,26,44,0.9), inset 0 -1px 0 rgba(232,224,210,0.08), 0 3px 8px rgba(14,26,44,0.35)",
          }}
        >
          {/* Decorative center hub */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, #0F1D31 0%, #0A1524 100%)",
              boxShadow: "inset 0 1px 3px rgba(14,26,44,0.9), 0 1px 0 rgba(232,224,210,0.06)",
            }}
          />

          {/* Up (N) */}
          <HoldBtn
            input={input}
            keyName="up"
            enabled={enabled}
            ariaLabel="Jump"
            className={`${dirBtn} left-1/2 top-[8px] h-[56px] w-[56px] -translate-x-1/2 text-[20px] leading-none`}
            style={{ background: "linear-gradient(180deg, #1D3050 0%, #16253D 100%)" }}
          >
            ▲
          </HoldBtn>

          {/* Down (S) */}
          <HoldBtn
            input={input}
            keyName="down"
            enabled={enabled}
            ariaLabel="Crouch"
            className={`${dirBtn} bottom-[8px] left-1/2 h-[56px] w-[56px] -translate-x-1/2 text-[20px] leading-none`}
            style={{ background: "linear-gradient(0deg, #1D3050 0%, #16253D 100%)" }}
          >
            ▼
          </HoldBtn>

          {/* Left (W) — primary movement, wide hit area */}
          <HoldBtn
            input={input}
            keyName="left"
            enabled={enabled}
            ariaLabel="Walk left"
            className={`${dirBtn} left-0 top-1/2 h-[60px] w-[64px] -translate-y-1/2 rounded-l-full rounded-r-[16px] text-[20px] leading-none`}
            style={{ background: "linear-gradient(90deg, #1D3050 0%, #16253D 100%)" }}
          >
            ◀
          </HoldBtn>

          {/* Right (E) — primary movement, wide hit area */}
          <HoldBtn
            input={input}
            keyName="right"
            enabled={enabled}
            ariaLabel="Walk right"
            className={`${dirBtn} right-0 top-1/2 h-[60px] w-[64px] -translate-y-1/2 rounded-r-full rounded-l-[16px] text-[20px] leading-none`}
            style={{ background: "linear-gradient(270deg, #1D3050 0%, #16253D 100%)" }}
          >
            ▶
          </HoldBtn>
        </div>
      </div>

      {/* ---- Action buttons ---- */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <HoldBtn
            input={input}
            keyName="punch"
            enabled={enabled}
            ariaLabel="Punch"
            className={`${btnBase} h-16 w-full bg-[#7A1F2B] text-[14px]`}
          >
            Punch
          </HoldBtn>
          <HoldBtn
            input={input}
            keyName="kick"
            enabled={enabled}
            ariaLabel="Kick"
            className={`${btnBase} h-16 w-full bg-[#62B58A] text-[14px] text-[#16253D]`}
          >
            Kick
          </HoldBtn>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <HoldBtn
            input={input}
            keyName="block"
            enabled={enabled}
            ariaLabel="Block"
            className={`${btnBase} h-16 w-full bg-[#9ED9F4] text-[14px] text-[#16253D]`}
          >
            Block
          </HoldBtn>
          <HoldBtn
            input={input}
            keyName="special"
            enabled={enabled}
            ariaLabel="Quack Combo"
            className={`${btnBase} h-16 w-full bg-[#F8C84A] text-[13px] text-[#16253D] ${specialReady ? "ring-2 ring-[#F2815A]" : ""}`}
          >
            Special
          </HoldBtn>
        </div>
      </div>
    </div>
  );
}
