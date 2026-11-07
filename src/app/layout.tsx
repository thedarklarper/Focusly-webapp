import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/providers/GameProvider";
import { BottomNav } from "@/components/BottomNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Focusly — a calmer phone, a happier flock",
  description: "Turn focus into a flock of duck companions. Less scroll. More soul.",
  applicationName: "Focusly",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FFF9EF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-dvh bg-cream font-sans text-navy">
        <GameProvider>
          <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-cream shadow-[0_0_60px_rgba(22,37,61,0.08)]">
            <main className="flex-1 pb-24">{children}</main>
            <BottomNav />
          </div>
        </GameProvider>
      </body>
    </html>
  );
}
