export type CharacterId = 'chicken' | 'ostrich';

export interface CharacterRig {
    modelPath: string;
    // 몸통에서 머리 순서. 회전 가중치 합은 1이어야 합니다.
    joints: { name: string; weight: number; pitchDownWeight?: number }[];
    // 배율 적용 후 숙임 각도가 이 값에 도달하면 숙임 전용 비율을 전부 적용
    pitchDownBlendAngle?: number;
    gain: { yaw: number; pitchUp: number; pitchDown: number; roll: number };
    // 배율 적용 후 캐릭터에 적용할 최대 각도
    limits: { yaw: number; pitch: number; roll: number };
    response: number;
    body: {
        bone: string;
        gain: { yaw: number; roll: number };
        limits: { yaw: number; roll: number };
        response: number;
    };
}

export const CHARACTER_RIGS: Record<CharacterId, CharacterRig> = {
    chicken: {
        modelPath: '/models/3DChicken.glb',
        joints: [
            { name: 'Neck02', weight: 0.2 },
            { name: 'Neck01', weight: 0.3 },
            { name: 'Head', weight: 0.5 },
        ],
        gain: { yaw: 1.2, pitchUp: 1.2, pitchDown: 1.8, roll: 1.2 },
        limits: { yaw: 60, pitch: 40, roll: 35 },
        response: 12,
        body: { bone: 'Body', gain: { yaw: 1.2, roll: 1.2 }, limits: { yaw: 45, roll: 25 }, response: 10 },
    },
    ostrich: {
        pitchDownBlendAngle: 20,
        modelPath: '/models/3DOstrich.glb',
        joints: [
            { name: 'Neck03', weight: 0.15, pitchDownWeight: 0.25 },
            { name: 'Neck02', weight: 0.2, pitchDownWeight: 0.3 },
            { name: 'Neck01', weight: 0.25, pitchDownWeight: 0.3 },
            { name: 'Head', weight: 0.4, pitchDownWeight: 0.15 },
        ],
        gain: { yaw: 1.2, pitchUp: 1.2, pitchDown: 2.3, roll: 1.2 },
        limits: { yaw: 60, pitch: 80, roll: 35 },
        response: 10,
        body: { bone: 'Body', gain: { yaw: 1.2, roll: 1.2 }, limits: { yaw: 45, roll: 25 }, response: 10 },
    },
};
