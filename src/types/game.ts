import type { MotionType } from '../motion/motionDetector';

/**
 * 노트 1개 (동작 순서/음악 담당이 만드는 데이터)
 * 시간은 모두 음악 재생 시간(audio.currentTime) 기준, 초 단위
 */
export interface NoteData {
    id: number;
    targetMotion: MotionType;
    responseStart: number; // 이 시간부터 판정 시작
    responseEnd: number;   // 이 시간까지 holdTime만큼 유지를 다 채워야 성공
    holdTime: number;      // 목표 동작을 연속으로 유지해야 하는 시간
}

export type JudgeResult = 'SUCCESS' | 'FAIL';

/** 판정이 끝난 노트 1개의 결과 */
export interface NoteResult {
    noteId: number;
    result: JudgeResult;
}
