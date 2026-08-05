import styles from './MainScreen.module.css';
import { useGameStore, DIFFICULTIES } from '../../store/gameStore';
import type { Difficulty } from '../../store/difficulties';

export default function MainScreen() {
  const { difficulty, setDifficulty, bestScore, startGame, tutorialStep, startTutorial } =
    useGameStore();
  const config = DIFFICULTIES[difficulty];

  return (
    <div className={styles.container}>
      <h1 className={styles['main-title']}>DJ Mong</h1>
      <div className={styles['best-score']}>이전 기록: {bestScore.toLocaleString()}</div>
      <div id="difficulty-select-area" className={styles['difficult-box']}>
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((id) => (
          <button
            key={id}
            onClick={() => setDifficulty(id)}
            className={styles['difficult-button']}
            data-selected={id === difficulty}
            disabled={tutorialStep !== null}
          >
            {DIFFICULTIES[id].label}
          </button>
        ))}
      </div>
      <div className={styles['difficult-explain']}>{config.description}</div>

      <button onClick={startGame} className={styles['game-button']}>
        게임 시작
      </button>

      {/* <button onClick={() => setScreen('tutorial')} className={styles['tutorial-button']}>
        튜토리얼
      </button> */}
      <button onClick={() => startTutorial()} className={styles['tutorial-button']}>
        튜토리얼
      </button>
    </div>
  );
}
