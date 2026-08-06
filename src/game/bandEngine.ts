import type { ColorId } from '../store/difficulties';

export interface BandWord {
  id: number;
  color: ColorId;
  startedAt: number; // performance.now() 기준 ms
  travelMs: number;
}

let nextId = 0;

/** 난이도별 색상 풀에서 중복 없는 랜덤 순서 세트를 생성 */
export function shuffledSet(colors: ColorId[]): ColorId[] {
  const arr = [...colors];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function lerp(a: number, b: number, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return a + (b - a) * clamped;
}

export function createWord(color: ColorId, now: number, travelMs: number): BandWord {
  return { id: nextId++, color, startedAt: now, travelMs };
}

/** 0 = 오른쪽에서 막 등장, 0.5 = 정중앙 통과, 1 = 왼쪽으로 퇴장 */
export function progressOf(word: BandWord, now: number): number {
  return (now - word.startedAt) / word.travelMs;
}

/** 정중앙(0.5)까지 남은 시간(ms). 음수면 이미 지나감 */
export function msUntilCenter(word: BandWord, now: number): number {
  const centerAt = word.startedAt + word.travelMs * 0.5;
  return centerAt - now;
}
