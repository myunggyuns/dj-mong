import { create } from 'zustand';
import { DIFFICULTIES, type Difficulty, type ColorId } from './difficulties';

export type Screen = 'main' | 'tutorial' | 'playing' | 'result';
export type Judgment = 'perfect' | 'good' | 'notGood' | 'bad';

const BEST_SCORE_KEY = 'tapmong:bestScore';
const BASE_POINTS: Record<Judgment, number> = { perfect: 100, good: 50, notGood: 0, bad: 0 };
const SESSION_SECONDS = 30;

function loadBestScore(): number {
  const raw = localStorage.getItem(BEST_SCORE_KEY);
  return raw ? Number(raw) || 0 : 0;
}

interface GameState {
  screen: Screen;
  difficulty: Difficulty;
  score: number;
  combo: number;
  maxCombo: number;
  perfectStreak: number;
  timeLeft: number;
  bestScore: number;
  lastJudgment: Judgment | null;
  judgmentSeq: number;
  tutorialStep: number | null;
  currentTargetColor: ColorId | null;
  isPaused: boolean;

  startTutorial: () => void;
  nextTutorial: () => void;
  prevTutorial: () => void;
  endTutorial: () => void;

  setScreen: (screen: Screen) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setCurrentTarget: (color: ColorId) => void;
  startGame: () => void;
  tick: (deltaSeconds: number) => void;
  registerJudgment: (judgment: Judgment) => void;
  endGame: () => void;
  resetSession: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'main',
  difficulty: 'normal',
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfectStreak: 0,
  timeLeft: SESSION_SECONDS,
  bestScore: loadBestScore(),
  lastJudgment: null,
  judgmentSeq: 0,
  tutorialStep: null,
  currentTargetColor: null,
  isPaused: false,

  startTutorial: () => set({ screen: 'main', tutorialStep: 1 }),
  nextTutorial: () =>
    set((state) => {
      const currentStep = state.tutorialStep ?? 0;

      if (currentStep === 1) {
        return { screen: 'playing', tutorialStep: 2 };
      }
      if (currentStep === 2) {
        return { tutorialStep: 3 };
      }

      return { screen: 'main', tutorialStep: null };
    }),
  prevTutorial: () =>
    set((state) => {
      const currentStep = state.tutorialStep ?? 1;

      // Step 2에서 이전 버튼 누르면 다시 Step 1 & 메인 화면으로 복귀
      if (currentStep === 2) {
        return { screen: 'main', tutorialStep: 1 };
      }

      if (currentStep === 3) {
        return { tutorialStep: 2 };
      }

      return { screen: 'main', tutorialStep: null };
    }),
  endTutorial: () => set({ screen: 'main', tutorialStep: null }),

  setScreen: (screen) => set({ screen }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setCurrentTarget: (color) => {
    if (get().currentTargetColor !== color) set({ currentTargetColor: color });
  },

  startGame: () =>
    set({
      screen: 'playing',
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectStreak: 0,
      timeLeft: SESSION_SECONDS,
      lastJudgment: null,
      isPaused: false,
    }),

  tick: (deltaSeconds) => {
    if (get().isPaused) return;
    const timeLeft = Math.max(0, get().timeLeft - deltaSeconds);
    set({ timeLeft });
    if (timeLeft <= 0) get().endGame();
  },

  // 판정 규칙 (기획 확정):
  // - 퍼펙트/굿 둘 다 콤보 유지, 낫굿·배드는 콤보 초기화
  // - 퍼펙트 연속 스트릭은 콤보와 별개 카운터 (굿이 섞이면 스트릭만 리셋, 콤보는 유지)
  // - 콤보 배율: 10마다 +0.1, 상한 x2.0
  registerJudgment: (judgment) => {
    const state = get();
    const comboBroken = judgment === 'notGood' || judgment === 'bad';
    const nextCombo = comboBroken ? 0 : state.combo + 1;
    const nextPerfectStreak =
      judgment === 'perfect' ? state.perfectStreak + 1 : judgment === 'good' ? 0 : 0;

    const comboMultiplier = Math.min(2.0, 1 + Math.floor(nextCombo / 10) * 0.1);
    const perfectStreakBonus = 1 + Math.min(1.0, nextPerfectStreak * 0.02); // 예시 곡선, 개발 중 튜닝

    const gained = Math.round(BASE_POINTS[judgment] * comboMultiplier * perfectStreakBonus);

    set({
      score: state.score + gained,
      combo: nextCombo,
      maxCombo: Math.max(state.maxCombo, nextCombo),
      perfectStreak: nextPerfectStreak,
      lastJudgment: judgment,
      judgmentSeq: state.judgmentSeq + 1,
    });
  },

  endGame: () => {
    const state = get();
    if (state.score > state.bestScore) {
      localStorage.setItem(BEST_SCORE_KEY, String(state.score));
      set({ bestScore: state.score });
    }
    set({ screen: 'result' });
  },

  resetSession: () => set({ screen: 'main', isPaused: false }),

  pauseGame: () => {
    if (get().screen === 'playing' && get().tutorialStep === null) set({ isPaused: true });
  },
  resumeGame: () => set({ isPaused: false }),
}));

export { DIFFICULTIES };
