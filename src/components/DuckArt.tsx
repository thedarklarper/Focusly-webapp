"use client";

import { useState } from "react";
import { getDuck } from "@/data/ducks";

export function DuckArt({ id, size = 72, flip = false, className = "" }: { id: string; size?: number; flip?: boolean; className?: string }) {
  const d = getDuck(id);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={className} style={{ fontSize: size * 0.7, lineHeight: 1, display: "inline-block", transform: flip ? "scaleX(-1)" : undefined }}>
        {d.art}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={d.sprite}
      alt={d.name}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size, transform: flip ? "scaleX(-1)" : undefined }}
      onError={() => setFailed(true)}
    />
  );
}
