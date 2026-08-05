import { useGameStore, DIFFICULTIES } from '../store/gameStore';
import type { Difficulty } from '../store/difficulties';

export default function MainScreen() {
  const { difficulty, setDifficulty, bestScore, startGame, setScreen } = useGameStore();
  const config = DIFFICULTIES[difficulty];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      color: '#fff',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: 32, margin: 0 }}>DJMong</h1>

      <div style={{ fontSize: 14, opacity: 0.7 }}>이전 기록: {bestScore.toLocaleString()}</div>

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((id) => (
          <button
            key={id}
            onClick={() => setDifficulty(id)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: id === difficulty ? '2px solid #b89bf0' : '1px solid #444',
              background: id === difficulty ? '#2a2440' : '#1a1a2e',
              color: '#fff',
              fontSize: 13,
            }}
          >
            {DIFFICULTIES[id].label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{config.description}</div>

      <button
        onClick={startGame}
        style={{
          marginTop: 24,
          padding: '14px 40px',
          borderRadius: 12,
          border: 'none',
          background: '#b89bf0',
          color: '#1a1a2e',
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        게임 시작
      </button>

      <button
        onClick={() => setScreen('tutorial')}
        style={{
          padding: '10px 24px',
          borderRadius: 10,
          border: '1px solid #444',
          background: 'transparent',
          color: '#aaa',
          fontSize: 13,
        }}
      >
        게임 튜토리얼
      </button>
    </div>
  );
}
