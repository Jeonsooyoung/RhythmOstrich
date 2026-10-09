import test from 'node:test';
import assert from 'node:assert/strict';
import { createHoldJudge, createNoteJudge } from '../src/motion/holdDetector.ts';

const FPS = 30;

// start~end 구간을 30fps로 흘려보내며 motionAt(t)를 넣어봄
function run(judge, start, end, motionAt) {
    let state;
    for (let t = start; t <= end + 1e-9; t += 1 / FPS) {
        state = judge.update(t, motionAt(t));
    }
    return state;
}

const note = {
    id: 1,
    targetMotion: 'LEFT_TURN',
    responseStart: 2,
    responseEnd: 8,
    holdTime: 3,
};

test('응답 시간 전에는 WAITING', () => {
    const judge = createHoldJudge(note);
    assert.equal(judge.update(1, 'LEFT_TURN').status, 'WAITING');
});

test('3초 연속 유지하면 SUCCESS', () => {
    const judge = createHoldJudge(note);
    const state = run(judge, 0, 9, (t) => (t >= 3 ? 'LEFT_TURN' : 'CENTER'));
    assert.equal(state.status, 'SUCCESS');
});

test('유지 시간이 모자라면 응답 끝난 뒤 FAIL', () => {
    const judge = createHoldJudge(note);
    const state = run(judge, 0, 9, (t) => (t >= 6 ? 'LEFT_TURN' : 'CENTER'));
    assert.equal(state.status, 'FAIL');
});

test('0.2초 정도 잠깐 튀는 건 봐줌', () => {
    const judge = createHoldJudge(note);
    const state = run(judge, 0, 9, (t) =>
        t >= 3 && !(t > 4 && t < 4.2) ? 'LEFT_TURN' : 'CENTER'
    );
    assert.equal(state.status, 'SUCCESS');
});

test('1초 넘게 벗어나면 처음부터 다시 재서 FAIL', () => {
    const judge = createHoldJudge(note);
    // 3~5초 유지, 5~6초 이탈, 6~8초 유지 → 연속 3초 못 채움
    const state = run(judge, 0, 9, (t) =>
        (t >= 3 && t < 5) || t >= 6 ? 'LEFT_TURN' : 'CENTER'
    );
    assert.equal(state.status, 'FAIL');
});

test('얼굴 인식 실패(null)는 이탈로 처리', () => {
    const judge = createHoldJudge(note);
    const state = run(judge, 0, 9, () => null);
    assert.equal(state.status, 'FAIL');
});

test('응답 끝 시간 이후의 유지는 인정 안 함', () => {
    const judge = createHoldJudge(note);
    const state = run(judge, 0, 12, (t) => (t >= 7 ? 'LEFT_TURN' : 'CENTER'));
    assert.equal(state.status, 'FAIL');
});

test('곡 전체 판정기는 노트별 결과를 한 번씩만 돌려줌', () => {
    const judge = createNoteJudge([
        note,
        { id: 2, targetMotion: 'RIGHT_TURN', responseStart: 9, responseEnd: 15, holdTime: 3 },
    ]);
    const collected = [];
    for (let t = 0; t <= 16; t += 1 / FPS) {
        const motion = t >= 3 && t < 8 ? 'LEFT_TURN' : 'CENTER';
        collected.push(...judge.update(t, motion));
    }
    assert.deepEqual(collected, [
        { noteId: 1, result: 'SUCCESS' },
        { noteId: 2, result: 'FAIL' },
    ]);
    assert.equal(judge.getResults().length, 2);
});
