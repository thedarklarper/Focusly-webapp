import Phaser from "phaser";
import { HUD_H, STAGE_W } from "../constants";
import { roundSecondsLeft } from "../match";
import type { MatchState } from "../match";

/**
 * Parallel overlay scene that renders the top HUD band: player labels, two
 * health bars with a lagging chip-damage trail, a centered MM:SS round clock,
 * three round-pip hearts per side, portrait boxes and the player's special
 * charge meter.
 *
 * Live state is read every frame from the running FightScene through the scene
 * manager; the scene never owns a copy, so it can be stopped and restarted
 * freely. All motion is computed in `update` from sim values; there are no
 * tweens or timers to leak across mount/destroy cycles.
 */
export class HudScene extends Phaser.Scene {
  private hudG!: Phaser.GameObjects.Graphics;
  /** Lagging chip-damage values in hp; only ever decrease. */
  private p1Chip: number | null = null;
  private p2Chip: number | null = null;

  constructor() {
    super({ key: "HudScene" });
  }

  create(): void {
    const W = STAGE_W;
    const font = (size: number, weight: string, color: string) =>
      ({ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: `${size}px`, fontStyle: weight, color }) as Phaser.Types.GameObjects.Text.TextStyle;

    this.hudG = this.add.graphics().setName("hud").setDepth(10);

    const edgeFont = font(11, "900", "#FFF9EF");
    this.add.text(16, 8, "PLAYER 1", { ...edgeFont, color: "#F8C84A" }).setName("hud-lbl-p1").setDepth(11);
    this.add.text(16, 21, "", font(12, "800", "#FFF9EF")).setName("hud-name-p1").setDepth(11);
    this.add.text(W - 16, 8, "PLAYER 2", { ...edgeFont, color: "#F2815A" }).setOrigin(1, 0).setName("hud-lbl-p2").setDepth(11);
    this.add.text(W - 16, 21, "", font(12, "800", "#FFF9EF")).setOrigin(1, 0).setName("hud-name-p2").setDepth(11);
    // Leading "@" keeps the clock out of update()'s text-glomming before a match is live.
    this.add.text(W / 2, 10, "@", font(26, "900", "#FFF9EF")).setOrigin(0.5, 0).setName("hud-clock").setDepth(11);
  }

  update(): void {
    const fight = this.scene.get("FightScene") as { match?: { state: MatchState } } | null;
    const state = fight && fight.match ? fight.match.state : null;
    if (!state || !this.hudG) return;

    const W = STAGE_W;
    const g = this.hudG;
    g.clear();
    g.fillStyle(0x16253d, 0.93).fillRect(0, 0, W, HUD_H);
    g.fillStyle(0x0d1a2b, 1).fillRect(0, HUD_H - 2, W, 2);

    const { player, opponent, rounds } = state;
    const portrait = 38;
    const portraitY = 36;
    this.drawPortraitFrame(g, 16, portraitY, portrait);
    this.drawPortraitFrame(g, W - 16 - portrait, portraitY, portrait);

    const barY = 50;
    const barH = 16;
    const clockW = 76;
    const innerL = 16 + portrait + 8;
    const innerR = W - 16 - portrait - 8;
    const barW = Math.floor((innerR - innerL - clockW) / 2);
    const p1x = innerL;
    const p2x = innerR - barW;

    this.drawHealthBar(g, player.hp, player.stats.maxHp, p1x, barY, barW, barH, "p1");
    this.drawHealthBar(g, opponent.hp, opponent.stats.maxHp, p2x, barY, barW, barH, "p2");
    this.drawPips(g, rounds[0], rounds[1], W, barY + barH + 13);
    this.drawMeter(g, Math.round(player.meter), p1x, barY + barH + 5, barW);

    const name1 = this.children.getByName("hud-name-p1") as Phaser.GameObjects.Text | null;
    const name2 = this.children.getByName("hud-name-p2") as Phaser.GameObjects.Text | null;
    if (name1 && name1.text !== player.name) name1.setText(player.name);
    if (name2 && name2.text !== opponent.name) name2.setText(opponent.name);

    const clock = this.children.getByName("hud-clock") as Phaser.GameObjects.Text | null;
    if (clock) {
      const secondsLeft = roundSecondsLeft(state);
      const label = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
      if (clock.text !== label) clock.setText(label);
    }
  }
private drawPortraitFrame(g: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    g.fillStyle(0x0d1a2b, 1).fillRoundedRect(x, y, size, size, 8);
    g.fillStyle(0x9ed9f4, 0.16).fillRoundedRect(x + 3, y + 3, size - 6, size - 6, 6);
    g.lineStyle(2, 0xf8c84a, 0.9).strokeRoundedRect(x, y, size, size, 8);
  }

  private drawHealthBar(g: Phaser.GameObjects.Graphics, hp: number, maxHp: number, x: number, y: number, w: number, h: number, side: "p1" | "p2"): void {
    const target = Math.max(0, hp);
    const prev = side === "p1" ? this.p1Chip : this.p2Chip;
    let eased = prev === null ? target : prev;
    if (eased > target) eased = Math.max(target, eased - Math.max(1, Math.round((eased - target) / 8)));
    else eased = target;
    if (side === "p1") this.p1Chip = eased;
    else this.p2Chip = eased;

    const fill = (target / maxHp) * w;
    const chip = (eased / maxHp) * w;

    g.fillStyle(0x0d1a2b, 1).fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 5);
    g.fillStyle(0xf8c84a, 0.55).fillRoundedRect(x, y, Math.max(0, chip), h, 4);
    const ratio = maxHp > 0 ? target / maxHp : 0;
    const live = ratio > 0.5 ? 0x62b58a : ratio > 0.25 ? 0xf8c84a : 0xf2815a;
    g.fillStyle(live, 1).fillRoundedRect(x, y, Math.max(0, fill), h, 4);
  }

  private drawPips(g: Phaser.GameObjects.Graphics, wonP1: number, wonP2: number, W: number, y: number): void {
    const r = 5;
    const gap = 15;
    const cx = W / 2;
    for (let i = 0; i < 3; i += 1) {
      g.fillStyle(i < wonP1 ? 0xf8c84a : 0x35476b, 1).fillCircle(cx - 34 - (2 - i) * gap, y, r);
      g.fillStyle(i < wonP2 ? 0xf2815a : 0x35476b, 1).fillCircle(cx + 34 + i * gap, y, r);
    }
  }

  /** Thin special-charge bar under the player's health bar. */
  private drawMeter(g: Phaser.GameObjects.Graphics, meter: number, x: number, y: number, w: number): void {
    const h = 5;
    g.fillStyle(0x0d1a2b, 0.9).fillRoundedRect(x, y, w, h, 3);
    const ratio = Math.max(0, Math.min(100, meter)) / 100;
    if (ratio > 0) g.fillStyle(meter >= 100 ? 0xf2815a : 0x9ed9f4, 1).fillRoundedRect(x + 1, y + 1, Math.max(2, Math.round((w - 2) * ratio)), h - 2, 2);
  }

  shutdown(): void {
    this.p1Chip = null;
    this.p2Chip = null;
  }
}