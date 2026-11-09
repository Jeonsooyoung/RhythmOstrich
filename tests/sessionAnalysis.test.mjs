import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHistory, compareAssessments, summarizeGame } from '../src/game/sessionAnalysis.ts';

const game = {
    chartId: 'tutorial',
    notes: [
        { noteId: 1, motion: 'FLEXION', judgment: 'PERFECT' },
        { noteId: 2, motion: 'EXTENSION', judgment: 'GOOD' },
        { noteId: 3, motion: 'LEFT_TURN', judgment: 'MISS' },
        { noteId: 4, motion: 'LEFT_TURN', judgment: 'PERFECT' },
    ],
    score: 900,
    maxCombo: 2,
    playTimeSec: 60,
    completed: true,
};

test('성공률 = (PERFECT + GOOD) / 전체 × 100', () => {
    const summary = summarizeGame(game);
    assert.equal(summary.total, 4);
    assert.equal(summary.success, 3);
    assert.equal(summary.rate, 75);
    assert.deepEqual(summary.judgments, { PERFECT: 2, GOOD: 1, MISS: 1 });
});

test('방향별 성공률, 제시되지 않은 방향은 null', () => {
    const { byDirection } = summarizeGame(game);
    assert.deepEqual(byDirection.LEFT_TURN, { total: 2, success: 1, rate: 50 });
    assert.equal(byDirection.FLEXION.rate, 100);
    assert.equal(byDirection.RIGHT_TILT.rate, null);
});

test('노트가 없으면 성공률 null', () => {
    assert.equal(summarizeGame({ ...game, notes: [] }).rate, null);
});

test('변화량 = 사후 − 사전 (0~10점, 0점 포함), ROM은 양쪽 다 있는 방향만', () => {
    const pre = { discomfort: 7, stiffness: 4, rom: { LEFT_TURN: 2, FLEXION: 3 }, recordedAt: '' };
    const post = { discomfort: 0, stiffness: 10, rom: { LEFT_TURN: 3 }, recordedAt: '' };
    assert.deepEqual(compareAssessments(pre, post), {
        discomfort: -7,
        stiffness: 6,
        rom: { LEFT_TURN: 1 },
    });
});

test('기록 추이는 세션마다 성공률과 변화량', () => {
    const pre = { discomfort: 3, stiffness: 3, rom: {}, recordedAt: '' };
    const post = { discomfort: 2, stiffness: 3, rom: {}, recordedAt: '' };
    const [point] = buildHistory([{ id: 's1', startedAt: 't', chartId: 'tutorial', game, pre, post }]);
    assert.equal(point.sessionId, 's1');
    assert.equal(point.rate, 75);
    assert.equal(point.byDirection.LEFT_TURN, 50);
    assert.equal(point.change.discomfort, -1);
});
