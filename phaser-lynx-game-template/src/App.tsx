import '@lynx-js/web-core';
import '@lynx-js/web-core/index.css';
import '@lynx-js/web-elements/index.css';
import './App.css';
import PhaserGameApp from './PhaserGameApp';

const App = () => {
  return (
    <lynx-view
      style={{ height: '100vh', width: '100vw' }}
      url="/main.web.bundle"
    >
      <PhaserGameApp />
    </lynx-view>
  );
};

export default App;
