import { Scene } from 'phaser';

export class BootScene extends Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Debug logging for asset loading
    this.load.on('filecomplete', (key: string) => {
      console.log('Boot: Loaded asset:', key);
    });

    this.load.on('loaderror', (file: any) => {
      console.error('Boot: Error loading asset:', file.key, file.src);
    });

    // Load the logo for the loading screen - use absolute path
    this.load.image('logo', '/assets/pacman-right/1.png');

    // Show loading text
    const loadingText = this.add
      .text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        'Loading...',
        {
          fontSize: '32px',
          color: '#fff',
        },
      )
      .setOrigin(0.5);

    // Add a simple animation
    this.tweens.add({
      targets: loadingText,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  create() {
    console.log('Boot scene complete, starting LoadingScene');
    this.scene.start('LoadingScene');
  }
}
