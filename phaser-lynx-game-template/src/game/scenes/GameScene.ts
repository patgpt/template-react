import { Scene } from 'phaser';

export class GameScene extends Scene {
  private pacman!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private dots!: Phaser.Physics.Arcade.StaticGroup;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private ghosts: Phaser.Physics.Arcade.Sprite[] = [];
  private ghostPenPosition!: Phaser.Types.Math.Vector2Like;
  private tunnelPositions: {
    left: Phaser.Types.Math.Vector2Like[];
    right: Phaser.Types.Math.Vector2Like[];
  } = { left: [], right: [] };

  // Sound properties
  private sounds: {
    chomp?: Phaser.Sound.BaseSound;
    death?: Phaser.Sound.BaseSound;
    powerPellet?: Phaser.Sound.BaseSound;
    ghostEaten?: Phaser.Sound.BaseSound;
    gameStart?: Phaser.Sound.BaseSound;
  } = {};

  private soundsLoaded = false;

  constructor() {
    super({
      key: 'GameScene',
      // Audio configuration is handled through game config instead
    });
  }

  preload() {
    // Get the base URL from the game config
    const gameConfig: any = this.sys.game.config;
    const baseUrl =
      gameConfig.baseURL || window.location.origin + window.location.pathname;
    console.log(`Game base URL: ${baseUrl}`);

    // Configure sound loading - make sure to use the absolute path
    const soundsPath = 'assets/sounds';
    this.load.setPath(soundsPath);
    console.log(
      `Set sound loading path to: ${soundsPath} (Absolute: ${baseUrl}${soundsPath})`,
    );

    // Add debugging for audio decoding
    this.sound.once('loaderror', () => {
      console.warn('Audio loader error occurred');
    });

    this.sound.once('decodeerror', (sound: string) => {
      console.warn(`Error decoding audio: ${sound}`);
    });

    // Log info about available audio formats
    this.checkAudioSupport();

    // Try to verify if we can access the sound files directly
    this.verifyAssetAccess(baseUrl, soundsPath, ['Chomp.mp3']);

    // Load sound assets with proper configuration - Note the uppercase filenames to match actual files
    const soundFiles = [
      { key: 'chomp', path: 'Chomp.mp3', config: { instances: 4 } }, // Multiple instances for rapid chomping
      { key: 'death', path: 'Death.mp3', config: { instances: 1 } },
      { key: 'powerPellet', path: 'Extra.mp3', config: { instances: 2 } },
      { key: 'ghostEaten', path: 'Ghost.mp3', config: { instances: 4 } },
      { key: 'gameStart', path: 'Intro.mp3', config: { instances: 1 } },
    ];

    // This event fires when an individual asset completes loading
    this.load.on('filecomplete', (key: string, type: string, data: any) => {
      if (type === 'audio') {
        console.log(`Sound "${key}" file load complete`);
      }
    });

    // Add error handling for audio loading
    this.load.on('loaderror', (file: any) => {
      console.warn(`Error loading audio file: ${file.key} (${file.src})`);
      console.warn(`Full URL was: ${baseUrl}${soundsPath}/${file.src}`);
      // Load a fallback sound when a sound fails to load
      this.loadFallbackSound(file.key);
    });

    // Load each sound with its specific configuration
    soundFiles.forEach(({ key, path, config }) => {
      const fullPath = `${soundsPath}/${path}`;
      console.log(
        `Loading sound: ${key} from ${path} (Full path: ${baseUrl}${fullPath})`,
      );
      this.load.audio(key, path, config);
    });

    // Add load complete listener
    this.load.on('complete', () => {
      console.log('All assets loaded, initializing sounds');
      this.initializeSounds();
    });
  }

  // Verify if assets can be accessed at the given path
  private verifyAssetAccess(
    baseUrl: string,
    soundsPath: string,
    fileNames: string[],
  ) {
    fileNames.forEach((fileName) => {
      const fullUrl = `${baseUrl}${soundsPath}/${fileName}`;

      console.log(`Verifying file access: ${fullUrl}`);

      // Create a simple fetch to check if the file is accessible
      fetch(fullUrl, { method: 'HEAD' })
        .then((response) => {
          if (response.ok) {
            console.log(`✅ File accessible: ${fileName}`);
            console.log(
              `Content-Type: ${response.headers.get('content-type')}`,
            );
          } else {
            console.warn(
              `❌ File not accessible: ${fileName} (Status: ${response.status})`,
            );
          }
        })
        .catch((error) => {
          console.error(`❌ Error checking file: ${fileName}`, error);
        });
    });
  }

