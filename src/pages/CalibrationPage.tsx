// S30: 머리·어깨 정면 기준 설정
// 정면을 바라본 채 3초 동안 모은 값의 평균을 기준으로 삼고,
// 기준을 잡은 뒤에는 선택한 캐릭터가 2D 자세 이미지로 움직임을 따라 함
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import GardenLayout from '../components/GardenLayout';
import { getAllPoseImages, getPoseImage } from '../data/characterPoses';
import { characters } from '../data/characters';
import { DIRECTION_LABELS } from '../game/sessionAnalysis';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import { usePoseLandmarker } from '../hooks/usePoseLandmarker';
import { useWebcam } from '../hooks/useWebcam';
import { extractHeadAngles } from '../mediapipe/motionExtractor';
import { extractShoulderAngles } from '../mediapipe/shoulderExtractor';
import { calibrateAngles } from '../motion/calibrate';
import {
    averageCalibration,
    MAX_CALIBRATION_DEVIATION,
    type CalibrationSample,
} from '../motion/calibrationSampler';
import { detectMotion } from '../motion/motionDetector';
import type { CharacterId } from '../types/character';
import type { CalibrationSnapshot } from '../types/session';

interface CalibrationPageProps {
    characterId: CharacterId;
    onComplete: (calibration: CalibrationSnapshot) => void;
    onBack: () => void;
}

const SAMPLE_INTERVAL_MS = 100;
const DURATION_MS = 3000;

interface Message { text: string; ok?: boolean }

/** 받침 여부에 따라 '이'/'가' (예: 펭귄이, 타조가) */
function subjectParticle(name: string): string {
    const code = name.charCodeAt(name.length - 1) - 0xac00;
    return code >= 0 && code <= 11171 && code % 28 !== 0 ? '이' : '가';
}

