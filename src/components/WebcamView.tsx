//실제 Video를 보여주는 컴포넌트
import { useEffect, useRef } from 'react';
import { useWebcam } from '../hooks/useWebcam';

function WebcamView() {
    const videoRef = useRef<HTMLVideoElement>(null);

    const {
        stream,
        error,
        isLoading,
        startCamera,
        stopCamera,
    } = useWebcam();

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

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
                <button onClick={startCamera} disabled={isLoading}>
                    {isLoading ? '카메라 연결 중...' : '카메라 시작'}
                </button>

                <button onClick={stopCamera}>
                    카메라 종료
                </button>
            </div>

            {error && <p>{error}</p>}
        </div>
    );
}

export default WebcamView;