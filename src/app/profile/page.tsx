"use client";

import { useGame } from "@/providers/GameProvider";
import { LOCAL_ACCOUNTS } from "@/services/accounts";
import { Button, Card, Header, Shell } from "@/components/ui";

export default function ProfilePage() {
  const { state, account, signIn, signOut, sync } = useGame();

  return (
    <Shell>
      <Header eyebrow="Your pond" title="A calmer corner of the internet." />

      <Card>
        <p className="text-[17px] font-black capitalize text-[#16253D]">{account?.display || state.profile.username}</p>
        <p className="text-[13px] text-[#718096]">
          Signed in as <span className="font-bold">{account?.handle}</span> · progress saved on this device
        </p>
        <div className="my-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#62B58A]" />
          <span className="text-[13px] font-bold text-[#16253D]">
            {state.profile.breadcrumbs} 🍞 · {state.profile.trophies} 🏆 · {state.profile.screenTimeMinutes} min
          </span>
        </div>
        <div className="flex gap-2">
          <Button title="Save now" onClick={sync} secondary className="!py-3" />
          <Button title="Sign out" onClick={signOut} className="!py-3" />
        </div>
      </Card>

      <Card>
        <p className="mb-2 text-[13px] font-black text-[#16253D]">Switch account</p>
        <p className="mb-3 text-[12px] text-[#718096]">Each account keeps its own separate progress on this device.</p>
        <div className="grid grid-cols-3 gap-2">
          {LOCAL_ACCOUNTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                signOut();
                signIn(a.handle, "123456");
              }}
              className={`rounded-[16px] border py-3 text-[13px] font-black capitalize transition ${
                account?.id === a.id ? "border-[#F8C84A] bg-[#FFF9EF] text-[#16253D]" : "border-[#E8E0D2] bg-white text-[#718096]"
              }`}
            >
              {a.display}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-[13px] text-[#718096]">
          Accounts are local to this browser (no cloud, no cost). Signing in on another device or clearing browser data starts fresh. A browser can&apos;t block apps or read real usage, so screen-time and protection are honest simulations.
        </p>
      </Card>
    </Shell>
  );
}
