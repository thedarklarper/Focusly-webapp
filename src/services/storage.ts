import { GameState } from "@/game/types";
import { starterState } from "@/game/engine";
import { getSupabase } from "@/lib/supabase";
import { DUCKS, getDuck } from "@/data/ducks";

const KEY = "focusly:game:v1";
const profileColumns = "id,username,breadcrumbs,hatching_credits,trophies,screen_time_minutes,stamina,active_duck_id";

const readRaw = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const writeRaw = (value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* ignore quota / privacy mode errors */
  }
};

export async function loadGameState(): Promise<GameState> {
  try {
    const raw = readRaw();
    if (!raw) return starterState();
    const saved = JSON.parse(raw) as Partial<GameState>;
    const initial = starterState();
    return {
      ...initial,
      ...saved,
      profile: { ...initial.profile, ...(saved.profile || {}) },
      sync: { ...initial.sync, ...(saved.sync || {}) },
      outbox: saved.outbox || [],
    };
  } catch {
    return starterState();
  }
}

export async function saveGameState(state: GameState) {
  writeRaw(JSON.stringify(state));
}

export async function loadSignedInGameState(local: GameState): Promise<GameState> {
  const { data } = await getSupabase().auth.getSession();
  const user = data.session?.user;
  if (!user) return local;
  const sb = getSupabase();
  const { data: profile, error } = await sb.from("profiles").select(profileColumns).eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (!profile) {
    await ensureProfile(user.id, user.email || "focus friend", local);
    return { ...local, profile: { ...local.profile, id: user.id }, sync: { ...local.sync, userId: user.id, status: "ready" } };
  }
  const { data: catalog } = await sb.from("ducks").select("id,name");
  const remoteById = new Map<string, string>((catalog || []).map((row: { id: string; name: string }) => [row.id, row.name]));
  const { data: ownedRows } = await sb.from("user_ducks").select("id,duck_id,level,xp,energy,is_active,is_asleep").eq("user_id", user.id);
  const ownedDucks = (ownedRows || [])
    .map((row: { id: string; duck_id: string; level: number; xp: number; energy: number; is_active: boolean; is_asleep: boolean }) => {
      const localDuck = DUCKS.find((d) => d.id === row.duck_id || d.name === remoteById.get(row.duck_id));
      return localDuck ? { id: row.id, duckId: localDuck.id, level: row.level || 1, xp: row.xp || 0, energy: row.energy ?? 100, isActive: !!row.is_active, isAsleep: !!row.is_asleep } : null;
    })
    .filter(Boolean) as GameState["ownedDucks"];
  const activeLocal = DUCKS.find((d) => d.id === profile.active_duck_id || d.name === remoteById.get(profile.active_duck_id))?.id || local.profile.activeDuckId;
  const next: GameState = {
    ...local,
    profile: {
      ...local.profile,
      id: user.id,
      username: profile.username || local.profile.username,
      breadcrumbs: profile.breadcrumbs ?? local.profile.breadcrumbs,
      hatchingCredits: profile.hatching_credits ?? local.profile.hatchingCredits,
      trophies: profile.trophies ?? local.profile.trophies,
      screenTimeMinutes: profile.screen_time_minutes ?? local.profile.screenTimeMinutes,
      stamina: profile.stamina ?? local.profile.stamina,
      activeDuckId: activeLocal,
    },
    ownedDucks: ownedDucks.length ? ownedDucks : local.ownedDucks,
    sync: { ...local.sync, userId: user.id, status: "ready" as const },
  };
  await saveGameState(next);
  return next;
}

export async function ensureProfile(userId: string, email: string, state: GameState) {
  const { error } = await getSupabase().from("profiles").upsert({
    id: userId,
    username: email.split("@")[0] || state.profile.username,
    breadcrumbs: state.profile.breadcrumbs,
    hatching_credits: state.profile.hatchingCredits,
    trophies: state.profile.trophies,
    screen_time_minutes: state.profile.screenTimeMinutes,
    stamina: state.profile.stamina,
    active_duck_id: state.profile.activeDuckId,
  });
  if (error) throw error;
}


