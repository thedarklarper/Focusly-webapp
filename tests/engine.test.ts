import { describe, it, expect } from "vitest";
import {
  starterState,
  rewardFocus,
  distraction,
  hatch,
  levelFor,
  statsFor,
  offlineBreadcrumbs,
  claimMilestone,
  TROPHY_REWARDS,
} from "@/game/engine";
import { GameState, SyncEvent } from "@/game/types";
import { DUCKS, getDuck } from "@/data/ducks";

const base = starterState();

describe("starterState", () => {
  it("gives the default flock and resources", () => {
    expect(base.profile.breadcrumbs).toBe(420);
    expect(base.profile.hatchingCredits).toBe(2);
    expect(base.ownedDucks).toHaveLength(1);
    expect(base.ownedDucks[0].duckId).toBe("prototype");
    expect(base.focus.running).toBe(false);
  });
});

describe("rewardFocus", () => {
  it("grants breadcrumbs, credits and screen time for 60 minutes", () => {
    const next = rewardFocus(base, 60);
    expect(next.profile.breadcrumbs).toBe(base.profile.breadcrumbs + 102);
    expect(next.profile.hatchingCredits).toBe(base.profile.hatchingCredits + 1);
    expect(next.profile.screenTimeMinutes).toBe(base.profile.screenTimeMinutes + 60);
    expect(next.outbox).toHaveLength(1);
    expect(next.outbox[0].kind).toBe("focus");
    const focusEvent = next.outbox.find((e: SyncEvent) => e.kind === "focus") as Extract<SyncEvent, { kind: "focus" }>;
    expect(focusEvent.duration_minutes).toBe(60);
    expect(next.sync.pending).toBe(base.sync.pending + 1);
  });

  it("grants a smaller reward under 60 minutes", () => {
    const next = rewardFocus(base, 30);
    expect(next.profile.breadcrumbs).toBe(base.profile.breadcrumbs + 1);
    expect((next.outbox[0] as Extract<SyncEvent, { kind: "focus" }>).hatching_credits_earned).toBe(0);
  });

  it("never reduces breadcrumbs below zero", () => {
    const next = rewardFocus({ ...base, profile: { ...base.profile, breadcrumbs: 0 } }, 30);
    expect(next.profile.breadcrumbs).toBeGreaterThanOrEqual(0);
  });
});

describe("distraction", () => {
  it("charges breadcrumbs and drains active duck energy", () => {
    const next = distraction(base, 2);
    expect(next.profile.breadcrumbs).toBe(Math.max(0, base.profile.breadcrumbs - 10));
    const active = next.ownedDucks.find((o) => o.isActive)!;
    expect(active.energy).toBeLessThan(100);
  });
});

describe("hatch", () => {
  it("refuses without breadcrumbs or credits", () => {
    const poor: GameState = { ...base, profile: { ...base.profile, breadcrumbs: 0, hatchingCredits: 0 } };
    const { state, duck } = hatch(poor);
    expect(duck).toBeNull();
    expect(state).toBe(poor);
  });

  it("produces a duck from a legal roll and records a transaction", () => {
    const rich: GameState = { ...base, profile: { ...base.profile, breadcrumbs: 1000, hatchingCredits: 3 } };
    const { state, duck } = hatch(rich);
    expect(duck).not.toBeNull();
    expect(DUCKS.some((d) => d.id === duck!.id)).toBe(true);
    expect(state.profile.breadcrumbs).toBe(650);
    expect(state.profile.hatchingCredits).toBe(2);
    const tx = state.outbox[state.outbox.length - 1] as Extract<SyncEvent, { kind: "transaction" }>;
    expect(tx.kind).toBe("transaction");
    expect(tx.type).toBe("hatch");
  });

  it("hatched duck can become active and gain levels", () => {
    const rich: GameState = { ...base, profile: { ...base.profile, breadcrumbs: 1000, hatchingCredits: 3 } };
    const { duck } = hatch(rich);
    const d = duck!;
    const o = { id: `local-${d.id}`, duckId: d.id, level: 3, xp: 260, energy: 80, isActive: true, isAsleep: false };
    expect(levelFor(o)).toBe(3);
    expect(statsFor(o, d).hp).toBe(getDuck(d.id).base_hp + 24);
  });
});

describe("claimMilestone", () => {
  it("rejects unearned milestones and grants earned ones once", () => {
    const first = TROPHY_REWARDS[0];
    const below: GameState = { ...base, profile: { ...base.profile, trophies: first.threshold - 1 } };
    expect(claimMilestone(below, first).claimedMilestones).not.toContain(first.threshold);

    const earned: GameState = { ...base, profile: { ...base.profile, trophies: first.threshold } };
    const once = claimMilestone(earned, first);
    expect(once.claimedMilestones).toContain(first.threshold);
    const twice = claimMilestone(once, first);
    expect(twice.claimedMilestones.filter((t) => t === first.threshold)).toHaveLength(1);
  });

  it("every trophy reward threshold is claimable", () => {
    for (const reward of TROPHY_REWARDS) {
      const s: GameState = { ...base, profile: { ...base.profile, trophies: reward.threshold } };
      expect(claimMilestone(s, reward).claimedMilestones).toContain(reward.threshold);
    }
  });
});

describe("offlineBreadcrumbs", () => {
  it("accrues one breadcrumb per 30 minutes offline", () => {
    expect(offlineBreadcrumbs({ ...base, lastEarnedAt: 0 }, 1_800_000)).toBe(1);
    expect(offlineBreadcrumbs({ ...base, lastEarnedAt: 0 }, 5_400_000)).toBe(3);
  });
});

describe("statsFor", () => {
  it("scales stats per level", () => {
    const d = getDuck("prototype");
    const lvl1 = statsFor({ id: "x", duckId: "prototype", level: 1, xp: 0, energy: 100, isActive: true, isAsleep: false }, d);
    const lvl3 = statsFor({ id: "x", duckId: "prototype", level: 3, xp: 200, energy: 100, isActive: true, isAsleep: false }, d);
    expect(lvl3.hp).toBe(lvl1.hp + 24);
    expect(lvl3.attack).toBe(lvl1.attack + 8);
    expect(lvl3.defense).toBe(lvl1.defense + 6);
    expect(lvl3.speed).toBe(lvl1.speed + 4);
  });
});
