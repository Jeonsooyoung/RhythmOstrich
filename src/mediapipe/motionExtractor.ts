export interface HeadAngles {
    yaw: number;
    pitch: number;
    roll: number;
}

export function extractHeadAngles(matrixData: number[]): HeadAngles {
    const r00 = matrixData[0];

    const r10 = matrixData[4];

    const r20 = matrixData[8];
    const r21 = matrixData[9];
    const r22 = matrixData[10];

    const pitch = Math.asin(-r20);
    const yaw = Math.atan2(r10, r00);
    const roll = Math.atan2(r21, r22);

    return {
        yaw: yaw * (180 / Math.PI),
        pitch: pitch * (180 / Math.PI),
        roll: roll * (180 / Math.PI),
    };
}