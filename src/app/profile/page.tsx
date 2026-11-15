"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/providers/GameProvider";
import { Button, Card, Header, Shell } from "@/components/ui";
import { authMessage, getSession, resetPassword, signIn, signInWithGoogle, signOut, signUp } from "@/lib/supabase";
import { ensureProfile } from "@/services/storage";

type Mode = "login" | "signup" | "forgot";

const statusColor: Record<string, string> = {
  offline: "#718096",
  ready: "#62B58A",
  syncing: "#9ED9F4",
  error: "#F2815A",
};

export default function ProfilePage() {
  const { state, sync, refreshFromCloud } = useGame();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getSession()
      .then(({ data }) => setAccount(data.session?.user.email || null))
      .catch(() => undefined);
  }, []);

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
    if (mode !== "forgot" && password.length < 6) return "Use a stronger password with at least 6 characters.";
    return "";
  };

  const submit = async () => {
    const validation = validate();
    setError(validation);
    setMessage("");
    if (validation) return;
    setBusy(true);
    if (mode === "forgot") {
      const result = await resetPassword(email);
      setBusy(false);
      if (result.error) setError(authMessage(result.error.message));
      else setMessage("Password reset instructions sent. Check your email.");
      return;
    }
    const result = mode === "login" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) {
      setError(authMessage(result.error.message));
      return;
    }
    if (result.data.user) {
      await ensureProfile(result.data.user.id, email, state);
      setAccount(result.data.user.email || email);
      await refreshFromCloud();
      setMessage(mode === "signup" && !result.data.session ? "Account created. Confirm your email, then sign in." : "Signed in and cloud progress loaded.");
    }
  };

  const doSignOut = async () => {
    await signOut();
    setAccount(null);
    setMessage("Signed out. Progress stays saved on this device.");
  };

  const doGoogleSignIn = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setBusy(false);
      setError(authMessage(error.message));
    }
    // On success the browser redirects to Google, then back to app where
    // onAuthStateChange loads the cloud progress for this account.
  };

  return (
    <Shell>
      <Header eyebrow="Your pond" title="A calmer corner of the internet." />

      <Card>
        <p className="text-[17px] font-black text-[#16253D]">{state.profile.username}</p>
        <p className="text-[13px] text-[#718096]">
          {account ? `Signed in as ${account}` : "Local-first profile"} · {state.sync.status}
        </p>
        <div className="my-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor[state.sync.status] }} />
          <span className="text-[13px] font-bold text-[#16253D]">
            {state.sync.pending} pending · {state.sync.lastSyncedAt ? `synced ${new Date(state.sync.lastSyncedAt).toLocaleTimeString()}` : "never synced"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button title="Sync now" onClick={sync} secondary className="!py-3" />
          {account ? <Button title="Sign out" onClick={doSignOut} className="!py-3" /> : null}
        </div>
      </Card>

      {!account ? (
        <Card>
          <div className="mb-4">
            <button
              type="button"
              onClick={doGoogleSignIn}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#E8E0D2] bg-white py-3 text-[14px] font-black text-[#16253D] shadow-sm transition active:scale-[0.98] disabled:opacity-45"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.7 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.8 6.1C12.2 13.9 17.6 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.5c-.5 2.9-2.2 5.4-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z" />
                <path fill="#FBBC05" d="M10.3 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l7.8-6.1z" />
                <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.1-5.5c-2 1.4-4.6 2.2-8.1 2.2-6.4 0-11.8-4.4-13.7-10.3l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
              </svg>
              Continue with Google
            </button>
            <p className="mt-2 text-center text-[11px] font-bold text-[#718096]">Sync progress to your Google account</p>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <span className="h-px flex-1 bg-[#E8E0D2]" />
            <span className="text-[11px] font-bold text-[#718096]">or use email</span>
            <span className="h-px flex-1 bg-[#E8E0D2]" />
          </div>

          <div className="mb-4 flex justify-between">
            {(["login", "signup", "forgot"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setMessage("");
                }}
                className={`text-[14px] ${mode === m ? "font-black text-[#16253D] underline" : "font-bold text-[#718096]"}`}
              >
                {m === "login" ? "Sign in" : m === "signup" ? "Create account" : "Forgot"}
              </button>
            ))}
          </div>

          <label className="text-[12px] font-bold text-[#718096]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mb-3 mt-1 w-full rounded-[14px] border border-[#E8E0D2] px-3 py-3 text-[14px] text-[#16253D] outline-none focus:border-[#9ED9F4]"
          />
          {mode !== "forgot" ? (
            <>
              <label className="text-[12px] font-bold text-[#718096]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mb-3 mt-1 w-full rounded-[14px] border border-[#E8E0D2] px-3 py-3 text-[14px] text-[#16253D] outline-none focus:border-[#9ED9F4]"
              />
            </>
          ) : null}

          <Button
            title={busy ? "Working…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            onClick={submit}
            disabled={busy}
          />

          {error ? <p className="mt-3 text-[13px] font-extrabold text-[#F2815A]">{error}</p> : null}
          {message ? <p className="mt-3 text-[13px] font-extrabold text-[#62B58A]">{message}</p> : null}
        </Card>
      ) : (
        <Card>
          <p className="text-[13px] text-[#718096]">
            Cloud sync is active. Progress is written to your Supabase account ({account}) and mirrored on this device.
          </p>
          {message ? <p className="mt-3 text-[13px] font-extrabold text-[#62B58A]">{message}</p> : null}
        </Card>
      )}

      <Card>
        <p className="text-[13px] text-[#718096]">
          Web limits: a browser cannot inspect real app usage or block apps. Screen-time, protection and distraction flows are honest simulations. Eggs, gear, blacklist and streaks stay on this device because the cloud schema has no columns for them.
        </p>
      </Card>
    </Shell>
  );
}
