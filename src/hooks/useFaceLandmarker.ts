//MediaPipe FaceLandmarker의 얼굴 결과 반환
import { useEffect, useRef, useState } from 'react';
import type {
    FaceLandmarker,
    FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

import { createFaceLandmarker } from '../mediapipe/faceLandmarker';

export function useFaceLandmarker(
    videoElement: HTMLVideoElement | null,
    onError?: (message: string) => void,
) {
    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const lastVideoTimeRef = useRef(-1);

    const [result, setResult] =
        useState<{ source: HTMLVideoElement; detection: FaceLandmarkerResult } | null>(null);

    useEffect(() => {
        if (!videoElement) return;
        lastVideoTimeRef.current = -1;
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

                    try {
                      const detectionResult = landmarker.detectForVideo(
                            videoElement,
                            performance.now()
                        );

                      setResult({ source: videoElement, detection: detectionResult });
                    } catch {
                      setResult(null);
                      onError?.('얼굴 인식이 중단되었습니다. 카메라를 껐다 켜주세요.');
                      return;
                    }
                }
            }

            animationFrameId =
                requestAnimationFrame(detect);
        }

        initialize().catch(() => {
            if (!isCancelled) onError?.('얼굴 인식을 시작할 수 없습니다. 네트워크를 확인하고 카메라를 다시 켜주세요.');
        });

        return () => {
            isCancelled = true;
            cancelAnimationFrame(animationFrameId);
        };
    }, [videoElement, onError]);

    return result?.source === videoElement ? result.detection : null;
}
