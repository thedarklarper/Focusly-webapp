import { DuckOffPage } from "@/components/duckoff/DuckOffPage";

// This page is fully client-interactive (Phaser + input bus) and reads URL
// params at mount, so Next's instant-navigation validator cannot outline it.
export const instant = false;

export default function Page() {
  return <DuckOffPage />;
}