export default function CalibrationPage({ characterId, onComplete, onBack }: CalibrationPageProps) {
    const character = characters.find(c => c.id === characterId) ?? characters[0];
    const { stream, error, isLoading, startCamera } = useWebcam();
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const faceResult = useFaceLandmarker(videoElement);
    const poseResult = usePoseLandmarker(videoElement);

    const matrix = stream ? faceResult?.facialTransformationMatrixes?.[0] : undefined;
    const head = matrix && (faceResult?.faceLandmarks.length ?? 0) > 0 ? extractHeadAngles(matrix.data) : null;
    const shoulder = stream ? extractShoulderAngles(poseResult?.worldLandmarks?.[0]) : null;

    const [calibration, setCalibration] = useState<CalibrationSnapshot | null>(null);
    const [remaining, setRemaining] = useState<number | null>(null);
    const [message, setMessage] = useState<Message | null>(null);

    // 측정 타이머에서 읽을 최신 값
    const latestRef = useRef<CalibrationSample | null>(null);
    useEffect(() => {
        latestRef.current = head ? { head, shoulder } : null;
    });

    const timerRef = useRef<number | null>(null);
    const stopTimer = () => {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setRemaining(null);
    };
    useEffect(() => () => {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
    }, []);

    // 캐릭터 자세 이미지 미리 불러오기 (자세가 바뀔 때 깜빡임 방지)
    useEffect(() => {
        for (const src of getAllPoseImages(characterId)) new Image().src = src;
    }, [characterId]);

    function startMeasuring() {
        const samples: CalibrationSample[] = [];
        const startedAt = performance.now();
        setCalibration(null);
        setMessage(null);
        setRemaining(Math.ceil(DURATION_MS / 1000));

        timerRef.current = window.setInterval(() => {
            const latest = latestRef.current;
            if (!latest) {
                stopTimer();
                setMessage({ text: '얼굴이 화면에서 벗어났어요. 다시 시도해 주세요.' });
                return;
            }
            samples.push(latest);

            const elapsed = performance.now() - startedAt;
            if (elapsed < DURATION_MS) {
                setRemaining(Math.ceil((DURATION_MS - elapsed) / 1000));
                return;
            }

            stopTimer();
            const result = averageCalibration(samples);
            if (!result) return;
            if (result.maxDeviation > MAX_CALIBRATION_DEVIATION) {
                setMessage({ text: '측정하는 동안 고개가 움직였어요. 정면을 보고 가만히 있어 주세요.' });
                return;
            }
            setCalibration(result.calibration);
            setMessage(result.calibration.shoulder
                ? { text: '기준을 잡았어요! 고개를 천천히 움직여 보세요.', ok: true }
                : { text: '어깨가 잘 보이지 않아 어깨 기준 없이 진행해요. 양쪽 어깨가 보이면 다시 맞춰 주세요.' });
        }, SAMPLE_INTERVAL_MS);
    }

    const measuring = remaining !== null;
    const motion = calibration && head ? detectMotion(calibrateAngles(head, calibration.head)) : null;
    const motionLabel = !calibration ? '정면을 봐 주세요'
        : !head ? '얼굴을 찾고 있어요'
        : motion === 'CENTER' || motion === null ? '정면' : DIRECTION_LABELS[motion];

    return (
        <GardenLayout
            phase="calibration"
            width="wide"
            eyebrow="FACE FORWARD, RELAX YOUR SHOULDERS"
            title="정면 맞추기"
            subtitle={`정면을 바라보고 어깨를 편하게 둔 채 3초만 가만히 있어 주세요. ${character.name}${subjectParticle(character.name)} 따라 할 준비를 해요.`}
        >
            <div className="gp-calibration">
                <div>
                    <div className="gp-webcam">
                        <video
                            ref={el => { if (el && stream && el.srcObject !== stream) el.srcObject = stream; }}
                            autoPlay
                            playsInline
                            muted
                            hidden={!stream}
                            onLoadedData={event => setVideoElement(event.currentTarget)}
                        />
                        {!stream && (
                            <div className="gp-webcam-empty">
                                <span>영상은 이 기기 안에서만 쓰고 밖으로 보내지 않아요.</span>
                                <button type="button" className="gp-button primary" onClick={startCamera} disabled={isLoading}>
                                    {isLoading ? '카메라 연결 중...' : '카메라 켜기'}
                                </button>
                                {error && <span className="gp-message">{error}</span>}
                            </div>
                        )}
                        {stream && !calibration && <span className="gp-guide" aria-hidden="true" />}
                        {measuring && <div className="gp-countdown" aria-live="assertive">{remaining}</div>}
                    </div>
                    <ul className="gp-checks" aria-label="인식 상태">
                        <li className={stream ? 'ok' : ''}>카메라 {stream ? '켜짐' : '꺼짐'}</li>
                        <li className={head ? 'ok' : ''}>얼굴 {head ? '인식됨' : '찾는 중'}</li>
                        <li className={shoulder ? 'ok' : ''}>양쪽 어깨 {shoulder ? '인식됨' : '찾는 중'}</li>
                    </ul>
                </div>

                <div className="gp-buddy">
                    <div className="gp-buddy-frame" style={{ '--bird-color': character.color } as CSSProperties}>
                        <img src={getPoseImage(characterId, motion)} alt={`${character.name} ${motionLabel}`} draggable="false" />
                    </div>
                    <span className="gp-buddy-name">{character.name}</span>
                    <span className="gp-buddy-motion" aria-live="polite">{motionLabel}</span>
                </div>
            </div>

            <p className={`gp-message ${message?.ok ? 'ok' : ''}`} role="status">{message?.text}</p>

            <div className="gp-actions">
                <button type="button" className="gp-button" onClick={startMeasuring} disabled={!head || measuring}>
                    {calibration ? '다시 맞추기' : measuring ? '측정 중...' : '정면 기준 잡기'}
                </button>
                <button
                    type="button"
                    className="gp-button primary"
                    disabled={!calibration || measuring}
                    onClick={() => calibration && onComplete(calibration)}
                >
                    다음 <span aria-hidden="true">→</span>
                </button>
            </div>
            <button type="button" className="gp-link" onClick={onBack}>← 캐릭터 다시 고르기</button>
        </GardenLayout>
    );
}
