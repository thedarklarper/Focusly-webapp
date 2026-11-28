"use client";

import { useGame } from "@/providers/GameProvider";
import { levelFor } from "@/game/engine";
import { Header, Shell } from "@/components/ui";

export default function AchievementsPage() {
  const { state } = useGame();
  const hasFocus = state.outbox.some((e) => e.kind === "focus");
  const hasWin =
    state.outbox.some((e) => e.kind === "battle" && e.result === "win") ||
    state.outbox.some((e) => e.kind === "transaction" && e.type === "battle_win") ||
    state.outbox.some((e) => e.kind === "transaction" && e.type === "street_brawl_win");
  const topDuckLevel = Math.max(...state.ownedDucks.map((o) => levelFor(o)), 0);

  const badges = [
    { icon: "⏳", name: "First splash of focus", condition: "Finish one focus sprint.", earned: hasFocus },
    { icon: "⚔️", name: "Duck Off winner", condition: "Win your first battle.", earned: hasWin },
    { icon: "🦆", name: "Flock of three", condition: "Own 3 ducks.", earned: state.ownedDucks.length >= 3 },
    { icon: "🔥", name: "Steady week", condition: "Reach a 3-day streak.", earned: state.streak >= 3 },
    { icon: "🍞", name: "Breadwinner", condition: "Hold 500 breadcrumbs at once.", earned: state.profile.breadcrumbs >= 500 },
    { icon: "⭐", name: "Seasoned swimmer", condition: "Raise a duck to level 5.", earned: topDuckLevel >= 5 },
    { icon: "🏆", name: "Milestone collector", condition: "Claim 8 trophy milestones.", earned: state.claimedMilestones.length >= 8 },
    { icon: "🥚", name: "Egg fund", condition: "Hold 5 hatching credits.", earned: state.profile.hatchingCredits >= 5 },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <Shell>
      <Header eyebrow="Badges" title="What you've done." right={<span className="text-[13px] font-black text-[#16253D]">{earnedCount}/{badges.length}</span>} />

      {badges.map((b) => (
        <div
          key={b.name}
          className={`mb-3.5 flex items-center gap-3.5 rounded-[24px] bg-white p-[18px] shadow-[0_5px_12px_rgba(32,48,74,0.07)] ${b.earned ? "" : "opacity-60"}`}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-xl"
            style={{ backgroundColor: b.earned ? "#62B58A" : "#F1EBE0" }}
          >
            <span className={b.earned ? "" : "grayscale"}>{b.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-black text-[#16253D]">{b.name}</p>
            <p className="mt-0.5 text-[12px] font-bold" style={{ color: b.earned ? "#16253D" : "#5C6B7F" }}>
              {b.earned ? "Earned" : b.condition}
            </p>
          </div>
        </div>
      ))}

      <p className="mt-1 text-center text-[12px] font-bold text-[#5C6B7F]">
        Badges read your progress as it is. Screen time behind them is a simulated pocket, counted from your focus timer.
      </p>
    </Shell>
  );
}
