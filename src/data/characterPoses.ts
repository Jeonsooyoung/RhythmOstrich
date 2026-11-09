import type { MotionType } from '../motion/motionDetector';

export const characterPoses: Record<MotionType, { file: string; label: string }> = {
  CENTER: { file: '정면.png', label: '정면 보기' },
  LEFT_TURN: { file: '왼돌기.png', label: '왼쪽으로 목 돌리기' },
  RIGHT_TURN: { file: '오른돌기.png', label: '오른쪽으로 목 돌리기' },
  FLEXION: { file: '고개숙이기.png', label: '고개 숙이기' },
  EXTENSION: { file: '고개들기.png', label: '고개 들기' },
  LEFT_TILT: { file: '왼기울기.png', label: '왼쪽으로 기울이기' },
  RIGHT_TILT: { file: '오른기울기.png', label: '오른쪽으로 기울이기' },
};

export function getCharacterPoseImage(frontImage: string, motion: MotionType) {
  return frontImage.replace(/[^/]+$/, characterPoses[motion].file);
}
