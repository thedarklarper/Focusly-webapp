"use client";

import { useState } from "react";
import { useGame } from "@/providers/GameProvider";
import { Button, Card, Header, Shell } from "@/components/ui";

export default function SettingsPage() {
  const { state, account, action } = useGame();
  const [name, setName] = useState(state.profile.username);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const saveName = () => {
    const clean = name.trim();
    if (!clean || clean === state.profile.username) return;
    action((s) => ({ ...s, profile: { ...s.profile, username: clean } }));
  };

  const resetData = () => {
    try {
      const id = account?.id;
      window.localStorage.removeItem(id ? `focusly:game:v1:${id}` : "focusly:game:v1");
    } catch {
      /* privacy mode — nothing stored to clear */
    }
    window.location.reload();
  };

  return (
    <Shell>
      <Header eyebrow="Your setup" title="Settings" />

      <Card>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[1.4px] text-[#5C6B7F]">Name</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          maxLength={24}
          placeholder="What should we call you?"
          className="w-full rounded-[18px] border border-[#E8E0D2] bg-[#FFF9EF] px-4 py-3 text-[15px] font-bold text-[#16253D] outline-none placeholder:font-normal placeholder:text-[#718096] focus:border-[#F8C84A]"
        />
        <p className="mt-2 text-[12px] text-[#5C6B7F]">Saved to your pond on this device.</p>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-black text-[#16253D]">Background music</p>
            <p className="text-[12px] text-[#5C6B7F]">The quiet desert track, on or off.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.musicEnabled}
            onClick={() => action((s) => ({ ...s, musicEnabled: !s.musicEnabled }))}
            className={`relative h-9 w-16 shrink-0 rounded-[14px] transition active:scale-[0.98] ${state.musicEnabled ? "bg-[#F8C84A]" : "bg-[#9ED9F4]"}`}
          >
            <span
              className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-[0_2px_5px_rgba(32,48,74,0.18)] transition-all ${state.musicEnabled ? "left-8" : "left-1"}`}
            />
          </button>
        </div>
      </Card>

      <Card>
        <p className="mb-2 text-[13px] font-black text-[#16253D]">Reset data</p>
        <p className="mb-3 text-[12px] text-[#5C6B7F]">
          Clears this device&apos;s snapshot: ducks, breadcrumbs, streaks, everything. There is no cloud copy.
        </p>
        {confirmingReset ? (
          <div className="flex gap-2">
            <Button title="Yes, clear it" onClick={resetData} className="!bg-[#F2815A] !py-3" />
            <Button title="Keep my data" onClick={() => setConfirmingReset(false)} secondary className="!py-3" />
          </div>
        ) : (
          <Button title="Reset everything" onClick={() => setConfirmingReset(true)} secondary className="!py-3" />
        )}
      </Card>

      <Card>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[1.4px] text-[#5C6B7F]">About this app</p>
        <p className="text-[13px] text-[#16253D]">
          Focusly turns focus time into ducks. The screen time it collects is a simulated pocket, not a real reading of
          your device — and it lives on this device only, as a single-device local snapshot. No account, no sync
          between devices.
        </p>
      </Card>
    </Shell>
  );
}
