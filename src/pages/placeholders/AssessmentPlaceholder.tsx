// 임시 자가 평가 화면 (3번 파트의 진짜 화면으로 교체 예정)
import { useState } from 'react';
import GardenLayout from '../../components/GardenLayout';
import { DIRECTION_LABELS, STRETCH_DIRECTIONS } from '../../game/sessionAnalysis';
import type { AssessmentPageProps } from '../../types/pages';
import type { RomCheck, Score10, Score4 } from '../../types/session';

const SCORES_10 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const satisfies readonly Score10[];
const SCORES_4 = [1, 2, 3, 4] as const satisfies readonly Score4[];

function Pills<T extends number>({ name, scores, value, onChange }: {
    name: string;
    scores: readonly T[];
    value: T | null;
    onChange: (value: T) => void;
}) {
    return (
        <div className="gp-pills" role="radiogroup" aria-label={name}>
            {scores.map(score => (
                <label className="gp-pill" key={score}>
                    <input type="radio" name={name} checked={value === score} onChange={() => onChange(score)} />
                    <span>{score}</span>
                </label>
            ))}
        </div>
    );
}

export default function AssessmentPlaceholder({ mode, initial, onComplete, onBack }: AssessmentPageProps) {
    const [discomfort, setDiscomfort] = useState<Score10 | null>(initial?.discomfort ?? null);
    const [stiffness, setStiffness] = useState<Score10 | null>(initial?.stiffness ?? null);
    const [rom, setRom] = useState<RomCheck>(initial?.rom ?? {});

    return (
        <GardenLayout
            phase={mode === 'pre' ? 'preAssessment' : 'postAssessment'}
            eyebrow={mode === 'pre' ? 'HOW DO YOU FEEL TODAY?' : 'HOW DO YOU FEEL NOW?'}
            title={mode === 'pre' ? '운동 전 몸 상태' : '운동 후 몸 상태'}
            subtitle="지금 목과 어깨가 어떤지 알려 주세요."
        >
            <span className="gp-placeholder-tag">임시 화면</span>
            <section className="gp-card">
                <h2>불편감 <small>0: 전혀 없음 · 10: 매우 심함</small></h2>
                <Pills name="discomfort" scores={SCORES_10} value={discomfort} onChange={setDiscomfort} />
            </section>
            <section className="gp-card">
                <h2>뻣뻣함 <small>0: 전혀 없음 · 10: 매우 심함</small></h2>
                <Pills name="stiffness" scores={SCORES_10} value={stiffness} onChange={setStiffness} />
            </section>
            <section className="gp-card">
                <h2>움직임 범위 <small>1: 거의 못 움직임 · 4: 끝까지 편하게 (선택)</small></h2>
                {STRETCH_DIRECTIONS.map(direction => (
                    <div className="gp-row" key={direction}>
                        <span>{DIRECTION_LABELS[direction]}</span>
                        <Pills
                            name={`rom-${direction}`}
                            scores={SCORES_4}
                            value={rom[direction] ?? null}
                            onChange={v => setRom(r => ({ ...r, [direction]: v }))}
                        />
                    </div>
                ))}
            </section>
            <div className="gp-actions">
                <button
                    type="button"
                    className="gp-button primary"
                    disabled={discomfort === null || stiffness === null}
                    onClick={() => discomfort !== null && stiffness !== null && onComplete({
                        discomfort,
                        stiffness,
                        rom,
                        recordedAt: new Date().toISOString(),
                    })}
                >
                    완료 <span aria-hidden="true">→</span>
                </button>
            </div>
            {onBack && <button type="button" className="gp-link" onClick={onBack}>← 이전으로</button>}
        </GardenLayout>
    );
}
