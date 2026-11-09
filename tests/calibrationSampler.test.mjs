import test from 'node:test';
import assert from 'node:assert/strict';
import { averageCalibration } from '../src/motion/calibrationSampler.ts';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('머리 각도는 모은 값의 평균', () => {
    const result = averageCalibration([
        { head: { yaw: 2, pitch: -4, roll: 1 }, shoulder: null },
        { head: { yaw: 4, pitch: -2, roll: 3 }, shoulder: null },
    ]);
    close(result.calibration.head.yaw, 3);
    close(result.calibration.head.pitch, -3);
    close(result.calibration.head.roll, 2);
    close(result.maxDeviation, 1);
});

test('어깨는 절반 이상 인식됐을 때만 평균, 아니면 null', () => {
    const head = { yaw: 0, pitch: 0, roll: 0 };
    const enough = averageCalibration([
        { head, shoulder: { yaw: 2, roll: 4 } },
        { head, shoulder: { yaw: 4, roll: 6 } },
        { head, shoulder: null },
    ]);
    assert.deepEqual(enough.calibration.shoulder, { yaw: 3, roll: 5 });

    const few = averageCalibration([
        { head, shoulder: { yaw: 2, roll: 4 } },
        { head, shoulder: null },
        { head, shoulder: null },
    ]);
    assert.equal(few.calibration.shoulder, null);
});

test('측정 중 크게 움직이면 maxDeviation이 커짐', () => {
    const result = averageCalibration([
        { head: { yaw: 0, pitch: 0, roll: 0 }, shoulder: null },
        { head: { yaw: 20, pitch: 0, roll: 0 }, shoulder: null },
    ]);
    close(result.maxDeviation, 10);
});

test('샘플이 없으면 null', () => {
    assert.equal(averageCalibration([]), null);
});
