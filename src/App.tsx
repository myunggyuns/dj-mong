import { useGameStore } from './store/gameStore';
import MainScreen from './screens/main/MainScreen';
import TutorialScreen from './screens/tutorial/TutorialScreen';
import PlayScreen from './screens/play/PlayScreen';
import ResultScreen from './screens/result/ResultScreen';

function App() {
  const screen = useGameStore((s) => s.screen);
  const tutorialStep = useGameStore((s) => s.tutorialStep);

  return (
    <div className="mobile-frame">
      {screen === 'main' && <MainScreen />}
      {/* {screen === 'tutorial' && <TutorialScreen />} */}
      {screen === 'playing' && <PlayScreen />}
      {screen === 'result' && <ResultScreen />}

      {tutorialStep !== null && <TutorialScreen />}
    </div>
  );
}

export default App;
