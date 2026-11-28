import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import path from "path";

// The Duck Off sim check is a standalone headless script with rich PASS/FAIL
// output. Running it as a subprocess keeps it the single source of truth while
// still gating commits on it.
describe("duckoff sim check (headless)", () => {
  it("all gameplay invariants hold", () => {
    const script = path.resolve(__dirname, "../scripts/duckoff-sim-check.ts");
    const out = execFileSync("npx", ["tsx", script], { encoding: "utf8", timeout: 120_000 });
    expect(out).toContain("All checks passed.");
  }, 150_000);
});
