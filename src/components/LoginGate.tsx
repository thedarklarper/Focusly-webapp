"use client";

import { useState } from "react";
import { useGame } from "@/providers/GameProvider";
import { LOCAL_ACCOUNTS, LOCAL_PASSWORD } from "@/services/accounts";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { BottomNav } from "@/components/BottomNav";
import { DuckArt } from "@/components/DuckArt";
import { Button, Card } from "@/components/ui";

export function LoginGate({ children }: { children: React.ReactNode }) {
  const { ready, account, signIn } = useGame();
  const [handle, setHandle] = useState("chris");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center bg-cream">
        <DuckArt id="prototype" size={72} />
        <p className="mt-3 text-[13px] font-bold text-[#718096]">Waking the flock…</p>
      </div>
    );
  }

  if (account) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-cream shadow-[0_0_60px_rgba(22,37,61,0.08)]">
        <BackgroundMusic />
        <main className="flex-1 pb-24">{children}</main>
        <BottomNav />
      </div>
    );
  }

  const submit = () => {
    const res = signIn(handle, password);
    if (!res.ok) setError(res.error || "Could not sign in.");
    else setError("");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center bg-cream px-5 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#F8C84A]">
          <DuckArt id="prototype" size={56} />
        </div>
        <h1 className="mt-4 text-[30px] font-black tracking-[-0.7px] text-[#16253D]">Focusly</h1>
        <p className="text-[13px] font-bold text-[#718096]">Less scroll. More soul. Sign in to start.</p>
      </div>

      <Card>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[1.6px] text-[#718096]">Choose account</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {LOCAL_ACCOUNTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setHandle(a.handle);
                setError("");
              }}
              className={`rounded-[16px] border py-3 text-[13px] font-black capitalize transition ${
                handle === a.handle ? "border-[#F8C84A] bg-[#FFF9EF] text-[#16253D]" : "border-[#E8E0D2] bg-white text-[#718096]"
              }`}
            >
              {a.display}
            </button>
          ))}
        </div>

        <label className="text-[12px] font-bold text-[#718096]">Name</label>
        <input
          value={handle}
          onChange={(e) => {
            setHandle(e.target.value);
            setError("");
          }}
          autoCapitalize="none"
          className="mb-3 mt-1 w-full rounded-[14px] border border-[#E8E0D2] px-3 py-3 text-[14px] text-[#16253D] outline-none focus:border-[#9ED9F4]"
        />

        <label className="text-[12px] font-bold text-[#718096]">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="123456"
          className="mb-4 mt-1 w-full rounded-[14px] border border-[#E8E0D2] px-3 py-3 text-[14px] text-[#16253D] outline-none focus:border-[#9ED9F4]"
        />

        <Button title="Sign in" onClick={submit} />
        {error ? <p className="mt-3 text-[13px] font-extrabold text-[#F2815A]">{error}</p> : null}
        <p className="mt-3 text-center text-[11px] font-bold text-[#718096]">
          Demo accounts: chris · steve · user — password {LOCAL_PASSWORD}
        </p>
      </Card>
    </div>
  );
}
