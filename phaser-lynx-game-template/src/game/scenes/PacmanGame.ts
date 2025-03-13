import { Scene } from 'phaser';

export class PacmanGame extends Scene {
  private pacman!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private dots!: Phaser.Physics.Arcade.StaticGroup;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PacmanGame' });
  }

  create() {
    // Create animations
    this.createPacmanAnimations();

    // Initialize score
    this.score = 0;
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      color: '#fff',
    });

    // Create walls group
    this.walls = this.physics.add.staticGroup();

    // Create basic maze layout (just a border for now)
    const mazeWidth = this.scale.width - 200;
    const mazeHeight = this.scale.height - 200;
    const wallThickness = 20;

    // Top and bottom walls
    this.walls
      .create(mazeWidth / 2 + 100, 100, 'wall')
      .setDisplaySize(mazeWidth, wallThickness)
      .refreshBody();
    this.walls
      .create(mazeWidth / 2 + 100, mazeHeight + 100, 'wall')
      .setDisplaySize(mazeWidth, wallThickness)
      .refreshBody();

    // Left and right walls
    this.walls
      .create(100, mazeHeight / 2 + 100, 'wall')
      .setDisplaySize(wallThickness, mazeHeight)
      .refreshBody();
    this.walls
      .create(mazeWidth + 100, mazeHeight / 2 + 100, 'wall')
      .setDisplaySize(wallThickness, mazeHeight)
      .refreshBody();

    // Create dots group
    this.dots = this.physics.add.staticGroup();

    // Add dots in a grid pattern
    const spacing = 40;
    for (let x = 150; x < mazeWidth + 50; x += spacing) {
      for (let y = 150; y < mazeHeight + 50; y += spacing) {
        this.dots.create(x + 50, y + 50, 'dot').setScale(0.2);
      }
    }

    // Create Pacman
    this.pacman = this.physics.add.sprite(150, 150, 'pacman-right-1');
    this.pacman.setCollideWorldBounds(true);
    this.pacman.setScale(0.5);
    this.pacman.play('pacman-right');

    // Setup collisions
    this.physics.add.collider(this.pacman, this.walls);
    this.physics.add.overlap(
      this.pacman,
      this.dots,
      (_: any, dot: any) => {
        (dot as Phaser.Physics.Arcade.Sprite).destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
      },
      undefined,
      this,
    );

    // Setup input
    if (!this.input || !this.input.keyboard) {
      throw new Error('Keyboard input not available');
    }
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  private createPacmanAnimations() {
    // Create animations for each direction
    ['right', 'left', 'up', 'down'].forEach((direction) => {
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
    });
  }

  update() {
    const speed = 200;

    // Reset velocity
    this.pacman.setVelocity(0);

    // Handle movement
    if (this.cursors.left.isDown) {
      this.pacman.setVelocityX(-speed);
      if (this.pacman.anims.getName() !== 'pacman-left') {
        this.pacman.play('pacman-left');
      }
    } else if (this.cursors.right.isDown) {
      this.pacman.setVelocityX(speed);
      if (this.pacman.anims.getName() !== 'pacman-right') {
        this.pacman.play('pacman-right');
      }
    }

    if (this.cursors.up.isDown) {
      this.pacman.setVelocityY(-speed);
      if (this.pacman.anims.getName() !== 'pacman-up') {
        this.pacman.play('pacman-up');
      }
    } else if (this.cursors.down.isDown) {
      this.pacman.setVelocityY(speed);
      if (this.pacman.anims.getName() !== 'pacman-down') {
        this.pacman.play('pacman-down');
      }
    }

    // Stop animation if not moving
    if (
      this.pacman.body?.velocity.x === 0 &&
      this.pacman.body?.velocity.y === 0
    ) {
      this.pacman.anims.pause();
    } else {
      this.pacman.anims.resume();
    }
  }
}
