# 진행 상황 (Claude Code 인계용)

## 완료됨

- 프로젝트 셋업: React + TS + Vite + Phaser, Zustand, oxlint, Prettier
- 화면 흐름: `App.tsx`가 `useGameStore().screen`으로 Main/Tutorial/Playing/Result 전환 (라우터 없음)
- `src/store/gameStore.ts`: 점수/콤보/판정 로직 완성
  - 판정 4종: `perfect | good | notGood | bad`
  - 퍼펙트·굿은 콤보 유지, 낫굿·배드는 콤보 리셋
  - 콤보 배율(10마다 +0.1, 상한 x2.0) + 퍼펙트 연속 스트릭 보너스 곡선 (임시 수치, 튜닝 필요)
  - `endGame()`에서 localStorage 최고점수 갱신
- `src/store/difficulties.ts`: Normal(x1) / Tap Master(x1.25) / Tap Legend(x1.5), 색상 3/4/5개
- **컬러 밴드 완성** (`src/game/bandEngine.ts` + `src/game/ColorBand.tsx`)
  - requestAnimationFrame 기반, 세트마다 색 랜덤 셔플, 시간 지날수록 간격/속도 증가
  - 중앙 통과 색을 `gameStore.currentTargetColor`에 실시간 반영 (다음 단계 버튼 판정에서 이 값을 읽으면 됨)
  - `PlayScreen.tsx`에 연결 완료, 실제로 화면에서 흐르는 것 확인 가능

## 다음 작업 (우선순위 순)

1. **좌우 버튼 레인 + TapMong** — `PlayScreen.tsx`의 GameCanvas 자리(또는 별도 컴포넌트)에 구현
   - 한 세트 시작 시 버튼 N개(난이도별 색상 수만큼) 좌/우 레인에 랜덤 위치로 동시 생성
   - 탭 시 판정 로직: `currentTargetColor`와 비교해 색이 다르면 `bad`, 같으면 `bandEngine`의 `msUntilCenter()`로 시간 차 계산해 `perfect/good/notGood` 결정 → `registerJudgment()` 호출
   - 세트(단어 다 지나감) 끝나면 버튼 위치 리셋
2. **AI 마스코트 리액션 연결** — 판정 SVG 5종(퍼펙트/굿/낫굿/배드/대기) 이미 디자인 확정, React 컴포넌트로 옮겨서 `lastJudgment` 값에 따라 표시
3. **AI 디렉터** — 정확도 롤링 윈도우로 난이도(속도/복잡도) 실시간 미세조절 (현재는 난이도 선택값 + 시간 경과로만 속도 조절 중)
4. **AI 코멘터리 (Gemini)** — 서버리스 프록시 함수 필요 (Vercel `api/` 폴더), 콤보 마일스톤/미스 이벤트에 반응
5. **결과 화면 폴리싱** — TapMong 반응 멘트 표시

## 참고

- 기획 문서: `GAME_DESIGN.md` (별도 전달됨), 와이어프레임: `wireframe.png`
- 마스코트 5종 리액션 SVG는 대화 중 생성됨(퍼펙트/굿/낫굿/배드/대기) — 코드로 옮기는 작업 필요
- `.env.example` 참고해서 Gemini API 키는 로컬 `.env`에만 (커밋 금지, 이미 gitignore 처리됨)
