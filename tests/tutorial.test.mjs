import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTutorial, TUTORIAL_GUIDES } from '../src/game/tutorial.ts';

const chart = JSON.parse(readFileSync(new URL('../src/game/charts/tutorial.json', import.meta.url), 'utf8'));

test('튜토리얼은 음악 시간 없이 2초 유지하면 성공하고 다음 동작으로', () => {
    const tutorial = createTutorial(chart);
    assert.equal(tutorial.update(0, 'FLEXION').flying, true);
    assert.equal(tutorial.update(1.99, 'FLEXION').result, undefined);
    const success = tutorial.update(2, 'FLEXION');
    assert.equal(success.result, 'SUCCESS');
    assert.equal(success.holdProgress, 1);
    assert.equal(tutorial.update(3.3, null).motion, 'EXTENSION');
});

test('실패하면 같은 방향을 다시 연습하며 완료 동작 수가 늘지 않음', () => {
    const tutorial = createTutorial(chart);
    tutorial.update(0, null);
    assert.equal(tutorial.update(6.1, null).result, 'FAIL');
    const retry = tutorial.update(7.4, null);
    assert.equal(retry.index, 0);
    assert.equal(retry.result, undefined);
    assert.equal(retry.flying, true);
    assert.equal(retry.results.length, 0);
});

test('여섯 동작을 성공해야 완료, 중복 기록 없이 모든 방향 안내 제공', () => {
    const tutorial = createTutorial(chart);
    let time = 0;
    let frame;
    for (const note of chart.notes) {
        assert.ok(TUTORIAL_GUIDES[note.motion]);
        tutorial.update(time, note.motion);
        frame = tutorial.update(time + 2.01, note.motion);
        assert.equal(frame.result, 'SUCCESS');
        time += 3.3;
    }
    assert.equal(frame.results.length, 6);
    assert.equal(tutorial.update(time + 10, null).results.length, 6);
});

test('연습 시간이 멈추면 먹이 이동과 유지 게이지도 멈춤', () => {
    const tutorial = createTutorial(chart);
    const first = tutorial.update(0, 'FLEXION');
    for (let i = 0; i < 50; i++) {
        const frame = tutorial.update(0, 'FLEXION');
        assert.equal(frame.progress, first.progress);
        assert.equal(frame.holdProgress, 0);
        assert.equal(frame.result, undefined);
    }
});
