// MediaPipe PoseLandmarker의 자세 결과 반환
import { useEffect, useRef, useState } from 'react';
import type {
    PoseLandmarker,
    PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

import { createPoseLandmarker } from '../mediapipe/poseLandmarker';

export function usePoseLandmarker(
    videoElement: HTMLVideoElement | null
) {
    const landmarkerRef = useRef<PoseLandmarker | null>(null);
    const lastVideoTimeRef = useRef(-1);

    const [result, setResult] =
        useState<PoseLandmarkerResult | null>(null);

    useEffect(() => {
        let animationFrameId: number;
        let isCancelled = false;

        async function initialize() {
            const landmarker = await createPoseLandmarker();

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
                if (
                    videoElement.currentTime !==
                    lastVideoTimeRef.current
                ) {
                    lastVideoTimeRef.current =
                        videoElement.currentTime;

                    const detectionResult =
                        landmarker.detectForVideo(
                            videoElement,
                            performance.now()
                        );

                    setResult(detectionResult);
                }
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