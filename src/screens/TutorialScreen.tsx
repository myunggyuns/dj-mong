import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const STEPS = [
  {
    title: 'Step 1. 난이도 선택',
    body: 'Normal(3색, 속도x1) / Beat Master(4색, 속도x1.25) / DJ Legend(5색, 속도x1.5) 중 선택하세요.',
  },
  {
    title: 'Step 2. 타이밍 밴드',
    body: '색상 텍스트가 랜덤 순서로 흘러갑니다. 중앙 박스와 같은 색 버튼을, 중앙에 왔을 때 누르면 퍼펙트! 퍼펙트/굿은 콤보 유지, 낫굿만 콤보가 끊깁니다.',
  },
  {
    title: 'Step 3. 버튼 찾기',
    body: 'DJMong 좌우에 색깔 버튼이 랜덤 위치로 등장합니다. 밴드가 알려주는 색과 같은 버튼을 찾아 탭하세요. 한 세트가 끝나면 버튼 위치가 다시 랜덤으로 바뀝니다.',
  },
];

export default function TutorialScreen() {
  const [step, setStep] = useState(0);
  const setScreen = useGameStore((s) => s.setScreen);
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
      padding: 24,
      color: '#fff',
      textAlign: 'center',
    }}>
      {/* TODO: 실제 게임 화면 위에 강조 박스(하이라이트) 오버레이하는 연출로 교체 */}
      <h2 style={{ fontSize: 20 }}>{STEPS[step].title}</h2>
      <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>{STEPS[step].body}</p>

      <div style={{ display: 'flex', gap: 6 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i === step ? '#b89bf0' : '#444',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          onClick={() => setScreen('main')}
          style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #444', background: 'transparent', color: '#aaa' }}
        >
          건너뛰기
        </button>
        <button
          onClick={() => (isLast ? setScreen('main') : setStep((s) => s + 1))}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#b89bf0', color: '#1a1a2e', fontWeight: 700 }}
        >
          {isLast ? '완료' : '다음'}
        </button>
      </div>
    </div>
  );
}
