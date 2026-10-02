import type { HeadAngles } from '../mediapipe/motionExtractor';

export interface CalibrationData {
    yaw: number;
    pitch: number;
    roll: number;
}

export function calibrateAngles(
    current: HeadAngles,
    calibration: CalibrationData
): HeadAngles {
    return {
        yaw: current.yaw - calibration.yaw,
        pitch: current.pitch - calibration.pitch,
        roll: current.roll - calibration.roll,
    };
}