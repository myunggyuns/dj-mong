import styles from './ResultScreen.module.css';
import { useGameStore } from '../../store/gameStore';

export default function ResultScreen() {
  const { score, maxCombo, bestScore, startGame, resetSession } = useGameStore();
  const isNewBest = score >= bestScore && score > 0;

  return (
    <div className={styles.container}>
      {isNewBest && <div className={styles['result-best-score']}>🎉 신기록 갱신!</div>}
      <h2 className={styles['result-title']}>{score.toLocaleString()}</h2>
      <div className={styles['result-combo-title']}>최고 콤보 x{maxCombo}</div>

      <div className={styles['result-button-box']}>
        <button onClick={resetSession} className={styles['result-back-button']}>
          메인으로
        </button>
        <button onClick={startGame} className={styles['result-again-button']}>
          다시하기
        </button>
      </div>
    </div>
  );
}
