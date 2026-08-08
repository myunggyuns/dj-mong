import Phaser from 'phaser';
import tapMongPerfectReaction from '../assets/tap-mong-perfect.png';
import tapMongGoodReaction from '../assets/tap-mong-good.png';
import tapMongNotGoodReaction from '../assets/tap-mong-notgood.png';
import tapMongBadReaction from '../assets/tap-mong-bad.png';
import tapMongPendingReaction from '../assets/tap-mong-pending.png';

import tapMongBG from '../assets/tap-mong-bg.png';
import perfectSound from '../assets/effects/perfect.mp4';
import goodSound from '../assets/effects/good.mp4';
import notGoodSound from '../assets/effects/not_good.mp4';
import badSound from '../assets/effects/bad.mp4';
import backgroundSound from '../assets/effects/tap_mong_bgm.mp4';

import { useGameStore, type Judgment } from '../store/gameStore';
import {
  DIFFICULTIES,
  COLOR_HEX,
  type ColorId,
  JUDGMENT_COLOR,
  JUDGMENT_LABEL,
} from '../store/difficulties';

import {
  shuffledSet,
  lerp,
  createWord,
  progressOf,
  centerOverlapRatio,
  withAlpha,
  shadeColor,
  type BandWord,
} from '../utils/game';

import {
  BAND_SESSION_SECONDS,
  BAND_BASE_INTERVAL_MS,
  BAND_MIN_INTERVAL_MS,
  BAND_BASE_TRAVEL_MS,
  BAND_MIN_TRAVEL_MS,
  BAND_HEIGHT,
  BAND_MARGIN_X,
  BAND_ZONE_WIDTH,
  BUTTON_RADIUS,
  BUTTON_GLOW_PADDING,
  BUTTON_PRESS_SCALE,
  BUTTON_MIN_DISTANCE,
  BUTTON_LANE_EDGE_MARGIN,
  BUTTON_CHARACTER_EXCLUSION_HALF_WIDTH,
  BUTTON_VERTICAL_TOP_MARGIN,
  BUTTON_VERTICAL_BOTTOM_MARGIN,
  BUTTON_PLACEMENT_MAX_ATTEMPTS,
  TAP_MONG_RATIO,
  JUDGE_PERFECT_OVERLAP_RATIO,
  JUDGE_GOOD_OVERLAP_RATIO,
  JUDGE_NOT_GOOD_OVERLAP_RATIO,
  FOOTER_HEIGHT,
  TUTORIAL_BAND_TARGET_LAYOUT,
} from '../constant/game';

export class MainScene extends Phaser.Scene {
  private bandWords: BandWord[] = [];
  private bandTexts = new Map<number, Phaser.GameObjects.Text>();
  private bandQueue: ColorId[] = [];
  private bandLastSpawnMs = 0;
  private bandStartMs = 0;
  private tutorialDemoWordSpawned = false;
  private judgedWordIds = new Set<number>();

  private buttonShapes: Phaser.GameObjects.Image[] = [];

  private hudScoreText!: Phaser.GameObjects.Text;
  private hudComboText!: Phaser.GameObjects.Text;
  private hudJudgmentText!: Phaser.GameObjects.Text;
  private unsubscribeStore: (() => void) | null = null;
  private unsubscribePause: (() => void) | null = null;
  private unsubscribeGameStart: (() => void) | null = null;

  // iOS Safari는 <audio>/Web Audio로 낸 소리는 무음 스위치를 따라 꺼버리지만,
  // <video>의 오디오 트랙은 예외적으로 무음 스위치를 무시하고 재생된다. 그래서
  // Phaser의 사운드 매니저 대신 숨겨진 video 엘리먼트로 직접 재생한다.
  private soundVideos = new Map<string, HTMLVideoElement>();

