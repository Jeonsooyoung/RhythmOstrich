// 임시 결과 화면 (3번 파트의 진짜 결과 화면으로 교체 예정)
// 그래프 대신 분석 함수 값을 표로 보여 줌
import { buildHistory, compareAssessments, DIRECTION_LABELS, STRETCH_DIRECTIONS, summarizeGame } from '../../game/sessionAnalysis';
import type { ResultPageProps } from '../../types/pages';
import '../flow.css';

const pct = (rate: number | null) => (rate === null ? '-' : `${Math.round(rate)}%`);
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export default function ResultPlaceholder({ record, history, onReplay, onReplayWithReassess, onHome }: ResultPageProps) {
    const summary = summarizeGame(record.game);
    const change = compareAssessments(record.pre, record.post);
    const trend = buildHistory(history);

    return (
        <main className="flow-page">
            <span className="flow-placeholder-tag">임시 화면</span>
            <h1>결과</h1>
            <p className="flow-lead">
                {record.userId} · {record.game.completed ? '완주' : '중간 종료'}
                {record.preReused && ' · 이전 사전 평가 사용'}
            </p>

            <section className="flow-card">
                <h2>플레이 요약</h2>
                <div className="flow-row"><span>점수</span><strong>{summary.score}</strong></div>
                <div className="flow-row"><span>성공률</span><strong>{pct(summary.rate)} ({summary.success}/{summary.total})</strong></div>
                <div className="flow-row"><span>판정</span><span>PERFECT {summary.judgments.PERFECT} · GOOD {summary.judgments.GOOD} · MISS {summary.judgments.MISS}</span></div>
                <div className="flow-row"><span>최대 콤보</span><span>{summary.maxCombo}</span></div>
                <div className="flow-row"><span>플레이 시간</span><span>{summary.playTimeSec}초</span></div>
            </section>

            <section className="flow-card">
                <h2>방향별 성공률</h2>
                <table className="flow-table">
                    <tbody>
                        {STRETCH_DIRECTIONS.map(direction => {
                            const stat = summary.byDirection[direction];
                            return (
                                <tr key={direction}>
                                    <th>{DIRECTION_LABELS[direction]}</th>
                                    <td>{pct(stat.rate)} ({stat.success}/{stat.total})</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>

            <section className="flow-card">
                <h2>운동 전후 변화</h2>
                <div className="flow-row"><span>불편감</span><span>{record.pre.discomfort} → {record.post.discomfort} ({signed(change.discomfort)})</span></div>
                <div className="flow-row"><span>뻣뻣함</span><span>{record.pre.stiffness} → {record.post.stiffness} ({signed(change.stiffness)})</span></div>
            </section>

            <section className="flow-card">
                <h2>기록 추이 (총 {trend.length}회)</h2>
                <table className="flow-table">
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

            <div className="flow-actions">
                <button type="button" className="primary" onClick={onReplay}>다시 하기</button>
                <button type="button" onClick={onReplayWithReassess}>상태 체크부터 다시</button>
                <button type="button" onClick={onHome}>처음으로</button>
            </div>
        </main>
    );
}
