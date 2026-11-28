"use client";

import { useState } from "react";
import { useGame } from "@/providers/GameProvider";
import { DuckArt } from "@/components/DuckArt";
import { Button } from "@/components/ui";

export function Onboarding() {
  const { state, action } = useGame();
  const [step, setStep] = useState(0);

  // Once onboarding is done (or skipped), stay out of the way.
  if (state.onboarded) return null;

  const finish = () => action((s) => ({ ...s, onboarded: true }));

  return (
    <div className="fixed inset-0 z-40 mx-auto flex w-full max-w-[480px] flex-col bg-cream px-5 py-10">
      {step === 0 && (
        <>
          <p className="text-[11px] font-black uppercase tracking-[1.4px] text-[#5C6B7F]">Welcome</p>
          <h1 className="mt-0.5 text-[29px] font-black leading-tight tracking-[-0.7px] text-[#16253D]">Focus time, meet ducks.</h1>
          <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-[#16253D]">
            Start a timer and stay with it. The minutes you focus turn into breadcrumbs, and breadcrumbs hatch duck eggs.
          </p>
          <div className="my-6 flex flex-1 items-center justify-center">
            <div className="rounded-[18px] bg-[#9ED9F4] p-5">
              <DuckArt id="prototype" size={96} />
            </div>
          </div>
          <p className="text-[12px] font-bold text-[#5C6B7F]">
            A note on honesty: this app cannot see your real screen time. The minutes it banks are a simulated pocket, counted from the timer you run here.
          </p>
          <div className="mt-6">
            <Button title="Next" onClick={() => setStep(1)} />
            <button type="button" onClick={finish} className="mt-3 w-full text-center text-[13px] font-bold text-[#5C6B7F]">
              Skip for now
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <p className="text-[11px] font-black uppercase tracking-[1.4px] text-[#5C6B7F]">Your starter duck</p>
          <h1 className="mt-0.5 text-[29px] font-black leading-tight tracking-[-0.7px] text-[#16253D]">This one is yours.</h1>
          <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-[#16253D]">
            Focus raises its level. Battles and trophy milestones keep it busy while you work.
          </p>
          <div className="my-6 flex flex-1 items-center justify-center">
            <div className="rounded-[18px] bg-[#F8C84A] p-6">
              <DuckArt id="prototype" size={96} />
            </div>
          </div>
          <p className="text-[12px] font-bold text-[#5C6B7F]">
            Screen time in Focusly is a simulated pocket. The timer is the real thing.
          </p>
          <div className="mt-6">
            <Button title="Next" onClick={() => setStep(2)} />
            <button type="button" onClick={finish} className="mt-3 w-full text-center text-[13px] font-bold text-[#5C6B7F]">
              Skip for now
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-[11px] font-black uppercase tracking-[1.4px] text-[#5C6B7F]">First sprint</p>
          <h1 className="mt-0.5 text-[29px] font-black leading-tight tracking-[-0.7px] text-[#16253D]">Ready when you are.</h1>
          <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-[#16253D]">
            The home screen has the timer. Start a sprint, let it run, and your duck gets its first XP when you finish.
          </p>
          <div className="my-6 flex flex-1 items-center justify-center">
            <div className="rounded-[18px] bg-[#F8C84A] px-8 py-6 text-center">
              <p className="text-[44px] font-black leading-none tracking-[-1px] text-[#16253D]">60:00</p>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[1.4px] text-[#16253D]">Suggested sprint</p>
            </div>
          </div>
          <div>
            <Button title="Start my first sprint" onClick={finish} />
            <button type="button" onClick={finish} className="mt-3 w-full text-center text-[13px] font-bold text-[#5C6B7F]">
              Skip for now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
