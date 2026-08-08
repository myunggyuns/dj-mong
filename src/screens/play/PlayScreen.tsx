import styles from './PlayScreen.module.css';
import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import GameCanvas from '../../game/GameCanvas';
import { TUTORIAL_BAND_TARGET_LAYOUT, TUTORIAL_BUTTON_TARGET_LAYOUT } from '../../constant/game';

const SHAKE_JUDGMENTS = new Set(['notGood', 'bad']);

export default function PlayScreen() {
  const {
    timeLeft,
    tick,
    tutorialStep,
    lastJudgment,
    judgmentSeq,
    isPaused,
    pauseGame,
    resumeGame,
    resetSession,
    hasStarted,
    beginSession,
  } = useGameStore();
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (tutorialStep !== null || !hasStarted) return;
    const interval = setInterval(() => {
      if (useGameStore.getState().isPaused) return;
      tick(0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [tick, tutorialStep, hasStarted]);

  useEffect(() => {
    if (judgmentSeq === 0 || !lastJudgment || !SHAKE_JUDGMENTS.has(lastJudgment)) return;
    setIsShaking(true);
    const timeout = setTimeout(() => setIsShaking(false), 300);
    return () => clearTimeout(timeout);
  }, [judgmentSeq, lastJudgment]);

  return (
    <div className={styles.container}>
      <div className={styles['play-spec-box']}>
        <span>
          ⏱ <span className="hud-number">{Math.ceil(timeLeft)}</span> s
        </span>
        {tutorialStep === null && (
          <button
            type="button"
            className={styles['pause-button']}
            onClick={pauseGame}
            aria-label="일시정지"
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill={'white'}>
              <rect x="6" y="4" width="4" height="16" rx="2" />
              <rect x="14" y="4" width="4" height="16" rx="2" />
            </svg>
          </button>
        )}
      </div>

      <div className={`${styles['play-box']} ${isShaking ? styles.shake : ''}`}>
        <GameCanvas />

        {tutorialStep === null && !hasStarted && (
          <div className={styles['start-overlay']}>
            <div className={styles['start-modal']}>
              <p className={styles['start-notice']}>게임을 시작하려면 시작하기를 눌러주세요</p>
              <button
                type="button"
                className={styles['start-button']}
                onClick={() => beginSession()}
              >
                시작하기
              </button>
              <button
                type="button"
                className={styles['start-back-button']}
                onClick={() => resetSession()}
              >
                뒤로가기
              </button>
            </div>
          </div>
        )}

        {isPaused && (
          <div className={styles['pause-overlay']}>
            <div className={styles['pause-modal']}>
              <h2 className={styles['pause-title']}>일시정지</h2>
              <button type="button" className={styles['pause-resume-button']} onClick={resumeGame}>
                계속하기
              </button>
              <button type="button" className={styles['pause-exit-button']} onClick={resetSession}>
                나가기
              </button>
            </div>
          </div>
        )}

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
