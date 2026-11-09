// 정면 기준 자세: 일정 시간 동안 모은 값의 평균
// 명세서 기준 자세 설정부(140): 정면을 바라보며 자세를 유지하는 동안 산출된 요·피치·롤 평균
import type { HeadAngles } from '../mediapipe/motionExtractor';
import type { ShoulderAngles } from '../mediapipe/shoulderExtractor';
import type { CalibrationSnapshot } from '../types/session';

export interface CalibrationSample {
    head: HeadAngles;
    shoulder: ShoulderAngles | null;
}

export interface CalibrationAverage {
    calibration: CalibrationSnapshot;
    /** 평균에서 가장 많이 벗어난 머리 각도(도). 크면 측정 중에 움직였다는 뜻 */
    maxDeviation: number;
}

/** 측정 중 머리가 이 각도(도) 이상 움직이면 다시 측정 */
export const MAX_CALIBRATION_DEVIATION = 8;

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * 모은 값의 평균. 샘플이 없으면 null
 * 어깨는 절반 이상의 샘플에서 인식됐을 때만 평균을 내고, 아니면 null(어깨 기준 없음)
 */
export function averageCalibration(samples: CalibrationSample[]): CalibrationAverage | null {
    if (samples.length === 0) return null;

    const head: HeadAngles = {
        yaw: mean(samples.map(s => s.head.yaw)),
        pitch: mean(samples.map(s => s.head.pitch)),
        roll: mean(samples.map(s => s.head.roll)),
    };

    const shoulders = samples.flatMap(s => (s.shoulder ? [s.shoulder] : []));
    const shoulder = shoulders.length * 2 >= samples.length
        ? { yaw: mean(shoulders.map(s => s.yaw)), roll: mean(shoulders.map(s => s.roll)) }
        : null;

    const maxDeviation = Math.max(...samples.map(({ head: h }) => Math.max(
        Math.abs(h.yaw - head.yaw),
        Math.abs(h.pitch - head.pitch),
        Math.abs(h.roll - head.roll),
    )));

    return { calibration: { head, shoulder }, maxDeviation };
}
