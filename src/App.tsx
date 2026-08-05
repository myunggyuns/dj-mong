import { useGameStore } from './store/gameStore';
import MainScreen from './screens/MainScreen';
import TutorialScreen from './screens/TutorialScreen';
import PlayScreen from './screens/PlayScreen';
import ResultScreen from './screens/ResultScreen';

function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="mobile-frame">
      {screen === 'main' && <MainScreen />}
      {screen === 'tutorial' && <TutorialScreen />}
      {screen === 'playing' && <PlayScreen />}
      {screen === 'result' && <ResultScreen />}
    </div>
  );
}

export default App;
