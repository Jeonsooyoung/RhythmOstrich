import { useEffect, useRef, useState } from 'react';
import type {
    FaceLandmarker,
    FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

import { createFaceLandmarker } from '../mediapipe/faceLandmarker';

export function useFaceLandmarker(
    videoElement: HTMLVideoElement | null
) {
    const landmarkerRef = useRef<FaceLandmarker | null>(null);

    const [result, setResult] =
        useState<FaceLandmarkerResult | null>(null);

    useEffect(() => {
        let animationFrameId: number;
        let isCancelled = false;

        async function initialize() {
            const landmarker = await createFaceLandmarker();

            if (isCancelled) return;

            landmarkerRef.current = landmarker;
            detect();
        }

        function detect() {
            const landmarker = landmarkerRef.current;

            if (
                landmarker &&
                videoElement &&
                videoElement.readyState >= 2
            ) {
                const detectionResult =
                    landmarker.detectForVideo(
                        videoElement,
                        performance.now()
                    );

                setResult(detectionResult);
            }

            animationFrameId =
                requestAnimationFrame(detect);
        }

        initialize();

        return () => {
            isCancelled = true;
            cancelAnimationFrame(animationFrameId);
        };
    }, [videoElement]);

    return result;
}