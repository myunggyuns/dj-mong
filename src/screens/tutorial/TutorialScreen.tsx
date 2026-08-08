import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './TutorialScreen.css';
import { STEPS } from '../../constant/tutorial';

export default function TutorialScreen() {
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const nextTutorial = useGameStore((s) => s.nextTutorial);
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
      allowClose: false,
      showButtons: ['next', 'previous'],
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
    });

    driverObj.drive(stepIndex);

    return () => {
      driverObj.destroy();
    };
  }, [tutorialStep, nextTutorial, prevTutorial]);

  return null;
}
