import '@lynx-js/web-core';
import { useRef } from 'react';
import './App.css';
import { Game, GameRef } from './game/PhaserGame';

const App = () => {
  const gameRef = useRef<GameRef | null>(null);

  return (
    <lynx-view
      style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
    >
      <div id="app">
        <Game ref={gameRef} />
      </div>
    </lynx-view>
  );
};

export default App;
