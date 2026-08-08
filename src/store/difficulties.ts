import { type Judgment } from './gameStore';

type Difficulty = 'normal' | 'tapMaster' | 'tapLegend';

type ColorId = 'Red' | 'Green' | 'Blue' | 'Yellow' | 'Purple';

interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  colors: ColorId[];
  speedMultiplier: number;
  showLanes: boolean;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  normal: {
    id: 'normal',
    label: 'Normal',
    description: '3가지 색상으로 게임을 진행합니다.',
    colors: ['Red', 'Green', 'Blue'],
    speedMultiplier: 1.0,
    showLanes: true,
  },
  tapMaster: {
    id: 'tapMaster',
    label: 'Tap Master',
    description: '4가지 색상으로 게임을 진행합니다.',
    colors: ['Red', 'Green', 'Blue', 'Yellow'],
    speedMultiplier: 1.25,
    showLanes: true,
  },
  tapLegend: {
    id: 'tapLegend',
    label: 'Tap Legend',
    description: '5가지 색상으로 게임을 진행합니다.',
    colors: ['Red', 'Green', 'Blue', 'Yellow', 'Purple'],
    speedMultiplier: 1.55,
    showLanes: false,
  },
};

export const COLOR_HEX: Record<ColorId, string> = {
  Red: '#e0453f',
  Green: '#3ba55c',
  Blue: '#3d7ee0',
  Yellow: '#e0c53d',
  Purple: '#b89bf0',
};

const JUDGMENT_LABEL: Record<Judgment, string> = {
  perfect: 'Perfect!',
  good: 'Good',
  notGood: 'Not Good',
  bad: 'Bad',
};

const JUDGMENT_COLOR: Record<Judgment, string> = {
  perfect: '#b89bf0',
  good: '#3ba55c',
  notGood: '#e0a53d',
  bad: '#e0453f',
};

export {
  type Difficulty,
  type ColorId,
  type DifficultyConfig,
  DIFFICULTIES,
  JUDGMENT_LABEL,
  JUDGMENT_COLOR,
};
