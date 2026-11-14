// 판정 등급(PERFECT / GOOD / MISS), 점수, 콤보 계산
// 기준이 바뀌면 아래 SCORING 값만 고치면 됨
import type { ChartData } from './chart';
import type { NoteResult } from '../types/game';
import type { GameResult, Judgment, NoteRecord, StretchDirection } from '../types/session';

export const SCORING = {
    /**
     * 성공한 노트의 등급 기준
     * - 'steady': 유지 게이지가 한 번도 끊기지 않고 채워지면 PERFECT, 중간에 끊겨 다시 채운 뒤 성공하면 GOOD
     * - 'success': 성공하면 모두 PERFECT (GOOD 없음)
     */
    perfectRule: 'steady' as 'steady' | 'success',
    /** 등급별 점수 */
    points: { PERFECT: 100, GOOD: 50, MISS: 0 } as Record<Judgment, number>,
    /** 콤보 1회당 추가 점수 (2콤보부터 적용, 0이면 보너스 없음) */
    comboBonus: 0,
};

export interface ScoredResult extends NoteResult {
    judgment?: Judgment;
    holdRatio?: number;
}

/** 노트 하나의 등급. restarted = 유지 도중 자세가 풀려 게이지가 처음부터 다시 시작된 적이 있는지 */
export function gradeNote(result: NoteResult['result'], restarted: boolean): Judgment {
    if (result === 'FAIL') return 'MISS';
    return SCORING.perfectRule === 'steady' && restarted ? 'GOOD' : 'PERFECT';
}

export function judgmentOf(result: ScoredResult): Judgment {
    return result.judgment ?? (result.result === 'SUCCESS' ? 'PERFECT' : 'MISS');
}

export interface ScoreState { score: number; combo: number; maxCombo: number; counts: Record<Judgment, number>; }

export function scoreResults(results: ScoredResult[]): ScoreState {
    const state: ScoreState = { score: 0, combo: 0, maxCombo: 0, counts: { PERFECT: 0, GOOD: 0, MISS: 0 } };
    for (const result of results) {
        const judgment = judgmentOf(result);
        state.counts[judgment]++;
        state.combo = judgment === 'MISS' ? 0 : state.combo + 1;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.score += SCORING.points[judgment];
        if (state.combo >= 2) state.score += SCORING.comboBonus;
    }
    return state;
}

export function buildGameResult(chart: ChartData, results: ScoredResult[], playTimeSec: number): GameResult {
    const ordered = chart.notes.flatMap((_, index) => results.find(result => result.noteId === index + 1) ?? []);
    const notes: NoteRecord[] = ordered.map(result => ({
        noteId: result.noteId,
        motion: chart.notes[result.noteId - 1].motion as StretchDirection,
        judgment: judgmentOf(result),
        ...(result.holdRatio === undefined ? {} : { holdRatio: result.holdRatio }),
    }));
    const { score, maxCombo } = scoreResults(ordered);
    return { chartId: chart.id, notes, score, maxCombo, playTimeSec, completed: notes.length === chart.notes.length };
}
