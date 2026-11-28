export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

export type Duck = {
  id: string;
  name: string;
  element: string;
  rarity: Rarity;
  base_hp: number;
  base_attack: number;
  base_defense: number;
  base_speed: number;
  base_energy: number;
  ability: string;
  personality: string;
  art: string;
  /** Public URL path to the duck sprite (e.g. "/ducks/normal.png"). */
  sprite: string;
};

export type OwnedDuck = {
  id: string;
  duckId: string;
  level: number;
  xp: number;
  energy: number;
  isActive: boolean;
  isAsleep: boolean;
  sleepUntil?: number;
};

export type BattleAction = "punch" | "kick" | "special" | "block" | "jump" | "left" | "right";

export type BattleState = {
  player: string;
  opponent: string;
  playerHp: number;
  opponentHp: number;
  playerMaxHp: number;
  opponentMaxHp: number;
  playerEnergy: number;
  opponentEnergy: number;
  playerX: number;
  opponentX: number;
  playerBlocking: boolean;
  opponentBlocking: boolean;
  playerJumping: boolean;
  opponentJumping: boolean;
  cooldown: number;
  turn: "player" | "opponent";
  log: string[];
  finished: boolean;
  result?: "win" | "loss";
  difficulty: "Rookie" | "Street" | "Champion";
  lastAction?: BattleAction;
  hitFlash?: "player" | "opponent";
  combo: string[];
  playerDamageDealt: number;
  opponentDamageDealt: number;
};

export type SyncEvent =
  | { kind: "focus"; duration_minutes: number; breadcrumbs_earned: number; hatching_credits_earned: number; screen_time_minutes_earned: number }
  | { kind: "transaction"; type: string; breadcrumbs_change: number; hatching_credits_change: number; screen_time_minutes_change: number; trophies_change: number; description: string }
  | { kind: "battle"; playerDuckId: string; opponentDuckId: string; result: "win" | "loss"; trophies_earned: number; breadcrumbs_earned: number; screen_time_minutes_earned: number };

export type GameState = {
  profile: {
    id: string;
    username: string;
    breadcrumbs: number;
    hatchingCredits: number;
    trophies: number;
    screenTimeMinutes: number;
    stamina: number;
    activeDuckId: string;
  };
  ownedDucks: OwnedDuck[];
  focus: { running: boolean; startedAt?: number; duration: number };
  protection: boolean;
  blacklist: string[];
  lastEarnedAt: number;
  streak: number;
  lastFocusDay: string | null;
  eggs: number;
  gear: Record<string, number>;
  claimedMilestones: number[];
  recentRewards: string[];
  outbox: SyncEvent[];
  battle?: BattleState;
  sync: { userId?: string; pending: number; lastSyncedAt?: number; status: "offline" | "ready" | "syncing" | "error" };
};
