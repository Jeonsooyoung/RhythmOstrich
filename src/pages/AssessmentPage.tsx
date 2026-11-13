// 사전/사후 자가 평가 화면 (3번 파트)
// 같은 화면을 mode로 나눠 쓰고, 사전·사후 모두 8개 항목(불편감, 뻣뻣함, ROM 6방향)을 전부 입력해야 완료됨
import { useState } from 'react';
import GardenLayout from '../components/GardenLayout';
import SourceBadge from '../components/SourceBadge';
import { getPoseImage } from '../data/characterPoses';
import { DIRECTION_LABELS, STRETCH_DIRECTIONS } from '../game/sessionAnalysis';
import type { AssessmentPageProps } from '../types/pages';
import type { RomCheck, Score10, Score4, StretchDirection } from '../types/session';
import './AssessmentPage.css';

const SCORES_10 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const satisfies readonly Score10[];
const SCORES_4 = [1, 2, 3, 4] as const satisfies readonly Score4[];

/** 방향마다 어떤 동작인지 알려 주는 한 줄 설명 */
const DIRECTION_GUIDES: Record<StretchDirection, string> = {
    FLEXION: '턱을 가슴 쪽으로 천천히 당겨요',
    EXTENSION: '천장을 보듯 고개를 뒤로 젖혀요',
    LEFT_TILT: '왼쪽 귀를 왼쪽 어깨 쪽으로 내려요',
    RIGHT_TILT: '오른쪽 귀를 오른쪽 어깨 쪽으로 내려요',
    LEFT_TURN: '왼쪽 어깨 너머를 보듯 고개를 돌려요',
    RIGHT_TURN: '오른쪽 어깨 너머를 보듯 고개를 돌려요',
};

/** 그림만으로는 작아서 구분이 어려운 방향을 화살표로 보조 */
const DIRECTION_ARROWS: Record<StretchDirection, string> = {
    FLEXION: '↓',
    EXTENSION: '↑',
    LEFT_TILT: '↶',
    RIGHT_TILT: '↷',
    LEFT_TURN: '←',
    RIGHT_TURN: '→',
};

/** 방향 그림은 대표 캐릭터(타조) 자세 이미지를 씀 */
const GUIDE_CHARACTER = 'ostrich';

const TOTAL_ITEMS = 2 + STRETCH_DIRECTIONS.length;

function ScorePills<T extends number>({ name, label, scores, value, onChange }: {
    name: string;
    label: string;
    scores: readonly T[];
    value: T | null;
    onChange: (value: T) => void;
}) {
    return (
        <div className="gp-pills" role="radiogroup" aria-label={label}>
            {scores.map(score => (
                <label className="gp-pill" key={score}>
                    <input type="radio" name={name} checked={value === score} onChange={() => onChange(score)} />
                    <span>{score}</span>
                </label>
            ))}
        </div>
    );
}

function Score10Card({ name, title, value, onChange }: {
    name: string;
    title: string;
    value: Score10 | null;
    onChange: (value: Score10) => void;
}) {
    return (
        <section className={`gp-card as-score${value !== null ? ' is-done' : ''}`}>
            <h2>{title} {value !== null && <span className="as-check" aria-label="입력함">✓</span>}</h2>
            <ScorePills name={name} label={`${title} 0~10점`} scores={SCORES_10} value={value} onChange={onChange} />
            <div className="as-scale" aria-hidden="true"><span>0 전혀 없음</span><span>10 매우 심함</span></div>
        </section>
    );
}

/** initial.rom 중 6방향 값만 남김 */
function pickRom(rom: RomCheck | undefined): RomCheck {
    const picked: RomCheck = {};
    for (const direction of STRETCH_DIRECTIONS) {
        const value = rom?.[direction];
        if (value !== undefined) picked[direction] = value;
    }
    return picked;
}

