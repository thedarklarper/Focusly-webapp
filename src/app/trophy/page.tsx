"use client";

import { useGame } from "@/providers/GameProvider";
import { claimMilestone, TROPHY_REWARDS, TrophyReward } from "@/game/engine";
import { Button, Card, Header, Shell } from "@/components/ui";

const describe = (r: TrophyReward) => {
  const parts: string[] = [];
  if (r.breadcrumbs) parts.push(`+${r.breadcrumbs} Breadcrumbs`);
  if (r.hatchingCredits) parts.push(`+${r.hatchingCredits} credit${r.hatchingCredits > 1 ? "s" : ""}`);
  if (r.eggs) parts.push(`+${r.eggs} egg${r.eggs > 1 ? "s" : ""}`);
  if (r.screenTimeMinutes) parts.push(`+${r.screenTimeMinutes} min`);
  if (r.duckId) parts.push("Legendary duck");
  return parts.join(" · ");
};

export default function TrophyPage() {
  const { state, action } = useGame();

  return (
    <Shell>
      <Header eyebrow="Trophy road" title="Claim your milestones." />

      <Card className="bg-[#16253D]">
        <p className="text-[11px] font-black uppercase tracking-[1.6px] text-white/70">Your trophies</p>
        <p className="text-[56px] font-black leading-none text-[#F8C84A]">{state.profile.trophies}</p>
        <p className="mt-1 text-[13px] font-bold text-white/80">Win Duck Off battles to climb the road.</p>
      </Card>

      {TROPHY_REWARDS.map((r) => {
        const claimed = state.claimedMilestones.includes(r.threshold);
        const ready = state.profile.trophies >= r.threshold && !claimed;
        return (
          <Card key={r.threshold} className={claimed ? "opacity-70" : ready ? "ring-2 ring-[#62B58A]" : ""}>
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-black text-[#16253D]">{r.title}</p>
              <p className="text-[13px] font-black text-[#16253D]">{r.threshold} 🏆</p>
            </div>
            <p className="mt-1 text-[13px] text-[#718096]">{r.description}</p>
            <p className="my-2 text-[13px] font-bold text-[#16253D]">{describe(r)}</p>
            {claimed ? (
              <span className="block rounded-[14px] bg-[#EEF0ED] py-2 text-center text-[12px] font-black text-[#718096]">Claimed</span>
            ) : ready ? (
              <Button title="Claim reward" onClick={() => action((s) => claimMilestone(s, r))} />
            ) : (
              <span className="block rounded-[14px] bg-[#F1EBE0] py-2 text-center text-[12px] font-bold text-[#718096]">
                {r.threshold - state.profile.trophies} more trophies needed
              </span>
            )}
          </Card>
        );
      })}
    </Shell>
  );
}
