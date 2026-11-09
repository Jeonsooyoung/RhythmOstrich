// 임시 곡 선택 화면
import type { ChartData } from '../../game/chart';
import '../flow.css';

interface SongSelectPageProps {
    charts: ChartData[];
    onSelect: (chartId: string) => void;
    onBack: () => void;
    onRecalibrate: () => void;
}

export default function SongSelectPlaceholder({ charts, onSelect, onBack, onRecalibrate }: SongSelectPageProps) {
    return (
        <main className="flow-page">
            <span className="flow-placeholder-tag">임시 화면</span>
            <h1>곡 선택</h1>
            <p className="flow-lead">함께 스트레칭할 곡을 골라 주세요.</p>
            {charts.map(chart => (
                <section className="flow-card flow-row" key={chart.id}>
                    <span>
                        <strong>{chart.id === 'tutorial' ? '튜토리얼' : chart.title}</strong>
                        <br />
                        <small>{chart.artist} · {chart.bpm} BPM · 노트 {chart.notes.length}개</small>
                    </span>
                    <button type="button" className="flow-option" onClick={() => onSelect(chart.id)}>선택</button>
                </section>
            ))}
            <div className="flow-actions">
                <button type="button" onClick={onBack}>← 캐릭터 다시 고르기</button>
                <button type="button" onClick={onRecalibrate}>정면 기준 다시 잡기</button>
            </div>
        </main>
    );
}
