import { useGameStore } from '../store/gameStore';

export default function ResultScreen() {
  const { score, maxCombo, bestScore, startGame, resetSession } = useGameStore();
  const isNewBest = score >= bestScore && score > 0;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: '#fff',
      textAlign: 'center',
    }}>
      {/* TODO: DJMong 반응 멘트(판정 요약 기반 LLM 코멘트) 여기 표시 */}
      {isNewBest && <div style={{ color: '#b89bf0', fontSize: 13 }}>🎉 신기록 갱신!</div>}
      <h2 style={{ fontSize: 28, margin: 0 }}>{score.toLocaleString()}</h2>
      <div style={{ fontSize: 13, opacity: 0.7 }}>최고 콤보 x{maxCombo}</div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          onClick={resetSession}
          style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #444', background: 'transparent', color: '#aaa' }}
        >
          메인으로
        </button>
        <button
          onClick={startGame}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#b89bf0', color: '#1a1a2e', fontWeight: 700 }}
        >
          다시하기
        </button>
      </div>
    </div>
  );
}
