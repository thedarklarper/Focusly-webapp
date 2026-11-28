import { BattleAction, Duck, GameState, OwnedDuck } from "@/game/types";
import { DUCKS, getDuck } from "@/data/ducks";

export const starterState = (): GameState => ({
  profile: { id: "local", username: "focus friend", breadcrumbs: 420, hatchingCredits: 2, trophies: 0, screenTimeMinutes: 45, stamina: 200, activeDuckId: "prototype" },
  ownedDucks: [{ id: "local-prototype", duckId: "prototype", level: 1, xp: 0, energy: 100, isActive: true, isAsleep: false }],
  focus: { running: false, duration: 60 },
  // Avoid Date.now() during server prerender (initial useState value is computed server-side).
  lastEarnedAt: typeof window === "undefined" ? 0 : Date.now(),
  streak: 3,
  lastFocusDay: null,
  eggs: 0,
  gear: {},
  claimedMilestones: [],
  recentRewards: ["Starter flock joined", "+420 Breadcrumbs ready"],
  outbox: [],
  focusLog: [],
  sync: { pending: 0, status: "offline" },
  focusSession: null,
});

export const startFocus = (s: GameState, minutes: number): GameState =>
  s.focusSession ? s : { ...s, focusSession: { startedAt: Date.now(), durationMinutes: minutes } };

export const cancelFocus = (s: GameState): GameState => (s.focusSession ? { ...s, focusSession: null } : s);

/**
 * Settle a running focus session. Idempotent: a session that is missing, or
 * already settled (cleared), leaves state untouched. Rewards only fire once —
 * on completion the session is cleared, so a second call is a no-op.
 */
export const settleFocus = (s: GameState, now = Date.now()): GameState => {
  const session = s.focusSession;
  if (!session) return s;
  const elapsedMs = now - session.startedAt;
  const totalMs = session.durationMinutes * 60000;
  if (elapsedMs < totalMs) return s;
  return rewardFocus({ ...s, focusSession: null }, session.durationMinutes);
};

export const focusRemainingMs = (s: GameState, now = Date.now()): number => {
  const session = s.focusSession;
  if (!session) return 0;
  return Math.max(0, session.durationMinutes * 60000 - (now - session.startedAt));
};

export const levelFor = (o: OwnedDuck) => Math.max(1, Math.floor(o.xp / 100) + 1);

export const statsFor = (o: OwnedDuck, d: Duck) => ({
  hp: d.base_hp + (o.level - 1) * 12,
  attack: d.base_attack + (o.level - 1) * 4,
  defense: d.base_defense + (o.level - 1) * 3,
  speed: d.base_speed + (o.level - 1) * 2,
});

export const offlineBreadcrumbs = (s: GameState, now = Date.now()) => Math.max(0, Math.floor((now - s.lastEarnedAt) / 1800000));

export const todayKey = (now = new Date()): string => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

export const dayDiff = (a: string, b: string): number => Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000);

export const rewardFocus = (s: GameState, minutes: number): GameState => {
  const active = s.ownedDucks.find((o) => o.isActive);
  const today = todayKey();
  const streak = s.lastFocusDay && dayDiff(s.lastFocusDay, today) === 0 ? s.streak : s.lastFocusDay && dayDiff(s.lastFocusDay, today) === 1 ? s.streak + 1 : 1;
  const base = Math.max(1, Math.floor(minutes / 30));
  const gain = minutes >= 60 ? base + 100 : base;
  const next: GameState = {
    ...s,
    profile: { ...s.profile, breadcrumbs: s.profile.breadcrumbs + gain, hatchingCredits: s.profile.hatchingCredits + (minutes >= 60 ? 1 : 0), screenTimeMinutes: s.profile.screenTimeMinutes + minutes },
    lastEarnedAt: Date.now(),
    streak,
    lastFocusDay: today,
    recentRewards: [`+${gain} Breadcrumbs`, ...(minutes >= 60 ? ["+1 Hatching Credit", "Duck XP boost"] : []), ...s.recentRewards].slice(0, 5),
    outbox: [...s.outbox, { kind: "focus", duration_minutes: minutes, breadcrumbs_earned: gain, hatching_credits_earned: minutes >= 60 ? 1 : 0, screen_time_minutes_earned: minutes }],
    focusLog: [...s.focusLog, { date: new Date().toISOString().slice(0, 10), minutes }].slice(-90),
    sync: { ...s.sync, pending: s.sync.pending + 1 },
  };
  if (active) next.ownedDucks = s.ownedDucks.map((o) => (o.id === active.id ? { ...o, xp: o.xp + (minutes >= 60 ? 50 : 10), level: levelFor({ ...o, xp: o.xp + (minutes >= 60 ? 50 : 10) }) } : o));
  return next;
};

