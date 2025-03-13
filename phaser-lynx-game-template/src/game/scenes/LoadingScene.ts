import { Scene } from 'phaser';

export class LoadingScene extends Scene {
  private logo!: Phaser.GameObjects.Image;
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private instructionsText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetsLoaded = false;
  private gameTitle!: Phaser.GameObjects.Text;
  constructor() {
    super('LoadingScene');
    console.log('LoadingScene: Constructor');
  }

  preload() {
    console.log('LoadingScene: Preload started');
    this.cameras.main.setBackgroundColor('#000000');

    // Create progress bar background
    const progressBarBg = this.add.graphics();
    progressBarBg.fillStyle(0x222222, 0.8);
    progressBarBg.fillRect(
      this.cameras.main.width / 2 - 160,
      this.cameras.main.height / 2 - 15,
      320,
      30,
    );

    // Create logo or use fallback
    try {
      if (this.textures.exists('logo')) {
        console.log('LoadingScene: Logo texture exists, creating image');
        this.logo = this.add.image(
          this.cameras.main.width / 4,
          this.cameras.main.height / 4,
          'logo',
        );
        this.logo.setScale(0.2);
        this.logo.setAlpha(0);
        this.logo.setOrigin(0.5, 0.2);

        // Add glow effect to logo
        this.logo.setPipeline('Light2D');
        this.logo.preFX?.addGlow(0x00ff00, 0.5, 0, false, 0.1, 16);
      } else {
        console.warn('LoadingScene: Logo texture missing, creating fallback');
        this.createFallbackAsset(
          'logo',
          'logo',
          this.cameras.main.width / 2,
          this.cameras.main.height / 2 - 100,
        );
      }
    } catch (error) {
      console.error('LoadingScene: Error creating logo:', error);
      this.createFallbackAsset(
        'logo',
        'logo',
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 100,
      );
    }

    // Create loading bar
    this.loadingBar = this.add.graphics();
    this.loadingBar.setDepth(1);
    this.gameTitle = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 100,
      'Pacman',
      {
        font: '24px Pacman',
        color: '#ffffff',
      },
    );
    this.gameTitle.setOrigin(0.5, 0.2);
    this.gameTitle.setDepth(1);
    this.gameTitle.setAlpha(0);

