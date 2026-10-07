import { useEffect, useRef } from 'react';

import {
    createCharacterScene,
    type CharacterController,
} from '../three/CharacterScene';

import {
    CHARACTER_MODELS,
    type CharacterId,
} from '../three/characters';

interface CharacterViewProps {
    angles: {
        yaw: number;
        pitch: number;
        roll: number;
    };

    character: CharacterId;
}

function CharacterView({
    angles,
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
                CHARACTER_MODELS[character]
            );

        return () => {
            controllerRef.current?.dispose();
            controllerRef.current = null;
        };
    }, [character]);

    // 각도가 바뀔 때 Head Bone 회전
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
    ]);

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