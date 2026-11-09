// 세션(한 번의 플레이) 기록과 화면 간에 주고받는 데이터 타입
// 명세서 저장부(180): 세션 정보 + 게임 수행 정보 + 자가 상태 정보를 구분해서 저장
import type { MotionType } from '../motion/motionDetector';
import type { CalibrationData } from '../motion/calibrate';
import type { ShoulderAngles } from '../mediapipe/shoulderExtractor';
import type { CharacterId } from './character';

/** 스트레칭 6방향 (정면 CENTER 제외) */
export type StretchDirection = Exclude<MotionType, 'CENTER'>;

/** 노트 판정 등급. PERFECT, GOOD은 성공, MISS는 실패로 집계 */
export type Judgment = 'PERFECT' | 'GOOD' | 'MISS';

/** 0~10점 척도 (0: 전혀 없음 ~ 10: 매우 심함). 불편감, 뻣뻣함에 사용 */
export type Score10 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** 1~4점 척도. ROM 자가 체크에 사용 */
export type Score4 = 1 | 2 | 3 | 4;

/**
 * ROM(가동범위) 자가 체크: 방향별로 스스로 느끼는 움직임 정도
 * 1: 거의 못 움직임 ~ 4: 끝까지 편하게 움직임
 * 체크하지 않은 방향은 비워 둘 수 있음
 */
export type RomCheck = Partial<Record<StretchDirection, Score4>>;

/** 자가 상태 정보 (사전/사후 같은 항목) */
export interface SelfAssessment {
    discomfort: Score10; // 불편감 (0~10)
    stiffness: Score10;  // 뻣뻣함 (0~10)
    rom: RomCheck;
    recordedAt: string; // ISO 시각
}

/** 기준 자세 (머리 + 어깨) */
export interface CalibrationSnapshot {
    head: CalibrationData;
    shoulder: ShoulderAngles | null;
}

/** 판정이 끝난 노트 1개의 기록 */
export interface NoteRecord {
    noteId: number;
    motion: StretchDirection;
    judgment: Judgment;
    holdRatio?: number; // 0~1, 유지 게이지를 얼마나 채웠는지 (선택)
}

/** 게임 화면이 끝날 때 돌려주는 결과 */
export interface GameResult {
    chartId: string;
    notes: NoteRecord[];
    score: number;
    maxCombo: number;
    playTimeSec: number;
    completed: boolean; // 곡을 끝까지 했으면 true, 중간에 종료했으면 false
}

/** LocalStorage에 저장되는 세션 기록 1개 */
export interface SessionRecord {
    version: 1;
    id: string;
    userId: string;
    chartId: string;
    characterId: CharacterId;
    startedAt: string; // 게임 시작 시각 (ISO)
    endedAt: string;   // 사후 평가 완료 시각 (ISO)
    game: GameResult;
    pre: SelfAssessment;
    post: SelfAssessment;
    preReused: boolean; // 재플레이에서 이전 사전 평가를 그대로 썼는지
}
