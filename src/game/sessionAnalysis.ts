// 결과 분석 (명세서 결과 분석부 170)
// 결과 화면과 그래프는 이 함수들의 값을 그대로 그리면 됨
import type {
    GameResult,
    Judgment,
    SelfAssessment,
    SessionRecord,
    StretchDirection,
} from '../types/session';

export const STRETCH_DIRECTIONS: readonly StretchDirection[] = [
    'FLEXION',
    'EXTENSION',
    'LEFT_TILT',
    'RIGHT_TILT',
    'LEFT_TURN',
    'RIGHT_TURN',
];

export const DIRECTION_LABELS: Record<StretchDirection, string> = {
    FLEXION: '고개 숙이기',
    EXTENSION: '고개 들기',
    LEFT_TILT: '왼쪽 기울이기',
    RIGHT_TILT: '오른쪽 기울이기',
    LEFT_TURN: '왼쪽 돌리기',
    RIGHT_TURN: '오른쪽 돌리기',
};

export const isSuccess =(judgment: Judgment) => judgment !== 'MISS';

export interface DirectionStat {
    total: number;
    success: number;
    /** 성공률(%) = 성공 노트 수 / 제시된 노트 수 × 100. 제시된 노트가 없으면 null */
    rate: number | null;
}

export interface GameSummary {
    total: number;
    success: number;
    rate: number | null;
    judgments: Record<Judgment, number>;
    byDirection: Record<StretchDirection, DirectionStat>;
    score: number;
    maxCombo: number;
    playTimeSec: number;
}

const toRate = (success: number, total: number) =>
    total === 0 ? null : (success / total) * 100;

/** 게임 결과 → 전체/방향별 성공률, 판정 개수 */
export function summarizeGame(game: GameResult): GameSummary {
    const judgments: Record<Judgment, number> = { PERFECT: 0, GOOD: 0, MISS: 0 };
    const byDirection = Object.fromEntries(
        STRETCH_DIRECTIONS.map(direction => [direction, { total: 0, success: 0, rate: null }])
    ) as Record<StretchDirection, DirectionStat>;

    for (const note of game.notes) {
        judgments[note.judgment]++;
        const stat = byDirection[note.motion];
        if (!stat) continue;
        stat.total++;
        if (isSuccess(note.judgment)) stat.success++;
    }
    for (const stat of Object.values(byDirection)) stat.rate = toRate(stat.success, stat.total);

    const success = judgments.PERFECT + judgments.GOOD;
    return {
        total: game.notes.length,
        success,
        rate: toRate(success, game.notes.length),
        judgments,
        byDirection,
        score: game.score,
        maxCombo: game.maxCombo,
        playTimeSec: game.playTimeSec,
    };
}

export interface AssessmentChange {
    /** 사후 − 사전. 음수면 줄어듦(좋아짐) */
    discomfort: number;
    stiffness: number;
    /** 방향별 ROM 사후 − 사전. 양수면 늘어남(좋아짐). 둘 중 하나라도 비어 있으면 제외 */
    rom: Partial<Record<StretchDirection, number>>;
}

/** 사전/사후 자가 평가 비교 */
export function compareAssessments(pre: SelfAssessment, post: SelfAssessment): AssessmentChange {
    const rom: Partial<Record<StretchDirection, number>> = {};
    for (const direction of STRETCH_DIRECTIONS) {
        const before = pre.rom[direction];
        const after = post.rom[direction];
        if (before !== undefined && after !== undefined) rom[direction] = after - before;
    }
    return {
        discomfort: post.discomfort - pre.discomfort,
        stiffness: post.stiffness - pre.stiffness,
        rom,
    };
}

export interface HistoryPoint {
    sessionId: string;
    startedAt: string;
    chartId: string;
    rate: number | null;
    byDirection: Record<StretchDirection, number | null>;
    score: number;
    change: AssessmentChange;
}

/** 이전 기록 추이 (그래프 640용). records는 오래된 순 */
export function buildHistory(records: SessionRecord[]): HistoryPoint[] {
    return records.map(record => {
        const summary = summarizeGame(record.game);
        return {
            sessionId: record.id,
            startedAt: record.startedAt,
            chartId: record.chartId,
            rate: summary.rate,
            byDirection: Object.fromEntries(
                STRETCH_DIRECTIONS.map(direction => [direction, summary.byDirection[direction].rate])
            ) as Record<StretchDirection, number | null>,
            score: summary.score,
            change: compareAssessments(record.pre, record.post),
        };
    });
}
