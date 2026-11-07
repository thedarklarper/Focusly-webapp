"use client";

import { useState } from "react";
import Link from "next/link";
import { useGame } from "@/providers/GameProvider";
import { Button, Card, C, Header, Pill, SectionLabel, Shell } from "@/components/ui";
import { DuckArt } from "@/components/DuckArt";
import { Duck } from "@/game/types";

export default function ShopPage() {
  const { state, hatch } = useGame();
  const [revealed, setRevealed] = useState<Duck | null>(null);

  const canHatch = state.profile.breadcrumbs >= 350 && state.profile.hatchingCredits >= 1;

  const onHatch = () => {
    const d = hatch();
    if (d) setRevealed(d);
  };

  return (
    <Shell>
      <Header eyebrow="The pond store" title="Hatch a new companion." />
      <p className="mb-4 text-[13px] text-[#718096]">Spend Breadcrumbs and a Hatching Credit to reveal a weighted-rarity duck.</p>

      <div className="mb-3.5 flex gap-3">
        <Card className="flex-1">
          <p className="text-[22px]">🍞</p>
          <p className="mt-1.5 text-2xl font-black text-[#16253D]">{state.profile.breadcrumbs}</p>
          <p className="text-[13px] text-[#718096]">Breadcrumbs</p>
        </Card>
        <Card className="flex-1">
          <p className="text-[22px]">🥚</p>
          <p className="mt-1.5 text-2xl font-black text-[#16253D]">{state.profile.hatchingCredits}</p>
          <p className="text-[13px] text-[#718096]">Hatching credits</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Pill color={C.blue}>EGG</Pill>
            <p className="mt-2 text-[17px] font-black text-[#16253D]">Mystery duck egg</p>
            <p className="text-[13px] text-[#718096]">Cost: 350 Breadcrumbs + 1 credit</p>
          </div>
          <span className="text-5xl">🥚</span>
        </div>
        <div className="mt-4">
          <Button title={canHatch ? "Hatch egg" : "Need 350 Breadcrumbs + 1 credit"} onClick={onHatch} disabled={!canHatch} />
        </div>
        <p className="mt-2 text-[11px] text-[#718096]">
          Pending eggs from trophy rewards: {state.eggs}. Rarity odds: Common 58% · Rare 28% · Epic 12% · Legendary 2%.
        </p>
      </Card>

      {revealed ? (
        <Card className="flex flex-col items-center bg-[#F8C84A] text-center">
          <p className="text-[11px] font-black uppercase tracking-[1.6px] text-[#16253D]/70">You hatched</p>
          <div className="my-2">
            <DuckArt id={revealed.id} size={120} />
          </div>
          <p className="text-[20px] font-black text-[#16253D]">{revealed.name}</p>
          <p className="text-[12px] font-bold text-[#16253D]/70">
            {revealed.rarity} · {revealed.element}
          </p>
          <p className="mt-1 text-[12px] text-[#16253D]/80">{revealed.personality}</p>
          <div className="mt-3 w-full">
            <Button title="Nice! Set as active in Ducks" onClick={() => (window.location.href = "/ducks")} secondary />
          </div>
        </Card>
      ) : null}

      <SectionLabel>Recent rewards</SectionLabel>
      <Card>
        {state.recentRewards.length === 0 ? (
          <p className="text-[13px] text-[#718096]">Nothing yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {state.recentRewards.map((r, i) => (
              <li key={i} className="text-[14px] font-bold text-[#16253D]">
                • {r}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Link
        href="/trophy"
        className="block w-full rounded-[18px] bg-[#9ED9F4] py-[15px] text-center text-[15px] font-black text-[#16253D] active:scale-[0.98]"
      >
        Open Trophy Road
      </Link>
    </Shell>
  );
}
