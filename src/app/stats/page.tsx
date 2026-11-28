"use client";

import { useGame } from "@/providers/GameProvider";
import { Card, Header, Shell } from "@/components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StatsPage() {
  const { state } = useGame();

  const byDay = new Map<string, number>();
  for (const entry of state.focusLog) {
    byDay.set(entry.date, (byDay.get(entry.date) ?? 0) + entry.minutes);
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    return { date, label: WEEKDAYS[d.getDay()], minutes: byDay.get(date) ?? 0 };
  });

  const maxMinutes = Math.max(1, ...days.map((d) => d.minutes));
  const weekTotal = days.reduce((sum, d) => sum + d.minutes, 0);
  const battles = state.outbox.filter((e) => e.kind === "battle");
  const wins = battles.filter((e) => e.kind === "battle" && e.result === "win").length;
  const losses = battles.length - wins;

  return (
    <Shell>
      <Header eyebrow="Focus history" title="Your week on the pond." />

      <p className="mb-3.5 text-[12px] font-bold text-[#5C6B7F]">
        Local record only — this stays on your device.
      </p>

      <Card>
        <p className="text-[11px] font-black uppercase tracking-[1.6px] text-[#5C6B7F]">This week's focus</p>
        <p className="mt-1 text-[44px] font-black leading-none text-[#16253D]">
          {weekTotal} <span className="text-[17px] tracking-[-0.3px]">min</span>
        </p>
        <div className="mt-4 flex h-[120px] items-end gap-2">
          {days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <p className="text-[10px] font-black text-[#5C6B7F]">{d.minutes > 0 ? d.minutes : ""}</p>
              <div
                className="w-full rounded-[14px] transition-all duration-300"
                style={{
                  height: `${Math.max(4, (d.minutes / maxMinutes) * 88)}px`,
                  backgroundColor: d.minutes > 0 ? "#62B58A" : "#EEF0ED",
                }}
              />
              <p className="text-[11px] font-black text-[#16253D]">{d.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-3.5 grid grid-cols-2 gap-3.5">
        <Card className="mb-0">
          <p className="text-[11px] font-black uppercase tracking-[1.4px] text-[#5C6B7F]">Sprints done</p>
          <p className="mt-1 text-[32px] font-black leading-none text-[#16253D]">{state.focusLog.length}</p>
          <p className="mt-1 text-[12px] font-bold text-[#5C6B7F]">focus sessions logged</p>
        </Card>
        <Card className="mb-0">
          <p className="text-[11px] font-black uppercase tracking-[1.4px] text-[#5C6B7F]">Battle record</p>
          <p className="mt-1 text-[32px] font-black leading-none text-[#62B58A]">
            {wins}<span className="text-[17px] text-[#5C6B7F]"> W</span>
            <span className="text-[17px] text-[#5C6B7F]"> · </span>
            <span className="text-[#F2815A]">{losses}</span><span className="text-[17px] text-[#5C6B7F]"> L</span>
          </p>
          <p className="mt-1 text-[12px] font-bold text-[#5C6B7F]">Duck Off matches</p>
        </Card>
      </div>
    </Shell>
  );
}
