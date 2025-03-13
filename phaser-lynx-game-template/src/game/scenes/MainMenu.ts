import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  title: GameObjects.Text;
  logoTween: Phaser.Tweens.Tween | null;
  gameTitle: GameObjects.Text;
  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;

    this.background = this.add.image(512, 384, 'background');

    this.logo = this.add.image(width * 0.5, height * 0.5, 'logo').setDepth(100);

    this.logo.setInteractive().on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.tweens.add({
        targets: this.logo,
        y: this.logo.y + 10,
        duration: 100,
        yoyo: true,
      });
    });

    this.title = this.add
      .text(768, 460, 'Main Menu', {
        fontFamily: 'PressStart2P',
        fontSize: 46,
        resolution: 2,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.add
      .text(width * 0.5, height * 0.7, 'Start Pacman', {
        fontSize: '32px',
        color: '#fff',
      })
      .setOrigin(0.5)
      .setInteractive()
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.scene.start('PacmanGame');
      });

    EventBus.emit('current-scene-ready', this);
  }

  changeScene() {
    if (this.logoTween) {
      this.logoTween.stop();
      this.logoTween = null;
    }

    this.scene.start('Game');
  }

  moveLogo(vueCallback: ({ x, y }: { x: number; y: number }) => void) {
    if (this.logoTween) {
      if (this.logoTween.isPlaying()) {
        this.logoTween.pause();
      } else {
        this.logoTween.play();
      }
    } else {
      this.logoTween = this.tweens.add({
        targets: this.logo,
        x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
        y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (vueCallback) {
            vueCallback({
              x: Math.floor(this.logo.x),
              y: Math.floor(this.logo.y),
            });
          }
        },
      });
    }
  }
}
