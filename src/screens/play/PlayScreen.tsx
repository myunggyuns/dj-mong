import styles from './PlayScreen.module.css';
import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import GameCanvas from '../../game/GameCanvas';

export default function PlayScreen() {
  const { score, combo, timeLeft, tick } = useGameStore();

  useEffect(() => {
    const interval = setInterval(() => tick(0.1), 100);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className={styles.container}>
      <div className={styles['play-spec-box']}>
        <span>⏱ {Math.ceil(timeLeft)}s</span>
        <span>Score {score.toLocaleString()}</span>
      </div>

      {/* TODO: 컬러 밴드 + 좌우 버튼 레인 + DJMong 이 다음 단계에서 여기 들어감 */}
      <div className={styles['play-box']}>
        <GameCanvas />
      </div>

      <div className={styles['combo-box']}>Combo x{combo}</div>
    </div>
  );
}
