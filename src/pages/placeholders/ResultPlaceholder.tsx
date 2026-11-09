// 임시 결과 화면 (3번 파트의 진짜 결과 화면으로 교체 예정)
// 그래프 대신 분석 함수 값을 숫자와 막대로 보여 줌
import GardenLayout from '../../components/GardenLayout';
import { buildHistory, compareAssessments, DIRECTION_LABELS, STRETCH_DIRECTIONS, summarizeGame } from '../../game/sessionAnalysis';
import type { ResultPageProps } from '../../types/pages';

const pct = (rate: number | null) => (rate === null ? '-' : `${Math.round(rate)}%`);
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const minSec = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export default function ResultPlaceholder({ record, history, onReplay, onReplayWithReassess, onHome }: ResultPageProps) {
    const summary = summarizeGame(record.game);
    const change = compareAssessments(record.pre, record.post);
    const trend = buildHistory(history);

    return (
        <GardenLayout
            phase="result"
            width="wide"
            eyebrow="GREAT JOB TODAY"
            title="오늘의 기록"
            subtitle={`${record.userId} · ${record.game.completed ? '끝까지 완주했어요' : '중간에 멈췄어요'}${record.preReused ? ' · 이전 사전 평가 사용' : ''}`}
        >
            <span className="gp-placeholder-tag">임시 화면</span>
            <div className="gp-stats">
                <div className="gp-stat"><strong>{summary.score}</strong><span>점수</span></div>
                <div className="gp-stat"><strong>{pct(summary.rate)}</strong><span>성공률 {summary.success}/{summary.total}</span></div>
                <div className="gp-stat"><strong>{summary.maxCombo}</strong><span>최대 콤보</span></div>
                <div className="gp-stat"><strong>{minSec(summary.playTimeSec)}</strong><span>플레이 시간</span></div>
            </div>

            <section className="gp-card">
                <h2>방향별 성공률 <small>PERFECT {summary.judgments.PERFECT} · GOOD {summary.judgments.GOOD} · MISS {summary.judgments.MISS}</small></h2>
                {STRETCH_DIRECTIONS.map(direction => {
                    const stat = summary.byDirection[direction];
                    return (
                        <div className="gp-row" key={direction}>
                            <span>{DIRECTION_LABELS[direction]}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 1 50%' }}>
                                <span className="gp-bar" style={{ flex: 1 }}><span style={{ width: `${stat.rate ?? 0}%` }} /></span>
                                <small>{pct(stat.rate)}</small>
                            </span>
                        </div>
                    );
                })}
            </section>

            <section className="gp-card">
                <h2>운동 전후 변화 <small>0~10점, 낮을수록 좋아요</small></h2>
                <div className="gp-row"><span>불편감</span><span>{record.pre.discomfort} → {record.post.discomfort} ({signed(change.discomfort)})</span></div>
                <div className="gp-row"><span>뻣뻣함</span><span>{record.pre.stiffness} → {record.post.stiffness} ({signed(change.stiffness)})</span></div>
            </section>

            <section className="gp-card">
                <h2>기록 추이 <small>총 {trend.length}회 참여</small></h2>
                <table className="gp-table">
                    <thead><tr><th>날짜</th><th>곡</th><th>성공률</th><th>불편감 변화</th></tr></thead>
                    <tbody>
                        {trend.slice(-10).map(point => (
                            <tr key={point.sessionId}>
                                <td>{new Date(point.startedAt).toLocaleString()}</td>
                                <td>{point.chartId}</td>
                                <td>{pct(point.rate)}</td>
                                <td>{signed(point.change.discomfort)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <div className="gp-actions">
                <button type="button" className="gp-button primary" onClick={onReplay}>다시 하기 <span aria-hidden="true">↻</span></button>
                <button type="button" className="gp-button" onClick={onReplayWithReassess}>상태 체크부터 다시</button>
                <button type="button" className="gp-button" onClick={onHome}>처음으로</button>
            </div>
        </GardenLayout>
    );
}
