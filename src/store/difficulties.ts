export type Difficulty = 'normal' | 'beatMaster' | 'djLegend';

export type ColorId = 'red' | 'green' | 'blue' | 'yellow' | 'black';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  colors: ColorId[];
  speedMultiplier: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  normal: {
    id: 'normal',
    label: 'Normal',
    description: '3가지 색상',
    colors: ['red', 'green', 'blue'],
    speedMultiplier: 1.0,
  },
  beatMaster: {
    id: 'beatMaster',
    label: 'Beat Master',
    description: '4가지 색상',
    colors: ['red', 'green', 'blue', 'yellow'],
    speedMultiplier: 1.25,
  },
  djLegend: {
    id: 'djLegend',
    label: 'DJ Legend',
    description: '5가지 색상',
    colors: ['red', 'green', 'blue', 'yellow', 'black'],
    speedMultiplier: 1.5,
  },
};

export const COLOR_HEX: Record<ColorId, string> = {
  red: '#e0453f',
  green: '#3ba55c',
  blue: '#3d7ee0',
  yellow: '#e0c53d',
  black: '#2b2b33',
};
