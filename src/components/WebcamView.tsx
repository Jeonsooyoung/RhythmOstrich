// 사용자 Video를 보여주는 컴포넌트
import { useEffect, useRef, useState } from 'react';
import {
    DrawingUtils,
    FaceLandmarker,
    PoseLandmarker,
} from '@mediapipe/tasks-vision';

import { usePoseLandmarker } from '../hooks/usePoseLandmarker';

import { useWebcam } from '../hooks/useWebcam';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import { extractHeadAngles } from '../mediapipe/motionExtractor';
import { calibrateAngles } from '../motion/calibrate';

import { detectMotion } from '../motion/motionDetector';
import CharacterView from './CharacterView';
import type { CharacterId } from '../three/Characters';

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

    const faceResult = useFaceLandmarker(videoElement);
    const poseResult = usePoseLandmarker(videoElement);

    // 원본 머리 각도
    const [angles, setAngles] = useState({
        yaw: 0,
        pitch: 0,
        roll: 0,
    });

    // 정면으로 설정했을 때의 기준값
    const [calibration, setCalibration] = useState<{
        yaw: number;
        pitch: number;
        roll: number;
    } | null>(null);

    // 정면 기준값을 뺀 실제 게임용 각도
    const [calibratedAngles, setCalibratedAngles] = useState({
        yaw: 0,
        pitch: 0,
        roll: 0,
    });

    const [selectedCharacter, setSelectedCharacter] =
        useState<CharacterId>('chicken');

    // 화면의 각도 숫자는 100ms마다 갱신하기 위한 값
    const lastAngleUpdateRef = useRef(0);

    // 가장 최근에 측정된 실제 각도
    // 화면 표시 주기와 관계없이 Calibration에 사용
    const latestAnglesRef = useRef({
        yaw: 0,
        pitch: 0,
        roll: 0,
    });

    // 웹캠 stream을 video에 연결
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            setVideoElement(videoRef.current);
        }
    }, [stream]);

    // 얼굴, 자세 Landmarks 시각화
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawingUtils = new DrawingUtils(ctx);

        // Face Landmarks
        if (faceResult) {
            for (const landmarks of faceResult.faceLandmarks) {
                drawingUtils.drawConnectors(
                    landmarks,
                    FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                    {
                        color: 'rgba(255, 255, 255, 0.35)',
                        lineWidth: 0.5,
                    }
                );

                drawingUtils.drawConnectors(
                    landmarks,
                    FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
                    {
                        color: 'rgba(255, 255, 255, 0.7)',
                        lineWidth: 1,
                    }
                );

                drawingUtils.drawConnectors(
                    landmarks,
                    FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                    {
                        color: 'rgba(0, 255, 0, 0.8)',
                        lineWidth: 1,
                    }
                );

                drawingUtils.drawConnectors(
                    landmarks,
                    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                    {
                        color: 'rgba(0, 150, 255, 0.8)',
                        lineWidth: 1,
                    }
                );

                drawingUtils.drawConnectors(
                    landmarks,
                    FaceLandmarker.FACE_LANDMARKS_LIPS,
                    {
                        color: 'rgba(255, 80, 80, 0.8)',
                        lineWidth: 1,
                    }
                );
            }
        }

        // Pose Landmarks
        if (poseResult) {
            for (const landmarks of poseResult.landmarks) {

                const bodyConnections =
                    PoseLandmarker.POSE_CONNECTIONS.filter(
                        (connection) =>
                            connection.start >= 11 &&
                            connection.end >= 11
                    );

                drawingUtils.drawConnectors(
                    landmarks,
                    bodyConnections,
                    {
                        color: 'rgba(255, 255, 0, 0.8)',
                        lineWidth: 2,
                    }
                );

                const bodyLandmarks = landmarks.filter(
                    (_, index) => index >= 11
                );

                drawingUtils.drawLandmarks(
                    bodyLandmarks,
                    {
                        color: 'rgba(255, 100, 0, 0.9)',
                        radius: 3,
                    }
                );
            }
        }
    }, [faceResult, poseResult]);

    // Transformation Matrix → yaw / pitch / roll 변환
    useEffect(() => {
        if (!faceResult) return;

        const matrix =
            faceResult.facialTransformationMatrixes?.[0];

        if (!matrix) return;

        const headAngles = extractHeadAngles(matrix.data);

        // 가장 최신 각도는 항상 저장
        latestAnglesRef.current = headAngles;

        // 게임 / 3D 캐릭터용 각도는 새 결과마다 갱신
        if (calibration) {
            const correctedAngles = calibrateAngles(
                headAngles,
                calibration
            );

            setCalibratedAngles(correctedAngles);
        }

        const now = performance.now();

        // 화면에 표시하는 숫자만 100ms마다 갱신
        if (now - lastAngleUpdateRef.current >= 100) {
            setAngles(headAngles);
            lastAngleUpdateRef.current = now;
        }
    }, [faceResult, calibration]);

    // 현재 자세를 정면 기준으로 설정
    function handleCalibration() {
        setCalibration({
            ...latestAnglesRef.current,
        });

        // 버튼을 누른 순간은 정면이므로 0으로 표시
        setCalibratedAngles({
            yaw: 0,
            pitch: 0,
            roll: 0,
        });
    }

    const faceDetected =
        (faceResult?.faceLandmarks.length ?? 0) > 0;

    const trackingValid =
        faceDetected && calibration !== null;

    const currentMotion = trackingValid
        ? detectMotion(calibratedAngles)
        : null;

    const poseDetected =
        (poseResult?.landmarks.length ?? 0) > 0;

    const poseLandmarks = poseResult?.landmarks?.[0];

    const leftShoulder = poseLandmarks?.[11];
    const rightShoulder = poseLandmarks?.[12];

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

                <button
                    onClick={handleCalibration}
                    disabled={!faceDetected}
                >
                    정면 기준 설정
                </button>
            </div>

            <p>
                얼굴 인식:
                {faceDetected ? ' 인식됨' : ' 인식 안 됨'}
            </p>

            <p>
                자세 인식:
                {poseDetected ? ' 인식됨' : ' 인식 안 됨'}
            </p>

            {leftShoulder && rightShoulder && (
                <div>
                    <h3>어깨 좌표</h3>

                    <p>
                        왼쪽 어깨:
                        x {leftShoulder.x.toFixed(2)},
                        y {leftShoulder.y.toFixed(2)}
                    </p>

                    <p>
                        오른쪽 어깨:
                        x {rightShoulder.x.toFixed(2)},
                        y {rightShoulder.y.toFixed(2)}
                    </p>
                </div>
            )}

            <div>
                <h3>원본 각도</h3>
                <p>Yaw: {angles.yaw.toFixed(1)}°</p>
                <p>Pitch: {angles.pitch.toFixed(1)}°</p>
                <p>Roll: {angles.roll.toFixed(1)}°</p>
            </div>

            <div>
                <h3>정면 기준 각도</h3>

                {calibration ? (
                    <>
                        <p>
                            Yaw: {calibratedAngles.yaw.toFixed(1)}°
                        </p>
                        <p>
                            Pitch: {calibratedAngles.pitch.toFixed(1)}°
                        </p>
                        <p>
                            Roll: {calibratedAngles.roll.toFixed(1)}°
                        </p>
                    </>
                ) : (
                    <p>정면 기준을 설정해주세요.</p>
                )}
            </div>
            <p>
                현재 동작:
                {currentMotion ?? ' 추적 대기'}
            </p>
            <div>
                <button
                    onClick={() => setSelectedCharacter('chicken')}
                >
                    닭
                </button>

                <button
                    onClick={() => setSelectedCharacter('ostrich')}
                >
                    타조
                </button>
            </div>

            <CharacterView
                angles={calibratedAngles}
                character={selectedCharacter}
            />
            {error && <p>{error}</p>}
        </div>
    );
}

export default WebcamView;