export const distraction = (s: GameState, minutes = 1): GameState => {
  const cost = 5 * minutes;
  return {
    ...s,
    profile: { ...s.profile, breadcrumbs: Math.max(0, s.profile.breadcrumbs - cost) },
    ownedDucks: s.ownedDucks.map((o) => (o.isActive ? { ...o, energy: Math.max(0, o.energy - minutes), isAsleep: o.energy - minutes <= 0, sleepUntil: o.energy - minutes <= 0 ? Date.now() + 43200000 : o.sleepUntil } : o)),
    recentRewards: [`-${cost} Breadcrumbs distraction penalty`, ...s.recentRewards].slice(0, 5),
    outbox: [...s.outbox, { kind: "transaction", type: "distraction", breadcrumbs_change: -cost, hatching_credits_change: 0, screen_time_minutes_change: 0, trophies_change: 0, description: `${minutes} minute distraction report` }],
    sync: { ...s.sync, pending: s.sync.pending + 1 },
  };
};

export const hatch = (s: GameState): { state: GameState; duck: Duck | null } => {
  if (s.profile.breadcrumbs < 350 || s.profile.hatchingCredits < 1) return { state: s, duck: null };
  const roll = Math.random();
  const rarity = roll < 0.58 ? "Common" : roll < 0.86 ? "Rare" : roll < 0.98 ? "Epic" : "Legendary";
  const pool = DUCKS.filter((d) => d.rarity === rarity);
  const d = pool[Math.floor(Math.random() * pool.length)];
  const owned: OwnedDuck = { id: `local-${d.id}-${Date.now()}`, duckId: d.id, level: 1, xp: 0, energy: 100, isActive: false, isAsleep: false };
  return {
    duck: d,
    state: {
      ...s,
      profile: { ...s.profile, breadcrumbs: s.profile.breadcrumbs - 350, hatchingCredits: s.profile.hatchingCredits - 1 },
      ownedDucks: [...s.ownedDucks, owned],
      recentRewards: [`${d.name} hatched!`, ...s.recentRewards].slice(0, 5),
      outbox: [...s.outbox, { kind: "transaction", type: "hatch", breadcrumbs_change: -350, hatching_credits_change: -1, screen_time_minutes_change: 0, trophies_change: 0, description: `${d.name} egg hatched` }],
      sync: { ...s.sync, pending: s.sync.pending + 1 },
    },
  };
};

const difficultyFor = (trophies: number): "Rookie" | "Street" | "Champion" => (trophies >= 150 ? "Champion" : trophies >= 75 ? "Street" : "Rookie");

export const startBattle = (s: GameState, opponentId?: string): GameState => {
  const active = s.ownedDucks.find((o) => o.isActive);
  if (!active || active.isAsleep || active.energy <= 0 || s.profile.stamina < 20 || (s.battle && !s.battle.finished)) return s;
  const opponent = opponentId || DUCKS.filter((d) => d.id !== active.duckId)[Math.floor(Math.random() * (DUCKS.length - 1))].id;
  const pd = statsFor(active, getDuck(active.duckId));
  const od = statsFor({ level: 1, xp: 0 } as OwnedDuck, getDuck(opponent));
  const difficulty = difficultyFor(s.profile.trophies);
  return {
    ...s,
    profile: { ...s.profile, stamina: s.profile.stamina - 20 },
    battle: {
      player: active.duckId,
      opponent,
      playerHp: pd.hp,
      opponentHp: od.hp,
      playerMaxHp: pd.hp,
      opponentMaxHp: od.hp,
      playerEnergy: 100,
      opponentEnergy: 100,
      playerX: 68,
      opponentX: 252,
      playerBlocking: false,
      opponentBlocking: false,
      playerJumping: false,
      opponentJumping: false,
      cooldown: 0,
      turn: "player",
      log: [`${difficulty} tier · The street crowd goes wild!`, `${getDuck(opponent).name} steps into range.`],
      finished: false,
      difficulty,
      combo: [],
      playerDamageDealt: 0,
      opponentDamageDealt: 0,
    },
    sync: { ...s.sync, pending: s.sync.pending + 1 },
  };
};

