import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { beatToSec, chartToNotes, createChartJudge } from '../src/game/chart.ts';

const chartsDir = new URL('../src/game/charts/', import.meta.url);
const loadChart = (name) =>
    JSON.parse(readFileSync(new URL(name, chartsDir), 'utf-8'));

const tutorial = loadChart('tutorial.json');
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test('박 → 초 변환은 설계 문서 공식과 같음', () => {
    // 72 BPM, 첫 박 0.08초 → 8번 박 = 0.08 + 8 × 60 / 72
    close(beatToSec(tutorial, 8), 0.08 + (8 * 60) / 72);
});

test('튜토리얼 첫 노트: 판정 구간 6박(5초), 유지 4박(3.33초)', () => {
    const [first] = chartToNotes(tutorial);
    assert.equal(first.id, 1);
    assert.equal(first.targetMotion, 'FLEXION');
    close(first.responseEnd - first.responseStart, 5);
    close(first.holdTime, 10 / 3);
});

test('모든 채보가 변환되고 노트 판정 구간이 겹치지 않음', () => {
    for (const file of readdirSync(chartsDir).filter((f) => f.endsWith('.json'))) {
        const notes = chartToNotes(loadChart(file));
        assert.ok(notes.length > 0, file);
        for (let i = 1; i < notes.length; i++) {
            assert.ok(notes[i].responseStart >= notes[i - 1].responseEnd, `${file} note ${i + 1}`);
        }
    }
});

test('흔들림 허용은 채보의 dropToleranceSec(0.3초)을 따름', () => {
    const [first] = chartToNotes(tutorial);
    const FPS = 60;
    const run = (gap) => {
        const judge = createChartJudge(tutorial);
        const results = [];
        const dropAt = first.responseStart + 1;
        for (let t = 0; t <= first.responseEnd + 0.5; t += 1 / FPS) {
            const dropped = t >= dropAt && t < dropAt + gap;
            const motion = t >= first.responseStart && !dropped ? 'FLEXION' : 'CENTER';
            results.push(...judge.update(t, motion));
        }
        return results.find((r) => r.noteId === 1)?.result;
    };
    // 0.2초 이탈은 봐줘서 성공
    assert.equal(run(0.2), 'SUCCESS');
    // 1.5초 이탈 → 남은 시간에 4박을 못 채워 실패
    assert.equal(run(1.5), 'FAIL');
});
