import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './TutorialScreen.module.css';

const STEPS = [
  {
    targetElement: '#difficulty-select-area',
    title: 'Step 1. 난이도 선택',
    description:
      ' 🎵 Normal - [ 3색, 속도x1 ] \n 🎧 Beat Master - [ 4색, 속도x1.25 ] \n 🔥 DJ Legend - [ 5색, 속도x1.5 ] \n자신에게 맞는 난이로를 선택하세요.',
  },
  {
    targetElement: '#difficulty-select-a11',
    title: 'Step 2. 타이밍 밴드',
    description:
      '색상 텍스트가 랜덤 순서로 흘러갑니다. \n중앙 박스와 같은 색 버튼을, \n중앙에 왔을 때 누르면 퍼펙트 🤩 \n퍼펙트/굿은 콤보 유지, 낫굿만 콤보가 끊깁니다.',
  },
  {
    targetElement: '#difficulty-select-2',
    title: 'Step 3. 버튼 찾기',
    description:
      'DJ Mong 좌우에 색깔 버튼이 랜덤 위치로 등장합니다. \n중앙 박스와 동일한 색과 같은 버튼을 찾아 탭하세요. \n한 세트가 끝나면 버튼 위치가 다시 랜덤으로 바뀝니다.',
  },
];

export default function TutorialScreen() {
  // const [step, setStep] = useState(0);
  // const setScreen = useGameStore((s) => s.setScreen);
  // const isLast = step === STEPS.length - 1;
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const nextTutorial = useGameStore((s) => s.nextTutorial);
  const endTutorial = useGameStore((s) => s.endTutorial);
  const prevTutorial = useGameStore((s) => s.prevTutorial);

  useEffect(() => {
    if (tutorialStep === null) return;

    const stepIndex = tutorialStep - 1;

    if (stepIndex < 0 || stepIndex >= STEPS.length) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      stagePadding: 6,
      popoverClass: 'custom-red-box-popover',
      steps: STEPS.map((v) => {
        return {
          element: v.targetElement,
          popover: {
            title: v.title,
            description: v.description,
            side: 'bottom',
            align: 'center',
            nextBtnText: stepIndex === STEPS.length - 1 ? '완료' : 'Next',
            prevBtnText: 'Previous',
          },
        };
      }),
      onPrevClick: () => {
        prevTutorial();
      },
      onNextClick: () => {
        nextTutorial();
      },
      onCloseClick: () => {
        endTutorial();
        driverObj.destroy();
      },
    });

    driverObj.drive(stepIndex);

    return () => {
      driverObj.destroy();
    };
  }, [tutorialStep, nextTutorial, prevTutorial, endTutorial]);

  return null;

  // return (
  //   <div className={styles.container}>
  //     {/* TODO: 실제 게임 화면 위에 강조 박스(하이라이트) 오버레이하는 연출로 교체 */}
  //     <h2 className={styles['tutorial-title']}>{STEPS[step].title}</h2>
  //     <p className={styles['tutorial-explain-text']}>{STEPS[step].description}</p>

  //     <div className={styles['indicator-box']}>
  //       {STEPS.map((_, i) => (
  //         <div key={i} className={styles.indicator} data-selected={i === step} />
  //       ))}
  //     </div>

  //     <div className={styles['tutorial-button-box']}>
  //       <button onClick={() => setScreen('main')} className={styles['tutorial-back-button']}>
  //         {isLast ? '메인으로' : '건너뛰기'}
  //       </button>
  //       <button
  //         onClick={() => (isLast ? setScreen('main') : setStep((s) => s + 1))}
  //         className={styles['tutorial-next-button']}
  //       >
  //         {isLast ? '완료' : '다음'}
  //       </button>
  //     </div>
  //   </div>
  // );
}
