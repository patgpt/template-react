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

  preload() {
    // Load assets
    this.load.image('pacman', 'assets/pacman.png');
    this.load.image('wall', 'assets/wall.png');
    this.load.image('dot', 'assets/dot.png');
  }

  create() {
    // Initialize score
    this.score = 0;
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      color: '#fff',
    });

    // Create walls group
    this.walls = this.physics.add.staticGroup();

    // Create basic maze layout (just a border for now)
    const mazeWidth = this.scale.width - 100;
    const mazeHeight = this.scale.height - 100;
    const wallThickness = 20;

    // Top and bottom walls
    this.walls
      .create(mazeWidth / 2 + 50, 50, 'wall')
      .setDisplaySize(mazeWidth, wallThickness)
      .refreshBody();
    this.walls
      .create(mazeWidth / 2 + 50, mazeHeight + 50, 'wall')
      .setDisplaySize(mazeWidth, wallThickness)
      .refreshBody();

    // Left and right walls
    this.walls
      .create(50, mazeHeight / 2 + 50, 'wall')
      .setDisplaySize(wallThickness, mazeHeight)
      .refreshBody();
    this.walls
      .create(mazeWidth + 50, mazeHeight / 2 + 50, 'wall')
      .setDisplaySize(wallThickness, mazeHeight)
      .refreshBody();

    // Create dots group
    this.dots = this.physics.add.staticGroup();

    // Add dots in a grid pattern
    const spacing = 40;
    for (let x = 100; x < mazeWidth; x += spacing) {
      for (let y = 100; y < mazeHeight; y += spacing) {
        this.dots.create(x + 50, y + 50, 'dot').setScale(0.2);
      }
    }

    // Create Pacman
    this.pacman = this.physics.add.sprite(100, 100, 'pacman');
    this.pacman.setCollideWorldBounds(true);
    this.pacman.setScale(0.5);

    // Setup collisions
    this.physics.add.collider(this.pacman, this.walls);
    this.physics.add.overlap(
      this.pacman,
      this.dots,
      this.collectDot,
      undefined,
      this,
    );

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  private collectDot(
    _: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    dot: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    const dotSprite = dot as Phaser.Physics.Arcade.Sprite;
    if (dotSprite) {
      dotSprite.destroy();
      this.score += 10;
      this.scoreText.setText('Score: ' + this.score);
    }
  }

  update() {
    const speed = 200;

    // Reset velocity
    this.pacman.setVelocity(0);

    // Handle movement
    if (this.cursors.left.isDown) {
      this.pacman.setVelocityX(-speed);
      this.pacman.angle = 180;
    } else if (this.cursors.right.isDown) {
      this.pacman.setVelocityX(speed);
      this.pacman.angle = 0;
    }

    if (this.cursors.up.isDown) {
      this.pacman.setVelocityY(-speed);
      this.pacman.angle = -90;
    } else if (this.cursors.down.isDown) {
      this.pacman.setVelocityY(speed);
      this.pacman.angle = 90;
    }
  }
}
