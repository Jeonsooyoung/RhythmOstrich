import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, getPhase, restoreDraft, sessionReducer } from '../src/state/sessionFlow.ts';

const pre = { discomfort: 3, stiffness: 3, rom: {}, recordedAt: 'pre' };
const post = { discomfort: 2, stiffness: 2, rom: {}, recordedAt: 'post' };
const calibration = { head: { yaw: 1, pitch: 2, roll: 3 }, shoulder: null };
const game = { chartId: 'tutorial', notes: [], score: 0, maxCombo: 0, playTimeSec: 60, completed: true };

const run = (actions, draft = createDraft('s1')) => actions.reduce(sessionReducer, draft);

const fullPlay = [
    { type: 'SET_USER', userId: ' user1 ' },
    { type: 'SUBMIT_PRE', assessment: pre },
    { type: 'SELECT_CHARACTER', characterId: 'ostrich' },
    { type: 'CALIBRATED', calibration },
    { type: 'SELECT_SONG', chartId: 'tutorial', now: '2026-11-09T01:00:00Z' },
    { type: 'FINISH_GAME', result: game },
    { type: 'SUBMIT_POST', assessment: post, now: '2026-11-09T01:05:00Z' },
];

test('명세서 순서대로 화면이 진행됨', () => {
    let draft = createDraft('s1');
    const phases = [getPhase(draft)];
    for (const action of fullPlay) {
        draft = sessionReducer(draft, action);
        phases.push(getPhase(draft));
    }
    assert.deepEqual(phases, [
        'userId', 'preAssessment', 'character', 'calibration', 'song', 'game', 'postAssessment', 'result',
    ]);
});

test('사후 평가가 끝나면 세션 기록이 만들어짐', () => {
    const { record } = run(fullPlay);
    assert.equal(record.id, 's1');
    assert.equal(record.userId, 'user1');
    assert.equal(record.startedAt, '2026-11-09T01:00:00Z');
    assert.equal(record.endedAt, '2026-11-09T01:05:00Z');
    assert.equal(record.pre, pre);
    assert.equal(record.post, post);
    assert.equal(record.preReused, false);
});

test('다시 하기: 사전 평가, 보정, 캐릭터 유지 → 곡 선택부터, 새 세션 ID', () => {
    const draft = run([...fullPlay, { type: 'REPLAY', reassess: false, sessionId: 's2' }]);
    assert.equal(getPhase(draft), 'song');
    assert.equal(draft.sessionId, 's2');
    assert.equal(draft.pre, pre);
    assert.equal(draft.preReused, true);
    assert.equal(draft.calibration, calibration);
    assert.equal(draft.characterId, 'ostrich');
    assert.equal(draft.game, null);
    assert.equal(draft.record, null);

    const next = run([
        { type: 'SELECT_SONG', chartId: 'tutorial', now: 't2' },
        { type: 'FINISH_GAME', result: game },
        { type: 'SUBMIT_POST', assessment: post, now: 't3' },
    ], draft);
    assert.equal(next.record.id, 's2');
    assert.equal(next.record.preReused, true);
});

test('평가부터 다시: 이전 사전 평가를 미리 채우고, 제출하면 곡 선택으로', () => {
    let draft = run([...fullPlay, { type: 'REPLAY', reassess: true, sessionId: 's2' }]);
    assert.equal(getPhase(draft), 'preAssessment');
    assert.equal(draft.previousPre, pre);

    const newPre = { ...pre, discomfort: 1 };
    draft = sessionReducer(draft, { type: 'SUBMIT_PRE', assessment: newPre });
    assert.equal(getPhase(draft), 'song');
    assert.equal(draft.preReused, false);
});

test('처음으로: 모든 값이 비워짐', () => {
    const draft = run([...fullPlay, { type: 'RESET', sessionId: 's9' }]);
    assert.deepEqual(draft, createDraft('s9'));
});

test('뒤로 가기는 이전 단계 값만 비움, 게임 후에는 뒤로 못 감', () => {
    const atSong = run(fullPlay.slice(0, 4));
    const backFromSong = sessionReducer(atSong, { type: 'BACK' });
    assert.equal(getPhase(backFromSong), 'calibration');
    assert.equal(backFromSong.characterId, 'ostrich');

    const atCalibration = run(fullPlay.slice(0, 3));
    assert.equal(getPhase(sessionReducer(atCalibration, { type: 'BACK' })), 'character');

    const atCharacter = run(fullPlay.slice(0, 2));
    const back = sessionReducer(atCharacter, { type: 'BACK' });
    assert.equal(getPhase(back), 'preAssessment');
    assert.equal(back.previousPre, pre);

    const atPost = run(fullPlay.slice(0, 6));
    assert.equal(sessionReducer(atPost, { type: 'BACK' }), atPost);
});

test('게임 중 중단하면 곡 선택으로, 기록 없음', () => {
    const draft = run([...fullPlay.slice(0, 5), { type: 'ABORT_GAME' }]);
    assert.equal(getPhase(draft), 'song');
    assert.equal(draft.startedAt, null);
});

test('새로고침 복구: 입력 화면은 그대로, 게임 중이었다면 보정부터', () => {
    const atPost = run(fullPlay.slice(0, 6));
    assert.equal(getPhase(restoreDraft(JSON.parse(JSON.stringify(atPost)))), 'postAssessment');

    const inGame = run(fullPlay.slice(0, 5));
    const restored = restoreDraft(JSON.parse(JSON.stringify(inGame)));
    assert.equal(getPhase(restored), 'calibration');
    assert.deepEqual(restored.pre, pre);
    assert.equal(restored.chartId, null);

    // 다시 보정하면 캐릭터는 유지된 채 곡 선택으로
    const afterCalibration = sessionReducer(restored, { type: 'CALIBRATED', calibration });
    assert.equal(getPhase(afterCalibration), 'song');
});

test('복구할 수 없는 데이터는 무시', () => {
    assert.equal(restoreDraft(null), null);
    assert.equal(restoreDraft({ version: 2, sessionId: 'x' }), null);
    assert.equal(restoreDraft('text'), null);
});
