import Phaser from "phaser";
import { HUD_H, STAGE_H, STAGE_W } from "../constants";
import { REG_SETUP, SceneSetup } from "../config";

/** Loads only the two portraits in play, then hands off to the fight. */
export class PreloadScene extends Phaser.Scene {
  private setup!: SceneSetup;

  constructor() {
    super({ key: "PreloadScene" });
  }

  init(): void {
    this.setup = this.registry.get(REG_SETUP) as SceneSetup;
  }

  preload(): void {
    const cx = STAGE_W / 2;
    const cy = HUD_H + (STAGE_H - HUD_H) / 2;

    const barW = 220;
    const barBg = this.add.rectangle(cx, cy, barW, 10, 0x16253d, 0.15).setOrigin(0.5);
    const bar = this.add.rectangle(cx - barW / 2, cy, 2, 10, 0x16253d).setOrigin(0, 0.5);
    this.add
      .text(cx, cy - 28, "Warming up the pond…", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "15px",
        color: "#16253D",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.load.on("progress", (p: number) => {
      bar.width = Math.max(2, barW * p);
    });
    this.load.on("complete", () => {
      barBg.destroy();
      bar.destroy();
    });

    this.load.image("duck-player", this.setup.playerSprite);
    this.load.image("duck-opponent", this.setup.opponentSprite);
  }

  create(): void {
    this.scene.start("FightScene");
    this.scene.launch("HudScene");
  }
}
