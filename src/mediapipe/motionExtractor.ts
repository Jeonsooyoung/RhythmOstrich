export interface HeadAngles {
    yaw: number;
    pitch: number;
    roll: number;
}

export function extractHeadAngles(
    matrixData: number[]
): HeadAngles {
    const r00 = matrixData[0];

    const r10 = matrixData[4];

    const r20 = matrixData[8];
    const r21 = matrixData[9];
    const r22 = matrixData[10];

    // Yaw: 고개를 좌우로 돌리는 움직임
    const yaw = Math.asin(-r20);

    // Pitch: 고개를 위/아래로 움직이는 움직임
    const pitch = Math.atan2(r21, r22);

    // Roll: 고개를 좌우로 기울이는 움직임
    const roll = Math.atan2(r10, r00);

    return {
        yaw: yaw * (180 / Math.PI),
        pitch: pitch * (180 / Math.PI),
        roll: roll * (180 / Math.PI),
    };
}