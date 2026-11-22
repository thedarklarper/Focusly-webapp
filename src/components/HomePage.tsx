"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame, duck } from "@/providers/GameProvider";
import { Button, Card, C, Header, Meter, Pill, SectionLabel, Shell } from "@/components/ui";
import { DuckArt } from "@/components/DuckArt";

export function HomePage() {
  const { state, action, focus } = useGame();
  const [tab, setTab] = useState<"time" | "ducks">("time");
  const [minutes, setMinutes] = useState(60);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const active = state.ownedDucks.find((o) => o.isActive) || state.ownedDucks[0];
  const ad = duck(active?.duckId || "prototype");

  const start = () => {
    setSeconds(minutes * 60);
    setRunning(true);
  };

  const cancel = () => {
    setRunning(false);
    setSeconds(0);
  };

  // Real countdown: tick down one second at a time and only settle rewards at 0:00.
  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      focus(minutes);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, seconds]);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <Shell>
      <Header
        eyebrow={`Focusly • day ${state.streak}`}
        title="Less scroll. More soul."
        right={
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#F8C84A]">
            <DuckArt id={ad.id} size={40} />
          </div>
        }
      />

      <div className="mb-4 flex rounded-[18px] bg-[#F1EBE0] p-1">
        <button
          onClick={() => setTab("time")}
          className={`flex-1 rounded-[14px] py-2.5 text-sm font-extrabold ${tab === "time" ? "bg-white text-[#16253D]" : "text-[#718096]"}`}
        >
          Screen time
        </button>
        <button
          onClick={() => setTab("ducks")}
          className={`flex-1 rounded-[14px] py-2.5 text-sm font-extrabold ${tab === "ducks" ? "bg-white text-[#16253D]" : "text-[#718096]"}`}
        >
          My ducks
        </button>
      </div>

      {tab === "time" ? (
        <>
          <Card className="flex min-h-[150px] items-center bg-[#9ED9F4]">
            <div className="flex-1">
              <Pill color={C.blue}>TODAY&apos;S POCKET</Pill>
              <p className="mt-2 text-[44px] font-black leading-none text-[#16253D]">
                {state.profile.screenTimeMinutes}
                <span className="text-lg"> min</span>
              </p>
              <p className="mt-1 text-[13px] text-[#16253D]/70">screen time collected this week</p>
            </div>
            <DuckArt id={ad.id} size={96} />
          </Card>

          <div className="mb-3.5 flex gap-3">
            <Card className="flex-1">
              <p className="text-[22px]">🍞</p>
              <p className="mt-1.5 text-2xl font-black text-[#16253D]">{state.profile.breadcrumbs}</p>
              <p className="text-[13px] text-[#718096]">Breadcrumbs</p>
            </Card>
            <Link href="/trophy" className="flex-1">
              <Card className="h-full">
                <p className="text-[22px]">🏆</p>
                <p className="mt-1.5 text-2xl font-black text-[#16253D]">{state.profile.trophies}</p>
                <p className="text-[13px] text-[#718096]">Trophies · open road</p>
              </Card>
            </Link>
          </div>

          <Card>
            <p className="text-[17px] font-black text-[#16253D]">Focus sprint</p>
            <p className="text-[13px] text-[#718096]">Choose a pocket of quiet. Your duck gets stronger too.</p>
            <div className="my-4 flex gap-2">
              {[30, 60, 90].map((m) => (
                <button
                  key={m}
                  onClick={() => !running && setMinutes(m)}
                  className={`rounded-[14px] px-4 py-2.5 font-black transition ${minutes === m ? "bg-[#16253D] text-white" : "bg-[#FFF9EF] text-[#16253D]"}`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <p className="mb-3 text-center text-[44px] font-black tabular-nums text-[#16253D]">{mmss}</p>
            <Button title={running ? "Cancel focus" : `Start ${minutes}-minute focus`} onClick={running ? cancel : start} secondary={running} />
            <p className="mt-2 text-[11px] text-[#718096]">The timer must run to 0:00 to claim rewards — cancelling gives none. Completing 60+ minutes grants bonus Breadcrumbs &amp; a Hatching Credit.</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[17px] font-black text-[#16253D]">Distraction shield</p>
                <p className="text-[13px] text-[#718096]">Simulated protection while you focus.</p>
              </div>
              <button
                onClick={() => action((s) => ({ ...s, protection: !s.protection }))}
                className={`relative h-8 w-14 rounded-full transition ${state.protection ? "bg-[#62B58A]" : "bg-[#D8D2C6]"}`}
                aria-label="Toggle distraction shield"
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${state.protection ? "left-7" : "left-1"}`} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {state.blacklist.map((b) => (
                <span key={b} className="rounded-full bg-[#F1EBE0] px-3 py-1 text-[12px] font-bold text-[#16253D]">
                  {b}
                </span>
              ))}
            </div>
          </Card>

          <SectionLabel>Recent rewards</SectionLabel>
          <Card>
            {state.recentRewards.length === 0 ? (
              <p className="text-[13px] text-[#718096]">No rewards yet — start a focus sprint.</p>
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
        </>
      ) : (
        <>
          <Card>
            <p className="text-[17px] font-black text-[#16253D]">Your flock</p>
            <p className="text-[13px] text-[#718096]">The ducks you own and their energy.</p>
          </Card>
          {state.ownedDucks.map((o) => {
            const d = duck(o.duckId);
            return (
              <Card key={o.id} className="flex items-center gap-3">
                <DuckArt id={o.duckId} size={54} />
                <div className="flex-1">
                  <p className="text-[15px] font-black text-[#16253D]">
                    {d.name} {o.isActive ? <span className="text-[11px] font-bold text-[#62B58A]">· active</span> : null}
                  </p>
                  <p className="mb-1 text-[12px] text-[#718096]">
                    Lv {o.level} · {o.isAsleep ? "sleeping" : `${o.energy}% energy`}
                  </p>
                  <Meter value={o.energy} color={o.energy > 30 ? C.green : C.orange} />
                </div>
              </Card>
            );
          })}
          <Link
            href="/ducks"
            className="mt-2 block w-full rounded-[18px] bg-[#9ED9F4] py-[15px] text-center text-[15px] font-black text-[#16253D] active:scale-[0.98]"
          >
            Manage flock & pick active duck
          </Link>
        </>
      )}
    </Shell>
  );
}
