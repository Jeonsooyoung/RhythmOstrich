//사용자 Video를 보여주는 컴포넌트
import { useEffect, useRef, useState } from 'react';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import { DrawingUtils, FaceLandmarker } from '@mediapipe/tasks-vision';

function WebcamView() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [videoElement, setVideoElement] =
        useState<HTMLVideoElement | null>(null);

    const {
        stream,
        error,
        isLoading,
        startCamera,
        stopCamera,
    } = useWebcam();

    const faceResult =
        useFaceLandmarker(videoElement);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            setVideoElement(videoRef.current);
        }
    }, [stream]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (!canvas || !video || !faceResult) return;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawingUtils = new DrawingUtils(ctx);

        for (const landmarks of faceResult.faceLandmarks) {
            //얼굴 전체 Mesh
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                {
                    color: 'rgba(255, 255, 255, 0.35)',
                    lineWidth: 0.5,
                }
            );

            //얼굴 윤곽
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                {
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineWidth: 1,
                }
            );
            //왼쪽 눈
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                {
                    color: 'rgba(0, 255, 0, 0.8)',
                    lineWidth: 1,
                }
            );
            //오른쪽 눈
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                {
                    color: 'rgba(0, 150, 255, 0.8)',
                    lineWidth: 1,
                }
            );
            //입
            drawingUtils.drawConnectors(
                landmarks,
                FaceLandmarker.FACE_LANDMARKS_LIPS,
                {
                    color: 'rgba(255, 80, 80, 0.8)',
                    lineWidth: 1,
                }
            );
        }
    }, [faceResult]);

    const faceDetected =
        (faceResult?.faceLandmarks.length ?? 0) > 0;

    return (
        <div>
            <h2>웹캠 테스트</h2>

            <div
                style={{
                    position: 'relative',
                    width: 640,
                    height: 480,
                }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    width={640}
                    height={480}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transform: 'scaleX(-1)',
                    }}
                />

                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transform: 'scaleX(-1)',
                        pointerEvents: 'none',
                    }}
                />
            </div>

            <div>
                <button
                    onClick={startCamera}
                    disabled={isLoading}
                >
                    {isLoading
                        ? '카메라 연결 중...'
                        : '카메라 시작'}
                </button>

                <button onClick={stopCamera}>
                    카메라 종료
                </button>
            </div>

            <p>
                얼굴 인식:
                {faceDetected ? ' 인식됨' : ' 인식 안 됨'}
            </p>

            {error && <p>{error}</p>}
        </div>
    );
}

export default WebcamView;