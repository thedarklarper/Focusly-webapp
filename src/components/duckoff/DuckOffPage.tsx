"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useGame, duck, DUCKS } from "@/providers/GameProvider";
import { startBattle, statsFor, settleFight } from "@/game/engine";
import { DuckOffCanvas, type DuckOffCanvasProps } from "@/components/duckoff/DuckOffCanvas";
import { ControlDeck } from "@/components/duckoff/ControlDeck";
import { Button, Card, Header, Pill, Shell } from "@/components/ui";
import { DuckArt } from "@/components/DuckArt";
import { OwnedDuck } from "@/game/types";
import { DIFFICULTY_LABEL, type Difficulty, type FighterSetup, type FightOutcome } from "@/game/duckoff/types";
import type { InputBus } from "@/game/duckoff/input";

/** Trophies-based tier labels reuse the exact strings the battle results print. */
const trophiesToDifficulty = (trophies: number): Difficulty => (trophies >= 150 ? "hard" : trophies >= 75 ? "medium" : "easy");

const DupSetup = memo(function DupSetup({
  opponentId,
  setOpponentId,
  canStart,
  onStart,
  activeName,
  title,
}: {
  opponentId: string;
  setOpponentId: (id: string) => void;
  canStart: boolean;
  onStart: () => void;
  activeName?: string;
  title: string;
}) {
  return (
    <Card>
      <p className="text-[17px] font-black text-[#16253D]">Choose your opponent</p>
      <p className="text-[13px] text-[#718096]">Your active duck is {activeName ?? "—"}.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DUCKS.filter((d) => d.id !== activeName).map((d) => (
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
        <Button title={canStart ? title : "Need stamina / rested duck"} onClick={onStart} disabled={!canStart} />
      </div>
    </Card>
  );
});

export function DuckOffPage() {
  const { state, action, ready, account } = useGame();
  const active = state.ownedDucks.find((o) => o.isActive) || state.ownedDucks[0];

  const [opponentId, setOpponentId] = useState<string>(DUCKS.find((d) => d.id !== active?.duckId)?.id || "pirate");
  const [brawlState, setBrawlState] = useState<"idle" | "fighting" | "done">("idle");
  const brawlAudioRef = useRef<HTMLAudioElement>(null);

  // Fight music: plays ONLY while a Street Brawl is actually running. The
  // "Enter the arena" tap is the user gesture that unlocks playback on iOS;
  // a first-pointerdown retry covers any race with the gesture window.
  useEffect(() => {
    const a = brawlAudioRef.current;
    if (!a) return;
    if (brawlState === "fighting") {
      a.volume = 0.4;
      const tryPlay = () => a.play().catch(() => {});
      tryPlay();
      const unlock = () => tryPlay();
      window.addEventListener("pointerdown", unlock, { once: true });
      return () => window.removeEventListener("pointerdown", unlock);
    }
    a.pause();
    a.currentTime = 0;
  }, [brawlState]);
  const [brawlOutcome, setBrawlOutcome] = useState<FightOutcome | null>(null);
  const [inputBus, setInputBus] = useState<InputBus | null>(null);

  // dev test account
  const isDevAccount = account?.id === "chris";

  const canStart = (isDevAccount || state.profile.stamina >= 20) && !!active && !active.isAsleep && active.energy > 0;
  const activeName = active ? duck(active.duckId).name : undefined;
  const difficulty = trophiesToDifficulty(state.profile.trophies);

  // dev test account: keep stamina and breadcrumbs topped up so the wallet
  // never depletes (engine guards and displays then behave as infinite).
  useEffect(() => {
    if (!isDevAccount) return;
    if (state.profile.stamina < 1000 || state.profile.breadcrumbs < 1000) {
      action((s) => ({
        ...s,
        profile: {
          ...s.profile,
          stamina: Math.max(s.profile.stamina, 9999),
          breadcrumbs: Math.max(s.profile.breadcrumbs, 9999),
        },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDevAccount, state.profile.stamina, state.profile.breadcrumbs]);

  const startBrawl = () => {
    if (!canStart || brawlState === "fighting") return;
    // dev test account: startBattle guards on stamina >= 20 — force it open.
    action((s) => startBattle(isDevAccount ? { ...s, profile: { ...s.profile, stamina: Math.max(s.profile.stamina, 9999) } } : s, opponentId));
    setBrawlOutcome(null);
    setBrawlState("fighting");
  };

  const finishBrawl = (outcome: FightOutcome) => {
    setBrawlOutcome(outcome);
    setBrawlState("done");
    if (!outcome || !active) return;
    action((s) => settleFight(s, { playerDuckId: active.duckId, opponentDuckId: opponentId, outcome }));
  };

  // Headless playtest hook: /duck-off?autostart=1 boots the brawl straight
  // away at page load. Stamina/duck checks still apply; nothing is bypassed.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("autostart") !== "1") return;
    if (ready && canStart && brawlState === "idle") startBrawl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, canStart, brawlState]);

  const brawlMatch: DuckOffCanvasProps["match"] | null =
    active && brawlState === "fighting"
      ? {
          player: setupFor(active, duck(active.duckId)),
          opponent: setupFor({ level: 1, xp: 0 } as OwnedDuck, duck(opponentId)),
          difficulty,
          seed: 1,
        }
      : null;

  return (
    <Shell>
      <Header eyebrow="Duck Off" title="Battle for the pond." />

      <Card className="flex items-center justify-between bg-[#9ED9F4]">
        <div>
          <Pill color="#FFFFFF">STAMINA</Pill>
          <p className="mt-1 text-[28px] font-black leading-none text-[#16253D]">
            {isDevAccount ? "∞ TEST MODE" : state.profile.stamina}
          </p>
          <p className="text-[12px] text-[#16253D]/70">A battle costs 20 stamina.</p>
        </div>
        <span className="text-4xl">⚡</span>
      </Card>

      {brawlState === "done" && brawlOutcome ? (
        <Card className="bg-[#16253D]">
          <p className="text-[28px] font-black text-[#F8C84A]">{brawlOutcome.result === "win" ? "Victory!" : "Good try!"}</p>
          <p className="mt-1 text-[13px] text-white/80">
            {brawlOutcome.result === "win" ? "+75 Breadcrumbs · +12 trophies · +15 min" : "+20 Breadcrumbs · +2 trophies · +5 min"}
            {" · Round wins "} {brawlOutcome.rounds[0]}-{brawlOutcome.rounds[1]}
          </p>
          <p className="mt-1 text-[12px] text-white/60">Player HP {brawlOutcome.playerHp}/{brawlOutcome.playerMaxHp} · Difficulty {DIFFICULTY_LABEL[difficulty]}.</p>
        </Card>
      ) : null}

      {brawlState === "idle" || brawlState === "done" ? (
        <DupSetup
          opponentId={opponentId}
          setOpponentId={setOpponentId}
          canStart={canStart}
          onStart={startBrawl}
          activeName={activeName}
          title={isDevAccount ? "Enter the arena" : "Enter the arena (20 stamina)"}
        />
      ) : null}

      {brawlState === "fighting" && brawlMatch ? (
        <>
          {/* Fight track — plays only while the brawl runs; the site loop is paused. */}
          <audio ref={brawlAudioRef} src="/audio/duck-off-brawl.mp3" loop preload="auto" aria-hidden="true" />
          <DuckOffCanvas
            match={brawlMatch}
            playerSprite={duck(active.duckId).sprite}
            opponentSprite={duck(opponentId).sprite}
            onFinish={finishBrawl}
            onInputBus={setInputBus}
          />
          <div className="mt-3 rounded-[12px] bg-[#FFF9EF] p-2.5">
            <ControlDeck input={inputBus} enabled specialReady={!!inputBus && inputBus.current.special} />
          </div>
          <p className="mt-2 text-[11px] font-bold text-[#718096]">
            Hold to fight · Special spends 100 meter · Difficulty {DIFFICULTY_LABEL[difficulty]} · Rematch drains 20 stamina.
          </p>
        </>
      ) : null}
    </Shell>
  );
}

/** Map an engine OwnedDuck + Duck into the Phaser FighterSetup shape. */
function setupFor(owned: OwnedDuck, d: ReturnType<typeof duck>): FighterSetup {
  const s = statsFor(owned, d);
  return {
    duckId: d.id,
    name: d.name,
    stats: {
      maxHp: s.hp,
      attack: s.attack,
      defense: s.defense,
      speed: s.speed,
    },
  };
}

