import type { ColorId } from '../store/difficulties';
import { BAND_MARGIN_X, BAND_ZONE_WIDTH } from '../constant/game';

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

/**
 * 현재 단어(텍스트)가 화면에 그려지는 밴드 중앙 박스(BAND_ZONE_WIDTH) 안에
 * 단어 너비 대비 얼마나 겹쳐 있는지(0~1)를 반환한다.
 * MainScene의 x = BAND_MARGIN_X + (1.15 - 1.3 * progress) * bandInnerWidth 매핑, scale 보간과
 * 동일한 계수를 사용해야 화면에 보이는 위치/크기와 판정 기준이 어긋나지 않는다.
 */
function centerOverlapRatio(
  word: BandWord,
  now: number,
  bandInnerWidth: number,
  screenWidth: number,
  textWidth: number,
): number {
  if (textWidth <= 0) return 0;

  const progress = progressOf(word, now);
  const distFromCenter = Math.abs(progress - 0.5);
  const scale = lerp(1.7, 0.7, Math.min(1, distFromCenter / 0.5));
  const xPercent = 1.15 - progress * 1.3;
  const centerX = BAND_MARGIN_X + xPercent * bandInnerWidth;

  const wordWidth = textWidth * scale;
  const wordLeft = centerX - wordWidth / 2;
  const wordRight = centerX + wordWidth / 2;
  const boxLeft = screenWidth / 2 - BAND_ZONE_WIDTH / 2;
  const boxRight = screenWidth / 2 + BAND_ZONE_WIDTH / 2;

  const overlap = Math.max(0, Math.min(wordRight, boxRight) - Math.max(wordLeft, boxLeft));
  return overlap / wordWidth;
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
  centerOverlapRatio,
  progressOf,
  createWord,
  lerp,
  shuffledSet,
  type BandWord,
};
