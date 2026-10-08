import test from 'node:test';
import assert from 'node:assert/strict';
import { extractShoulderAngles, calibrateShoulders } from '../src/mediapipe/shoulderExtractor.ts';

function points(yaw = 0, roll = 0) {
    const y = yaw * Math.PI / 180;
    const r = roll * Math.PI / 180;
    const result = Array(13);
    result[11] = { x: 0.2 * Math.cos(y) * Math.cos(r), y: 0.2 * Math.cos(y) * Math.sin(r), z: -0.2 * Math.sin(y), visibility: 1 };
    result[12] = { x: -result[11].x, y: -result[11].y, z: -result[11].z, visibility: 1 };
    return result;
}

test('shoulder angles: neutral, turns and tilts have consistent signs', () => {
    for (const [yaw, roll] of [[0, 0], [30, 0], [-30, 0], [0, 20], [0, -20]]) {
        const result = extractShoulderAngles(points(yaw, roll));
        assert.ok(Math.abs(result.yaw - yaw) < 1e-8);
        assert.ok(Math.abs(result.roll - roll) < 1e-8);
    }
});

test('missing, occluded, overlapping and invalid shoulders are ignored', () => {
    assert.equal(extractShoulderAngles(), null);
    assert.equal(extractShoulderAngles([]), null);
    for (const patch of [{ visibility: 0.3 }, { x: NaN }, { z: Infinity }]) {
        const sample = points();
        Object.assign(sample[11], patch);
        assert.equal(extractShoulderAngles(sample), null);
    }
    const overlapping = points();
    overlapping[11] = { ...overlapping[12] };
    assert.equal(extractShoulderAngles(overlapping), null);
    assert.equal(extractShoulderAngles(points(90, 0)), null);
});

test('calibration removes the initial shoulder pose and wraps angle boundaries', () => {
    assert.deepEqual(calibrateShoulders({ yaw: 25, roll: 15 }, { yaw: 10, roll: 5 }), { yaw: 15, roll: 10 });
    assert.deepEqual(calibrateShoulders({ yaw: -179, roll: 179 }, { yaw: 179, roll: -179 }), { yaw: 2, roll: -2 });
});
