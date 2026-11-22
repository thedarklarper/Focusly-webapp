#!/usr/bin/env node
/**
 * One-off runtime probe for the gated build: logs in as the chris test account
 * through LoginGate, then verifies the Street Brawl game boots on /duck-off.
 * Usage: node playtest/verify-loggedin.mjs [baseURL]
 */
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(`${base}/duck-off?autostart=1`, { waitUntil: "load" });

// LoginGate is showing: fill the form and submit.
await page.fill('input:not([type="password"])', "chris");
await page.fill('input[type="password"]', "123456");
await page.click('button:has-text("Sign in")');
await page.waitForTimeout(2500);

// autostart=1 should now fire the brawl without further clicks.
const canvas = await page.$("canvas");
const game = await page.evaluate(() => {
  const g = window.__PHASER_GAME__;
  if (!g) return null;
  return { booted: g.isBooted, fps: g.loop && Math.round(g.loop.actualFps) };
});

const staminaShown = await page.evaluate(() => document.body.innerText.includes("TEST MODE"));

console.log("canvas:", canvas ? "found" : "MISSING");
console.log("game:", game ? JSON.stringify(game) : "MISSING");
console.log("chris test mode (infinite stamina):", staminaShown);
console.log("errors:", errors.length ? errors.slice(0, 5) : "none");
await page.screenshot({ path: ".playtest/verify-loggedin.png" });
await browser.close();
process.exit(canvas && game && game.booted ? 0 : 1);
