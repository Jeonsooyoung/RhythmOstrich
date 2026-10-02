//MediaPipe FaceLandmarker의 얼굴 결과 반환
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
    const lastVideoTimeRef = useRef(-1);

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
            ) { //videoElement.currentTime이 이전 프레임과 달라졌을 때만 
                //detectForVideo를 호출하여 30fps일 경우 중복 연산 방지
                if (videoElement.currentTime !== lastVideoTimeRef.current) {
                    lastVideoTimeRef.current = videoElement.currentTime;

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