const inRange = (a: number, b: number) => Math.abs(a - b) <= 132;

const rollAiAction = (b: NonNullable<GameState["battle"]>): BattleAction => {
  const r = Math.random();
  if (b.opponentEnergy >= 30 && r < 0.18) return "special";
  if (r < 0.3) return "block";
  if (r < 0.48) return "left";
  if (r < 0.58) return "right";
  if (r < 0.68) return "jump";
  return r < 0.84 ? "punch" : "kick";
};

const damageFor = (action: BattleAction, attack: number, defense: number, energy: number) =>
  action === "punch" ? Math.max(4, attack * 0.72 - defense * 0.18) : action === "kick" ? Math.max(8, attack * 1.08 - defense * 0.2) : action === "special" ? Math.max(16, attack * 1.5 - defense * 0.15 + energy * 0.08) : 0;


export const fightAction = (s: GameState, action: BattleAction): GameState => {
  const b = s.battle;
  const player = s.ownedDucks.find((o) => o.isActive);
  if (!b || b.finished || !player) return s;
  const pd = statsFor(player, getDuck(b.player));
  const od = statsFor({ level: 1, xp: 0 } as OwnedDuck, getDuck(b.opponent));
  let next = {
    ...b,
    lastAction: action,
    hitFlash: undefined as "player" | "opponent" | undefined,
    playerBlocking: action === "block",
    playerJumping: action === "jump",
    opponentBlocking: false,
    opponentJumping: false,
    combo: action === "punch" ? [...b.combo, action].slice(-3) : action === "kick" ? [...b.combo, action].slice(-3) : [],
  };
  if (action === "left") next.playerX = Math.max(28, b.playerX - 28);
  else if (action === "right") next.playerX = Math.min(160, b.playerX + 28);
  else if (action === "special" && b.cooldown > 0) next.log = [...b.log, `Special recharging for ${b.cooldown} more turn${b.cooldown === 1 ? "" : "s"}.`];
  else if (action === "special" && b.playerEnergy < 30) next.log = [...b.log, "Not enough energy for that ability."];
  else if (["punch", "kick", "special"].includes(action)) {
    const comboBoost = next.combo.join("+") === "punch+punch+kick" ? 12 : 0;
    const cost = action === "special" ? 30 : action === "kick" ? 5 : 2;
    const raw = damageFor(action, pd.attack, od.defense, b.playerEnergy) + comboBoost;
    next.playerEnergy = Math.max(0, b.playerEnergy - cost);
    if (action === "special") next.cooldown = 3;
    if (inRange(b.playerX, b.opponentX)) {
      const damage = Math.round(raw);
      next.opponentHp = Math.max(0, b.opponentHp - damage);
      next.playerDamageDealt += damage;
      next.hitFlash = "opponent";
      next.log = [...b.log, `${action === "special" ? getDuck(b.player).ability : action === "punch" ? "Punch" : "Kick"} hits for ${damage}${comboBoost ? " · combo!" : ""}.`];
    } else next.log = [...b.log, `${action === "special" ? "Special" : action} whiffs — close the distance.`];
  }
  if (next.opponentHp <= 0) return settleBattle(s, { ...next, finished: true, result: "win", log: [...next.log, "You win the Duck Off!"] });
  const ai = rollAiAction(next);
  let aiX = next.opponentX;
  if (ai === "left") aiX = Math.max(190, next.opponentX - 24);
  if (ai === "right") aiX = Math.min(300, next.opponentX + 24);
  const aiBlocking = ai === "block";
  const aiJumping = ai === "jump";
  let playerHp = next.playerHp;
  let playerEnergy = next.playerEnergy;
  let opponentEnergy = next.opponentEnergy;
  let opponentDamage = 0;
  if (["punch", "kick", "special"].includes(ai) && inRange(next.playerX, aiX)) {
    const cost = ai === "special" ? 30 : ai === "kick" ? 5 : 2;
    if (ai !== "special" || opponentEnergy >= 30) {
      const raw = damageFor(ai, od.attack, pd.defense, opponentEnergy);
      opponentEnergy = Math.max(0, opponentEnergy - cost);
      if (!next.playerJumping) {
        const damage = Math.max(1, Math.round(raw * (next.playerBlocking ? 0.35 : 1)));
        playerHp = Math.max(0, playerHp - damage);
        opponentDamage = damage;
      }
    }
  }
  const logs = opponentDamage
    ? [...next.log, `${getDuck(b.opponent).name} ${ai}s for ${opponentDamage}.`]
    : [...next.log, ai === "block" ? `${getDuck(b.opponent).name} blocks.` : `${getDuck(b.opponent).name} ${ai === "jump" ? "jumps" : "repositions"}.`];
  next = { ...next, opponentX: aiX, opponentBlocking: aiBlocking, opponentJumping: aiJumping, playerHp, opponentEnergy, playerEnergy, opponentDamageDealt: b.opponentDamageDealt + opponentDamage, log: logs.slice(-6), turn: "player", cooldown: Math.max(0, next.cooldown - 1) };
  if (playerHp <= 0) return settleBattle(s, { ...next, finished: true, result: "loss", log: [...next.log, "Your duck needs a rest."] });
  return { ...s, battle: next };
}

