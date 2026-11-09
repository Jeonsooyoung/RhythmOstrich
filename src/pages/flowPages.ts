// 진행 순서에 쓰이는 페이지 모음
// 각 파트에서 진짜 페이지를 만들면 아래 import 경로만 바꾸면 됨
// (props 약속은 src/types/pages.ts)

// 3번 파트: 사전·사후 자가 평가 (AssessmentPageProps)
export { default as AssessmentPage } from './placeholders/AssessmentPlaceholder';

// 1·2번 파트: 게임 (GamePageProps)
export { default as GamePage } from './GamePlay';

// 3번 파트: 결과 (ResultPageProps)
export { default as ResultPage } from './placeholders/ResultPlaceholder';

// 곡 선택 (연습 포함 여부는 1번 파트와 상의)
export { default as SongSelectPage } from './placeholders/SongSelectPlaceholder';
