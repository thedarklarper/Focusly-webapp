import Phaser from "phaser";
import { HUD_H, STAGE_H, STAGE_W } from "../constants";

/**
 * The street backdrop, drawn once with Graphics: sunset sky, skyline, a
 * rooftop-vent awning, the ground and a little graffiti. No image assets, so
 * the arena always renders and never 404s.
 */
export const drawArena = (scene: Phaser.Scene): Phaser.GameObjects.Graphics => {
  const g = scene.add.graphics();

  // --- sky -----------------------------------------------------------------
  const sky = g;
  const skyH = HUD_H + 320;
  sky.fillStyle(0xfde7c8, 1).fillRect(0, 0, STAGE_W, skyH);
  // warm sun band near the horizon
  const grad = 12;
  for (let i = 0; i < grad; i += 1) {
    const a = 0.1 * (1 - i / grad);
    sky.fillStyle(0xf8c84a, a).fillRect(0, skyH - 160 + i * 12, STAGE_W, 12);
  }
  // sun
  sky.fillStyle(0xfdcb6e, 1).fillCircle(STAGE_W / 2, skyH - 40, 70);
  sky.fillStyle(0xfdcb6e, 0.35).fillCircle(STAGE_W / 2, skyH - 40, 105);

  // --- far skyline -----------------------------------------------------------
  const baseY = skyH;
  const towers: Array<[x: number, w: number, h: number]> = [
    [10, 54, 150],
    [70, 40, 100],
    [118, 60, 190],
    [186, 34, 84],
    [226, 58, 132],
    [290, 44, 168],
    [340, 62, 110],
    [408, 50, 176],
  ];
  for (const [x, w, h] of towers) {
    g.fillStyle(0x6c7a92, 1).fillRect(x, baseY - h, w, h);
    g.fillStyle(0x5b6880, 1).fillRect(x, baseY - h, w, 8);
    // windows
    g.fillStyle(0xfff3c4, 0.5);
    for (let wy = baseY - h + 18; wy < baseY - 14; wy += 22) {
      for (let wx = x + 8; wx < x + w - 10; wx += 16) {
        if ((wx * 7 + wy) % 5 < 3) g.fillRect(wx, wy, 7, 10);
      }
    }
  }

  // --- mid buildings with awning --------------------------------------------
  const midH = 210;
  g.fillStyle(0x9aa7bd, 1).fillRect(0, baseY, 150, midH);
  g.fillStyle(0x8b98ae, 1).fillRect(330, baseY, 150, midH);
  // awning over the left building
  g.fillStyle(0x16253d, 1).fillRect(6, baseY + 40, 118, 26);
  const stripW = 118 / 8;
  for (let i = 0; i < 8; i += 1) {
    g.fillStyle(i % 2 ? 0xf8c84a : 0xffffff, 1).fillRect(6 + i * stripW, baseY + 40, stripW, 13);
  }

  // --- ground ----------------------------------------------------------------
  const groundY = baseY + midH;
  g.fillStyle(0x2a3a55, 1).fillRect(0, groundY, STAGE_W, STAGE_H - groundY);
  g.fillStyle(0x1f2d43, 1).fillRect(0, groundY, STAGE_W, 10);
  g.fillStyle(0x35476833, 1).fillRect(0, groundY, STAGE_W, 1);

  // worn pavement stripes
  g.fillStyle(0x3a4c6e, 0.8);
  for (let x = 24; x < STAGE_W; x += 64) {
    g.fillRect(x, groundY + 26, 40, 3);
    g.fillRect(x + 20, groundY + 58, 24, 3);
  }

  // --- graffiti --------------------------------------------------------------
  scene.add
    .text(430, groundY + 30, "STREET\nBRAWL", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "19px",
      fontStyle: "900",
      color: "#F8C84A",
      align: "center",
      lineSpacing: 2,
    })
    .setOrigin(1, 0)
    .setRotation(-0.06)
    .setAlpha(0.9);
  scene.add
    .text(28, groundY + 64, "◆", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "26px",
      color: "#9ED9F4",
    })
    .setAlpha(0.7)
    .setRotation(0.2);

  g.setDepth(0);
  return g;
};