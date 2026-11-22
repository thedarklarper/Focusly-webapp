import Phaser from "phaser";
import { HUD_H, STAGE_H, STAGE_W } from "../constants";
import { REG_SETUP, SceneSetup } from "../config";
import { DuckOffMatch } from "../match";
import { Fighter, SimEvent, isAttacking } from "../sim";
import { InputState, emptyInput } from "../types";
import { drawArena } from "./Arena";

const FIGHTER_H = 150;
const MAX_STEPS = 3;
const STEP_MS = 1000 / 60;
/** The duck PNGs face LEFT natively. Flip this constant if art ever changes. */
const SPRITES_FACE_RIGHT = false;

/**
 * Renders the simulation from `match.ts`. The scene never owns game rules: it
 * advances a fixed-step accumulator, draws whatever the sim reports, and turns
 * `SimEvent`s into juice.
 */
export class FightScene extends Phaser.Scene {
  private setup!: SceneSetup;
  private match!: DuckOffMatch;
  private playerSprite!: Phaser.GameObjects.Image;
  private opponentSprite!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private opponentShadow!: Phaser.GameObjects.Ellipse;
  private banner?: Phaser.GameObjects.Container;
  private accumulator = 0;
  private isFinishing = false;
  private bannerShownFor = -1;
  /** Source texture heights cached once; never recomputed from scaled sprites. */
  private playerNativeH = 1;
  private opponentNativeH = 1;
  private lastRoundSeen = 0;
  private lastRoundWinner: "player" | "opponent" | "draw" | null = null;
  private playerTag!: Phaser.GameObjects.Text;
  private opponentTag!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "FightScene" });
  }

  init(): void {
    this.setup = this.registry.get(REG_SETUP) as SceneSetup;
  }

  create(): void {
    drawArena(this);

    this.match = new DuckOffMatch(this.setup.match);

    // Cache source texture heights once so pose math never reads a scaled sprite.
    const nativeHeightOf = (key: string): number => {
      const texture = this.textures.get(key) as null | { source?: Array<{ width?: number; height?: number }> };
      const source = texture && Array.isArray(texture.source) ? texture.source[0] : undefined;
      return source && typeof source.height === "number" && source.height > 0 ? source.height : FIGHTER_H;
    };
    this.playerNativeH = nativeHeightOf("duck-player");
    this.opponentNativeH = nativeHeightOf("duck-opponent");

    this.playerShadow = this.add.ellipse(this.match.state.player.x, this.match.state.player.y + 2, 78, 18, 0x0d1a2b, 0.28).setDepth(1);
    this.opponentShadow = this.add.ellipse(this.match.state.opponent.x, this.match.state.opponent.y + 2, 78, 18, 0x0d1a2b, 0.28).setDepth(1);

    this.playerSprite = this.add.image(this.match.state.player.x, this.match.state.player.y, "duck-player").setOrigin(0.5, 1).setDepth(3);
    this.opponentSprite = this.add.image(this.match.state.opponent.x, this.match.state.opponent.y, "duck-opponent").setOrigin(0.5, 1).setDepth(3);

    const tagStyle = (bg: string): Phaser.Types.GameObjects.Text.TextStyle =>
      ({
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#FFF9EF",
        backgroundColor: bg,
        padding: { x: 6, y: 3 },
      });
    this.playerTag = this.add.text(this.match.state.player.x, this.match.state.player.y, "YOU", tagStyle("#62B58A")).setOrigin(0.5, 1).setDepth(6);
    this.opponentTag = this.add.text(this.match.state.opponent.x, this.match.state.opponent.y, "AI", tagStyle("#F2815A")).setOrigin(0.5, 1).setDepth(6);

    this.showBanner(`ROUND ${this.match.state.round}`, "FIGHT!");
    this.lastRoundSeen = this.match.state.round;
    this.setup.onRoundStart?.(this.match.state.round);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.banner?.destroy();
    });
  }

  update(_time: number, delta: number): void {
    const s = this.match.state;

    if (s.phase === "matchEnd" && !this.isFinishing) {
      this.isFinishing = true;
      this.time.delayedCall(700, () => this.finishMatch());
    }

    this.accumulator += Math.min(delta, MAX_STEPS * STEP_MS);
    let steps = 0;
    while (this.accumulator >= STEP_MS && steps < MAX_STEPS) {
      this.accumulator -= STEP_MS;
      steps += 1;
      const input: InputState = s.phase === "fight" ? this.setup.readInput() : emptyInput();
      const events = this.match.tick(input);
      this.handleEvents(events);
    }

    // Detect sim-driven round transitions that arrive without a KO event.
    if (s.round !== this.lastRoundSeen) {
      this.lastRoundSeen = s.round;
      this.showBanner(`ROUND ${s.round}`, "FIGHT!");
      this.setup.onRoundStart?.(s.round);
    }
    if (s.lastRoundWinner && s.lastRoundWinner !== this.lastRoundWinner) {
      this.lastRoundWinner = s.lastRoundWinner;
      if (s.lastRoundWinner !== "draw") this.setup.onRoundEnd?.(s.lastRoundWinner, s.rounds);
    }

    this.render();
  }

  private render() {
    const { player, opponent } = this.match.state;

    this.playerSprite.setPosition(player.x, player.y);
    this.opponentSprite.setPosition(opponent.x, opponent.y);
    this.playerShadow.setPosition(player.x, Math.max(player.y, this.match.state.player.y) + 2);
    this.opponentShadow.setPosition(opponent.x, Math.max(opponent.y, this.match.state.opponent.y) + 2);

    this.playerSprite.setFlipX(SPRITES_FACE_RIGHT ? player.facing === -1 : player.facing === 1);
    this.opponentSprite.setFlipX(SPRITES_FACE_RIGHT ? opponent.facing === -1 : opponent.facing === 1);

    // Gamertag chips float just above each fighter's head (origin 0.5,1 so the
    // tag's bottom edge sits at the anchor; sprite.y is feet + pose offset).
    const tagY = (sprite: Phaser.GameObjects.Image) => sprite.y - FIGHTER_H * sprite.scaleY - 10;
    this.playerTag.setPosition(this.playerSprite.x, tagY(this.playerSprite));
    this.opponentTag.setPosition(this.opponentSprite.x, tagY(this.opponentSprite));

    this.poseFighter(this.playerSprite, this.playerShadow, player, this.playerNativeH);
    this.poseFighter(this.opponentSprite, this.opponentShadow, opponent, this.opponentNativeH);

    this.playerSprite.setDepth(isAttacking(player) ? 5 : 3);
    this.opponentSprite.setDepth(isAttacking(opponent) ? 5 : 3);
  }

  /** Squash, lean and hop derived from sim state. Presentation only. */
  private poseFighter(sprite: Phaser.GameObjects.Image, shadow: Phaser.GameObjects.Ellipse, f: Fighter, nativeH: number) {
    // Base scale is computed from the cached source height, never from the
    // currently-scaled sprite, which removed the scale drift bug.
    const base = FIGHTER_H / Math.max(1, nativeH);
    let sx = base;
    let sy = base;
    let lean = 0;
    let offsetY = 0;

    switch (f.state) {
      case "walk":
        offsetY = Math.abs(Math.sin(this.time.now / 90)) * 3;
        sy = base * 1.02;
        break;
      case "crouch":
        sy = base * 0.86;
        sx = base * 1.1;
        break;
      case "jump":
        sy = base * 1.06;
        sx = base * 0.95;
        break;
      case "block":
        sx = base * 0.88;
        lean = f.facing * -6;
        break;
      case "punch":
      case "kick":
      case "special": {
        const m = f.move;
        const total = m ? m.startup + m.active + m.recovery : 12;
        const t = Phaser.Math.Clamp(f.frame / total, 0, 1);
        const lunge = t < 0.35 ? -0.06 * (t / 0.35) : 0.22 * ((t - 0.35) / 0.65);
        lean = f.facing * (10 + lunge * 90);
        sx = base * (1 + lunge * 0.18);
        sy = base * (1 - lunge * 0.08);
        offsetY = f.state === "kick" ? 2 : 0;
        break;
      }
      case "hitstun":
        lean = f.facing * -14;
        sx = base * 0.94;
        sy = base * 1.04;
        break;
      case "blockstun":
        lean = f.facing * -8;
        sx = base * 0.9;
        break;
      case "ko":
        lean = f.facing * -20;
        sy = base * 0.62;
        sx = base * 1.16;
        break;
      default:
        offsetY = Math.sin(this.time.now / 520) * 2;
    }

    sprite.setScale(sx, sy);
    sprite.setRotation(lean * 0.006);
    sprite.y = f.y + offsetY;

    // Phaser 4 removed setTintFill(); the fill-flash equivalent is
    // setTint(color) + TintModes.FILL. tintMode persists across frames, so the
    // non-flash branches reset it to MULTIPLY (the KO dim and the clear).
    if (f.hitFlash > 0) sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (f.state === "ko") sprite.setTint(0x8899aa).setTintMode(Phaser.TintModes.MULTIPLY);
    else sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);

    shadow.setScale(sx / base, 1);
    shadow.setAlpha(f.state === "jump" ? 0.12 : 0.26);
  }

  /** Turn simulation events into camera shake, hit sparks, flash and banners. */
  private handleEvents(events: SimEvent[]): void {
    for (const e of events) {
      if (e.type === "hit") this.spawnHit(e);
      else if (e.type === "ko") {
        const winner = e.loser === "player" ? "opponent" : "player";
        this.showBanner("K.O.", winner === "player" ? "PLAYER 1 TAKES THE ROUND" : "PLAYER 2 TAKES THE ROUND");
      }
    }
  }

  private spawnHit(e: Extract<SimEvent, { type: "hit" }>): void {
    const big = !e.blocked && (e.move === "kick" || e.move === "special");
    this.cameras.main.shake(big ? 170 : 90, big ? 0.006 : 0.0022);

    const sparkKey = big ? "spark-lg" : "spark";
    const spark = this.add.image(e.x, e.y, sparkKey).setDepth(9).setBlendMode("ADD");
    spark.setTint(e.blocked ? 0x9ed9f4 : 0xf8c84a);
    this.tweens.add({
      targets: spark,
      alpha: 0,
      scaleX: big ? 1.6 : 1.2,
      scaleY: big ? 1.6 : 1.2,
      duration: big ? 240 : 150,
      onComplete: () => spark.destroy(),
    });

    if (!e.blocked) {
      const flash = this.add.rectangle(STAGE_W / 2, STAGE_H / 2, STAGE_W, STAGE_H, 0xfff9ef, big ? 0.3 : 0.18).setDepth(20);
      this.tweens.add({ targets: flash, alpha: 0, duration: 120, onComplete: () => flash.destroy() });
    }
  }

  private showBanner(primary: string, secondary?: string): void {
    this.banner?.destroy();
    this.bannerShownFor = this.match.state.round;

    const cx = STAGE_W / 2;
    const cy = HUD_H + 20;
    const c = this.add.container(cx, cy).setDepth(25);

    const textStyle = (size: number, weight: string, color: string) =>
      ({ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: `${size}px`, fontStyle: weight, color }) as Phaser.Types.GameObjects.Text.TextStyle;

    const primaryT = this.add.text(0, 0, primary, textStyle(52, "900", "#F8C84A")).setOrigin(0.5);
    const shadow = this.add.text(0, 3, primary, textStyle(52, "900", "#0d1a2b")).setOrigin(0.5).setAlpha(0.45);
    c.add(shadow);
    c.add(primaryT);

    if (secondary) {
      const sub = this.add.text(0, 42, secondary, textStyle(16, "800", "#FFF9EF")).setOrigin(0.5);
      const subShadow = this.add.text(0 + 1, 43, secondary, textStyle(16, "800", "#0d1a2b")).setOrigin(0.5).setAlpha(0.5);
      c.add(subShadow);
      c.add(sub);
    }

    c.setScale(0.3);
    c.setAlpha(0);
    this.tweens.add({ targets: c, scaleX: 1.12, scaleY: 1.12, alpha: 1, duration: 190, ease: "Back.easeOut" });
    this.tweens.add({
      targets: c,
      alpha: 0,
      scaleX: 1.0,
      scaleY: 1.0,
      delay: 1150,
      duration: 160,
      onComplete: () => {
        c.destroy();
        if (this.banner === c) this.banner = undefined;
      },
    });

    this.banner = c;
  }

  private finishMatch(): void {
    const finished = this.match.state.finished;
    if (!finished) return;
    this.cameras.main.fadeOut(380, 13, 26, 43);
    this.time.delayedCall(410, () => {
      this.scene.stop("HudScene");
      this.setup.onFinish?.(finished);
    });
  }
}
