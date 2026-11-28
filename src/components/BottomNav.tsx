"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/ducks", label: "Ducks", icon: "🦆" },
  { href: "/duck-off", label: "Duck Off", icon: "⚔️" },
  { href: "/shop", label: "Shop", icon: "🥚" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-[#E8E0D2] bg-white/95 backdrop-blur">
      <div className="grid grid-cols-6">
        {items.map((it) => {
          const on = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition ${on ? "text-[#16253D]" : "text-[#718096]"}`}
            >
              <span className={`text-lg ${on ? "" : "opacity-70"}`}>{it.icon}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
