export type CharacterId = 'chicken' | 'ostrich';

export interface CharacterRig {
    modelPath: string;
    // 몸통에서 머리 순서. 회전 가중치 합은 1이어야 합니다.
    joints: { name: string; weight: number }[];
    limits: { yaw: number; pitch: number; roll: number };
    response: number;
}

export const CHARACTER_RIGS: Record<CharacterId, CharacterRig> = {
    chicken: {
        modelPath: '/models/3DChicken.glb',
        joints: [
            { name: 'Neck02', weight: 0.2 },
            { name: 'Neck01', weight: 0.3 },
            { name: 'Head', weight: 0.5 },
        ],
        limits: { yaw: 60, pitch: 40, roll: 35 },
        response: 12,
    },
    ostrich: {
        modelPath: '/models/3DOstrich.glb',
        joints: [
            { name: 'Neck03', weight: 0.15 },
            { name: 'Neck02', weight: 0.2 },
            { name: 'Neck01', weight: 0.25 },
            { name: 'Head', weight: 0.4 },
        ],
        limits: { yaw: 60, pitch: 40, roll: 35 },
        response: 10,
    },
};
