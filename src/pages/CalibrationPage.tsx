// S30: 머리·어깨 정면 기준 설정
// 지금은 WebcamView(테스트 화면)를 그대로 감싸서 보정값만 받아 옴
import { useState } from 'react';
import WebcamView from '../components/WebcamView';
import type { CalibrationSnapshot } from '../types/session';
import './flow.css';

interface CalibrationPageProps {
    onComplete: (calibration: CalibrationSnapshot) => void;
    onBack: () => void;
}

export default function CalibrationPage({ onComplete, onBack }: CalibrationPageProps) {
    const [calibration, setCalibration] = useState<CalibrationSnapshot | null>(null);

    return (
        <main className="flow-page">
            <h1>정면 기준 잡기</h1>
            <p className="flow-lead">
                카메라를 켜고 정면을 바라본 채 어깨를 편하게 둔 다음 "정면 기준 설정"을 눌러 주세요.
            </p>
            <div className="flow-actions">
                <button type="button" onClick={onBack}>← 이전</button>
                <button
                    type="button"
                    className="primary"
                    disabled={!calibration}
                    onClick={() => calibration && onComplete(calibration)}
                >
                    {calibration ? '다음 →' : '기준을 먼저 설정해 주세요'}
                </button>
            </div>
            <WebcamView onCalibrated={setCalibration} />
        </main>
    );
}
