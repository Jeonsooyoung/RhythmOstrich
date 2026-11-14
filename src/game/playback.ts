import { beatToSec, chartToNotes, createChartJudge } from './chart.ts';
import type { ChartData } from './chart';
import type { MotionType } from '../motion/motionDetector';
import { buildGameResult, gradeNote } from './scoring.ts';
import type { ScoredResult } from './scoring';
import type { GameResult } from '../types/session';

export function buildPlaybackResult(chart: ChartData, results: ScoredResult[], time: number): GameResult {
    return buildGameResult(chart, results, time);
}

/** 음악 시간만으로 이동·진행 단계·유지 판정을 결정한다. */
export function createPlayback(chart: ChartData) {
    const notes = chartToNotes(chart);
    const judge = createChartJudge(chart);
    const scored: ScoredResult[] = [];
    const lastProgress = new Map<number, number>();
    const bestProgress = new Map<number, number>();
    const restarted = new Set<number>();
    // 판정이 끝난 노트에 등급과 유지 비율을 붙여 기록한다.
    const step = (time: number, motion: MotionType | null) => {
        for (const result of judge.update(time, motion)) {
            scored.push({ ...result, judgment: gradeNote(result.result, restarted.has(result.noteId)),
                holdRatio: result.result === 'SUCCESS' ? 1 : bestProgress.get(result.noteId) ?? 0 });
        }
        // 유지 게이지가 줄어들면 자세가 풀려 처음부터 다시 잰 것으로 본다.
        const holding = judge.getActive();
        if (holding) {
            const id = holding.note.id;
            const progress = holding.getState().progress;
            if (progress < (lastProgress.get(id) ?? 0)) restarted.add(id);
            lastProgress.set(id, progress);
            bestProgress.set(id, Math.max(bestProgress.get(id) ?? 0, progress));
        }
    };
    return {
        update(time: number, motion: MotionType | null) {
            step(time, motion);
            // 판정 종료 시각에서도 실패를 확정한다.
            if (notes.some(note => time === note.responseEnd)) step(time + 1e-7, motion);
            const index = chart.notes.findLastIndex(note => time >= beatToSec(chart, note.callBeat));
            const source = chart.notes[index];
            const note = notes[index];
            const nextCall = chart.notes[index + 1];
            const cycleEnd = source ? beatToSec(chart, source.responseBeat + chart.judge.windowBeats + 2) : 0;
            const active = !!note && time < (nextCall ? beatToSec(chart, nextCall.callBeat) : cycleEnd);
            const result = note ? scored.find(result => result.noteId === note.id)?.result : undefined;
            const phase = !active || time < note.responseStart ? 0
                : time < beatToSec(chart, source.responseBeat + chart.beatsPerBar) ? 1 : 2;
            const hold = judge.getActive();
            return {
                time, index, active, phase,
                motion: source?.motion ?? 'CENTER',
                progress: note ? Math.max(0, Math.min(1, (time - note.responseStart) / (note.responseEnd - note.responseStart))) : 0,
                flying: active && time >= note.responseStart && time < note.responseEnd && !result,
                result: active ? result : undefined,
                holdProgress: result === 'SUCCESS' ? 1 : hold?.note.id === note?.id ? hold?.getState().progress ?? 0 : 0,
                results: [...scored],
            };
        },
    };
}
