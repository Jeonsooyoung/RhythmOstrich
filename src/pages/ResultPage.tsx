// 결과 화면 (3번 파트)
// 웹캠 판정 결과(게임)와 직접 입력한 자가 평가(사전·사후)를 나눠 보여 줌
// 값은 모두 sessionAnalysis.ts 함수 결과를 그대로 그림 (그래프는 CSS로 직접 그림)
import type { CSSProperties } from 'react';
import GardenLayout from '../components/GardenLayout';
import SourceBadge from '../components/SourceBadge';
import {
    buildHistory,
    compareAssessments,
    DIRECTION_LABELS,
    STRETCH_DIRECTIONS,
    summarizeGame,
} from '../game/sessionAnalysis';
import type { HistoryPoint } from '../game/sessionAnalysis';
import type { ResultPageProps } from '../types/pages';
import './ResultPage.css';

/** 추이 그래프에 보여 줄 최근 회차 수 */
const TREND_LIMIT = 10;

const pct = (rate: number | null) => (rate === null ? '-' : `${Math.round(rate)}%`);
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const minSec = (sec: number) => {
    const total = Math.max(0, Math.round(sec));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
const shortDate = (iso: string) => {
    const date = new Date(iso);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

type Better = 'lower' | 'higher';

/** 변화량 꼬리표. lower: 줄어들면 좋음(불편감, 뻣뻣함) / higher: 늘어나면 좋음(ROM) */
function Delta({ value, better }: { value: number | undefined; better: Better }) {
    if (value === undefined) return <span className="rs-delta">비교 불가</span>;
    if (value === 0) return <span className="rs-delta">그대로</span>;
    const good = better === 'lower' ? value < 0 : value > 0;
    const word = better === 'lower'
        ? (value < 0 ? '줄었어요' : '늘었어요')
        : (value > 0 ? '넓어졌어요' : '줄었어요');
    return <span className={`rs-delta ${good ? 'good' : 'bad'}`}>{signed(value)} {word}</span>;
}

/** 사전/사후 막대 한 쌍 */
function CompareRow({ label, pre, post, max, change, better }: {
    label: string;
    pre: number | undefined;
    post: number | undefined;
    max: number;
    change: number | undefined;
    better: Better;
}) {
    const bar = (kind: 'pre' | 'post', value: number | undefined) => (
        <div className="rs-pair">
            <span className="rs-pair-tag">{kind === 'pre' ? '전' : '후'}</span>
            <span className="rs-track"><span className={`rs-fill ${kind}`} style={{ width: `${((value ?? 0) / max) * 100}%` }} /></span>
            <b>{value ?? '-'}</b>
        </div>
    );
    return (
        <div className="rs-compare" role="group" aria-label={`${label}: 운동 전 ${pre ?? '없음'}, 운동 후 ${post ?? '없음'}`}>
            <span className="rs-compare-label">{label}</span>
            <div className="rs-compare-bars">{bar('pre', pre)}{bar('post', post)}</div>
            <Delta value={change} better={better} />
        </div>
    );
}

function TrendColumns({ points, currentId, firstIndex }: { points: HistoryPoint[]; currentId: string; firstIndex: number }) {
    return (
        <div className="rs-trend-scroll">
            <div className="rs-columns" style={{ '--count': points.length } as CSSProperties}>
                {points.map((point, i) => (
                    <div className={`rs-column${point.sessionId === currentId ? ' is-current' : ''}`} key={point.sessionId}>
                        <span className="rs-column-value">{pct(point.rate)}</span>
                        <span className="rs-column-track">
                            <span className="rs-column-fill" style={{ height: `${point.rate ?? 0}%` }} />
                        </span>
                        <span className="rs-column-label">{firstIndex + i + 1}회<small>{shortDate(point.startedAt)}</small></span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** 불편감·뻣뻣함 변화량 (0 기준선 위아래로) */
function ChangeColumns({ points, currentId, firstIndex }: { points: HistoryPoint[]; currentId: string; firstIndex: number }) {
    // 변화량은 보통 ±2 안팎이라 ±10으로 그리면 거의 안 보임 → 가장 큰 값에 맞춤 (최소 ±3)
    const scale = Math.max(3, ...points.flatMap(p => [Math.abs(p.change.discomfort), Math.abs(p.change.stiffness)]));
    const half = (value: number) => `${(Math.abs(value) / scale) * 50}%`;
    const barStyle = (value: number) => (value >= 0
        ? { bottom: '50%', height: half(value) }
        : { top: '50%', height: half(value) });
    return (
        <div className="rs-trend-scroll">
            <div className="rs-columns rs-diverging" style={{ '--count': points.length } as CSSProperties}>
                {points.map((point, i) => (
                    <div className={`rs-column${point.sessionId === currentId ? ' is-current' : ''}`} key={point.sessionId}>
                        <span className="rs-column-value">
                            <span className="discomfort">{signed(point.change.discomfort)}</span>
                            <span className="stiffness">{signed(point.change.stiffness)}</span>
                        </span>
                        <span className="rs-column-track">
                            <span className="rs-zero" />
                            <span className="rs-split discomfort" style={barStyle(point.change.discomfort)} />
                            <span className="rs-split stiffness" style={barStyle(point.change.stiffness)} />
                        </span>
                        <span className="rs-column-label">{firstIndex + i + 1}회<small>{shortDate(point.startedAt)}</small></span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ResultPage({ record, history, onReplay, onReplayWithReassess, onHome }: ResultPageProps) {
    const summary = summarizeGame(record.game);
    const change = compareAssessments(record.pre, record.post);
    const trend = buildHistory(history);
    const firstIndex = Math.max(0, trend.length - TREND_LIMIT);
    const recent = trend.slice(firstIndex);

    return (
        <GardenLayout
            phase="result"
            width="wide"
            eyebrow="GREAT JOB TODAY"
            title="오늘의 기록"
            subtitle={`${record.userId} · ${record.game.completed ? '끝까지 완주했어요' : '중간에 멈췄어요'}${record.preReused ? ' · 이전 사전 평가 사용' : ''}`}
        >
            {/* 웹캠 판정 결과 */}
            <section className="rs-section" aria-labelledby="rs-game-title">
                <header className="rs-section-head">
                    <h2 id="rs-game-title">게임 결과</h2>
                    <SourceBadge source="webcam" />
                    <p>웹캠이 동작을 보고 판정한 결과예요.</p>
                </header>
                <div className="gp-stats">
                    <div className="gp-stat"><strong>{summary.score.toLocaleString()}</strong><span>점수</span></div>
                    <div className="gp-stat"><strong>{pct(summary.rate)}</strong><span>성공률 {summary.success}/{summary.total}</span></div>
                    <div className="gp-stat"><strong>{summary.maxCombo}</strong><span>최대 콤보</span></div>
                    <div className="gp-stat"><strong>{minSec(summary.playTimeSec)}</strong><span>플레이 시간</span></div>
                </div>
                <section className="gp-card">
                    <h2>방향별 성공률 <small>PERFECT {summary.judgments.PERFECT} · GOOD {summary.judgments.GOOD} · MISS {summary.judgments.MISS}</small></h2>
                    <div className="rs-directions">
                        {STRETCH_DIRECTIONS.map(direction => {
                            const stat = summary.byDirection[direction];
                            return (
                                <div className="rs-direction" key={direction}>
                                    <span className="rs-direction-label">{DIRECTION_LABELS[direction]}</span>
                                    <span className="gp-bar"><span style={{ width: `${stat.rate ?? 0}%` }} /></span>
                                    <span className="rs-direction-value">
                                        {pct(stat.rate)} <small>{stat.success}/{stat.total}</small>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </section>

            {/* 직접 입력한 자가 평가 */}
            <section className="rs-section" aria-labelledby="rs-self-title">
                <header className="rs-section-head">
                    <h2 id="rs-self-title">운동 전후 변화</h2>
                    <SourceBadge source="self" />
                    <p>운동 전후에 직접 고른 점수예요.</p>
                </header>
                <div className="rs-legend" aria-hidden="true">
                    <span><i className="pre" /> 운동 전</span>
                    <span><i className="post" /> 운동 후</span>
                </div>
                <div className="rs-self-grid">
                    <section className="gp-card">
                        <h2>불편감 · 뻣뻣함 <small>0~10점, 낮을수록 좋아요</small></h2>
                        <CompareRow label="불편감" pre={record.pre.discomfort} post={record.post.discomfort} max={10} change={change.discomfort} better="lower" />
                        <CompareRow label="뻣뻣함" pre={record.pre.stiffness} post={record.post.stiffness} max={10} change={change.stiffness} better="lower" />
                    </section>
                    <section className="gp-card">
                        <h2>움직임 범위 <small>1~4점, 높을수록 좋아요</small></h2>
                        {STRETCH_DIRECTIONS.map(direction => (
                            <CompareRow
                                key={direction}
                                label={DIRECTION_LABELS[direction]}
                                pre={record.pre.rom[direction]}
                                post={record.post.rom[direction]}
                                max={4}
                                change={change.rom[direction]}
                                better="higher"
                            />
                        ))}
                    </section>
                </div>
            </section>

            {/* 회차별 추이 */}
            <section className="rs-section" aria-labelledby="rs-trend-title">
                <header className="rs-section-head">
                    <h2 id="rs-trend-title">회차별 추이</h2>
                    <p>총 {trend.length}회 참여{trend.length > TREND_LIMIT ? ` · 최근 ${TREND_LIMIT}회` : ''}</p>
                </header>
                {trend.length < 2 ? (
                    <section className="gp-card rs-empty">
                        <p>첫 기록이에요! 다음에 또 하면 회차별 변화를 그래프로 보여 드릴게요.</p>
                    </section>
                ) : (
                    <>
                        <section className="gp-card">
                            <h2>성공률 <SourceBadge source="webcam" /></h2>
                            <TrendColumns points={recent} currentId={record.id} firstIndex={firstIndex} />
                        </section>
                        <section className="gp-card">
                            <h2>불편감 · 뻣뻣함 변화량 <SourceBadge source="self" /> <small>사후 − 사전, 0 아래로 내려가면 줄어든 것(좋아짐)</small></h2>
                            <div className="rs-legend" aria-hidden="true">
                                <span><i className="discomfort" /> 불편감</span>
                                <span><i className="stiffness" /> 뻣뻣함</span>
                            </div>
                            <ChangeColumns points={recent} currentId={record.id} firstIndex={firstIndex} />
                        </section>
                        <section className="gp-card">
                            <h2>움직임 범위 변화량 <SourceBadge source="self" /> <small>사후 − 사전, +면 넓어짐</small></h2>
                            <div className="rs-trend-scroll">
                                <table className="gp-table rs-rom-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">방향</th>
                                            {recent.map((point, i) => (
                                                <th scope="col" key={point.sessionId} className={point.sessionId === record.id ? 'is-current' : undefined}>
                                                    {firstIndex + i + 1}회
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {STRETCH_DIRECTIONS.map(direction => (
                                            <tr key={direction}>
                                                <th scope="row">{DIRECTION_LABELS[direction]}</th>
                                                {recent.map(point => {
                                                    const value = point.change.rom[direction];
                                                    const tone = value === undefined || value === 0 ? '' : value > 0 ? 'good' : 'bad';
                                                    return (
                                                        <td key={point.sessionId} className={`${tone}${point.sessionId === record.id ? ' is-current' : ''}`}>
                                                            {value === undefined ? '-' : signed(value)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </section>

            <div className="gp-actions">
                <button type="button" className="gp-button primary" onClick={onReplay}>다른 노래 하기 <span aria-hidden="true">↻</span></button>
                <button type="button" className="gp-button" onClick={onReplayWithReassess}>상태 체크부터 다시</button>
                <button type="button" className="gp-button" onClick={onHome}>처음으로</button>
            </div>
        </GardenLayout>
    );
}
