import Phaser from 'phaser';
import djmongPerfectReaction from '../assets/djmong-perfect.png';
import djmongGoodReaction from '../assets/djmong-good.png';
import djmongNotGoodReaction from '../assets/djmong-notgood.png';
import djmongBadReaction from '../assets/djmong-bad.png';
import djmongPendingReaction from '../assets/djmong-pending.png';
import { useGameStore, type Judgment } from '../store/gameStore';
import { DIFFICULTIES, COLOR_HEX, type ColorId } from '../store/difficulties';
import {
  shuffledSet,
  lerp,
  createWord,
  progressOf,
  msUntilCenter,
  type BandWord,
} from './bandEngine';

const BAND_SESSION_SECONDS = 60;
const BAND_BASE_INTERVAL_MS = 1000;
const BAND_MIN_INTERVAL_MS = 500;
const BAND_BASE_TRAVEL_MS = 1800;
const BAND_MIN_TRAVEL_MS = 1100;
const BAND_HEIGHT = 56;
const BAND_MARGIN_X = 12;
const BAND_ZONE_WIDTH = 100;

const BUTTON_SIZE = 30;
const BUTTON_RADIUS = BUTTON_SIZE / 2;
const BUTTON_MIN_DISTANCE = 50;
const BUTTON_LANE_EDGE_MARGIN = 16;
const BUTTON_CHARACTER_EXCLUSION_HALF_WIDTH = 110;
const BUTTON_VERTICAL_TOP_MARGIN = 100;
const BUTTON_VERTICAL_BOTTOM_MARGIN = 200;
const BUTTON_PLACEMENT_MAX_ATTEMPTS = 200;

const JUDGE_PERFECT_MS = 120;
const JUDGE_GOOD_MS = 280;

const FOOTER_HEIGHT = 56;

const JUDGMENT_LABEL: Record<Judgment, string> = {
  perfect: 'Perfect!',
  good: 'Good',
  notGood: 'Not Good',
  bad: 'Bad',
};

const JUDGMENT_COLOR: Record<Judgment, string> = {
  perfect: '#b89bf0',
  good: '#3ba55c',
  notGood: '#e0a53d',
  bad: '#e0453f',
};

export class MainScene extends Phaser.Scene {
  private bandWords: BandWord[] = [];
  private bandTexts = new Map<number, Phaser.GameObjects.Text>();
  private bandQueue: ColorId[] = [];
  private bandLastSpawnMs = 0;
  private bandStartMs = 0;

  private buttonShapes: Phaser.GameObjects.Arc[] = [];
  private laneShapes: Phaser.GameObjects.Graphics[] = [];

  private hudScoreText!: Phaser.GameObjects.Text;
  private hudComboText!: Phaser.GameObjects.Text;
  private hudJudgmentText!: Phaser.GameObjects.Text;
  private unsubscribeStore: (() => void) | null = null;

  private perfectEffectSprite!: Phaser.GameObjects.Sprite;
  private goodEffectSprite!: Phaser.GameObjects.Sprite;
  private notGoodEffectSprite!: Phaser.GameObjects.Sprite;
  private badEffectSprite!: Phaser.GameObjects.Sprite;
  private pendingEffectSprite!: Phaser.GameObjects.Sprite;

  constructor() {
    super('MainScene');
  }

