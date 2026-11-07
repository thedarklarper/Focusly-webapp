"use client";

import { useState } from "react";
import { useGame, duck, DUCKS } from "@/providers/GameProvider";
import { fightAction, startBattle } from "@/game/engine";
import { Button, Card, Header, Meter, Pill, Shell } from "@/components/ui";
import { DuckArt } from "@/components/DuckArt";
import { BattleAction } from "@/game/types";

export default function DuckOffPage() {
  const { state, action } = useGame();
  const active = state.ownedDucks.find((o) => o.isActive) || state.ownedDucks[0];
  const b = state.battle;
  const [opponentId, setOpponentId] = useState<string>(DUCKS.find((d) => d.id !== active?.duckId)?.id || "pirate");

  const start = () => action((s) => startBattle(s, opponentId));
  const act = (a: BattleAction) => action((s) => fightAction(s, a));
  const canStart = state.profile.stamina >= 20 && !!active && !active.isAsleep && active.energy > 0;

  return (
    <Shell>
      <Header eyebrow="Duck Off" title="Battle for the pond." />

      <Card className="flex items-center justify-between bg-[#9ED9F4]">
        <div>
          <Pill color="#FFFFFF">STAMINA</Pill>
          <p className="mt-1 text-[28px] font-black leading-none text-[#16253D]">{state.profile.stamina}</p>
          <p className="text-[12px] text-[#16253D]/70">A battle costs 20 stamina.</p>
        </div>
        <span className="text-4xl">⚡</span>
      </Card>

      {!b || b.finished ? (
        <>
          {b?.finished ? (
            <Card className="bg-[#16253D]">
              <p className="text-[28px] font-black text-[#F8C84A]">{b.result === "win" ? "Victory!" : "Good try!"}</p>
              <p className="mt-1 text-[13px] text-white/80">
                {b.result === "win" ? "+75 Breadcrumbs · +12 trophies · +15 min" : "+20 Breadcrumbs · +2 trophies · +5 min"}
              </p>
            </Card>
          ) : null}

          <Card>
            <p className="text-[17px] font-black text-[#16253D]">Choose your opponent</p>
            <p className="text-[13px] text-[#718096]">Your active duck is {active ? duck(active.duckId).name : "—"}.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DUCKS.filter((d) => d.id !== active?.duckId).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setOpponentId(d.id)}
                  className={`flex items-center gap-2 rounded-[16px] border p-2 text-left ${opponentId === d.id ? "border-[#F8C84A] bg-[#FFF9EF]" : "border-[#E8E0D2] bg-white"}`}
                >
                  <DuckArt id={d.id} size={36} />
                  <div>
                    <p className="text-[12px] font-black text-[#16253D]">{d.name}</p>
                    <p className="text-[10px] font-bold text-[#718096]">{d.rarity}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Button title={canStart ? "Enter the arena (20 stamina)" : "Need stamina / rested duck"} onClick={start} disabled={!canStart} />
            </div>
          </Card>
        </>
      ) : null}

      {b && !b.finished ? (
        <>
          <Card className="bg-[#16253D]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <p className="text-[12px] font-black text-white">{duck(b.player).name}</p>
                <div className="mt-1">
                  <Meter value={(b.playerHp / b.playerMaxHp) * 100} color="#62B58A" />
                </div>
              </div>
              <span className="text-[11px] font-black text-white/60">VS</span>
              <div className="flex-1 text-right">
                <p className="text-[12px] font-black text-white">{duck(b.opponent).name}</p>
                <div className="mt-1">
                  <Meter value={(b.opponentHp / b.opponentMaxHp) * 100} color="#F2815A" />
                </div>
              </div>
            </div>

            <div className="relative mt-3 h-[230px] overflow-hidden rounded-[18px] border-b-[6px] border-[#1F2B3C] bg-[#34455C]">
              <div className="absolute bottom-6" style={{ left: `${(b.opponentX / 320) * 100}%` }}>
                <DuckArt id={b.opponent} size={72} flip />
              </div>
              <div className="absolute bottom-6" style={{ left: `${(b.playerX / 320) * 100}%` }}>
                <DuckArt id={b.player} size={72} />
              </div>
              <p className="absolute bottom-2 w-full text-center text-[11px] font-extrabold text-[#DDE5F0]">
                {Math.abs(b.playerX - b.opponentX) <= 132 ? "In range — strike now!" : "Close the distance to hit."}
              </p>
            </div>

            <p className="mt-2 text-[11px] font-bold text-[#DDE5F0]">
              Energy {b.playerEnergy} · Cooldown {b.cooldown} · {b.difficulty} tier
            </p>
          </Card>

          <Card>
            <p className="text-[11px] font-black uppercase tracking-[1.6px] text-[#718096]">Battle log</p>
            <ul className="mt-1 space-y-0.5">
              {b.log.slice(-5).map((l, i) => (
                <li key={i} className="text-[12px] text-[#16253D]">
                  • {l}
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <button onClick={() => act("left")} className="rounded-[12px] bg-white py-3 text-[13px] font-black text-[#16253D] shadow active:scale-[0.98]">
                ◀ Left
              </button>
              <button onClick={() => act("right")} className="rounded-[12px] bg-white py-3 text-[13px] font-black text-[#16253D] shadow active:scale-[0.98]">
                Right ▶
              </button>
              <div className="flex gap-2">
                <button onClick={() => act("jump")} className="flex-1 rounded-[12px] bg-white py-3 text-[12px] font-black text-[#16253D] shadow active:scale-[0.98]">
                  Jump
                </button>
                <button onClick={() => act("block")} className="flex-1 rounded-[12px] bg-white py-3 text-[12px] font-black text-[#16253D] shadow active:scale-[0.98]">
                  Block
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => act("punch")} className="rounded-[12px] bg-[#9ED9F4] py-3 text-[13px] font-black text-[#16253D] shadow active:scale-[0.98]">
                Punch
              </button>
              <button onClick={() => act("kick")} className="rounded-[12px] bg-[#9ED9F4] py-3 text-[13px] font-black text-[#16253D] shadow active:scale-[0.98]">
                Kick
              </button>
              <button onClick={() => act("special")} className="rounded-[12px] bg-[#F8C84A] py-3 text-[13px] font-black text-[#16253D] shadow active:scale-[0.98]">
                Special ✦
              </button>
            </div>
          </div>
        </>
      ) : null}
    </Shell>
  );
}
