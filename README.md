# NAN 2026 - Arcade Prototype

NHN Game x AI Hackathon 2026 사전 과제용 프로젝트.

## 스택
- React + TypeScript + Vite
- Phaser.js (Arcade Physics) — React 컴포넌트(`GameCanvas`) 안에 마운트
- 타겟: 모바일 세로형 (9:16, max-width 480px). 데스크톱 브라우저에서도 동일 프레임으로 표시됨

## 로컬 실행
```bash
npm install
npm run dev
```

## GitHub Pages 배포
1. GitHub에 public repo 생성 후 push (main 브랜치)
2. repo Settings → Pages → Source를 "GitHub Actions"로 설정
3. `.github/workflows/deploy.yml`이 push할 때마다 자동 빌드/배포
4. 배포된 URL: `https://<username>.github.io/<repo-name>/`

## Claude Code로 이어서 개발하기

1. 이 프로젝트 폴더를 로컬 PC로 다운로드/압축 해제
2. 터미널에서 프로젝트 폴더로 이동 후:
   ```bash
   claude
   ```
   (Claude Code가 설치되어 있지 않다면 `npm install -g @anthropic-ai/claude-code`)
3. Claude Code가 이 폴더 구조와 `src/game/MainScene.ts`를 자동으로 인식함
4. 이후 작업 지시 예시:
   - "player 스프라이트를 실제 아트로 교체해줘"
   - "AI 디렉터 로직(난이도 자동 조절) 추가해줘"
   - "Gemini API로 실시간 게임 내레이션 붙여줘"

## 다음 단계 (TODO)
- [ ] AI 디렉터: 플레이어 스킬 스코어링 + 난이도 피드백 루프 구현
- [ ] LLM 내레이션: 이벤트 기반 프롬프트 설계 및 통합
- [ ] 실제 아트 에셋 교체 (터치 조작에 맞는 세로형 레이아웃 고려)
- [ ] 사운드 추가
- [ ] 게임 소개서 작성 (PDF)
- [ ] AI 활용 기술 문서 작성 (PDF) — 게임 내 AI 로직 + 개발에 사용한 AI 도구(Claude Code 등) 둘 다 기재
- [ ] 플레이 영상 촬영 (실기기 or 브라우저 모바일 프레임, AI 편집 금지)
