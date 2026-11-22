import Phaser from "phaser";

/**
 * Generates the small set of textures the arena needs so the game has no
 * binary asset dependencies beyond the duck portraits. Running this in Boot
 * means the preloader can show a progress bar immediately.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
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
