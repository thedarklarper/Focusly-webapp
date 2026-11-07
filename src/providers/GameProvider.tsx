"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { GameState, Duck } from "@/game/types";
import { loadGameState, saveGameState, syncGameState, loadSignedInGameState, ensureProfile } from "@/services/storage";
import { getSession, onAuthStateChange } from "@/lib/supabase";
import * as engine from "@/game/engine";
import { DUCKS, getDuck } from "@/data/ducks";

type Ctx = {
  state: GameState;
  ready: boolean;
  action: (fn: (s: GameState) => GameState) => void;
  focus: (minutes: number) => void;
  hatch: () => Duck | null;
  sync: () => void;
  refreshFromCloud: () => Promise<void>;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(engine.starterState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGameState().then((s) => {
      setState(s);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) saveGameState(state);
  }, [state, ready]);

  useEffect(() => {
    const auth = onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setState((s) => ({ ...s, sync: { ...s.sync, userId: undefined, status: "offline" } }));
        return;
      }
      try {
        const current = await loadGameState();
        await ensureProfile(session.user.id, session.user.email || "focus friend", current);
        const remote = await loadSignedInGameState(current);
        setState(remote);
      } catch {
        setState((s) => ({ ...s, sync: { ...s.sync, userId: session.user.id, status: "error" } }));
      }
    });
    return () => auth.data.subscription.unsubscribe();
  }, []);

  const action = (fn: (s: GameState) => GameState) => setState((s) => fn(s));
  const focus = (minutes: number) => setState((s) => engine.rewardFocus({ ...s, focus: { ...s.focus, running: false } }, minutes));
  const hatch = () => {
    let out: Duck | null = null;
    setState((s) => {
      const r = engine.hatch(s);
      out = r.duck;
      return r.state;
    });
    return out;
  };
  const sync = () => {
    setState((s) => {
      syncGameState(s).then(setState);
      return { ...s, sync: { ...s.sync, status: "syncing" } };
    });
  };
  const refreshFromCloud = async () => {
    const current = await loadGameState();
    try {
      const remote = await loadSignedInGameState(current);
      setState(remote);
    } catch {
      setState((s) => ({ ...s, sync: { ...s.sync, status: "error" } }));
    }
  };

  return <GameCtx.Provider value={{ state, ready, action, focus, hatch, sync, refreshFromCloud }}>{children}</GameCtx.Provider>;
}

export const useGame = () => useContext(GameCtx)!;
export const duck = (id: string) => getDuck(id);
export { DUCKS };
export { getSession };
