"use client";

import { useGame, DUCKS } from "@/providers/GameProvider";
import { statsFor } from "@/game/engine";
import { Button, Card, C, Header, Meter, Pill, Shell } from "@/components/ui";
import { DuckArt } from "@/components/DuckArt";

const rarityColor: Record<string, string> = { Common: "#E8E0D2", Rare: "#9ED9F4", Epic: "#9B8AFB", Legendary: "#F8C84A" };

export default function DucksPage() {
  const { state, action } = useGame();

  const setActive = (duckId: string) =>
    action((s) => ({
      ...s,
      profile: { ...s.profile, activeDuckId: duckId },
      ownedDucks: s.ownedDucks.map((o) => ({ ...o, isActive: o.duckId === duckId })),
    }));

  return (
    <Shell>
      <Header eyebrow="The flock" title="Pick your feathered focus buddy." />
      <p className="mb-4 text-[13px] text-[#718096]">Every duck brings a different way to win your attention back.</p>

      <div className="grid grid-cols-2 gap-3">
        {DUCKS.map((d) => {
          const owned = state.ownedDucks.find((o) => o.duckId === d.id);
          const stats = statsFor(owned || { id: "", duckId: d.id, level: 1, xp: 0, energy: 100, isActive: false, isAsleep: false }, d);
          const isActive = !!owned?.isActive;
          return (
            <Card key={d.id} className={`!mb-0 ${isActive ? "ring-2 ring-[#F8C84A]" : ""}`}>
              <div className="flex items-start justify-between">
                <DuckArt id={d.id} size={64} />
                <Pill color={rarityColor[d.rarity]}>{d.rarity}</Pill>
              </div>
              <p className="mt-2 text-[15px] font-black text-[#16253D]">{d.name}</p>
              <p className="text-[12px] font-bold text-[#718096]">{d.element}</p>
              <p className="mt-1 text-[11px] leading-snug text-[#718096]">{d.ability}</p>

              <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] font-bold text-[#16253D]">
                <span>HP {stats.hp}</span>
                <span>ATK {stats.attack}</span>
                <span>DEF {stats.defense}</span>
                <span>SPD {stats.speed}</span>
              </div>

              {owned ? (
                <div className="mt-2">
                  <p className="mb-1 text-[11px] font-bold text-[#718096]">
                    Lv {owned.level} · {owned.isAsleep ? "sleeping" : `${owned.energy}% energy`}
                  </p>
                  <Meter value={owned.energy} color={owned.energy > 30 ? C.green : C.orange} />
                  <div className="mt-2">
                    {isActive ? (
                      <span className="block rounded-[14px] bg-[#F8C84A] py-2 text-center text-[12px] font-black text-[#16253D]">Active</span>
                    ) : (
                      <button
                        onClick={() => setActive(d.id)}
                        className="w-full rounded-[14px] bg-[#16253D] py-2 text-[12px] font-black text-white active:scale-[0.98]"
                      >
                        Set active
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 rounded-[14px] bg-[#F1EBE0] py-2 text-center text-[11px] font-bold text-[#718096]">Locked — hatch in Shop</p>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-4">
        <Button title="Go to Shop to hatch eggs" onClick={() => (window.location.href = "/shop")} secondary />
      </div>
    </Shell>
  );
}
