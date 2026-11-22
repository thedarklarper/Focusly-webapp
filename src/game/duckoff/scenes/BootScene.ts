import Phaser from "phaser";
import { LOGO_KEY, LOGO_URL } from "../constants";

/**
 * Generates the small set of textures the arena needs and loads the logo, so
 * the preloader and title splash have it immediately. Running this in Boot
 * means the preloader can show a progress bar right away.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    this.load.image(LOGO_KEY, LOGO_URL);
  }

  create(): void {
    makeCircle(this, "spark", 10);
    makeCircle(this, "spark-lg", 22);
    makeRect(this, "px");
    this.scene.start("PreloadScene");
  }
}

const makeCircle = (scene: Phaser.Scene, key: string, radius: number) => {
  if (scene.textures.exists(key)) return;
  const size = radius * 2;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(radius, radius, radius);
  g.generateTexture(key, size, size);
  g.destroy();
};

const makeRect = (scene: Phaser.Scene, key: string) => {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 1, 1);
  g.generateTexture(key, 1, 1);
  g.destroy();
};
