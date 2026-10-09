// 목표 동작 유지(3~5초) 여부 판정
import type { MotionType } from './motionDetector';
import type { NoteData, NoteResult } from '../types/game';

/**
 * 목표 동작에서 잠깐 벗어나도 유지로 인정하는 시간(초)
 * 동작 판별 기준값(yaw 20도 등) 근처에서 프레임마다 동작이 튀는 것을 봐주기 위함
 */
export const DEFAULT_GRACE_TIME = 0.4;

export type HoldStatus =
    | 'WAITING'  // 아직 responseStart 전
    | 'HOLDING'  // 판정 중
    | 'SUCCESS'
    | 'FAIL';

export interface HoldState {
    status: HoldStatus;
    progress: number; // 0~1, 유지 게이지 표시용
}

export interface HoldJudge {
    readonly note: NoteData;
    /** 매 프레임 호출. time = audio.currentTime, motion = detectMotion() 결과 (얼굴 인식 실패 시 null) */
    update(time: number, motion: MotionType | null): HoldState;
    getState(): HoldState;
}

/** 노트 1개에 대한 판정기 생성 */
export function createHoldJudge(
    note: NoteData,
    graceTime: number = DEFAULT_GRACE_TIME
): HoldJudge {
    let holdStart: number | null = null;
    let lastInside: number | null = null;
    let state: HoldState = { status: 'WAITING', progress: 0 };

    function update(time: number, motion: MotionType | null): HoldState {
        // 판정이 끝난 노트는 결과 유지
        if (state.status === 'SUCCESS' || state.status === 'FAIL') {
            return state;
        }

        if (time < note.responseStart) {
            state = { status: 'WAITING', progress: 0 };
            return state;
        }

        // 응답 시간 안에만 유지를 인정
        const judgeTime = Math.min(time, note.responseEnd);

        if (motion === note.targetMotion) {
            if (holdStart === null) holdStart = judgeTime;
            lastInside = judgeTime;
        } else if (
            holdStart !== null &&
            lastInside !== null &&
            judgeTime - lastInside > graceTime
        ) {
            // 유예 시간보다 오래 벗어나면 처음부터 다시
            holdStart = null;
            lastInside = null;
        }

        // 유지 시간은 마지막으로 목표 동작이었던 시점까지만 인정
        const held =
            holdStart !== null && lastInside !== null
                ? lastInside - holdStart
                : 0;

        if (held >= note.holdTime) {
            state = { status: 'SUCCESS', progress: 1 };
        } else if (time > note.responseEnd) {
            state = { status: 'FAIL', progress: held / note.holdTime };
        } else {
            state = { status: 'HOLDING', progress: held / note.holdTime };
        }

        return state;
    }

    return {
        note,
        update,
        getState: () => state,
    };
}

/**
 * 곡 전체 노트를 한 번에 관리하는 판정기
 * update()는 이번 프레임에 판정이 끝난 노트들의 결과만 돌려줌
 */
export function createNoteJudge(
    notes: NoteData[],
    graceTime: number = DEFAULT_GRACE_TIME
) {
    const judges = [...notes]
        .sort((a, b) => a.responseStart - b.responseStart)
        .map((note) => createHoldJudge(note, graceTime));

    const results: NoteResult[] = [];

    function update(time: number, motion: MotionType | null): NoteResult[] {
        const finished: NoteResult[] = [];

        for (const judge of judges) {
            const before = judge.getState().status;
            if (before === 'SUCCESS' || before === 'FAIL') continue;

            const { status } = judge.update(time, motion);

            if (status === 'SUCCESS' || status === 'FAIL') {
                const result = { noteId: judge.note.id, result: status };
                finished.push(result);
                results.push(result);
            }
        }

        return finished;
    }

    /** 지금 판정 중인 노트 (화면에 목표 동작/게이지 표시용) */
    function getActive() {
        return judges.find(
            (judge) => judge.getState().status === 'HOLDING'
        ) ?? null;
    }

    return {
        update,
        getActive,
        getResults: () => [...results],
    };
}