/**
 * Reward adapter for the Phaser Street Brawl mode.
 *
 * `FightOutcome` comes from `src/game/duckoff/types.ts`; the reward shape
 * (breadcrumbs, trophies, XP, outbox entries) mirrors settleBattle exactly, so
 * the Duck Off page, the trophy road, the outbox and the Supabase sync keep
 * working unchanged regardless of which mode was played.
 */
export const settleFight = (s: GameState, brawl: { playerDuckId: string; opponentDuckId: string; outcome: FightOutcomeLike }): GameState => {
  const win = brawl.outcome.result === "win";
  const [pRounds, oRounds] = brawl.outcome.rounds;
  const reward = win ? 75 : 20;
  const xp = win ? 40 : 15;
  const opponentName = getDuck(brawl.opponentDuckId).name;
  return {
    ...s,
    // Mark the shared battle slot finished, exactly like settleBattle does, so
    // startBattle's "battle in progress" guard lifts and the next brawl can
    // charge its 20 stamina again.
    battle: s.battle ? { ...s.battle, finished: true, result: win ? ("win" as const) : ("loss" as const) } : s.battle,
    profile: {
      ...s.profile,
      trophies: s.profile.trophies + (win ? 12 : 2),
      breadcrumbs: s.profile.breadcrumbs + reward,
      screenTimeMinutes: s.profile.screenTimeMinutes + (win ? 15 : 5),
    },
    ownedDucks: s.ownedDucks.map((o) => (o.isActive ? { ...o, xp: o.xp + xp, level: levelFor({ ...o, xp: o.xp + xp }), energy: Math.max(0, o.energy - 3) } : o)),
    recentRewards: [
      win
        ? `Street Brawl win! +${reward} Breadcrumbs (${pRounds}-${oRounds} vs ${opponentName})`
        : `Street Brawl good try! +${reward} Breadcrumbs (${pRounds}-${oRounds} vs ${opponentName})`,
      ...s.recentRewards,
    ].slice(0, 5),
    outbox: [
      ...s.outbox,
      {
        kind: "transaction",
        type: win ? "street_brawl_win" : "street_brawl_loss",
        breadcrumbs_change: reward,
        hatching_credits_change: 0,
        screen_time_minutes_change: win ? 15 : 5,
        trophies_change: win ? 12 : 2,
        description: win ? "Won Duck Off: Street Brawl" : "Street Brawl consolation",
      } as const,
      {
        kind: "battle",
        playerDuckId: brawl.playerDuckId,
        opponentDuckId: brawl.opponentDuckId,
        result: win ? "win" : "loss",
        trophies_earned: win ? 12 : 2,
        breadcrumbs_earned: reward,
        screen_time_minutes_earned: win ? 15 : 5,
      } as const,
    ],
    sync: { ...s.sync, pending: s.sync.pending + 1 },
  };
};

/**
 * Structural shape of the Phaser match outcome. Duplicated here so engine.ts
 * does not import the duckoff types module and risk tangling client/server
 * bundles; it stays assignable to the real FightOutcome as long as fields match.
 */
type FightOutcomeLike = {
  result: "win" | "loss";
  rounds: [number, number];
  playerHp: number;
  opponentHp: number;
  playerMaxHp: number;
  opponentMaxHp: number;
};;


