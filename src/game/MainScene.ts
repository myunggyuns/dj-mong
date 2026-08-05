import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;
  private pointerX: number | null = null;

  constructor() {
    super('MainScene');
  }

  preload() {
    // TODO: 실제 아트로 교체. 지금은 기본 스프라이트로 프로토타이핑.
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
    this.load.image('coin', 'https://labs.phaser.io/assets/sprites/star.png');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(16, 16, 'DJ Mong', {
      fontSize: '18px',
      color: '#ffffff',
    });

    this.player = this.physics.add.sprite(width / 2, height - 100, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.8);

    const coins = this.physics.add.group({
      key: 'coin',
      repeat: 5,
      setXY: { x: 40, y: 120, stepX: (width - 80) / 5 },
    });

    this.physics.add.overlap(this.player, coins, (_player, coin) => {
      (coin as Phaser.Physics.Arcade.Sprite).destroy();
      this.score += 10;
      this.scoreText.setText(`Score: ${this.score}`);
    });

    this.scoreText = this.add.text(16, 44, 'Score: 0', {
      fontSize: '16px',
      color: '#ffffff',
    });

    // 세로 모바일 게임 기준 터치/드래그 컨트롤: 화면을 누른 x좌표로 플레이어 이동
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.pointerX = p.x;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.pointerX = p.x;
    });
    this.input.on('pointerup', () => {
      this.pointerX = null;
    });
  }

  update() {
    const speed = 300;
    if (this.pointerX !== null) {
      const dx = this.pointerX - this.player.x;
      if (Math.abs(dx) > 4) {
        this.player.setVelocityX(Phaser.Math.Clamp(dx * 5, -speed, speed));
      } else {
        this.player.setVelocityX(0);
      }
    } else {
      this.player.setVelocityX(0);
    }
  }
}

export function createGameConfig(parent: HTMLDivElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 480,
      height: 853, // 9:16 비율
    },
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
