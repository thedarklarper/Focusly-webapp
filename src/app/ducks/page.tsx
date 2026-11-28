"use client";

import { useState } from "react";
import { useGame, DUCKS } from "@/providers/GameProvider";
import { statsFor } from "@/game/engine";
import { Button, Card, C, Header, Meter, Pill, Shell } from "@/components/ui";
import { DuckArt } from "@/components/DuckArt";

const rarityColor: Record<string, string> = { Common: "#E8E0D2", Rare: "#9ED9F4", Epic: "#9B8AFB", Legendary: "#F8C84A" };

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] bg-[#F1EBE0] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[1.4px] text-[#5C6B7F]">{label}</p>
      <p className="text-[20px] font-black leading-tight tracking-[-0.3px] text-[#16253D]">{value}</p>
    </div>
  );
}

function DuckDetail({ duckId, level, xp }: { duckId: string; level: number; xp: number }) {
  const d = DUCKS.find((x) => x.id === duckId)!;
  const stats = statsFor({ id: "", duckId, level, xp, energy: 100, isActive: false, isAsleep: false }, d);
  return (
    <div className="mt-3 border-t border-[#E8E0D2] pt-3">
      <div className="flex items-center gap-3">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[18px] bg-[#9ED9F4]">
          <DuckArt id={duckId} size={56} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[1.4px] text-[#5C6B7F]">Ability</p>
          <p className="text-[13px] font-bold leading-snug text-[#16253D]">{d.ability}</p>
          <p className="mt-1 text-[12px] leading-snug text-[#5C6B7F]">{d.personality}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatTile label="HP" value={stats.hp} />
        <StatTile label="ATK" value={stats.attack} />
        <StatTile label="DEF" value={stats.defense} />
        <StatTile label="SPD" value={stats.speed} />
      </div>

      <div className="mt-3">
        <p className="mb-1 text-[11px] font-bold text-[#16253D]">
          {xp % 100}/100 to Lv {level + 1}
        </p>
        <Meter value={xp % 100} color={C.green} />
      </div>
    </div>
  );
}

export default function DucksPage() {
  const { state, action } = useGame();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const setActive = (duckId: string) =>
    action((s) => ({
      ...s,
      profile: { ...s.profile, activeDuckId: duckId },
      ownedDucks: s.ownedDucks.map((o) => ({ ...o, isActive: o.duckId === duckId })),
    }));

  return (
    <Shell>
      <Header eyebrow="The flock" title="Pick your feathered focus buddy." />
      <p className="mb-4 text-[13px] text-[#5C6B7F]">Every duck brings a different way to win your attention back.</p>

      <div className="grid grid-cols-2 gap-3">
        {DUCKS.map((d) => {
          const owned = state.ownedDucks.find((o) => o.duckId === d.id);
          const stats = statsFor(owned || { id: "", duckId: d.id, level: 1, xp: 0, energy: 100, isActive: false, isAsleep: false }, d);
          const isActive = !!owned?.isActive;
          const expanded = owned !== undefined && expandedId === d.id;
          return (
            <Card key={d.id} className={`!mb-0 ${isActive ? "ring-2 ring-[#F8C84A]" : ""} ${expanded ? "col-span-2" : ""}`}>
              <div className="flex items-start justify-between">
                <DuckArt id={d.id} size={64} />
                <Pill color={rarityColor[d.rarity]}>{d.rarity}</Pill>
              </div>
              <p className="mt-2 text-[15px] font-black text-[#16253D]">{d.name}</p>
              <p className="text-[12px] font-bold text-[#5C6B7F]">{d.element}</p>
              <p className="mt-1 text-[11px] leading-snug text-[#5C6B7F]">{d.ability}</p>

              <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] font-bold text-[#16253D]">
                <span>HP {stats.hp}</span>
                <span>ATK {stats.attack}</span>
                <span>DEF {stats.defense}</span>
                <span>SPD {stats.speed}</span>
              </div>

              {owned ? (
                <div className="mt-2">
                  <p className="mb-1 text-[11px] font-bold text-[#5C6B7F]">
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
                  <button
                    onClick={() => setExpandedId(expanded ? null : d.id)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-[14px] bg-[#F1EBE0] py-2 text-[12px] font-black text-[#16253D] active:scale-[0.98]"
                  >
                    {expanded ? "Close details" : "Duck details"}
                    <span
                      className="inline-block text-[10px] transition-transform duration-200"
                      style={{ transform: expanded ? "rotate(180deg)" : undefined }}
                    >
                      ▼
                    </span>
                  </button>
                  {expanded && <DuckDetail duckId={d.id} level={owned.level} xp={owned.xp} />}
                </div>
              ) : (
                <p className="mt-3 rounded-[14px] bg-[#F1EBE0] py-2 text-center text-[11px] font-bold text-[#5C6B7F]">Locked — hatch in Shop</p>
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
