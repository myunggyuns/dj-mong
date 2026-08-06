import { useEffect, useReducer, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { DIFFICULTIES, COLOR_HEX } from '../store/difficulties';
import { shuffledSet, lerp, createWord, progressOf, type BandWord } from './bandEngine';

const SESSION_SECONDS = 60;
const BASE_INTERVAL_MS = 1000;
const MIN_INTERVAL_MS = 500;
const BASE_TRAVEL_MS = 1800;
const MIN_TRAVEL_MS = 1100;

export default function ColorBand() {
  const difficulty = useGameStore((s) => s.difficulty);
  const setCurrentTarget = useGameStore((s) => s.setCurrentTarget);
  const config = DIFFICULTIES[difficulty];

  const wordsRef = useRef<BandWord[]>([]);
  const queueRef = useRef(shuffledSet(config.colors));
  const lastSpawnRef = useRef(0);
  const startRef = useRef(0);
  const nowRef = useRef(performance.now());
  const rafRef = useRef(0);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    startRef.current = performance.now();
    lastSpawnRef.current = 0;
    queueRef.current = shuffledSet(config.colors);
    wordsRef.current = [];

    function frame(now: number) {
      nowRef.current = now;
      const elapsed = now - startRef.current;
      const elapsedRatio = elapsed / (SESSION_SECONDS * 1000);
      const interval = lerp(BASE_INTERVAL_MS, MIN_INTERVAL_MS, elapsedRatio) / config.speedMultiplier;
      const travel = lerp(BASE_TRAVEL_MS, MIN_TRAVEL_MS, elapsedRatio) / config.speedMultiplier;

      if (elapsed - lastSpawnRef.current >= interval) {
        lastSpawnRef.current = elapsed;
        if (queueRef.current.length === 0) queueRef.current = shuffledSet(config.colors);
        const color = queueRef.current.shift()!;
        wordsRef.current = [...wordsRef.current, createWord(color, now, travel)];
      }

      wordsRef.current = wordsRef.current.filter((w) => progressOf(w, now) < 1.1);

      if (wordsRef.current.length > 0) {
        let nearest = wordsRef.current[0];
        let nearestDist = Math.abs(progressOf(nearest, now) - 0.5);
        for (const w of wordsRef.current) {
          const d = Math.abs(progressOf(w, now) - 0.5);
          if (d < nearestDist) {
            nearest = w;
            nearestDist = d;
          }
        }
        setCurrentTarget(nearest.color);
      }

      forceRender();
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const now = nowRef.current;

  return (
    <div style={{ position: 'relative', height: 56, overflow: 'hidden', margin: '0 12px' }}>
      {/* 중앙 타이밍 존 표시 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 4,
          bottom: 4,
          width: 76,
          transform: 'translateX(-50%)',
          background: 'rgba(184,155,240,0.18)',
          border: '1px solid rgba(184,155,240,0.4)',
          borderRadius: 10,
        }}
      />
      {wordsRef.current.map((w) => {
        const p = progressOf(w, now);
        const distFromCenter = Math.abs(p - 0.5);
        const scale = lerp(1.7, 0.7, Math.min(1, distFromCenter / 0.5));
        const opacity = lerp(1, 0.3, Math.min(1, distFromCenter / 0.5));
        const leftPercent = p * 130 - 15; // -15% (오른쪽 밖) ~ 115% (왼쪽 밖)
        return (
          <div
            key={w.id}
            style={{
              position: 'absolute',
              left: `${leftPercent}%`,
              top: '50%',
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              fontWeight: 700,
              fontSize: 16,
              color: COLOR_HEX[w.color],
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {w.color}
          </div>
        );
      })}
    </div>
  );
}