export async function syncGameState(state: GameState): Promise<GameState> {
  const { data } = await getSupabase().auth.getSession();
  const user = data.session?.user;
  if (!user) return { ...state, sync: { ...state.sync, status: "offline" } };
  const next = { ...state, sync: { ...state.sync, userId: user.id, status: "syncing" as const } };
  try {
    const sb = getSupabase();
    const { data: catalog, error: catalogError } = await sb.from("ducks").select("id,name");
    if (catalogError) throw catalogError;
    const duckIds = new Map<string, string>((catalog || []).map((row: { id: string; name: string }) => [row.name, row.id]));
    const activeDuck = getDuck(state.profile.activeDuckId);
    const profileResult = await sb.from("profiles").upsert({
      id: user.id,
      username: state.profile.username,
      breadcrumbs: state.profile.breadcrumbs,
      hatching_credits: state.profile.hatchingCredits,
      trophies: state.profile.trophies,
      screen_time_minutes: state.profile.screenTimeMinutes,
      stamina: state.profile.stamina,
      active_duck_id: duckIds.get(activeDuck.name) || state.profile.activeDuckId,
    });
    if (profileResult.error) throw profileResult.error;
    for (const owned of state.ownedDucks) {
      const remoteDuckId = duckIds.get(getDuck(owned.duckId).name);
      if (!remoteDuckId) continue;
      const payload: Record<string, unknown> = { user_id: user.id, duck_id: remoteDuckId, level: owned.level, xp: owned.xp, energy: owned.energy, is_active: owned.isActive, is_asleep: owned.isAsleep };
      if (!owned.id.startsWith("local-")) payload.id = owned.id;
      const { error } = await sb.from("user_ducks").upsert(payload);
      if (error) throw error;
    }
    const { data: userRows } = await sb.from("user_ducks").select("id,duck_id").eq("user_id", user.id);
    const userDuckIds = new Map<string, string>((userRows || []).map((row: { id: string; duck_id: string }) => [row.duck_id, row.id]));
    for (const event of state.outbox) {
      if (event.kind === "focus") {
        const { error } = await sb.from("focus_sessions").insert({ user_id: user.id, duration_minutes: event.duration_minutes, breadcrumbs_earned: event.breadcrumbs_earned, hatching_credits_earned: event.hatching_credits_earned, screen_time_minutes_earned: event.screen_time_minutes_earned, completed: true });
        if (error) throw error;
      } else if (event.kind === "transaction") {
        const { error } = await sb.from("transactions").insert({ user_id: user.id, type: event.type, breadcrumbs_change: event.breadcrumbs_change, hatching_credits_change: event.hatching_credits_change, screen_time_minutes_change: event.screen_time_minutes_change, trophies_change: event.trophies_change, description: event.description });
        if (error) throw error;
      } else {
        const playerRemoteDuck = duckIds.get(getDuck(event.playerDuckId).name);
        const opponentRemoteDuck = duckIds.get(getDuck(event.opponentDuckId).name);
        const playerUserDuck = playerRemoteDuck ? userDuckIds.get(playerRemoteDuck) : undefined;
        if (!playerRemoteDuck || !opponentRemoteDuck || !playerUserDuck) continue;
        const { error } = await sb.from("battles").insert({ user_id: user.id, user_duck_id: playerUserDuck, opponent_duck_id: opponentRemoteDuck, result: event.result, trophies_earned: event.trophies_earned, breadcrumbs_earned: event.breadcrumbs_earned, screen_time_minutes_earned: event.screen_time_minutes_earned });
        if (error) throw error;
      }
    }
    const synced: GameState = { ...next, outbox: [], sync: { ...next.sync, pending: 0, lastSyncedAt: Date.now(), status: "ready" } };
    await saveGameState(synced);
    return synced;
  } catch {
    return { ...state, sync: { ...next.sync, pending: state.outbox.length, status: "error" } };
  }
}