  // Check browser audio format support and provide details
  private checkAudioSupport() {
    // Get audio support information from Phaser
    const audioSupport = {
      mp3: this.sys.game.device.audio.mp3,
      ogg: this.sys.game.device.audio.ogg,
      opus: this.sys.game.device.audio.opus,
      wav: this.sys.game.device.audio.wav,
      webm: this.sys.game.device.audio.webm,
      dolby: this.sys.game.device.audio.dolby,
    };

    console.log('Browser audio format support:', audioSupport);

    // Check if Web Audio API is available
    if ('context' in this.sound) {
      console.log('Using Web Audio API');

      // Log AudioContext details
      const webAudioManager = this.sound as Phaser.Sound.WebAudioSoundManager;
      console.log('AudioContext state:', webAudioManager.context.state);
      console.log(
        'AudioContext sample rate:',
        webAudioManager.context.sampleRate,
      );
    } else if (this.sound instanceof Phaser.Sound.HTML5AudioSoundManager) {
      console.log('Using HTML5 Audio');
      // HTML5 Audio has limited capabilities
      console.log(
        'HTML5 Audio has limited capabilities and may not work on all browsers',
      );
    } else {
      console.log('No audio support detected');
    }
  }

  // Load a fallback sound when the original fails
  private loadFallbackSound(key: string) {
    console.log(`Loading fallback sound for: ${key}`);

    try {
      // Simple approach: create a dummy sound programmatically
      const config = {
        mute: false,
        volume: key === 'death' ? 0.6 : key === 'gameStart' ? 0.7 : 0.5,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0,
      };

      // Use a simple "dummy" sound object that doesn't actually play anything
      const dummySound = {
        key: key,
        isPlaying: false,
        isPaused: false,
        play: () => {
          console.log(`Dummy sound '${key}' play called`);
          // Emit events that would normally happen when a sound plays
          setTimeout(() => this.events.emit(`sound_${key}_complete`), 300);
          return dummySound;
        },
        once: (event: string, callback: Function) => {
          this.events.once(`sound_${key}_${event}`, callback);
          return dummySound;
        },
        stop: () => {
          console.log(`Dummy sound '${key}' stop called`);
          return dummySound;
        },
      };

      // Add it to our sounds object
      this.sounds[key as keyof typeof this.sounds] =
        dummySound as unknown as Phaser.Sound.BaseSound;

      console.log(`Created dummy sound for: ${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to create fallback sound for ${key}:`, error);
      return false;
    }
  }

  // Add this new method for direct audio unlocking
  private unlockAudio() {
    console.log('Attempting to directly unlock audio...');

    // Check if we have WebAudio
    const hasWebAudio = 'context' in this.sound;
    if (!hasWebAudio) {
      console.log('No WebAudio available, skipping unlock');
      return;
    }

    // Try to unlock in various ways
    const webAudioManager = this.sound as Phaser.Sound.WebAudioSoundManager;
    const context = webAudioManager.context;

    if (context.state !== 'running') {
      console.log('AudioContext state before unlock attempt:', context.state);

      // Create and play a silent buffer
      try {
        const buffer = context.createBuffer(1, 1, 22050);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
        console.log('Played silent buffer to unlock audio');
      } catch (e) {
        console.warn('Failed to play silent buffer:', e);
      }

      // Force resume
      context
        .resume()
        .then(() => {
          console.log(
            'AudioContext resumed through direct call, new state:',
            context.state,
          );
        })
        .catch((err) => {
          console.warn('Failed to resume AudioContext:', err);
        });

      // Also try the built-in unlock
      this.sound.unlock();
    } else {
      console.log('AudioContext already in "running" state');
    }
  }

