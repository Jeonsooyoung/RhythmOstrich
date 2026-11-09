import type { ChartData } from './chart';
import type { MotionType } from '../motion/motionDetector';
import { createHoldJudge } from '../motion/holdDetector.ts';
import type { NoteResult } from '../types/game';

export const TUTORIAL_GUIDES: Partial<Record<MotionType, string>> = {
    FLEXION: '먹이가 아래에서 올라오면 고개를 천천히 숙여 주세요.',
    EXTENSION: '먹이가 위에서 내려오면 고개를 천천히 들어 주세요.',
    LEFT_TILT: '먹이가 왼쪽 위에서 곡선으로 오면 왼쪽 귀를 어깨 쪽으로 기울여 주세요.',
    RIGHT_TILT: '먹이가 오른쪽 위에서 곡선으로 오면 오른쪽 귀를 어깨 쪽으로 기울여 주세요.',
    LEFT_TURN: '먹이가 왼쪽에서 곧게 오면 고개를 왼쪽으로 돌려 주세요.',
    RIGHT_TURN: '먹이가 오른쪽에서 곧게 오면 고개를 오른쪽으로 돌려 주세요.',
};

/** 음악 없이 한 방향씩 연습. 실패하면 같은 동작을 다시 보여 준다. */
export function createTutorial(chart: ChartData) {
    let index = 0;
    let startedAt = 0;
    let feedbackAt: number | null = null;
    const results: NoteResult[] = [];
    const makeJudge = () => createHoldJudge({ id: index + 1, targetMotion: chart.notes[index].motion,
        responseStart: 0, responseEnd: 6, holdTime: 2 }, .3);
    let judge = makeJudge();
    return {
        update(time: number, motion: MotionType | null) {
            if (feedbackAt !== null && time - feedbackAt >= 1.2 && results.length < chart.notes.length) {
                if (judge.getState().status === 'SUCCESS') index++;
                startedAt = time;
                feedbackAt = null;
                judge = makeJudge();
            }
            const state = judge.update(time - startedAt, motion);
            const result = state.status === 'SUCCESS' ? 'SUCCESS' as const : state.status === 'FAIL' ? 'FAIL' as const : undefined;
            if (result && feedbackAt === null) {
                feedbackAt = time;
                if (result === 'SUCCESS') results.push({ noteId: index + 1, result });
            }
            return { time, index, active: true, phase: 1, motion: chart.notes[index].motion,
                progress: Math.min(1, (time - startedAt) / 6), flying: !result, result,
                holdProgress: state.progress, results: [...results] };
        },
    };
}