export default function AssessmentPage({ mode, initial, onComplete, onBack }: AssessmentPageProps) {
    const [discomfort, setDiscomfort] = useState<Score10 | null>(initial?.discomfort ?? null);
    const [stiffness, setStiffness] = useState<Score10 | null>(initial?.stiffness ?? null);
    const [rom, setRom] = useState<RomCheck>(() => pickRom(initial?.rom));

    const missing = [
        ...(discomfort === null ? ['불편감'] : []),
        ...(stiffness === null ? ['뻣뻣함'] : []),
        ...STRETCH_DIRECTIONS.filter(direction => rom[direction] === undefined).map(direction => DIRECTION_LABELS[direction]),
    ];
    const doneCount = TOTAL_ITEMS - missing.length;
    const isPre = mode === 'pre';

    const submit = () => {
        if (discomfort === null || stiffness === null || missing.length > 0) return;
        onComplete({ discomfort, stiffness, rom, recordedAt: new Date().toISOString() });
    };

    return (
        <GardenLayout
            phase={isPre ? 'preAssessment' : 'postAssessment'}
            eyebrow={isPre ? 'HOW DO YOU FEEL TODAY?' : 'HOW DO YOU FEEL NOW?'}
            title={isPre ? '운동 전 몸 상태' : '운동 후 몸 상태'}
            subtitle={isPre
                ? '지금 목과 어깨가 어떤지 느끼는 그대로 골라 주세요.'
                : '운동 전과 같은 항목이에요. 지금 느낌 그대로 골라 주세요.'}
        >
            <p className="as-intro">
                <SourceBadge source="self" /> 정답은 없어요. 웹캠 판정과 별개로, 내가 느끼는 상태를 기록해요.
            </p>

            <div className="as-scores">
                <Score10Card name="discomfort" title="불편감" value={discomfort} onChange={setDiscomfort} />
                <Score10Card name="stiffness" title="뻣뻣함" value={stiffness} onChange={setStiffness} />
            </div>

            <section className="gp-card as-rom">
                <h2>움직임 범위 <small>그림처럼 천천히 움직여 보고 골라 주세요</small></h2>
                <ol className="as-rom-legend" aria-label="움직임 범위 점수 기준">
                    <li><b>1</b> 거의 못 움직임</li>
                    <li><b>4</b> 끝까지 편하게 움직임</li>
                </ol>
                <div className="as-rom-grid">
                    {STRETCH_DIRECTIONS.map(direction => {
                        const value = rom[direction] ?? null;
                        return (
                            <div className={`as-direction${value !== null ? ' is-done' : ''}`} key={direction}>
                                <span className="as-direction-figure">
                                    <img
                                        className="as-direction-img"
                                        src={getPoseImage(GUIDE_CHARACTER, direction)}
                                        alt={`${DIRECTION_LABELS[direction]} 자세`}
                                        loading="lazy"
                                    />
                                    <span className="as-direction-arrow" aria-hidden="true">{DIRECTION_ARROWS[direction]}</span>
                                </span>
                                <div className="as-direction-body">
                                    <strong>
                                        {DIRECTION_LABELS[direction]}
                                        {value !== null && <span className="as-check" aria-label="입력함">✓</span>}
                                    </strong>
                                    <small>{DIRECTION_GUIDES[direction]}</small>
                                    <ScorePills
                                        name={`rom-${direction}`}
                                        label={`${DIRECTION_LABELS[direction]} 1~4점`}
                                        scores={SCORES_4}
                                        value={value}
                                        onChange={v => setRom(r => ({ ...r, [direction]: v }))}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="as-progress" aria-live="polite">
                <span className="gp-bar"><span style={{ width: `${(doneCount / TOTAL_ITEMS) * 100}%` }} /></span>
                <p>
                    {missing.length === 0
                        ? '모두 입력했어요!'
                        : `${doneCount}/${TOTAL_ITEMS} 입력 · 남은 항목: ${missing.join(', ')}`}
                </p>
            </div>

            <div className="gp-actions">
                <button type="button" className="gp-button primary" disabled={missing.length > 0} onClick={submit}>
                    {isPre ? '다음으로' : '결과 보기'} <span aria-hidden="true">→</span>
                </button>
            </div>
            {onBack && <button type="button" className="gp-link" onClick={onBack}>← 이전으로</button>}
        </GardenLayout>
    );
}
