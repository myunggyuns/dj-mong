import styles from './PlayScreen.module.css';
import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import GameCanvas from '../../game/GameCanvas';
import { TUTORIAL_BAND_TARGET_LAYOUT, TUTORIAL_BUTTON_TARGET_LAYOUT } from '../../game/MainScene';

export default function PlayScreen() {
  const { timeLeft, tick, tutorialStep } = useGameStore();

  useEffect(() => {
    if (tutorialStep !== null) return;
    const interval = setInterval(() => tick(0.1), 100);
    return () => clearInterval(interval);
  }, [tick, tutorialStep]);

  return (
    <div className={styles.container}>
      <div className={styles['play-spec-box']}>
        <span>⏱ {Math.ceil(timeLeft)} s</span>
      </div>

      <div className={styles['play-box']}>
        <GameCanvas />

        {/* Phaser draws the band/buttons onto its own <canvas>, invisible to
            driver.js — these overlays give the tutorial real DOM targets. */}
        <div
          id="timming-band"
          className={styles['tutorial-target']}
          style={{
            top: TUTORIAL_BAND_TARGET_LAYOUT.top,
            height: TUTORIAL_BAND_TARGET_LAYOUT.height,
            left: 0,
            right: 0,
          }}
        />
        <div
          id="button-rail"
          className={styles['tutorial-target']}
          style={{
            top: TUTORIAL_BUTTON_TARGET_LAYOUT.top,
            bottom: TUTORIAL_BUTTON_TARGET_LAYOUT.bottomOffset,
            left: TUTORIAL_BUTTON_TARGET_LAYOUT.sideMargin,
            right: TUTORIAL_BUTTON_TARGET_LAYOUT.sideMargin,
          }}
        />
      </div>
    </div>
  );
}
