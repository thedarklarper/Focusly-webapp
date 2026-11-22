import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/providers/GameProvider";
import { LoginGate } from "@/components/LoginGate";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Focusly — a calmer phone, a happier flock",
  description: "Turn focus into a flock of duck companions. Less scroll. More soul.",
  applicationName: "Focusly",
  icons: { icon: "/duckoff-logo.png" },
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
          <LoginGate>{children}</LoginGate>
        </GameProvider>
      </body>
    </html>
  );
}
