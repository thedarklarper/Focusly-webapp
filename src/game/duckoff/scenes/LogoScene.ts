import Phaser from "phaser";
import { HUD_H, LOGO_KEY, STAGE_H, STAGE_W } from "../constants";

/** How long the splash holds before the fight loads on its own. */
const HOLD_MS = 1500;
const LOGO_SIZE = 150;

/**
 * Title splash between the preloader and the fight: the game's logo gets one
 * clear beat (a pop and settle, then still), then the fight fades in. Any
 * pointer or confirm key skips straight through.
 */
export class LogoScene extends Phaser.Scene {
  private advancing = false;

  constructor() {
    super({ key: "LogoScene" });
  }

  create(): void {
    const cx = STAGE_W / 2;
    const cy = HUD_H + (STAGE_H - HUD_H) / 2;

    this.cameras.main.setBackgroundColor("#FFF9EF");

    const logo = this.add
      .image(cx, cy - 34, LOGO_KEY)
      .setDisplaySize(LOGO_SIZE, LOGO_SIZE)
      .setScale((LOGO_SIZE / 512) * 0.55)
      .setAlpha(0);
    this.tweens.add({
      targets: logo,
      scaleX: LOGO_SIZE / 512,
      scaleY: LOGO_SIZE / 512,
      alpha: 1,
      duration: 300,
      ease: "Back.easeOut",
    });

    this.add
      .text(cx, cy + 62, "DUCK OFF", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "29px",
        fontStyle: "900",
        color: "#16253D",
      })
      .setOrigin(0.5);
    this.add
      .text(cx, cy + 88, "STREET BRAWL", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "11px",
        fontStyle: "900",
        color: "#5C6B7F",
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    this.time.delayedCall(HOLD_MS, () => this.advance());

    this.input.once("pointerdown", () => this.advance());
    this.input.keyboard?.once("keydown-SPACE", () => this.advance());
    this.input.keyboard?.once("keydown-ENTER", () => this.advance());
  }

  private advance(): void {
    if (this.advancing) return;
    this.advancing = true;
    this.cameras.main.fadeOut(220, 255, 249, 239);
    this.time.delayedCall(240, () => {
      this.scene.start("FightScene");
      this.scene.launch("HudScene");
    });
  }
}
