import { forwardRef, useEffect, useRef } from 'react';
import createGame from './main';

export interface GameRef {
  game: Phaser.Game | null;
}

interface GameProps {
  onSceneReady?: (scene: Phaser.Scene) => void;
}

export const Game = forwardRef<GameRef, GameProps>(function Game(
  { onSceneReady },
  ref,
) {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = createGame('game-container');

      if (ref) {
        if (typeof ref === 'function') {
          ref({ game: gameRef.current });
        } else {
          ref.current = { game: gameRef.current };
        }
      }
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [ref]);

  return <div id="game-container" />;
});
