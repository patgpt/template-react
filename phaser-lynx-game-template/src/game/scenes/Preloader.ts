import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    const gameTitle = this.add.text(512, 300, 'Pacman', {
      fontFamily: 'Pacman',
      fontSize: '14px',
      color: '#ffff00',
    });
    gameTitle.setOrigin(0.5, 0.2);
    // Create a Pacman-themed loading screen
    const logo = this.add.image(512, 300, 'logo');
    logo.setScale(0.5);
    logo.setAlpha(0);
    logo.setOrigin(0.5, 0.2);

    // Progress bar background
    this.add
      .rectangle(512, 384, 468, 32)
      .setStrokeStyle(4, 0xffff00)
      .setFillStyle(0x000000);

    // Progress bar
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffff00);

    // Loading text
    const loadingText = this.add
      .text(512, 350, 'Loading...', {
        fontFamily: 'Pacman',
        fontSize: '16px',
        color: '#ffff00',
      })
      .setOrigin(0.5);

    this.load.on('progress', (progress: number) => {
      bar.width = 4 + 460 * progress;
      bar.x = 512 - 230 + (460 * progress) / 2;
    });

    this.load.on('complete', () => {
      loadingText.setText('Press Any Key to Start');
      this.input.keyboard?.once('keydown', () => {
        this.scene.start('PacmanGame');
      });
    });
  }

  preload() {
    this.load.setPath('assets');

    // Load Pacman sprites
    for (let i = 1; i <= 3; i++) {
      this.load.image(`pacman-right-${i}`, `pacman-right/${i}.png`);
      this.load.image(`pacman-left-${i}`, `pacman-left/${i}.png`);
      this.load.image(`pacman-up-${i}`, `pacman-up/${i}.png`);
      this.load.image(`pacman-down-${i}`, `pacman-down/${i}.png`);
    }

    // Load game assets
    this.load.image('wall', 'wall.svg');
    this.load.image('dot', 'dot.svg');

    // Load ghost sprites if they exist
    ['red', 'pink', 'blue', 'orange'].forEach((color) => {
      this.load.image(`ghost-${color}`, `ghosts/${color}.png`);
    });
  }
}
