import { useEffect, useRef } from 'react';

import {
    createCharacterScene,
    type CharacterController,
} from '../three/CharacterScene';

interface CharacterViewProps {
    angles: {
        yaw: number;
        pitch: number;
        roll: number;
    };
}

function CharacterView({
    angles,
}: CharacterViewProps) {
    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const controllerRef =
        useRef<CharacterController | null>(null);

    // Three.js Scene은 처음 한 번만 생성
    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        controllerRef.current =
            createCharacterScene(container);

        return () => {
            controllerRef.current?.dispose();
            controllerRef.current = null;
        };
    }, []);

    // 각도가 바뀔 때 Bone만 회전
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