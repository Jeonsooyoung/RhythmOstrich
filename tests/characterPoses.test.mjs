import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { characters } from '../src/data/characters.ts';
import { characterPoses, getCharacterPoseImage } from '../src/data/characterPoses.ts';
import { calibrateAngles } from '../src/motion/calibrate.ts';
import { detectMotion } from '../src/motion/motionDetector.ts';

test('정면 기준 보정 후 기존 동작 판정이 오른돌기 이미지로 연결된다', () => {
  const baseline = { yaw: 10, pitch: 4, roll: -3 };
  const motion = detectMotion(calibrateAngles({ ...baseline, yaw: 35 }, baseline));
  assert.equal(motion, 'RIGHT_TURN');
  assert.equal(getCharacterPoseImage('/characters/타조/정면.png', motion), '/characters/타조/오른돌기.png');
  assert.equal(detectMotion(calibrateAngles(baseline, baseline)), 'CENTER');
});

test('모든 선택 캐릭터의 일곱 자세 이미지가 존재한다', () => {
  for (const character of characters) {
    for (const motion of Object.keys(characterPoses)) {
      const path = getCharacterPoseImage(character.image, motion);
      assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)), path);
    }
  }
});
