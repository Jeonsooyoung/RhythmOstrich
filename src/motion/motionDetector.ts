// 얼굴 랜드마크 기반 동작 판별
import type { HeadAngles } from '../mediapipe/motionExtractor';

export type MotionType =
    | 'CENTER'
    | 'LEFT_TURN'
    | 'RIGHT_TURN'
    | 'FLEXION'
    | 'EXTENSION'
    | 'LEFT_TILT'
    | 'RIGHT_TILT';

const YAW_THRESHOLD = 20;
const PITCH_THRESHOLD = 15;
const ROLL_THRESHOLD = 15;

export function detectMotion(
    angles: HeadAngles
): MotionType {
    const { yaw, pitch, roll } = angles;

    // 좌우 회전
    if (yaw <= -YAW_THRESHOLD) {
        return 'LEFT_TURN';
    }

    if (yaw >= YAW_THRESHOLD) {
        return 'RIGHT_TURN';
    }

    // 고개 숙이기 / 들기
    if (pitch <= -PITCH_THRESHOLD) {
        return 'FLEXION';
    }

    if (pitch >= PITCH_THRESHOLD) {
        return 'EXTENSION';
    }

    // 좌우 기울이기
    if (roll >= ROLL_THRESHOLD) {
        return 'LEFT_TILT';
    }

    if (roll <= -ROLL_THRESHOLD) {
        return 'RIGHT_TILT';
    }

    return 'CENTER';
}