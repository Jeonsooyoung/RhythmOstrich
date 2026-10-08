export interface ShoulderAngles {
    yaw: number;
    roll: number;
}

interface PosePoint {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

/** 미러링 전 MediaPipe world 좌표. 사용자 오른쪽 회전/왼쪽 기울임이 양수. */
export function extractShoulderAngles(points?: readonly PosePoint[]): ShoulderAngles | null {
    const left = points?.[11];
    const right = points?.[12];
    if (!left || !right) return null;
    if (![left, right].every(point =>
        [point.x, point.y, point.z].every(Number.isFinite)
        && (point.visibility ?? 0) >= 0.6)) return null;

    const dx = left.x - right.x;
    const dy = left.y - right.y;
    const dz = left.z - right.z;
    // 어깨가 겹치거나 등을 보이는 자세는 안정적인 정면 추적 범위 밖입니다.
    if (Math.hypot(dx, dy, dz) < 0.1 || dx < 0.05) return null;
    return {
        yaw: Math.atan2(-dz, dx) * 180 / Math.PI,
        roll: Math.atan2(dy, dx) * 180 / Math.PI,
    };
}

export function calibrateShoulders(current: ShoulderAngles, baseline: ShoulderAngles): ShoulderAngles {
    const difference = (value: number, origin: number) => ((value - origin + 540) % 360) - 180;
    return { yaw: difference(current.yaw, baseline.yaw), roll: difference(current.roll, baseline.roll) };
}
