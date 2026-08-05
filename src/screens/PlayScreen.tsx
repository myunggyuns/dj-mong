import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import GameCanvas from '../game/GameCanvas';

export default function PlayScreen() {
  const { score, combo, timeLeft, tick } = useGameStore();

  useEffect(() => {
    const interval = setInterval(() => tick(0.1), 100);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 13 }}>
        <span>⏱ {Math.ceil(timeLeft)}s</span>
        <span>Score {score.toLocaleString()}</span>
      </div>

      {/* TODO: 컬러 밴드 + 좌우 버튼 레인 + DJMong 이 다음 단계에서 여기 들어감 */}
      <div style={{ flex: 1 }}>
        <GameCanvas />
      </div>

      <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 20, fontWeight: 700 }}>
        Combo x{combo}
      </div>
    </div>
  );
}
