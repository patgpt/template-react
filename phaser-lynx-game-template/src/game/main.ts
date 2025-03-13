import { AUTO, Game, Scale } from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { LoadingScene } from './scenes/LoadingScene';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const gameConfig: Phaser.Types.Core.GameConfig = {
  type: AUTO,

  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Scale.ScaleModes.RESIZE,
    autoCenter: Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
  },
  fps: {
    target: 60,
    min: 30,
  },
  audio: {
    disableWebAudio: false,
    noAudio: false,
    disableContextMenu: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, LoadingScene, GameScene],
};

const createGame = (containerId: string) => {
  return new Game({ ...gameConfig, parent: containerId });
};

export default createGame;
