// 카메라 관리
import { useCallback, useEffect, useState } from 'react';

export function useWebcam() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });

            setStream(mediaStream);
        } catch (err) {
            console.error('카메라 실행 실패:', err);

            if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    setError('카메라 사용 권한이 거부되었습니다.');
                } else if (err.name === 'NotFoundError') {
                    setError('사용 가능한 카메라를 찾을 수 없습니다.');
                } else {
                    setError('카메라를 실행할 수 없습니다.');
                }
            } else {
                setError('알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => {
                track.stop();
            });

            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        return () => {
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [stream]);

    return {
        stream,
        error,
        isLoading,
        startCamera,
        stopCamera,
    };
}