  preload() {
    // TODO: 실제 아트로 교체. 지금은 기본 스프라이트로 프로토타이핑.
    this.load.spritesheet('perfect_effect', djmongPerfectReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet('good_effect', djmongGoodReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet('not_good_effect', djmongNotGoodReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet('bad_effect', djmongBadReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet('pending_effect', djmongPendingReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });
  }

  create() {
    const { width, height } = this.scale;

    this.anims.create({
      key: 'perfect_anim',
      frames: this.anims.generateFrameNumbers('perfect_effect', {
        start: 0,
        end: 11,
      }),
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: 'good_anim',
      frames: this.anims.generateFrameNumbers('good_effect', {
        start: 0,
        end: 11,
      }),
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: 'not_good_anim',
      frames: this.anims.generateFrameNumbers('not_good_effect', {
        start: 0,
        end: 11,
      }),
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: 'bad_anim',
      frames: this.anims.generateFrameNumbers('bad_effect', {
        start: 0,
        end: 11,
      }),
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: 'pending_anim',
      frames: this.anims.generateFrameNumbers('pending_effect', {
        start: 0,
        end: 11,
      }),
      frameRate: 15,
      repeat: -1,
    });

    this.perfectEffectSprite = this.add.sprite(width / 2, height / 2, 'perfect_effect', 0);
    this.perfectEffectSprite.setScale(2.15);
    this.perfectEffectSprite.setVisible(false);

    this.goodEffectSprite = this.add.sprite(width / 2, height / 2, 'good_effect', 0);
    this.goodEffectSprite.setScale(2);
    this.goodEffectSprite.setVisible(false);

    this.notGoodEffectSprite = this.add.sprite(width / 2, height / 2, 'not_good_effect', 0);
    this.notGoodEffectSprite.setScale(2);
    this.notGoodEffectSprite.setVisible(false);

    this.badEffectSprite = this.add.sprite(width / 2, height / 2, 'bad_effect', 0);
    this.badEffectSprite.setScale(2);
    this.badEffectSprite.setVisible(false);

    this.pendingEffectSprite = this.add.sprite(width / 2, height / 2, 'pending_effect', 0);
    this.pendingEffectSprite.setScale(2);
    this.pendingEffectSprite.play('pending_anim');

    this.createColorBand();
    this.drawButtonLanes();
    this.spawnButtons();
    this.createHud();

    this.events.once('shutdown', () => this.unsubscribeStore?.());
    this.events.once('destroy', () => this.unsubscribeStore?.());
  }

  update() {
    this.updateColorBand(performance.now());
  }

  private createColorBand() {
    const { width } = this.scale;
    const difficulty = useGameStore.getState().difficulty;
    const config = DIFFICULTIES[difficulty];

    this.bandQueue = shuffledSet(config.colors);
    this.bandWords = [];
    this.bandStartMs = performance.now();
    this.bandLastSpawnMs = 0;

    const yPosition = 75;
    const railHeight = 60;
    this.add.rectangle(width / 2, yPosition, width, railHeight, 0x333333);

    const zone = this.add.graphics();
    zone.fillStyle(0xb89bf0, 0.18);
    zone.lineStyle(1, 0xb89bf0, 0.4);

    const zoneX = width / 2 - BAND_ZONE_WIDTH / 2;
    zone.fillRoundedRect(zoneX, 51, BAND_ZONE_WIDTH, BAND_HEIGHT - 8, 10);
    zone.strokeRoundedRect(zoneX, 51, BAND_ZONE_WIDTH, BAND_HEIGHT - 8, 10);
  }

  private updateColorBand(now: number) {
    const { width } = this.scale;
    const difficulty = useGameStore.getState().difficulty;
    const config = DIFFICULTIES[difficulty];

    const elapsed = now - this.bandStartMs;
    const elapsedRatio = elapsed / (BAND_SESSION_SECONDS * 1000);
    const interval =
      lerp(BAND_BASE_INTERVAL_MS, BAND_MIN_INTERVAL_MS, elapsedRatio) / config.speedMultiplier;
    const travel =
      lerp(BAND_BASE_TRAVEL_MS, BAND_MIN_TRAVEL_MS, elapsedRatio) / config.speedMultiplier;

    if (elapsed - this.bandLastSpawnMs >= interval) {
      this.bandLastSpawnMs = elapsed;
      if (this.bandQueue.length === 0) {
        this.bandQueue = shuffledSet(config.colors);
        this.spawnButtons();
      }
      const color = this.bandQueue.shift()!;
      const word = createWord(color, now, travel);
      this.bandWords.push(word);

      const text = this.add.text(0, BAND_HEIGHT / 2, color, {
        fontSize: '16px',
        fontStyle: 'bold',
        color: COLOR_HEX[color],
      });
      text.setOrigin(0.5, 0.5);
      this.bandTexts.set(word.id, text);
    }

    this.bandWords = this.bandWords.filter((w) => {
      if (progressOf(w, now) < 1.1) return true;
      this.bandTexts.get(w.id)?.destroy();
      this.bandTexts.delete(w.id);
      return false;
    });

    const bandInnerWidth = width - BAND_MARGIN_X * 2;
    let nearest: BandWord | null = null;
    let nearestDist = Infinity;

    for (const w of this.bandWords) {
      const text = this.bandTexts.get(w.id);
      if (!text) continue;

      const p = progressOf(w, now);
      const distFromCenter = Math.abs(p - 0.5);
      const scale = lerp(1.7, 0.7, Math.min(1, distFromCenter / 0.5));
      const alpha = lerp(1, 0.3, Math.min(1, distFromCenter / 0.5));
      const xPercent = 1.15 - p * 1.3; // 오른쪽에서 등장(1.15) -> 왼쪽으로 퇴장(-0.15)
      const x = BAND_MARGIN_X + xPercent * bandInnerWidth;

      text.setPosition(x, BAND_HEIGHT / 2 + 50);
      text.setScale(scale);
      text.setAlpha(alpha);

      if (distFromCenter < nearestDist) {
        nearest = w;
        nearestDist = distFromCenter;
      }
    }

    if (nearest) useGameStore.getState().setCurrentTarget(nearest.color);
  }

  private getButtonLaneBounds() {
    const { width, height } = this.scale;
    const characterX = width / 2;
    const laneTop = BAND_HEIGHT + BUTTON_RADIUS + BUTTON_VERTICAL_TOP_MARGIN;
    const laneBottom = height - BUTTON_RADIUS - BUTTON_VERTICAL_BOTTOM_MARGIN;

    const lanes = [
      {
        minX: BUTTON_LANE_EDGE_MARGIN + BUTTON_RADIUS,
        maxX: characterX - BUTTON_CHARACTER_EXCLUSION_HALF_WIDTH - BUTTON_RADIUS,
      },
      {
        minX: characterX + BUTTON_CHARACTER_EXCLUSION_HALF_WIDTH + BUTTON_RADIUS,
        maxX: width - BUTTON_LANE_EDGE_MARGIN - BUTTON_RADIUS,
      },
    ];

    return { laneTop, laneBottom, lanes };
  }

  private drawButtonLanes() {
    const difficulty = useGameStore.getState().difficulty;
    const config = DIFFICULTIES[difficulty];

    this.laneShapes.forEach((shape) => shape.destroy());
    this.laneShapes = [];

    if (!config.showLanes) return;

    const { laneTop, laneBottom, lanes } = this.getButtonLaneBounds();
    if (laneBottom <= laneTop) return;

    lanes.forEach((lane) => {
      if (lane.maxX <= lane.minX) return;

      const graphics = this.add.graphics();
      graphics.fillStyle(0xffffff, 0.1);
      graphics.lineStyle(1, 0xffffff, 0.25);

      const x = lane.minX - BUTTON_RADIUS;
      const y = laneTop - BUTTON_RADIUS;
      const laneWidth = lane.maxX - lane.minX + BUTTON_RADIUS * 2;
      const laneHeight = laneBottom - laneTop + BUTTON_RADIUS * 2;

      graphics.fillRoundedRect(x, y, laneWidth, laneHeight, 14);
      graphics.strokeRoundedRect(x, y, laneWidth, laneHeight, 14);
      graphics.setDepth(-1);
      this.laneShapes.push(graphics);
    });
  }

  private spawnButtons() {
    const difficulty = useGameStore.getState().difficulty;
    const config = DIFFICULTIES[difficulty];

    this.buttonShapes.forEach((shape) => shape.destroy());
    this.buttonShapes = [];

    const { laneTop, laneBottom, lanes } = this.getButtonLaneBounds();
    if (laneBottom <= laneTop) return;

    const placed: { x: number; y: number }[] = [];

    shuffledSet(config.colors).forEach((color, i) => {
      const lane = lanes[i % 2];
      if (lane.maxX <= lane.minX) return;

      let point: { x: number; y: number } | null = null;
      for (let attempt = 0; attempt < BUTTON_PLACEMENT_MAX_ATTEMPTS; attempt++) {
        const candidate = {
          x: Phaser.Math.Between(lane.minX, lane.maxX),
          y: Phaser.Math.Between(laneTop, laneBottom),
        };
        const tooClose = placed.some(
          (p) =>
            Phaser.Math.Distance.Between(p.x, p.y, candidate.x, candidate.y) < BUTTON_MIN_DISTANCE,
        );
        if (!tooClose) {
          point = candidate;
          break;
        }
      }
      if (!point) return;

      placed.push(point);
      const circle = this.add.circle(
        point.x,
        point.y,
        BUTTON_RADIUS,
        parseInt(COLOR_HEX[color].slice(1), 16),
      );
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerdown', () => this.handleButtonTap(color));
      this.buttonShapes.push(circle);
    });
  }

  private createHud() {
    const { width, height } = this.scale;
    const state = useGameStore.getState();

    this.hudScoreText = this.add.text(
      width / 2,
      BAND_HEIGHT / 2,
      `Score ${state.score.toLocaleString()}`,
      { fontSize: '20px', fontStyle: 'bold', color: '#ffffff' },
    );

    this.hudScoreText.setOrigin(0.5);
    this.hudScoreText.setDepth(10);

    const footerY = height - FOOTER_HEIGHT;
    this.add.rectangle(width / 2, footerY + FOOTER_HEIGHT / 2, width, FOOTER_HEIGHT, 0x1a1a1a, 0.6);

    this.hudComboText = this.add.text(
      width / 2,
      footerY + FOOTER_HEIGHT / 2,
      `Combo x${state.combo}`,
      {
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
      },
    );
    this.hudComboText.setOrigin(0.5);

    this.hudJudgmentText = this.add.text(width / 2, footerY + FOOTER_HEIGHT / 2 - 110, '', {
      fontSize: '32px',
      fontStyle: '800',
      color: '#ffffff',
    });
    this.hudJudgmentText.setOrigin(0.5, 0.5);
    this.hudJudgmentText.setAlpha(0);

    this.unsubscribeStore = useGameStore.subscribe((next, prev) => {
      if (next.score !== prev.score) {
        this.hudScoreText.setText(`Score ${next.score.toLocaleString()}`);
        this.playScorePop();
      }
      if (next.combo !== prev.combo) {
        this.hudComboText.setText(`Combo x${next.combo}`);
      }
      if (next.judgmentSeq !== prev.judgmentSeq && next.lastJudgment) {
        this.playJudgmentPop(next.lastJudgment);
      }
    });
  }

  private playScorePop() {
    this.tweens.killTweensOf(this.hudScoreText);
    this.hudScoreText.setScale(1);
    this.hudScoreText.setColor('#ffe066');
    this.tweens.add({
      targets: this.hudScoreText,
      scale: { from: 1.35, to: 1 },
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => this.hudScoreText.setColor('#ffffff'),
    });
  }

  private playJudgmentPop(judgment: Judgment) {
    this.hudJudgmentText.setText(JUDGMENT_LABEL[judgment]);
    this.hudJudgmentText.setColor(JUDGMENT_COLOR[judgment]);
    this.tweens.killTweensOf(this.hudJudgmentText);
    this.hudJudgmentText.setScale(0.6);
    this.hudJudgmentText.setAlpha(1);
    this.tweens.add({
      targets: this.hudJudgmentText,
      scale: { from: 0.6, to: 1.5 },
      duration: 1000,
      ease: 'Cubic.easeOut',
    });
    this.tweens.add({
      targets: this.hudJudgmentText,
      alpha: { from: 1, to: 0.1 },
      delay: 500,
      duration: 500,
      ease: 'Cubic.easeIn',
    });
  }

  private playReactionEffect(sprite: Phaser.GameObjects.Sprite, animKey: string) {
    this.perfectEffectSprite.setVisible(false);
    this.goodEffectSprite.setVisible(false);
    this.notGoodEffectSprite.setVisible(false);
    this.badEffectSprite.setVisible(false);
    this.pendingEffectSprite.setVisible(false);

    sprite.setVisible(true);
    sprite.play(animKey);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      sprite.setVisible(false);
      this.pendingEffectSprite.setVisible(true);
    });
  }

  private handleButtonTap(color: ColorId) {
    const currentTargetColor = useGameStore.getState().currentTargetColor;

    if (color !== currentTargetColor) {
      this.playReactionEffect(this.badEffectSprite, 'bad_anim');
      useGameStore.getState().registerJudgment('bad');
      return;
    }

    const now = performance.now();
    const target = this.bandWords.find((w) => w.color === color) ?? null;
    const absMs = target ? Math.abs(msUntilCenter(target, now)) : Infinity;

    let judgment: Judgment;
    if (absMs <= JUDGE_PERFECT_MS) {
      judgment = 'perfect';
      this.playReactionEffect(this.perfectEffectSprite, 'perfect_anim');
    } else if (absMs <= JUDGE_GOOD_MS) {
      judgment = 'good';
      this.playReactionEffect(this.goodEffectSprite, 'good_anim');
    } else {
      judgment = 'notGood';
      this.playReactionEffect(this.notGoodEffectSprite, 'not_good_anim');
    }

    // if (target) {
    //   this.bandTexts.get(target.id)?.destroy();
    //   this.bandTexts.delete(target.id);
    //   this.bandWords = this.bandWords.filter((w) => w.id !== target.id);
    // }

    useGameStore.getState().registerJudgment(judgment);
  }
}

export function createGameConfig(parent: HTMLDivElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    // backgroundColor: '#1a1a2e',
    // scale: {
    //   mode: Phaser.Scale.FIT,
    //   autoCenter: Phaser.Scale.CENTER_BOTH,
    //   width: 480,
    //   height: 853, // 9:16 비율
    // },
    width: '100%',
    height: '100%',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: MainScene,
  };
}
