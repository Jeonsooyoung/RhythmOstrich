import { useEffect, useRef } from 'react';
import type { ShoulderAngles } from '../mediapipe/shoulderExtractor';

import {
    createCharacterScene,
    type CharacterController,
} from '../three/CharacterScene';

import {
    CHARACTER_RIGS,
    type CharacterId,
} from '../three/Characters';

interface CharacterViewProps {
    angles: {
        yaw: number;
        pitch: number;
        roll: number;
    };

    bodyAngles: ShoulderAngles | null;
    character: CharacterId;
}

function CharacterView({
    angles,
    bodyAngles,
    character,
}: CharacterViewProps) {
    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const controllerRef =
        useRef<CharacterController | null>(null);

    // 캐릭터가 바뀔 때 Scene 다시 생성
    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        controllerRef.current =
            createCharacterScene(
                container,
                CHARACTER_RIGS[character]
            );

        return () => {
            controllerRef.current?.dispose();
            controllerRef.current = null;
        };
    }, [character]);

    // 각도 또는 캐릭터가 바뀌면 목과 머리의 목표 회전 전달
    useEffect(() => {
        controllerRef.current?.setHeadAngles(
            angles.yaw,
            angles.pitch,
            angles.roll
        );
    }, [
        angles.yaw,
        angles.pitch,
        angles.roll,
        character,
    ]);

    const bodyYaw = bodyAngles?.yaw;
    const bodyRoll = bodyAngles?.roll;
    useEffect(() => {
        if (bodyYaw === undefined || bodyRoll === undefined) return;
        controllerRef.current?.setBodyAngles(bodyYaw, bodyRoll);
    }, [bodyYaw, bodyRoll, character]);

    return (
        <div
            ref={containerRef}
            style={{
                width: 500,
                height: 500,
            }}
        />
    );
}

export default CharacterView;