const settleBattle = (s: GameState, b: NonNullable<GameState["battle"]>): GameState => {
  const win = b.result === "win";
  const reward = win ? 75 : 20;
  const xp = win ? 40 : 15;
  return {
    ...s,
    battle: b,
    profile: { ...s.profile, trophies: s.profile.trophies + (win ? 12 : 2), breadcrumbs: s.profile.breadcrumbs + reward, screenTimeMinutes: s.profile.screenTimeMinutes + (win ? 15 : 5) },
    ownedDucks: s.ownedDucks.map((o) => (o.isActive ? { ...o, xp: o.xp + xp, level: levelFor({ ...o, xp: o.xp + xp }), energy: Math.max(0, o.energy - 3) } : o)),
    recentRewards: [win ? `Win! +${reward} Breadcrumbs` : `Good try! +${reward} Breadcrumbs`, ...s.recentRewards].slice(0, 5),
    outbox: [
      ...s.outbox,
      { kind: "transaction", type: win ? "battle_win" : "battle_loss", breadcrumbs_change: reward, hatching_credits_change: 0, screen_time_minutes_change: win ? 15 : 5, trophies_change: win ? 12 : 2, description: win ? "Won Duck Off" : "Duck Off consolation" },
      { kind: "battle", playerDuckId: b.player, opponentDuckId: b.opponent, result: win ? "win" : "loss", trophies_earned: win ? 12 : 2, breadcrumbs_earned: reward, screen_time_minutes_earned: win ? 15 : 5 },
    ],
    sync: { ...s.sync, pending: s.sync.pending + 1 },
  };
};

export type TrophyReward = { threshold: number; title: string; description: string; breadcrumbs?: number; hatchingCredits?: number; eggs?: number; screenTimeMinutes?: number; duckId?: string };

export const TROPHY_REWARDS: TrophyReward[] = [
  { threshold: 25, title: "First splash", description: "A warm-up reward for showing up.", breadcrumbs: 100, screenTimeMinutes: 10 },
  { threshold: 75, title: "Street regular", description: "Your flock knows your focus face.", hatchingCredits: 1, eggs: 1 },
  { threshold: 150, title: "Champion pond", description: "Unlock a legendary companion.", duckId: "war", breadcrumbs: 250 },
  { threshold: 250, title: "Golden hour", description: "A full focus hour for your future self.", screenTimeMinutes: 60, hatchingCredits: 2 },
  { threshold: 400, title: "Pond keeper", description: "Your flock eats well tonight.", breadcrumbs: 350, eggs: 1 },
  { threshold: 600, title: "Quiet mornings", description: "Focus is starting to feel like a habit.", screenTimeMinutes: 90, breadcrumbs: 200 },
  { threshold: 900, title: "Duck of steel", description: "A second legendary joins the pond.", duckId: "war", hatchingCredits: 2 },
  { threshold: 1400, title: "Long game", description: "You showed up for the whole road. The pond is yours.", breadcrumbs: 600, screenTimeMinutes: 120, hatchingCredits: 3 },
];

export const claimMilestone = (s: GameState, reward: TrophyReward): GameState => {
  if (s.profile.trophies < reward.threshold || s.claimedMilestones.includes(reward.threshold)) return s;
  const owned = reward.duckId && !s.ownedDucks.some((o) => o.duckId === reward.duckId)
    ? [...s.ownedDucks, { id: `local-${reward.duckId}-${Date.now()}`, duckId: reward.duckId, level: 1, xp: 0, energy: 100, isActive: false, isAsleep: false }]
    : s.ownedDucks;
  const breadcrumbs = reward.breadcrumbs || 0;
  const credits = reward.hatchingCredits || 0;
  const minutes = reward.screenTimeMinutes || 0;
  return {
    ...s,
    profile: { ...s.profile, breadcrumbs: s.profile.breadcrumbs + breadcrumbs, hatchingCredits: s.profile.hatchingCredits + credits, screenTimeMinutes: s.profile.screenTimeMinutes + minutes },
    ownedDucks: owned,
    eggs: s.eggs + (reward.eggs || 0),
    claimedMilestones: [...s.claimedMilestones, reward.threshold],
    recentRewards: [`${reward.title} claimed`, ...s.recentRewards].slice(0, 5),
    outbox: [...s.outbox, { kind: "transaction", type: "trophy_reward", breadcrumbs_change: breadcrumbs, hatching_credits_change: credits, screen_time_minutes_change: minutes, trophies_change: 0, description: `${reward.title} at ${reward.threshold} trophies` }],
    sync: { ...s.sync, pending: s.sync.pending + 1 },
  };
};

