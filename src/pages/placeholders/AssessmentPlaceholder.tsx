// 임시 자가 평가 화면 (3번 파트의 진짜 화면으로 교체 예정)
import { useState } from 'react';
import { DIRECTION_LABELS, STRETCH_DIRECTIONS } from '../../game/sessionAnalysis';
import type { AssessmentPageProps } from '../../types/pages';
import type { RomCheck, Score10, Score4 } from '../../types/session';
import '../flow.css';

const SCORES_10 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const satisfies readonly Score10[];
const SCORES_4 = [1, 2, 3, 4] as const satisfies readonly Score4[];

export default function AssessmentPlaceholder({ mode, initial, onComplete, onBack }: AssessmentPageProps) {
    const [discomfort, setDiscomfort] = useState<Score10 | null>(initial?.discomfort ?? null);
    const [stiffness, setStiffness] = useState<Score10 | null>(initial?.stiffness ?? null);
    const [rom, setRom] = useState<RomCheck>(initial?.rom ?? {});

    const scale = <T extends number>(name: string, scores: readonly T[], value: T | null, onChange: (v: T) => void) => (
        <div className="flow-scale" role="radiogroup" aria-label={name}>
            {scores.map(score => (
                <label key={score}>
                    <input type="radio" name={name} checked={value === score} onChange={() => onChange(score)} />
                    {score}
                </label>
            ))}
        </div>
    );

    return (
        <main className="flow-page">
            <span className="flow-placeholder-tag">임시 화면</span>
            <h1>{mode === 'pre' ? '운동 전' : '운동 후'} 상태 체크</h1>
            <p className="flow-lead">0점: 전혀 없음 · 10점: 매우 심함</p>

            <section className="flow-card">
                <div className="flow-row"><span>불편감</span>{scale('discomfort', SCORES_10, discomfort, setDiscomfort)}</div>
                <div className="flow-row"><span>뻣뻣함</span>{scale('stiffness', SCORES_10, stiffness, setStiffness)}</div>
            </section>

            <section className="flow-card">
                <h2>움직임 범위 (1: 거의 못 움직임 · 4: 끝까지 편하게, 선택)</h2>
                {STRETCH_DIRECTIONS.map(direction => (
                    <div className="flow-row" key={direction}>
                        <span>{DIRECTION_LABELS[direction]}</span>
                        {scale(`rom-${direction}`, SCORES_4, rom[direction] ?? null, v => setRom(r => ({ ...r, [direction]: v })))}
                    </div>
                ))}
            </section>

            <div className="flow-actions">
                {onBack && <button type="button" onClick={onBack}>← 이전</button>}
                <button
                    type="button"
                    className="primary"
                    disabled={discomfort === null || stiffness === null}
                    onClick={() => discomfort !== null && stiffness !== null && onComplete({
                        discomfort,
                        stiffness,
                        rom,
                        recordedAt: new Date().toISOString(),
                    })}
                >
                    완료
                </button>
            </div>
        </main>
    );
}