  private async initializeSounds() {
    try {
      // Check if sound manager is WebAudioSoundManager
      const webAudioManager = this.sound as Phaser.Sound.WebAudioSoundManager;
      const hasWebAudio =
        this.sound.getAll('').length > 0 && 'context' in this.sound;

      console.log('Sound system state:', {
        locked: this.sound.locked,
        hasWebAudio,
        contextState: hasWebAudio
          ? webAudioManager.context.state
          : 'No WebAudio',
        mute: this.sound.mute,
        volume: this.sound.volume,
      });

      // Try to unlock audio directly first
      this.unlockAudio();

      // Check if Web Audio is available and locked
      if (
        hasWebAudio &&
        (webAudioManager.context.state === 'suspended' || this.sound.locked)
      ) {
        console.log(
          'Audio is locked or suspended, waiting for user interaction',
        );

        // Create a more visible prompt for audio unlock
        const container = this.add.container(
          this.cameras.main.centerX,
          this.cameras.main.centerY - 50,
        );

        const bg = this.add
          .rectangle(0, 0, 400, 100, 0x000000, 0.8)
          .setOrigin(0.5);

        const text = this.add
          .text(0, 0, 'Click/Tap to Enable Sound', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
          })
          .setOrigin(0.5);

        container.add([bg, text]);

        // Setup one-time unlock handler with visual feedback
        const unlockAudio = () => {
          container.destroy();

          // Call our direct unlock method
          this.unlockAudio();

          // Show brief confirmation
          const confirmation = this.add
            .text(
              this.cameras.main.centerX,
              this.cameras.main.centerY,
              'Sound Enabled!',
              {
                fontSize: '32px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
              },
            )
            .setOrigin(0.5);

          this.tweens.add({
            targets: confirmation,
            alpha: 0,
            duration: 1000,
            onComplete: () => confirmation.destroy(),
          });

          this.setupSounds();

          // Remove listeners
          this.input.off('pointerdown', unlockAudio);
          this.input.off('gameobjectdown', unlockAudio);
        };

        this.input.on('pointerdown', unlockAudio);
        this.input.on('gameobjectdown', unlockAudio);
      } else {
        console.log('Audio not locked, setting up sounds directly');
        this.setupSounds();
      }
    } catch (error) {
      console.warn('Error in initializeSounds:', error);
      this.soundsLoaded = false;
    }
  }

  // Add a method to try loading sounds manually
  private tryLoadSoundManually(key: string, fileName: string) {
    console.log(`Attempting to manually load sound: ${key} from ${fileName}`);

    // Get the base URL
    const gameConfig: any = this.sys.game.config;
    const baseUrl =
      gameConfig.baseURL || window.location.origin + window.location.pathname;

    // Full path to the sound file
    const soundsPath = 'assets/sounds';

    // Try different file extensions
    const fileNameWithoutExt = fileName.split('.')[0];
    const extensions = ['mp3', 'ogg', 'wav'];

    console.log(
      `Will try loading ${fileNameWithoutExt} with extensions: ${extensions.join(', ')}`,
    );

    // Try each extension
    this.tryNextExtension(
      key,
      fileNameWithoutExt,
      extensions,
      0,
      baseUrl,
      soundsPath,
    );
  }

  // Helper method to try loading with different extensions
  private tryNextExtension(
    key: string,
    fileNameWithoutExt: string,
    extensions: string[],
    index: number,
    baseUrl: string,
    soundsPath: string,
  ) {
    // If we've tried all extensions, fall back to dummy sound
    if (index >= extensions.length) {
      console.warn(
        `Failed to load sound ${key} with any extension, using fallback`,
      );
      this.loadFallbackSound(key);
      return;
    }

    const ext = extensions[index];
    const fullFileName = `${fileNameWithoutExt}.${ext}`;
    const fullUrl = `${baseUrl}${soundsPath}/${fullFileName}`;

    console.log(`Trying to load sound file from: ${fullUrl}`);

    // Try loading with fetch API
    fetch(fullUrl)
      .then((response) => {
        if (!response.ok) {
          console.warn(
            `Failed to fetch sound file ${fullFileName}: ${response.status} ${response.statusText}`,
          );
          // Try next extension
          this.tryNextExtension(
            key,
            fileNameWithoutExt,
            extensions,
            index + 1,
            baseUrl,
            soundsPath,
          );
          return null;
        }

        console.log(`File ${fullFileName} fetched successfully, processing...`);
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (!arrayBuffer) {
          return; // Error already logged
        }

        console.log(
          `Received ${arrayBuffer.byteLength} bytes for ${fullFileName}`,
        );

        // Try to decode the audio data manually
        if ('context' in this.sound) {
          const webAudioManager = this
            .sound as Phaser.Sound.WebAudioSoundManager;

          webAudioManager.context.decodeAudioData(
            arrayBuffer,
            (audioBuffer) => {
              console.log(
                `Successfully decoded audio for ${key} using ${ext} format`,
              );

              // Add the decoded sound to the cache
              this.cache.audio.add(key, audioBuffer);

              // Now create a sound with the standard method
              const config = {
                mute: false,
                volume: key === 'death' ? 0.6 : key === 'gameStart' ? 0.7 : 0.5,
                rate: 1,
                detune: 0,
              };

              this.sounds[key as keyof typeof this.sounds] = this.sound.add(
                key,
                config,
              );
              console.log(`Manually loaded sound "${key}" successfully`);

              // If we were waiting for game start sound, try to play it now
              if (key === 'gameStart' && !this.sound.locked) {
                this.playSound('gameStart');
              }
            },
            (error) => {
              console.warn(
                `Failed to decode audio for ${key} with ${ext} format:`,
                error,
              );
              // Try next extension
              this.tryNextExtension(
                key,
                fileNameWithoutExt,
                extensions,
                index + 1,
                baseUrl,
                soundsPath,
              );
            },
          );
        } else {
          console.warn('Web Audio API not available, cannot decode audio');
          this.loadFallbackSound(key);
        }
      })
      .catch((error) => {
        console.error(`Error loading sound file ${fullFileName}:`, error);
        // Try next extension
        this.tryNextExtension(
          key,
          fileNameWithoutExt,
          extensions,
          index + 1,
          baseUrl,
          soundsPath,
        );
      });
  }

  // Enhanced setupSounds method that tries manual loading if needed
  private setupSounds() {
    try {
      console.log('Setting up sounds...');

      // Base configuration for all sounds
      const baseConfig = {
        mute: false,
        volume: 0.5,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0,
      };

      // Initialize each sound with specific configurations
      const soundConfigs: Record<string, typeof baseConfig> = {
        chomp: { ...baseConfig, volume: 0.3 },
        death: { ...baseConfig, volume: 0.6 },
        powerPellet: { ...baseConfig, volume: 0.5 },
        ghostEaten: { ...baseConfig, volume: 0.5 },
        gameStart: { ...baseConfig, volume: 0.7 },
      };

      // Map sound keys to file names
      const soundFiles = {
        chomp: 'Chomp.mp3',
        death: 'Death.mp3',
        powerPellet: 'Extra.mp3',
        ghostEaten: 'Ghost.mp3',
        gameStart: 'Intro.mp3',
      };

      let soundsInitialized = 0;
      let soundsAttempted = 0;

      Object.entries(soundConfigs).forEach(([key, config]) => {
        try {
          soundsAttempted++;
          if (this.cache.audio.exists(key)) {
            this.sounds[key as keyof typeof this.sounds] = this.sound.add(
              key,
              config,
            );
            console.log(`Sound "${key}" loaded successfully from cache`);
            soundsInitialized++;
          } else {
            console.warn(
              `Sound "${key}" not found in cache, trying manual load`,
            );
            // Try to load it manually
            this.tryLoadSoundManually(
              key,
              soundFiles[key as keyof typeof soundFiles],
            );
          }
        } catch (error) {
          console.warn(`Could not initialize sound: ${key}`, error);
          this.loadFallbackSound(key);
        }
      });

      console.log(
        `Initialized ${soundsInitialized}/${soundsAttempted} sounds from cache`,
      );
      this.soundsLoaded = soundsInitialized > 0;

      // Add global sound controls with visual feedback
      this.input.keyboard?.on('keydown-M', () => {
        this.sound.mute = !this.sound.mute;
        console.log(`Sound ${this.sound.mute ? 'muted' : 'unmuted'}`);

        // Show mute status
        const muteText = this.add.text(
          10,
          10,
          this.sound.mute ? 'Sound: OFF' : 'Sound: ON',
          {
            fontSize: '16px',
            color: this.sound.mute ? '#ff0000' : '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
          },
        );

        this.tweens.add({
          targets: muteText,
          alpha: 0,
          duration: 1000,
          onComplete: () => muteText.destroy(),
        });
      });

      // Try to play the game start sound
      if (this.soundsLoaded) {
        console.log('Attempting to play game start sound...');
        if (this.sound.locked) {
          console.log('Sound locked, will play after unlock');
          this.sound.once('unlocked', () => {
            console.log('Sound unlocked, playing gameStart sound');
            this.playSound('gameStart');
          });
        } else {
          console.log('Sound not locked, playing gameStart sound now');
          this.playSound('gameStart');
        }
      } else {
        console.warn(
          'Sounds not loaded from cache, waiting for manual loading',
        );
      }
    } catch (error) {
      console.warn('Error in setupSounds:', error);
      this.soundsLoaded = false;
    }
  }

  // Enhanced helper method to safely play sounds with rate variation
  private playSound(key: keyof typeof this.sounds) {
    try {
      const sound = this.sounds[key];

      if (!sound) {
        console.warn(`Cannot play sound "${key}": Sound not loaded`);
        return;
      }

      if (!this.soundsLoaded) {
        console.warn(`Cannot play sound "${key}": Sound system not loaded`);
        return;
      }

      if (this.sound.mute) {
        console.log(`Sound "${key}" not played: Audio is muted`);
        return;
      }

      // Add slight random variation to chomp sounds to make them more natural
      if (key === 'chomp' && sound instanceof Phaser.Sound.WebAudioSound) {
        sound.rate = 0.9 + Math.random() * 0.2;
      }

      // Check if sound is already playing
      if (sound.isPlaying) {
        console.log(`Sound "${key}" already playing`);

        // For chomp sound, we want multiple instances
        if (key === 'chomp') {
          const newSound = this.sound.add(key, { volume: 0.3 });
          newSound.once('complete', () => {
            newSound.destroy();
          });
          newSound.play();
          console.log(`Created additional instance of "${key}" sound`);
        }

        return;
      }

      // Check audio context state
      const hasWebAudio = 'context' in this.sound;
      const webAudioManager = this.sound as Phaser.Sound.WebAudioSoundManager;

      if (hasWebAudio && webAudioManager.context.state === 'suspended') {
        console.log(
          `AudioContext suspended, attempting to resume for "${key}"`,
        );
        webAudioManager.context
          .resume()
          .then(() => {
            console.log(`AudioContext resumed, now playing "${key}"`);
            sound.play();
          })
          .catch((error: Error) => {
            console.warn('Failed to resume AudioContext:', error);
          });
      } else if (this.sound.locked) {
        console.log(`Sound locked, queueing "${key}" for after unlock`);
        this.sound.once('unlocked', () => {
          console.log(`Sound unlocked, now playing "${key}"`);
          sound.play();
        });
      } else {
        console.log(`Playing sound: "${key}"`);
        sound.play();
      }
    } catch (error) {
      console.warn(`Error playing sound: ${key}`, error);
    }
  }

  create() {
    console.log('GameScene: Creating game elements');

    // Verify that required textures exist
    this.ensureTextures();

    this.createUI();
    this.createMaze();
    this.createPacman();
    this.createGhosts();
    this.setupCollisions();
    this.setupInput();
  }

  // Make sure required textures exist
  private ensureTextures() {
    const requiredTextures = [
      'pacman-right-1',
      'wall',
      'dot',
      'ghost-red',
      'ghost-blue',
      'ghost-pink',
      'ghost-orange',
    ];

    requiredTextures.forEach((textureName) => {
      if (!this.textures.exists(textureName)) {
        console.error(`Required texture '${textureName}' is missing.`);
        this.createFallbackTexture(textureName);
      }
    });
  }

  // Create a fallback texture if needed
  private createFallbackTexture(key: string) {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    if (key.startsWith('pacman')) {
      // Yellow circle for Pacman
      graphics.fillStyle(0xffff00);
      graphics.fillCircle(16, 16, 16);

      // Simple mouth based on direction
      graphics.fillStyle(0x000000);
      if (key.includes('right')) {
        graphics.slice(
          16,
          16,
          16,
          Phaser.Math.DegToRad(30),
          Phaser.Math.DegToRad(330),
          true,
        );
      } else if (key.includes('left')) {
        graphics.slice(
          16,
          16,
          16,
          Phaser.Math.DegToRad(210),
          Phaser.Math.DegToRad(150),
          true,
        );
      } else if (key.includes('up')) {
        graphics.slice(
          16,
          16,
          16,
          Phaser.Math.DegToRad(60),
          Phaser.Math.DegToRad(300),
          true,
        );
      } else if (key.includes('down')) {
        graphics.slice(
          16,
          16,
          16,
          Phaser.Math.DegToRad(240),
          Phaser.Math.DegToRad(120),
          true,
        );
      }
      graphics.fillPath();
    } else if (key.includes('ghost')) {
      // Create a ghost shape
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
    } else if (key === 'wall') {
      // Blue wall for classic Pac-Man
      graphics.fillStyle(0x0000ff);
      graphics.fillRect(0, 0, 32, 32);
    } else if (key === 'dot') {
      // White dot
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(4, 4, 4);
    } else {
      // Purple fallback
      graphics.fillStyle(0xff00ff);
      graphics.fillRect(0, 0, 32, 32);
    }

    graphics.generateTexture(key, 32, 32);
    graphics.destroy();

    console.log(`GameScene: Created fallback texture for ${key}`);
  }

  private createAnimations() {
    // Don't recreate animations, they're now created in LoadingScene
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
          console.log(`GameScene: Created animation: pacman-${direction}`);
        } catch (error) {
          console.error(
            `GameScene: Failed to create animation: pacman-${direction}`,
            error,
          );
        }
      }
    });
  }

  private createUI() {
    // Create classic Pac-Man UI
    const tileSize = 32;
    const offsetX = (this.scale.width - 19 * tileSize) / 2;

    // Black background for the entire game
    this.cameras.main.setBackgroundColor('#000000');

    // Score text at top left
    this.score = 0;
    this.scoreText = this.add.text(offsetX, 10, 'SCORE', {
      fontFamily: 'Pacman',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Score value below the label
    this.add
      .text(offsetX, 60, '0', {
        fontSize: '24px',
        color: 'yellow',
        fontStyle: 'bold',
      })
      .setName('scoreValue');

    // High score at top center
    this.add
      .text(offsetX + 9.5 * tileSize, 10, 'HIGH SCORE', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    // High score value
    this.add
      .text(offsetX + 9.5 * tileSize, 60, '10000', {
        fontSize: '24px',
        fontFamily: 'PressStart2P',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    // Lives indicator (bottom left)
    // Add a small Pac-Man icon for each life
    for (let i = 0; i < 2; i++) {
      const lifeIcon = this.add.sprite(
        offsetX + 30 + i * 30,
        this.scale.height - 20,
        'pacman-right-1',
      );
      lifeIcon.setScale(0.6);
    }
  }

  private createMaze() {
    // Create a classic Pac-Man maze layout
    const tileSize = 32; // Size of each wall/path tile
    this.walls = this.physics.add.staticGroup();
    this.dots = this.physics.add.staticGroup();

    // Define the maze layout using a 2D array
    // 1 = wall, 0 = path with dot, 2 = path without dot, 3 = power pellet, 4 = ghost house, 5 = tunnel
    const mazeLayout = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 3, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 2, 1, 1, 1, 0, 1, 1, 1, 1],
      [5, 5, 5, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 5, 5, 5],
      [1, 1, 1, 1, 0, 1, 2, 1, 1, 4, 1, 1, 2, 1, 0, 1, 1, 1, 1],
      [5, 5, 5, 5, 0, 2, 2, 1, 4, 4, 4, 1, 2, 2, 0, 5, 5, 5, 5],
      [1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1],
      [5, 5, 5, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 5, 5, 5],
      [1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 3, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 3, 1],
      [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // Create the maze based on the layout
    const offsetX = (this.scale.width - mazeLayout[0].length * tileSize) / 2;
    const offsetY = (this.scale.height - 22 * tileSize) / 2;

    // Create a "READY!" text in the ghost house area
    this.add
      .text(offsetX + 9.5 * tileSize, offsetY + 13.5 * tileSize, 'READY!', {
        fontSize: '16px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('readyText');

    // Add power pellet texture if it doesn't exist
    if (!this.textures.exists('power-pellet')) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture('power-pellet', 16, 16);
      graphics.destroy();
    }

    // Store tunnel positions for teleportation
    this.tunnelPositions = {
      left: [],
      right: [],
    };

    // Build the maze
    for (let y = 0; y < mazeLayout.length; y++) {
      for (let x = 0; x < mazeLayout[y].length; x++) {
        const tileType = mazeLayout[y][x];
        const posX = offsetX + x * tileSize + tileSize / 2;
        const posY = offsetY + y * tileSize + tileSize / 2;

        if (tileType === 1) {
          // Wall
          const wall = this.walls.create(posX, posY, 'wall');
          wall.setDisplaySize(tileSize, tileSize);
          wall.setTint(0x0000ff); // Blue color for walls
          wall.refreshBody();
        } else if (tileType === 0) {
          // Path with dot
          this.dots.create(posX, posY, 'dot').setScale(0.2);
        } else if (tileType === 3) {
          // Power pellet
          this.dots.create(posX, posY, 'power-pellet').setScale(0.8);
        } else if (tileType === 5) {
          // Tunnel - store positions for teleportation
          if (x <= 2) {
            // Left side
            this.tunnelPositions.left.push({ x: posX, y: posY });
          } else if (x >= mazeLayout[0].length - 3) {
            // Right side
            this.tunnelPositions.right.push({ x: posX, y: posY });
          }
        }
        // Types 2 (empty path) and 4 (ghost house) don't need objects
      }
    }

    // Create ghost house walls with a different color
    const ghostHouseX = offsetX + 9 * tileSize;
    const ghostHouseY = offsetY + 10 * tileSize;
    const ghostHouseWidth = 3 * tileSize;
    const ghostHouseHeight = 2 * tileSize;

    // Top of ghost house
    const topWall = this.walls.create(
      ghostHouseX,
      ghostHouseY - tileSize / 2,
      'wall',
    );
    topWall.setDisplaySize(ghostHouseWidth, 4);
    topWall.setTint(0xff00ff); // Pink color for ghost house
    topWall.refreshBody();

    // Bottom of ghost house
    const bottomWall = this.walls.create(
      ghostHouseX,
      ghostHouseY + ghostHouseHeight + tileSize / 2,
      'wall',
    );
    bottomWall.setDisplaySize(ghostHouseWidth, 4);
    bottomWall.setTint(0xff00ff);
    bottomWall.refreshBody();

    // Left of ghost house
    const leftWall = this.walls.create(
      ghostHouseX - ghostHouseWidth / 2,
      ghostHouseY + ghostHouseHeight / 2,
      'wall',
    );
    leftWall.setDisplaySize(4, ghostHouseHeight);
    leftWall.setTint(0xff00ff);
    leftWall.refreshBody();

    // Right of ghost house
    const rightWall = this.walls.create(
      ghostHouseX + ghostHouseWidth / 2,
      ghostHouseY + ghostHouseHeight / 2,
      'wall',
    );
    rightWall.setDisplaySize(4, ghostHouseHeight);
    rightWall.setTint(0xff00ff);
    rightWall.refreshBody();

    // Update ghost positions to be in the ghost house
    this.ghostPenPosition = {
      x: ghostHouseX,
      y: ghostHouseY + ghostHouseHeight / 2,
    };
  }

  private createGhosts() {
    // Add ghosts
    const ghostColors = ['red', 'pink', 'blue', 'orange'];

    // Calculate ghost house position
    const tileSize = 32;
    const offsetX = (this.scale.width - 19 * tileSize) / 2;
    const offsetY = (this.scale.height - 22 * tileSize) / 2;
    const ghostHouseX = offsetX + 9.5 * tileSize;
    const ghostHouseY = offsetY + 10.5 * tileSize;

    // Position ghosts in the ghost house
    const positions = [
      { x: ghostHouseX - tileSize / 2, y: ghostHouseY }, // Red (left)
      { x: ghostHouseX, y: ghostHouseY - tileSize / 4 }, // Pink (top)
      { x: ghostHouseX, y: ghostHouseY + tileSize / 4 }, // Blue (bottom)
      { x: ghostHouseX + tileSize / 2, y: ghostHouseY }, // Orange (right)
    ];

    ghostColors.forEach((color, index) => {
      try {
        const ghost = this.physics.add.sprite(
          positions[index].x,
          positions[index].y,
          `ghost-${color}`,
        );
        ghost.setScale(0.8);
        ghost.setCollideWorldBounds(true);

        // Initially ghosts don't move - they'll start moving when game starts
        ghost.setVelocity(0, 0);

        // Add to ghost array
        this.ghosts.push(ghost);
      } catch (error) {
        console.error(`Error creating ghost-${color}:`, error);
      }
    });

    // After a delay, start ghost movement
    this.time.delayedCall(4000, () => {
      // Hide the READY! text
      const readyText = this.children.getByName(
        'readyText',
      ) as Phaser.GameObjects.Text;
      if (readyText) {
        readyText.setVisible(false);
      }

      // Start ghost movement
      this.ghosts.forEach((ghost, index) => {
        // Different movement patterns for each ghost
        const speed = 80;

        // Red ghost moves directly toward Pacman
        if (index === 0) {
          this.physics.moveToObject(ghost, this.pacman, speed);
        }
        // Others move in different directions initially
        else {
          const directions = [
            { x: 0, y: -speed }, // Up
            { x: speed, y: 0 }, // Right
            { x: 0, y: speed }, // Down
          ];
          ghost.setVelocity(directions[index - 1].x, directions[index - 1].y);
        }
      });
    });
  }

  private createPacman() {
    try {
      // Ensure the pacman-right animation exists
      if (!this.anims.exists('pacman-right')) {
        this.createAnimations();
      }

      // Position Pacman at the starting position (below the ghost house)
      const tileSize = 32;
      const offsetX = (this.scale.width - 19 * tileSize) / 2;
      const offsetY = (this.scale.height - 22 * tileSize) / 2;

      // Position at the bottom center of the maze
      const pacmanX = offsetX + 9.5 * tileSize;
      const pacmanY = offsetY + 16.5 * tileSize;

      this.pacman = this.physics.add.sprite(pacmanX, pacmanY, 'pacman-right-1');
      this.pacman.setCollideWorldBounds(true);
      this.pacman.setScale(0.8);

      // Only play animation if it exists
      if (this.anims.exists('pacman-right')) {
        this.pacman.play('pacman-right');
      }
    } catch (error) {
      console.error('Error creating Pacman:', error);

      // Create a fallback pacman using graphics if animation fails
      if (!this.textures.exists('pacman-fallback')) {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffff00);
        graphics.fillCircle(16, 16, 16);
        graphics.fillStyle(0x000000);
        graphics.slice(
          16,
          16,
          16,
          Phaser.Math.DegToRad(30),
          Phaser.Math.DegToRad(330),
          true,
        );
        graphics.fillPath();
        graphics.generateTexture('pacman-fallback', 32, 32);
        graphics.destroy();
      }

      // Position at the bottom center of the maze (fallback)
      const tileSize = 32;
      const offsetX = (this.scale.width - 19 * tileSize) / 2;
      const offsetY = (this.scale.height - 22 * tileSize) / 2;
      const pacmanX = offsetX + 9.5 * tileSize;
      const pacmanY = offsetY + 16.5 * tileSize;

      this.pacman = this.physics.add.sprite(
        pacmanX,
        pacmanY,
        'pacman-fallback',
      );
      this.pacman.setCollideWorldBounds(true);
      this.pacman.setScale(0.8);
    }
  }

  private setupCollisions() {
    this.physics.add.collider(this.pacman, this.walls);

    // Add ghost collisions
    this.ghosts.forEach((ghost) => {
      this.physics.add.collider(
        ghost,
        this.walls,
        this
          .handleGhostWallCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this,
      );
      this.physics.add.overlap(
        this.pacman,
        ghost,
        this.handleGhostCollision,
        undefined,
        this,
      );
    });

    this.physics.add.overlap(
      this.pacman,
      this.dots,
      (_, dot) => {
        const dotSprite = dot as Phaser.Physics.Arcade.Sprite;

        // Check if it's a power pellet
        let points = 10;
        if (dotSprite.texture.key === 'power-pellet') {
          points = 50;
          this.makeGhostsVulnerable();
          this.playSound('powerPellet');
        } else {
          this.playSound('chomp');
        }

        dotSprite.destroy();
        this.score += points;

        // Update score display
        const scoreValue = this.children.getByName(
          'scoreValue',
        ) as Phaser.GameObjects.Text;
        if (scoreValue) {
          scoreValue.setText(this.score.toString());
        }
      },
      undefined,
      this,
    );
  }

  private handleGhostWallCollision(
    ghost:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile,
    wall: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ) {
    const ghostSprite = ghost as Phaser.Physics.Arcade.Sprite;
    // Bounce at a random angle
    const angle = Phaser.Math.Between(0, 360);
    const speed = 100;
    ghostSprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private handleGhostCollision() {
    this.playSound('death');

    // Display game over message
    this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY, 'GAME OVER', {
        fontSize: '64px',
        color: '#ff0000',
      })
      .setOrigin(0.5);

    // Stop all movement
    this.pacman.setVelocity(0, 0);
    this.ghosts.forEach((ghost) => ghost.setVelocity(0, 0));

    // Pause physics
    this.physics.pause();

    // Restart after 3 seconds
    this.time.delayedCall(3000, () => {
      this.scene.restart();
    });
  }

  private makeGhostsVulnerable() {
    // Make ghosts blue and vulnerable
    this.ghosts.forEach((ghost) => {
      ghost.setTint(0x0000ff); // Blue tint

      // Add collision handler for vulnerable ghosts
      this.physics.add.overlap(
        this.pacman,
        ghost,
        () => {
          if (ghost.tintTopLeft === 0x0000ff) {
            // If ghost is blue/vulnerable
            this.playSound('ghostEaten');
            ghost.setPosition(this.ghostPenPosition.x, this.ghostPenPosition.y);
            ghost.clearTint();
            this.score += 200;

            // Update score display
            const scoreValue = this.children.getByName(
              'scoreValue',
            ) as Phaser.GameObjects.Text;
            if (scoreValue) {
              scoreValue.setText(this.score.toString());
            }
          }
        },
        undefined,
        this,
      );

      // Slow down ghosts when vulnerable
      const currentVelocity = ghost.body?.velocity;
      if (currentVelocity) {
        const speed = 40; // Slower speed when vulnerable
        const direction = new Phaser.Math.Vector2(
          currentVelocity.x,
          currentVelocity.y,
        ).normalize();
        ghost.setVelocity(direction.x * speed, direction.y * speed);
      }
    });

    // After 8 seconds, return ghosts to normal
    this.time.delayedCall(8000, () => {
      this.ghosts.forEach((ghost) => {
        ghost.clearTint();

        // Speed up ghosts again
        const currentVelocity = ghost.body?.velocity;
        if (currentVelocity) {
          const speed = 80; // Normal speed
          const direction = new Phaser.Math.Vector2(
            currentVelocity.x,
            currentVelocity.y,
          ).normalize();
          ghost.setVelocity(direction.x * speed, direction.y * speed);
        }
      });
    });
  }

  private setupInput() {
    if (!this.input?.keyboard) {
      console.error('Keyboard input not available');
      return;
    }
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (!this.pacman || !this.cursors) return;

    const speed = 200;
    this.pacman.setVelocity(0);

    try {
      if (this.cursors.left.isDown) {
        this.pacman.setVelocityX(-speed);
        if (
          this.anims.exists('pacman-left') &&
          this.pacman.anims.getName() !== 'pacman-left'
        ) {
          this.pacman.play('pacman-left');
        }
      } else if (this.cursors.right.isDown) {
        this.pacman.setVelocityX(speed);
        if (
          this.anims.exists('pacman-right') &&
          this.pacman.anims.getName() !== 'pacman-right'
        ) {
          this.pacman.play('pacman-right');
        }
      }

      if (this.cursors.up.isDown) {
        this.pacman.setVelocityY(-speed);
        if (
          this.anims.exists('pacman-up') &&
          this.pacman.anims.getName() !== 'pacman-up'
        ) {
          this.pacman.play('pacman-up');
        }
      } else if (this.cursors.down.isDown) {
        this.pacman.setVelocityY(speed);
        if (
          this.anims.exists('pacman-down') &&
          this.pacman.anims.getName() !== 'pacman-down'
        ) {
          this.pacman.play('pacman-down');
        }
      }

      if (
        this.pacman.body?.velocity.x === 0 &&
        this.pacman.body?.velocity.y === 0 &&
        this.pacman.anims?.isPlaying
      ) {
        this.pacman.anims.pause();
      } else if (this.pacman.anims?.isPaused) {
        this.pacman.anims.resume();
      }

      // Check for tunnel teleportation
      this.checkTunnelTeleport();

      // Update ghost AI
      this.updateGhostAI();
    } catch (error) {
      console.error('Error in update:', error);
    }
  }

  private checkTunnelTeleport() {
    if (!this.pacman || !this.tunnelPositions) return;

    const tileSize = 32;
    const offsetX = (this.scale.width - 19 * tileSize) / 2;

    // Check if Pacman is in the left tunnel
    if (this.pacman.x < offsetX) {
      // Teleport to right tunnel
      const rightmostTunnel = this.tunnelPositions.right[0];
      this.pacman.x = rightmostTunnel.x - tileSize;
    }

    // Check if Pacman is in the right tunnel
    if (this.pacman.x > offsetX + 19 * tileSize) {
      // Teleport to left tunnel
      const leftmostTunnel = this.tunnelPositions.left[0];
      this.pacman.x = leftmostTunnel.x + tileSize;
    }
  }

  private updateGhostAI() {
    // Simple ghost AI - red ghost always chases Pacman
    const redGhost = this.ghosts[0];
    if (redGhost && !redGhost.tintTopLeft) {
      // Not vulnerable
      // Every few seconds, update the red ghost's direction to chase Pacman
      if (Phaser.Math.Between(1, 60) === 1) {
        this.physics.moveToObject(redGhost, this.pacman, 80);
      }
    }
  }
}
