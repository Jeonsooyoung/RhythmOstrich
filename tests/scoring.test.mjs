import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCORING, buildGameResult, gradeNote, judgmentOf, scoreResults } from '../src/game/scoring.ts';
import { createPlayback } from '../src/game/playback.ts';
import { beatToSec, chartToNotes } from '../src/game/chart.ts';

const load = name => JSON.parse(readFileSync(new URL(`../src/game/charts/${name}.json`, import.meta.url), 'utf8'));

test('한 번에 유지하면 PERFECT, 끊겼다 다시 채우면 GOOD, 실패는 MISS', () => {
    assert.equal(gradeNote('SUCCESS', false), 'PERFECT');
    assert.equal(gradeNote('SUCCESS', true), SCORING.perfectRule === 'steady' ? 'GOOD' : 'PERFECT');
    assert.equal(gradeNote('FAIL', false), 'MISS');
    assert.equal(gradeNote('FAIL', true), 'MISS');
});

test('점수는 등급별 점수의 합, 콤보는 MISS에서 끊김', () => {
    const results = ['PERFECT', 'GOOD', 'MISS', 'PERFECT', 'PERFECT', 'PERFECT'].map((judgment, index) =>
        ({ noteId: index + 1, result: judgment === 'MISS' ? 'FAIL' : 'SUCCESS', judgment }));
    const state = scoreResults(results);
    assert.equal(state.score, 4 * SCORING.points.PERFECT + SCORING.points.GOOD + 3 * SCORING.comboBonus);
    assert.equal(state.combo, 3);
    assert.equal(state.maxCombo, 3);
    assert.deepEqual(state.counts, { PERFECT: 4, GOOD: 1, MISS: 1 });
    assert.deepEqual(scoreResults([]), { score: 0, combo: 0, maxCombo: 0, counts: { PERFECT: 0, GOOD: 0, MISS: 0 } });
});

test('등급이 없는 결과는 성공을 PERFECT, 실패를 MISS로 처리', () => {
    assert.equal(judgmentOf({ noteId: 1, result: 'SUCCESS' }), 'PERFECT');
    assert.equal(judgmentOf({ noteId: 1, result: 'FAIL' }), 'MISS');
});

test('실제 진행에서 한 번에 유지는 PERFECT, 끊긴 뒤 다시 채우면 GOOD, 미달은 MISS와 유지 비율 기록', () => {
    const chart = load('study_and_relax');
    const playback = createPlayback(chart);
    const beat = 60 / chart.bpm;
    const hold = chart.judge.holdBeats * beat;
    const start = index => beatToSec(chart, chart.notes[index].responseBeat);
    const run = (from, to, motion) => { let frame; for (let t = from; t <= to; t += .05) frame = playback.update(t, motion); return frame; };

    // 1번: 늦게 들어가도 끊김 없이 유지
    run(start(0), start(0) + 1.5 * beat - .05, 'CENTER');
    run(start(0) + 1.5 * beat, start(0) + 1.5 * beat + hold + .1, chart.notes[0].motion);
    // 2번: 0.5초 유지 → 0.5초 정면(흔들림 허용 초과로 처음부터) → 다시 끝까지 유지
    run(start(1), start(1) + .5, chart.notes[1].motion);
    run(start(1) + .55, start(1) + 1, 'CENTER');
    run(start(1) + 1.05, start(1) + 1.05 + hold + .1, chart.notes[1].motion);
    // 3번: 절반쯤 유지하다 정면으로 돌아와 실패
    run(start(2), start(2) + hold / 2, chart.notes[2].motion);
    const frame = run(start(2) + hold / 2 + .05, start(2) + chart.judge.windowBeats * beat + .1, 'CENTER');

    const expected = SCORING.perfectRule === 'steady' ? 'GOOD' : 'PERFECT';
    assert.deepEqual(frame.results.map(judgmentOf), ['PERFECT', expected, 'MISS']);
    assert.equal(frame.results[0].holdRatio, 1);
    assert.ok(frame.results[2].holdRatio > .3 && frame.results[2].holdRatio < .7);

    const result = buildGameResult(chart, frame.results, frame.time);
    assert.equal(result.completed, false);
    assert.equal(result.notes.length, 3);
    assert.equal(result.score, SCORING.points.PERFECT + SCORING.points[expected] + SCORING.comboBonus);
    assert.equal(result.maxCombo, 2);
    assert.deepEqual(result.notes.map(note => note.motion), chart.notes.slice(0, 3).map(note => note.motion));
});
