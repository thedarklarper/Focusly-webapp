"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Site-wide background music (Minecraft's desert track "Crescent Dunes",
 * sourced via mcsounds.net). Loops everywhere EXCEPT during a Street Brawl —
 * /duck-off pauses it so the fight stays focused, and it resumes on return.
 *
 * Browsers block audio until a user gesture: the sign-in click usually precedes
 * this component mounting, and a first-tap unlock listener covers the rest.
 */
export function BackgroundMusic() {
  const ref = useRef<HTMLAudioElement>(null);
  const pathname = usePathname();
  const pausedForBrawl = pathname?.startsWith("/duck-off") ?? false;

  useEffect(() => {
    const a = ref.current;
    if (!a) return;

    if (pausedForBrawl) {
      a.pause();
      return;
    }

    a.volume = 0.35;
    const tryPlay = () => a.play().catch(() => {
      /* autoplay blocked — the unlock listener below retries */
    });
    tryPlay();
    // iOS Safari: play() must run inside a gesture handler.
    const unlock = () => tryPlay();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [pausedForBrawl]);

  return <audio ref={ref} src="/audio/overworld-desert.m4a" loop preload="auto" aria-hidden="true" />;
}
