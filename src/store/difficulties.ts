export type Difficulty = 'normal' | 'beatMaster' | 'djLegend';

export type ColorId = 'Red' | 'Green' | 'Blue' | 'Yellow' | 'Purple';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  colors: ColorId[];
  speedMultiplier: number;
  showLanes: boolean;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  normal: {
    id: 'normal',
    label: 'Normal',
    description: '3가지 색상으로 게임을 진행합니다.',
    colors: ['Red', 'Green', 'Blue'],
    speedMultiplier: 1.0,
    showLanes: true,
  },
  beatMaster: {
    id: 'beatMaster',
    label: 'Beat Master',
    description: '4가지 색상으로 게임을 진행합니다.',
    colors: ['Red', 'Green', 'Blue', 'Yellow'],
    speedMultiplier: 1.25,
    showLanes: true,
  },
  djLegend: {
    id: 'djLegend',
    label: 'DJ Legend',
    description: '5가지 색상으로 게임을 진행합니다.',
    colors: ['Red', 'Green', 'Blue', 'Yellow', 'Purple'],
    speedMultiplier: 1.5,
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
