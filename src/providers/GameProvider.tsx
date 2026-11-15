"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { GameState, Duck } from "@/game/types";
import { loadGameState, saveGameState } from "@/services/storage";
import { findAccount, getSessionAccount, setSessionAccount, LocalAccount } from "@/services/accounts";
import * as engine from "@/game/engine";
import { DUCKS, getDuck } from "@/data/ducks";

type Ctx = {
  state: GameState;
  ready: boolean;
  account: LocalAccount | null;
  signIn: (handle: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
  action: (fn: (s: GameState) => GameState) => void;
  focus: (minutes: number) => void;
  hatch: () => Duck | null;
  sync: () => void;
  refreshFromCloud: () => Promise<void>;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(engine.starterState());
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<LocalAccount | null>(null);

  // Restore the saved session and load that account's progress on first mount.
  useEffect(() => {
    const saved = getSessionAccount();
    const id = saved?.id;
    loadGameState(id).then((s) => {
      if (saved) {
        s.profile = { ...s.profile, id: saved.id, username: saved.display };
      }
      setState(s);
      setAccount(saved);
      setReady(true);
    });
  }, []);

  // Persist progress to this account's storage whenever it changes.
  useEffect(() => {
    if (ready && account) saveGameState(state, account.id);
  }, [state, ready, account]);

  const signIn = (handle: string, password: string) => {
    const found = findAccount(handle);
    if (!found) return { ok: false, error: "No account with that name." };
    if (password !== "123456") return { ok: false, error: "Wrong password. Try 123456." };
    setSessionAccount(found.id);
    setAccount(found);
    loadGameState(found.id).then((s) => {
      s.profile = { ...s.profile, id: found.id, username: found.display };
      setState(s);
    });
    return { ok: true };
  };

  const signOut = () => {
    if (account) saveGameState(state, account.id);
    setSessionAccount(null);
    setAccount(null);
    setState(engine.starterState());
  };

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
  // Local accounts: everything is already saved locally, so "sync" is a no-op refresh.
  const sync = () => {
    if (account) saveGameState(state, account.id);
  };
  const refreshFromCloud = async () => {
    if (!account) return;
    const s = await loadGameState(account.id);
    setState(s);
  };

  return <GameCtx.Provider value={{ state, ready, account, signIn, signOut, action, focus, hatch, sync, refreshFromCloud }}>{children}</GameCtx.Provider>;
}

export const useGame = () => useContext(GameCtx)!;
export const duck = (id: string) => getDuck(id);
export { DUCKS };
