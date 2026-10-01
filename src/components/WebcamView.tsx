//사용자 Video를 보여주는 컴포넌트
import { useEffect, useRef, useState } from 'react';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';

function WebcamView() {
    const videoRef = useRef<HTMLVideoElement>(null);
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

    const faceDetected =
        (faceResult?.faceLandmarks.length ?? 0) > 0;

    return (
        <div>
            <h2>웹캠 테스트</h2>

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                width={640}
                height={480}
                style={{
                    transform: 'scaleX(-1)',
                }}
            />

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