  // 일시정지 동안 흐른 실제 시간을 빼서 밴드 로직이 쓰는 시계가
  // 정지 구간만큼 멈춰 있던 것처럼 보이게 만든다.
  private pausedAccumMs = 0;
  private pauseStartedAt: number | null = null;

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
    this.load.spritesheet('perfect_effect', tapMongPerfectReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet('good_effect', tapMongGoodReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet('not_good_effect', tapMongNotGoodReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet('bad_effect', tapMongBadReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet('pending_effect', tapMongPendingReaction, {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.image('background', tapMongBG);

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error('[MainScene] failed to load asset', file.key, file.src);
    });
  }

  private createSoundVideos() {
    const sources: Record<string, string> = {
      background_sound: backgroundSound,
      perfect_sound: perfectSound,
      good_sound: goodSound,
      not_good_sound: notGoodSound,
      bad_sound: badSound,
    };

    Object.entries(sources).forEach(([key, src]) => {
      const video = document.createElement('video');
      video.src = src;
      video.preload = 'auto';
      video.playsInline = true;
      video.loop = key === 'background_sound';
      video.volume = key === 'background_sound' ? 0.3 : 1;
      video.style.position = 'fixed';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      document.body.appendChild(video);
      this.soundVideos.set(key, video);
    });
  }

  private playTrack(key: string) {
    const video = this.soundVideos.get(key);
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }

  create() {
    const { width, height } = this.scale;

    const canvas = this.game.canvas;
    canvas.style.touchAction = 'manipulation';
    canvas.addEventListener('dblclick', (e) => e.preventDefault());
    let lastTouchEnd = 0;
    canvas.addEventListener(
      'touchend',
      (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
      },
      { passive: false },
    );

    const bg = this.add.image(width / 2, height / 2, 'background');
    bg.setDisplaySize(width, height);

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
    this.perfectEffectSprite.setScale(TAP_MONG_RATIO + 0.15);
    this.perfectEffectSprite.setVisible(false);

    this.goodEffectSprite = this.add.sprite(width / 2, height / 2, 'good_effect', 0);
    this.goodEffectSprite.setScale(TAP_MONG_RATIO);
    this.goodEffectSprite.setVisible(false);

    this.notGoodEffectSprite = this.add.sprite(width / 2, height / 2, 'not_good_effect', 0);
    this.notGoodEffectSprite.setScale(TAP_MONG_RATIO);
    this.notGoodEffectSprite.setVisible(false);

    this.badEffectSprite = this.add.sprite(width / 2, height / 2, 'bad_effect', 0);
    this.badEffectSprite.setScale(TAP_MONG_RATIO);
    this.badEffectSprite.setVisible(false);

    this.pendingEffectSprite = this.add.sprite(width / 2, height / 2, 'pending_effect', 0);
    this.pendingEffectSprite.setScale(TAP_MONG_RATIO);
    this.pendingEffectSprite.play('pending_anim');

    this.createColorBand();
    // this.drawButtonLanes();
    this.spawnButtons();
    this.createHud();
    this.createSoundVideos();
    this.watchPauseState();
    this.watchGameStart();

    const cleanup = () => {
      this.unsubscribeStore?.();
      this.unsubscribePause?.();
      this.unsubscribeGameStart?.();
      this.soundVideos.forEach((video) => video.remove());
      this.soundVideos.clear();
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  // PlayScreen의 "시작하기" 모달을 탭하는 순간(=진짜 유저 제스처 콜스택 안) 이 콜백이
  // 동기적으로 실행된다. 그 자리에서 바로 BGM을 재생해야 iOS Safari 등에서 오토플레이
  // 정책에 안 걸리고 확실하게 소리가 난다.
  private watchGameStart() {
    if (useGameStore.getState().hasStarted) this.beginSession();

    this.unsubscribeGameStart = useGameStore.subscribe((next, prev) => {
      if (next.hasStarted === prev.hasStarted || !next.hasStarted) return;
      this.beginSession();
    });
  }

  private beginSession() {
    this.bandStartMs = performance.now();
    this.bandLastSpawnMs = 0;
    this.playTrack('background_sound');
  }

  private watchPauseState() {
    this.unsubscribePause = useGameStore.subscribe((next, prev) => {
      if (next.isPaused === prev.isPaused) return;
      if (next.isPaused) {
        this.pauseStartedAt = performance.now();
        this.scene.pause();
      } else {
        if (this.pauseStartedAt !== null) {
          this.pausedAccumMs += performance.now() - this.pauseStartedAt;
          this.pauseStartedAt = null;
        }
        this.scene.resume();
      }
    });
  }

  // 일시정지로 멈춰 있던 시간만큼 뒤로 당긴 논리 시계. 밴드 스폰 간격/이동 진행률처럼
  // performance.now() 기준으로 계산하는 로직은 전부 이 값을 써야 정지 후 재개했을 때
  // 밴드가 멈춰 있던 시간만큼 순간이동하지 않는다.
  private getLogicalNow(): number {
    return performance.now() - this.pausedAccumMs;
  }

  update() {
    const tutorialStep = useGameStore.getState().tutorialStep;

    // Step 2 demos the band with a single word instead of the live, endless
    // stream, so the player can read the popover without the band racing on.
    if (tutorialStep === 2) {
      this.updateColorBand(this.getLogicalNow(), true);
      return;
    }
    if (tutorialStep !== null) return;
    if (!useGameStore.getState().hasStarted) return;

    this.updateColorBand(this.getLogicalNow(), false);
  }

  private createColorBand() {
    const { width } = this.scale;
    const difficulty = useGameStore.getState().difficulty;
    const config = DIFFICULTIES[difficulty];

    this.bandQueue = shuffledSet(config.colors);
    this.bandWords = [];
    this.bandStartMs = performance.now();
    this.bandLastSpawnMs = 0;
    this.judgedWordIds.clear();

    const yPosition = TUTORIAL_BAND_TARGET_LAYOUT.top + TUTORIAL_BAND_TARGET_LAYOUT.height / 2;
    const railHeight = TUTORIAL_BAND_TARGET_LAYOUT.height;
    this.add.rectangle(width / 2, yPosition, width, railHeight, 0x333333, 0.45);

    const zone = this.add.graphics();
    zone.fillStyle(0xb89bf0, 0.18);
    zone.lineStyle(1, 0xb89bf0, 0.4);

    const zoneX = width / 2 - BAND_ZONE_WIDTH / 2;
    zone.fillRoundedRect(zoneX, 51, BAND_ZONE_WIDTH, BAND_HEIGHT - 8, 10);
    zone.strokeRoundedRect(zoneX, 51, BAND_ZONE_WIDTH, BAND_HEIGHT - 8, 10);
  }

  private updateColorBand(now: number, singleDemoWord: boolean) {
    const { width } = this.scale;
    const difficulty = useGameStore.getState().difficulty;
    const config = DIFFICULTIES[difficulty];

    const elapsed = now - this.bandStartMs;
    const elapsedRatio = elapsed / (BAND_SESSION_SECONDS * 1000);
    const interval =
      lerp(BAND_BASE_INTERVAL_MS, BAND_MIN_INTERVAL_MS, elapsedRatio) / config.speedMultiplier;
    const travel =
      lerp(BAND_BASE_TRAVEL_MS, BAND_MIN_TRAVEL_MS, elapsedRatio) / config.speedMultiplier;

    const canSpawn = !singleDemoWord || !this.tutorialDemoWordSpawned;

    if (canSpawn && elapsed - this.bandLastSpawnMs >= interval) {
      this.bandLastSpawnMs = elapsed;
      if (singleDemoWord) this.tutorialDemoWordSpawned = true;
      if (this.bandQueue.length === 0) {
        this.bandQueue = shuffledSet(config.colors);
        if (!singleDemoWord) this.spawnButtons();
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
      this.judgedWordIds.delete(w.id);
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

  // 색상별 캔버스 텍스처를 한 번만 생성해 캐싱한다: radial-gradient 하이라이트/그림자,
  // 바깥쪽 glow, 안쪽 위-밝음/아래-어두움 립(inset shadow처럼 보이게)까지 직접 그린다.
  private ensureButtonTexture(color: ColorId): string {
    const key = `btn-${color}`;
    if (this.textures.exists(key)) return key;

    const hex = COLOR_HEX[color];
    const size = (BUTTON_RADIUS + BUTTON_GLOW_PADDING) * 2;
    const center = size / 2;

    const canvasTexture = this.textures.createCanvas(key, size, size);
    if (!canvasTexture) return key;
    const ctx = canvasTexture.context;

    ctx.save();
    ctx.shadowColor = withAlpha(hex, 0.85);
    ctx.shadowBlur = BUTTON_GLOW_PADDING;
    ctx.beginPath();
    ctx.arc(center, center, BUTTON_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();
    ctx.restore();

    const gradient = ctx.createRadialGradient(
      center - BUTTON_RADIUS * 0.35,
      center - BUTTON_RADIUS * 0.4,
      BUTTON_RADIUS * 0.1,
      center,
      center,
      BUTTON_RADIUS * 1.05,
    );
    gradient.addColorStop(0, shadeColor(hex, 45));
    gradient.addColorStop(0.55, hex);
    gradient.addColorStop(1, shadeColor(hex, -35));

    ctx.beginPath();
    ctx.arc(center, center, BUTTON_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, BUTTON_RADIUS, 0, Math.PI * 2);
    ctx.clip();

    const topShine = ctx.createLinearGradient(0, center - BUTTON_RADIUS, 0, center);
    topShine.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    topShine.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topShine;
    ctx.fillRect(0, center - BUTTON_RADIUS, size, BUTTON_RADIUS);

    const bottomShade = ctx.createLinearGradient(0, center, 0, center + BUTTON_RADIUS);
    bottomShade.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomShade.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = bottomShade;
    ctx.fillRect(0, center, size, BUTTON_RADIUS);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, BUTTON_RADIUS - 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    canvasTexture.refresh();
    return key;
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
      const textureKey = this.ensureButtonTexture(color);
      const button = this.add.image(point.x, point.y, textureKey);
      button.setInteractive({
        hitArea: new Phaser.Geom.Circle(button.width / 2, button.height / 2, BUTTON_RADIUS),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: true,
      });

      const settle = () => {
        this.tweens.killTweensOf(button);
        this.tweens.add({
          targets: button,
          scale: 1,
          duration: 120,
          ease: 'Back.easeOut',
        });
      };

      button.on('pointerdown', () => {
        this.tweens.killTweensOf(button);
        this.tweens.add({
          targets: button,
          scale: BUTTON_PRESS_SCALE,
          duration: 80,
          ease: 'Quad.easeOut',
        });
        this.handleButtonTap(color);
      });
      button.on('pointerup', settle);
      button.on('pointerout', settle);

      this.buttonShapes.push(button);
    });
  }

  private createHud() {
    const { width, height } = this.scale;
    const state = useGameStore.getState();

    this.hudScoreText = this.add.text(
      width / 2,
      BAND_HEIGHT / 2,
      `Score ${state.score.toLocaleString()}`,
      {
        fontFamily: '"Chakra Petch", sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
      },
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
    this.hudScoreText.setColor('#b89bf0');
    this.tweens.add({
      targets: this.hudScoreText,
      scale: { from: 1, to: 1.25 },
      duration: 150,
      ease: 'Cubic.easeOut',
      yoyo: true,
      onYoyo: () => this.hudScoreText.setColor('#ffffff'),
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
      alpha: { from: 1, to: 0 },
      delay: 500,
      duration: 500,
      ease: 'Cubic.easeIn',
    });
  }

  private playReactionEffect(sprite: Phaser.GameObjects.Sprite, animKey: string, soundKey: string) {
    [
      this.perfectEffectSprite,
      this.goodEffectSprite,
      this.notGoodEffectSprite,
      this.badEffectSprite,
    ].forEach((s) => {
      s.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
      s.stop();
      s.setVisible(false);
    });
    this.pendingEffectSprite.setVisible(false);

    sprite.setVisible(true);
    sprite.play(animKey);
    this.playTrack(soundKey);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      sprite.setVisible(false);
      this.pendingEffectSprite.setVisible(true);
    });
  }

  private handleButtonTap(color: ColorId) {
    if (useGameStore.getState().tutorialStep !== null) return;
    if (useGameStore.getState().isPaused) return;
    if (!useGameStore.getState().hasStarted) return;

    const currentTargetColor = useGameStore.getState().currentTargetColor;

    if (color !== currentTargetColor) {
      this.playReactionEffect(this.badEffectSprite, 'bad_anim', 'bad_sound');
      useGameStore.getState().registerJudgment('bad');
      return;
    }

    const now = this.getLogicalNow();
    const target =
      this.bandWords.find((w) => w.color === color && !this.judgedWordIds.has(w.id)) ?? null;
    if (!target) return;
    this.judgedWordIds.add(target.id);

    const bandInnerWidth = this.scale.width - BAND_MARGIN_X * 2;
    const targetText = this.bandTexts.get(target.id);
    const overlapRatio = targetText
      ? centerOverlapRatio(target, now, bandInnerWidth, this.scale.width, targetText.width)
      : 0;

    let judgment: Judgment;
    if (overlapRatio >= JUDGE_PERFECT_OVERLAP_RATIO) {
      judgment = 'perfect';
      this.playReactionEffect(this.perfectEffectSprite, 'perfect_anim', 'perfect_sound');
    } else if (overlapRatio >= JUDGE_GOOD_OVERLAP_RATIO) {
      judgment = 'good';
      this.playReactionEffect(this.goodEffectSprite, 'good_anim', 'good_sound');
    } else if (overlapRatio >= JUDGE_NOT_GOOD_OVERLAP_RATIO) {
      judgment = 'notGood';
      this.playReactionEffect(this.notGoodEffectSprite, 'not_good_anim', 'not_good_sound');
    } else {
      judgment = 'bad';
      this.playReactionEffect(this.badEffectSprite, 'bad_anim', 'bad_sound');
    }
    if (target) {
      this.bandTexts.get(target.id)?.destroy();
      this.bandTexts.delete(target.id);
      this.bandWords = this.bandWords.filter((w) => w.id !== target.id);
    }

    useGameStore.getState().registerJudgment(judgment);
  }

  // private drawButtonLanes() {
  //   const difficulty = useGameStore.getState().difficulty;
  //   const config = DIFFICULTIES[difficulty];

  //   this.laneShapes.forEach((shape) => shape.destroy());
  //   this.laneShapes = [];

  //   if (!config.showLanes) return;

  //   const { laneTop, laneBottom, lanes } = this.getButtonLaneBounds();
  //   if (laneBottom <= laneTop) return;

  //   lanes.forEach((lane) => {
  //     if (lane.maxX <= lane.minX) return;

  //     const graphics = this.add.graphics();
  //     graphics.fillStyle(0xffffff, 0.1);
  //     graphics.lineStyle(1, 0xffffff, 0.25);

  //     const x = lane.minX - BUTTON_RADIUS;
  //     const y = laneTop - BUTTON_RADIUS;
  //     const laneWidth = lane.maxX - lane.minX + BUTTON_RADIUS * 2;
  //     const laneHeight = laneBottom - laneTop + BUTTON_RADIUS * 2;

  //     graphics.fillRoundedRect(x, y, laneWidth, laneHeight, 14);
  //     graphics.strokeRoundedRect(x, y, laneWidth, laneHeight, 14);
  //     graphics.setDepth(-1);
  //     this.laneShapes.push(graphics);
  //   });
  // }
}

export function createGameConfig(parent: HTMLDivElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: '100%',
    height: '100%',
    // audio: { disableWebAudio: true },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: true,
      },
    },
    scene: MainScene,
  };
}
