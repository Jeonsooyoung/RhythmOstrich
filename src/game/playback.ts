import { beatToSec, chartToNotes, createChartJudge } from './chart.ts';
import type { ChartData } from './chart';
import type { MotionType } from '../motion/motionDetector';

/** 음악 시간만으로 이동·진행 단계·유지 판정을 결정한다. */
export function createPlayback(chart: ChartData) {
    const notes = chartToNotes(chart);
    const judge = createChartJudge(chart);
    return {
        update(time: number, motion: MotionType | null) {
            judge.update(time, motion);
            // 판정 종료 시각에서도 실패를 확정한다.
            if (notes.some(note => time === note.responseEnd)) judge.update(time + 1e-7, motion);
            const index = chart.notes.findLastIndex(note => time >= beatToSec(chart, note.callBeat));
            const source = chart.notes[index];
            const note = notes[index];
            const nextCall = chart.notes[index + 1];
            const cycleEnd = source ? beatToSec(chart, source.responseBeat + chart.judge.windowBeats + 2) : 0;
            const active = !!note && time < (nextCall ? beatToSec(chart, nextCall.callBeat) : cycleEnd);
            const result = note ? judge.getResults().find(result => result.noteId === note.id)?.result : undefined;
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
                results: judge.getResults(),
            };
        },
    };
}
