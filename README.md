# 2026_RhythmOstrich

## React + TypeScript + Vite

## 커밋 메시지 규칙
- FEAT: 새로운 기능 추가
- FIX: 버그 수정
- DOCS: 문서 변경
- STYLE: 코드 포맷팅, 세미콜론 누락 등 코드 변경이 없는 경우
- REFACTOR: 코드 리팩토링 (기능 변경 없음)
- TEST: 누락된 테스트 추가 또는 기존 테스트 수정
- CHORE: 빌드 프로세스 또는 보조 도구 수정 (라이브러리 추가 등)
- PERF: 성능 향상 관련 변경
- BUILD: 빌드 관련 파일 변경

## 폴더별 역할

- `src/assets`
  - 이미지, 아이콘, 로고 등 화면에서 사용하는 정적 파일 저장
  - 예: `logo.png`, `left-arrow.svg`, `tutorial-image.png`

- `src/components`
  - 여러 화면에서 재사용하는 React UI 컴포넌트 저장
  - 예: `WebcamView.tsx`, `CharacterView.tsx`, `ResultChart.tsx`

- `src/data`
  - 개발 및 테스트용 임시 데이터(Mock Data) 저장
  - 예: `mockMotion.ts`, `mockGameResult.ts`

- `src/game`
  - 리듬게임 진행 로직, 노트, 음악 타이밍 관련 코드 저장
  - 예: `gameEngine.ts`, `noteManager.ts`, `songData.ts`

- `src/hooks`
  - React에서 반복적으로 사용하는 기능성 Custom Hook 저장
  - 예: `useWebcam.ts`, `useFaceLandmarker.ts`, `usePoseLandmarker.ts`

- `src/mediapipe`
  - MediaPipe 초기화 및 결과값 추출 관련 코드 저장
  - 예: `faceLandmarker.ts`, `poseLandmarker.ts`, `motionExtractor.ts`

- `src/motion`
  - 머리 각도 보정 및 실제 동작 판별 관련 코드 저장
  - 예: `calibrate.ts`, `motionDetector.ts`, `holdDetector.ts`

- `src/pages`
  - 하나의 전체 화면을 구성하는 React 페이지 저장
  - 예: `StartPage.tsx`, `GamePage.tsx`, `ResultPage.tsx`

- `src/three`
  - Three.js 및 3D 캐릭터 관련 코드 저장
  - 예: `characterLoader.ts`, `characterController.ts`, `sceneManager.ts`

- `src/types`
  - 팀 전체에서 공통으로 사용하는 TypeScript 데이터 타입 저장
  - 예: `motion.ts`, `game.ts`, `assessment.ts`

- `public/audio`
  - 게임에서 사용하는 음악 및 효과음 파일 저장
  - 예: `game_music.mp3`, `success.mp3`

- `public/models`
  - MediaPipe 모델 및 3D 모델 파일 저장
  - 예: `face_landmarker.task`, `pose_landmarker.task`, `ostrich.glb`