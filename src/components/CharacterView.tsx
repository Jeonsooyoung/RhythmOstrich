import { useEffect, useRef } from 'react';

import { createCharacterScene } from '../three/CharacterScene';

function CharacterView() {
    const containerRef =
        useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        const { renderer } =
            createCharacterScene(container);

        return () => {
            renderer.dispose();

            if (renderer.domElement.parentElement) {
                renderer.domElement.parentElement.removeChild(
                    renderer.domElement
                );
            }
        };
    }, []);

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