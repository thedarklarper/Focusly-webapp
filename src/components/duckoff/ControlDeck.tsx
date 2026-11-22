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
 * Two-cluster layout: D-pad on the left, PUNCH/KICK/BLOCK/SPECIAL as a 2x2 on
 * the right, matching the sketch. Every target is >=44px high so it is
 * thumb-reachable on iOS Safari; the deck itself never scrolls the page.
 */
export function ControlDeck({ input, enabled = true, specialReady = false }: ControlDeckProps) {
  const btnBase =
    "flex w-full select-none items-center justify-center rounded-[14px] font-black uppercase tracking-[0.08em] text-white transition-transform duration-75 active:translate-y-[2px] active:scale-[0.98] disabled:opacity-40";

  return (
    <div
      className="grid w-full select-none grid-cols-2 items-start gap-4"
      style={{ touchAction: "none", userSelect: "none", overscrollBehavior: "contain" }}
    >
      {/* ---- D-pad ---- */}
      <div className="flex flex-col items-center gap-1">
        <HoldBtn
          input={input}
          keyName="up"
          enabled={enabled}
          ariaLabel="Jump"
          className={`${btnBase} h-[50px] w-[72px] bg-[#16253D] text-lg leading-none`}
        >
          ▲
        </HoldBtn>
        <div className="flex items-center gap-1">
          <HoldBtn
            input={input}
            keyName="left"
            enabled={enabled}
            ariaLabel="Walk left"
            className={`${btnBase} h-12 w-14 bg-[#16253D] text-base leading-none`}
          >
            ◀
          </HoldBtn>
          <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#E8E0D2] text-[10px] font-black uppercase tracking-[0.08em] text-[#718096]">
            D-PAD
          </div>
          <HoldBtn
            input={input}
            keyName="right"
            enabled={enabled}
            ariaLabel="Walk right"
            className={`${btnBase} h-12 w-14 bg-[#16253D] text-base leading-none`}
          >
            ▶
          </HoldBtn>
        </div>
        <HoldBtn
          input={input}
          keyName="down"
          enabled={enabled}
          ariaLabel="Crouch"
          className={`${btnBase} h-[50px] w-[72px] bg-[#16253D] text-lg leading-none`}
        >
          ▼
        </HoldBtn>
      </div>

      {/* ---- Action buttons ---- */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <HoldBtn
            input={input}
            keyName="punch"
            enabled={enabled}
            ariaLabel="Punch"
            className={`${btnBase} h-14 bg-[#7A1F2B] text-[14px]`}
          >
            Punch
          </HoldBtn>
          <HoldBtn
            input={input}
            keyName="kick"
            enabled={enabled}
            ariaLabel="Kick"
            className={`${btnBase} h-14 bg-[#62B58A] text-[14px] text-[#16253D]`}
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
            className={`${btnBase} h-14 bg-[#9ED9F4] text-[14px] text-[#16253D]`}
          >
            Block
          </HoldBtn>
          <HoldBtn
            input={input}
            keyName="special"
            enabled={enabled}
            ariaLabel="Quack Combo"
            className={`${btnBase} h-14 bg-[#F8C84A] text-[13px] text-[#16253D] ${specialReady ? "ring-2 ring-[#F2815A]" : ""}`}
          >
            Special
          </HoldBtn>
        </div>
      </div>
    </div>
  );
}
