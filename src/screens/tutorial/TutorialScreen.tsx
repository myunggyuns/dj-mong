import styles from './TutorialScreen.module.css';
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

const STEPS = [
  {
    title: 'Step 1. 난이도 선택',
    body: 'Normal - [3색, 속도x1] \n Beat Master - [4색, 속도x1.25] \n DJ Legend - [5색, 속도x1.5] \n 자신에게 맞는 난이로를 선택하세요.',
  },
  {
    title: 'Step 2. 타이밍 밴드',
    body: '색상 텍스트가 랜덤 순서로 흘러갑니다. \n 중앙 박스와 같은 색 버튼을, 중앙에 왔을 때 누르면 퍼펙트! \n 퍼펙트/굿은 콤보 유지, 낫굿만 콤보가 끊깁니다.',
  },
  {
    title: 'Step 3. 버튼 찾기',
    body: 'DJMong 좌우에 색깔 버튼이 랜덤 위치로 등장합니다. \n 밴드가 알려주는 색과 같은 버튼을 찾아 탭하세요. \n 한 세트가 끝나면 버튼 위치가 다시 랜덤으로 바뀝니다.',
  },
];

export default function TutorialScreen() {
  const [step, setStep] = useState(0);
  const setScreen = useGameStore((s) => s.setScreen);
  const isLast = step === STEPS.length - 1;

  return (
    <div className={styles.container}>
      {/* TODO: 실제 게임 화면 위에 강조 박스(하이라이트) 오버레이하는 연출로 교체 */}
      <h2 className={styles['tutorial-title']}>{STEPS[step].title}</h2>
      <p className={styles['tutorial-explain-text']}>{STEPS[step].body}</p>

      <div className={styles['indicator-box']}>
        {STEPS.map((_, i) => (
          <div key={i} className={styles.indicator} data-selected={i === step} />
        ))}
      </div>

      <div className={styles['tutorial-button-box']}>
        <button onClick={() => setScreen('main')} className={styles['tutorial-back-button']}>
          {isLast ? '메인으로' : '건너뛰기'}
        </button>
        <button
          onClick={() => (isLast ? setScreen('main') : setStep((s) => s + 1))}
          className={styles['tutorial-next-button']}
        >
          {isLast ? '완료' : '다음'}
        </button>
      </div>
    </div>
  );
}