    // Loading text
    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      'Loading...',
      {
        font: '20px PressStart2P',
        color: '#ffffff',
      },
    );
    this.loadingText.setOrigin(0.5);
    this.loadingText.setDepth(1);

    // Percentage text
    this.percentText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '0%',
      {
        font: '18px PressStart2P',
        color: '#ffffff',
      },
    );
    this.percentText.setOrigin(0.5);
    this.percentText.setDepth(1);

    // Instructions (hidden initially)
    this.instructionsText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 80,
      'Use ARROW KEYS to move\nEat all the dots to win!',
      {
        font: '20px Arial',
        color: '#ffffff',
        align: 'center',
      },
    );
    this.instructionsText.setOrigin(0.5);
    this.instructionsText.setDepth(1);
    this.instructionsText.setAlpha(0);

    // Register loading progress events
    this.load.on('progress', (value: number) => {
      console.log(
        `LoadingScene: Loading progress: ${Math.floor(value * 100)}%`,
      );
      this.percentText.setText(`${Math.floor(value * 100)}%`);
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x00ff00, 1);
      this.loadingBar.fillRect(
        this.cameras.main.width / 2 - 150,
        this.cameras.main.height / 2 - 10,
        300 * value,
        20,
      );
    });

    this.load.on('complete', () => {
      console.log('LoadingScene: Loading complete');
      this.assetsLoaded = true;
      this.loadingText.setText('PRESS ANY KEY TO START');
      this.loadingText.setColor('#ffff00');
      this.loadingText.setFontSize(16);

      // Show instructions with fade-in
      this.tweens.add({
        targets: this.instructionsText,
        alpha: 1,
        duration: 1000,
        ease: 'Linear',
      });

      // Create pulse animation for text
      this.tweens.add({
        targets: [this.loadingText, this.instructionsText],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Add input listener for any key
      this.input.keyboard?.once('keydown', this.handleKeyPress, this);
    });

    this.load.on('filecomplete', (key: string) => {
      console.log(`LoadingScene: File complete: ${key}`);
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`LoadingScene: Error loading file: ${file.key}`, file);
      this.createFallbackAsset(file.key, file.type, 0, 0);
    });

    // Start loading game assets
    console.log('LoadingScene: Loading game assets...');

    // Load pacman sprites
    for (const direction of ['right', 'left', 'up', 'down']) {
      for (let i = 1; i <= 3; i++) {
        const key = `pacman-${direction}-${i}`;
        this.load.image(key, `/assets/sprites/pacman/${key}.png`);
        console.log(`LoadingScene: Added ${key} to load queue`);
      }
    }

    // Load maze assets
    this.load.image('wall', '/assets/sprites/maze/wall.png');
    this.load.image('dot', '/assets/sprites/maze/dot.png');

    // Load ghost sprites
    const ghostColors = ['red', 'blue', 'pink', 'orange'];
    for (const color of ghostColors) {
      const key = `ghost-${color}`;
      this.load.image(key, `/assets/sprites/ghosts/${key}.png`);
      console.log(`LoadingScene: Added ${key} to load queue`);
    }

    // Create fallback assets for any assets that fail to load
    this.load.on('complete', this.createAllFallbackAssets, this);
  }

  create() {
    console.log('LoadingScene: Create method called');
    this.createAnimations();
  }

  private createAnimations() {
    try {
      console.log('LoadingScene: Creating animations');

      // Create pacman animations for each direction
      ['right', 'left', 'up', 'down'].forEach((direction) => {
        if (!this.anims.exists(`pacman-${direction}`)) {
          try {
            this.anims.create({
              key: `pacman-${direction}`,
              frames: [
                { key: `pacman-${direction}-1` },
                { key: `pacman-${direction}-2` },
                { key: `pacman-${direction}-3` },
                { key: `pacman-${direction}-2` },
              ],
              frameRate: 10,
              repeat: -1,
            });
            console.log(`LoadingScene: Created animation: pacman-${direction}`);
          } catch (error) {
            console.error(
              `LoadingScene: Failed to create animation: pacman-${direction}`,
              error,
            );
          }
        } else {
          console.log(
            `LoadingScene: Animation already exists: pacman-${direction}`,
          );
        }
      });
    } catch (error) {
      console.error('LoadingScene: Error creating animations:', error);
    }
  }

  // Handle key press to start the game
  private handleKeyPress(event: Phaser.Input.Keyboard.Key): void {
    console.log('Key pressed:', event.keyCode);
    if (this.assetsLoaded) {
      this.loadingText.setText('Starting Game...');
      this.scene.start('GameScene');
      this.sound.unlock();
    }
  }

  private createAllFallbackAssets() {
    console.log(
      'LoadingScene: Creating fallback assets for any missing textures',
    );

    // Check and create placeholders for all required assets

    // Pacman sprites
    for (const direction of ['right', 'left', 'up', 'down']) {
      for (let i = 1; i <= 3; i++) {
        const key = `pacman-${direction}-${i}`;
        if (!this.textures.exists(key)) {
          this.createFallbackAsset(key, 'image', 0, 0);
        }
      }
    }

    // Maze assets
    if (!this.textures.exists('wall')) {
      this.createFallbackAsset('wall', 'image', 0, 0);
    }

    if (!this.textures.exists('dot')) {
      this.createFallbackAsset('dot', 'image', 0, 0);
    }

    // Ghost sprites
    const ghostColors = ['red', 'blue', 'pink', 'orange'];
    for (const color of ghostColors) {
      const key = `ghost-${color}`;
      if (!this.textures.exists(key)) {
        this.createFallbackAsset(key, 'image', 0, 0);
      }
    }

    console.log('LoadingScene: Fallback asset creation complete');
  }

  // Create fallback graphics for missing assets
  private createFallbackAsset(key: string, type: string, x: number, y: number) {
    console.log(`LoadingScene: Creating fallback asset for ${key}`);

    const graphics = this.make.graphics({ x, y });

    if (key === 'logo') {
      // Create a simple logo - a yellow circle with a mouth (pacman-like)
      graphics.fillStyle(0xffff00);
      graphics.fillCircle(125, 125, 100);

      // Add a mouth
      graphics.fillStyle(0x000000);
      graphics.slice(
        125,
        125,
        100,
        Phaser.Math.DegToRad(30),
        Phaser.Math.DegToRad(330),
        true,
      );
      graphics.fillPath();

      // Add text
      graphics.generateTexture(key, 250, 250);
      graphics.destroy();

      // Create the logo sprite
      const logo = this.add.image(x, y, key);
      logo.setScale(0.3);

      return logo;
    }

    // For pacman sprites
    if (key.startsWith('pacman')) {
      graphics.fillStyle(0xffff00);
      graphics.fillCircle(16, 16, 16);

      // Add mouth based on direction
      graphics.fillStyle(0x000000);

      if (key.includes('right')) {
        // Right direction - mouth opens to the right
        graphics.slice(
          16,
          16,
          16,
          Phaser.Math.DegToRad(30),
          Phaser.Math.DegToRad(330),
          true,
        );
      } else if (key.includes('left')) {
        // Left direction - mouth opens to the left
        graphics.slice(
          16,
          16,
          16,
          Phaser.Math.DegToRad(210),
          Phaser.Math.DegToRad(150),
          true,
        );
      } else if (key.includes('up')) {
        // Up direction - mouth opens upward (FIX: Correct angles)
        graphics.slice(
          16,
          16,
          16,
          Phaser.Math.DegToRad(300),
          Phaser.Math.DegToRad(240),
          true,
        );
      } else if (key.includes('down')) {
        // Down direction - mouth opens downward (FIX: Correct angles)
        graphics.slice(
          16,
          16,
          16,
          Phaser.Math.DegToRad(120),
          Phaser.Math.DegToRad(60),
          true,
        );
      }

      graphics.fillPath();
    }
    // For ghost sprites
    else if (key.includes('ghost')) {
      // Set color based on ghost type
      let color = 0xff0000; // Default red
      if (key.includes('pink')) color = 0xff69b4;
      if (key.includes('blue')) color = 0x0000ff;
      if (key.includes('orange')) color = 0xffa500;

      // Draw the ghost body
      graphics.fillStyle(color);

      // Head/body (top rounded rectangle)
      graphics.beginPath();
      graphics.fillRoundedRect(0, 0, 32, 24, 8);

      // Bottom part (with waves)
      graphics.fillRect(0, 16, 32, 8);

      // Wavy bottom
      graphics.beginPath();
      graphics.moveTo(0, 24);
      graphics.lineTo(4, 28);
      graphics.lineTo(8, 24);
      graphics.lineTo(12, 28);
      graphics.lineTo(16, 24);
      graphics.lineTo(20, 28);
      graphics.lineTo(24, 24);
      graphics.lineTo(28, 28);
      graphics.lineTo(32, 24);
      graphics.fillPath();

      // Add eyes
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(10, 12, 4);
      graphics.fillCircle(22, 12, 4);

      graphics.fillStyle(0x000000);
      graphics.fillCircle(12, 12, 2);
      graphics.fillCircle(24, 12, 2);
    }
    // For wall
    else if (key === 'wall') {
      // Blue wall
      graphics.fillStyle(0x0000ff);
      graphics.fillRect(0, 0, 32, 32);
    }
    // For dot
    else if (key === 'dot') {
      // White dot
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(4, 4, 4);
    }
    // Default placeholder
    else {
      // Purple placeholder
      graphics.fillStyle(0xff00ff);
      graphics.fillRect(0, 0, 32, 32);

      // Add text with the key name
      const textObject = this.add.text(16, 16, key.substring(0, 4), {
        font: '10px Arial',
        color: '#ffffff',
      });
      textObject.setOrigin(0.5);
      textObject.setDepth(1);

      // Add to the texture
      const rt = this.add.renderTexture(0, 0, 32, 32);
      rt.draw(graphics, 0, 0);
      rt.draw(textObject, 16, 16);
      rt.saveTexture(key);

      rt.destroy();
      textObject.destroy();
      graphics.destroy();

      console.log(`LoadingScene: Created generic fallback for ${key}`);
      return;
    }

    // Generate and save the texture
    graphics.generateTexture(key, 32, 32);
    graphics.destroy();

    console.log(`LoadingScene: Created specific fallback for ${key}`);
  }

  update() {
    // Bounce/pulse effect for loading text
    if (this.assetsLoaded && this.loadingText) {
      this.loadingText.setAlpha(
        0.5 + Math.abs(Math.sin(this.time.now / 500)) * 0.5,
      );
    }
  }
}
