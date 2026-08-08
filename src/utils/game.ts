import type { ColorId } from '../store/difficulties';

interface BandWord {
  id: number;
  color: ColorId;
  startedAt: number; // performance.now() 기준 ms
  travelMs: number;
}

let nextId = 0;

/** 난이도별 색상 풀에서 중복 없는 랜덤 순서 세트를 생성 */
function shuffledSet(colors: ColorId[]): ColorId[] {
  const arr = [...colors];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function lerp(a: number, b: number, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return a + (b - a) * clamped;
}

function createWord(color: ColorId, now: number, travelMs: number): BandWord {
  return { id: nextId++, color, startedAt: now, travelMs };
}

/** 0 = 오른쪽에서 막 등장, 0.5 = 정중앙 통과, 1 = 왼쪽으로 퇴장 */
function progressOf(word: BandWord, now: number): number {
  return (now - word.startedAt) / word.travelMs;
}

/** 정중앙(0.5)까지 남은 시간(ms). 음수면 이미 지나감 */
function msUntilCenter(word: BandWord, now: number): number {
  const centerAt = word.startedAt + word.travelMs * 0.5;
  return centerAt - now;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// color-mix(hex, white/black percent)에 대응하는 캔버스용 셰이딩 헬퍼.
function shadeColor(hex: string, percent: number) {
  const { r, g, b } = hexToRgb(hex);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  return `rgb(${clamp(r + amt)}, ${clamp(g + amt)}, ${clamp(b + amt)})`;
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export {
  withAlpha,
  shadeColor,
  msUntilCenter,
  progressOf,
  createWord,
  lerp,
  shuffledSet,
  type BandWord,
};
