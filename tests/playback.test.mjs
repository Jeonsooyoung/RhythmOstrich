import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPlayback } from '../src/game/playback.ts';
import { beatToSec } from '../src/game/chart.ts';

const load = name => JSON.parse(readFileSync(new URL(`../src/game/charts/${name}.json`, import.meta.url), 'utf8'));

for (const name of ['tutorial', 'bleeping_demo']) {
    test(`${name}: BPM과 오프셋에 맞춰 준비, 출발, 중간 이동, 도착`, () => {
        const chart = load(name);
        const playback = createPlayback(chart);
        const source = chart.notes[0];
        const call = beatToSec(chart, source.callBeat);
        const start = beatToSec(chart, source.responseBeat);
        const end = beatToSec(chart, source.responseBeat + chart.judge.windowBeats);
        assert.equal(playback.update(call - .01, null).active, false);
        assert.equal(playback.update(call, null).flying, true);
        const departure = playback.update(start, null);
        assert.equal(departure.flying, true);
        assert.equal(departure.progress, 0);
        assert.equal(departure.motion, source.motion);
        assert.ok(Math.abs(playback.update((start + end) / 2, null).progress - .5) < 1e-9);
        const arrival = playback.update(end, null);
        assert.equal(arrival.flying, false);
        assert.equal(arrival.progress, 1);
        assert.equal(arrival.result, 'FAIL');
    });
}

test('시연 중 자세를 취해도 성공하지 않고 응답 구간에서 4박 유지해야 성공', () => {
    const chart = load('tutorial');
    const playback = createPlayback(chart);
    const source = chart.notes[0];
    const start = beatToSec(chart, source.responseBeat);
    const hold = chart.judge.holdBeats * 60 / chart.bpm;
    assert.equal(playback.update(start - .1, source.motion).result, undefined);
    assert.equal(playback.update(start, source.motion).result, undefined);
    assert.equal(playback.update(start + hold - .01, source.motion).result, undefined);
    const success = playback.update(start + hold + .001, source.motion);
    assert.equal(success.result, 'SUCCESS');
    assert.equal(success.flying, false);
    assert.equal(playback.update(start + hold + .1, null).results.length, 1);
});

test('음악 시간이 멈추면 먹이와 유지 시간도 그대로, 다음 동작은 채보 순서', () => {
    const chart = load('tutorial');
    const playback = createPlayback(chart);
    const time = beatToSec(chart, chart.notes[0].responseBeat) + 1;
    const first = playback.update(time, 'FLEXION');
    for (let i = 0; i < 100; i++) {
        const frame = playback.update(time, 'FLEXION');
        assert.equal(frame.progress, first.progress);
        assert.equal(frame.result, undefined);
    }
    const next = playback.update(beatToSec(chart, chart.notes[1].callBeat), null);
    assert.equal(next.index, 1);
    assert.equal(next.motion, 'EXTENSION');
    assert.equal(next.flying, true);
});

test('먹이는 8박 간격, 빠르게 성공하면 다음 먹이까지 4박만 대기', () => {
    for (const name of ['tutorial', 'study_and_relax', 'late_night_radio', 'bleeping_demo']) {
        const chart = load(name);
        const playback = createPlayback(chart);
        const first = chart.notes[0];
        const start = beatToSec(chart, first.responseBeat);
        playback.update(start, first.motion);
        assert.equal(playback.update(start + chart.judge.holdBeats * 60 / chart.bpm + .001, first.motion).result, 'SUCCESS');
        for (let i = 1; i < chart.notes.length; i++) {
            assert.equal(chart.notes[i].responseBeat - chart.notes[i-1].responseBeat, 8);
            assert.equal(chart.notes[i].callBeat, chart.notes[i].responseBeat);
        }
        const deadline = beatToSec(chart, first.responseBeat + chart.judge.windowBeats);
        const missed = createPlayback(chart).update(deadline, null);
        assert.equal(missed.result, 'FAIL');
        assert.equal(missed.index, 0);
        const nextStart = beatToSec(chart, chart.notes[1].responseBeat);
        assert.ok(Math.abs((nextStart - start) - 8 * 60 / chart.bpm) < 1e-8);
        assert.equal(playback.update(nextStart, null).flying, true);
    }
});
