import styles from './PlayScreen.module.css';
import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import GameCanvas from '../../game/GameCanvas';

export default function PlayScreen() {
  const { timeLeft, tick } = useGameStore();

  useEffect(() => {
    const interval = setInterval(() => tick(0.1), 100);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className={styles.container}>
      <div className={styles['play-spec-box']}>
        <span>⏱ {Math.ceil(timeLeft)} s</span>
      </div>

      <div className={styles['play-box']}>
        <GameCanvas />
      </div>
    </div>
  );
}
