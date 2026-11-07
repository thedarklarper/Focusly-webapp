"use client";

import React from "react";

export const C = {
  navy: "#16253D",
  yellow: "#F8C84A",
  cream: "#FFF9EF",
  green: "#62B58A",
  blue: "#9ED9F4",
  orange: "#F2815A",
  line: "#E8E0D2",
  muted: "#718096",
  white: "#FFFFFF",
  purple: "#9B8AFB",
};

export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`mb-3.5 rounded-[24px] bg-white p-[18px] shadow-[0_5px_12px_rgba(32,48,74,0.07)] ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Pill({ children, color = C.blue }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex self-start rounded-[14px] px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-[#16253D]" style={{ backgroundColor: color }}>
      {children}
    </span>
  );
}

export function Button({
  title,
  onClick,
  disabled = false,
  secondary = false,
  className = "",
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-[18px] py-[15px] text-center text-[15px] font-black text-[#16253D] transition active:scale-[0.98] disabled:opacity-45 ${secondary ? "bg-[#9ED9F4]" : "bg-[#F8C84A]"} ${className}`}
    >
      {title}
    </button>
  );
}

export function Meter({ value, color = C.green }: { value: number; color?: string }) {
  return (
    <div className="h-[9px] w-full overflow-hidden rounded-full bg-[#EEF0ED]">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
    </div>
  );
}

export function Header({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-[18px] flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[1.4px] text-[#718096]">{eyebrow}</p>
        <h1 className="mt-0.5 text-[29px] font-black leading-tight tracking-[-0.7px] text-[#16253D]">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-2 text-[11px] font-black uppercase tracking-[1.6px] text-[#718096]">{children}</p>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="px-5 pb-10 pt-5">{children}</div>;
}
