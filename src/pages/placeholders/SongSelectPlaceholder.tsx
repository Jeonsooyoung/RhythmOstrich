// 임시 곡 선택 화면
import GardenLayout from '../../components/GardenLayout';
import type { ChartData } from '../../game/chart';

interface SongSelectPageProps {
    charts: ChartData[];
    onSelect: (chartId: string) => void;
    /** 이전 화면(정면 기준 잡기)으로 */
    onBack: () => void;
}

export default function SongSelectPlaceholder({ charts, onSelect, onBack }: SongSelectPageProps) {
    return (
        <GardenLayout
            phase="song"
            eyebrow="PICK A SONG"
            title="노래 고르기"
            subtitle="함께 스트레칭할 노래를 골라 주세요."
        >
            <span className="gp-placeholder-tag">임시 화면</span>
            {charts.map(chart => {
                const isTutorial = chart.id === 'tutorial';
                const minutes = Math.round(((chart.notes.at(-1)?.responseBeat ?? 0) + 12) * 60 / chart.bpm / 6) / 10;
                return (
                    <section className="gp-card gp-song" key={chart.id}>
                        <span className="gp-song-icon" aria-hidden="true">{isTutorial ? '✿' : '♪'}</span>
                        <span className="gp-song-info">
                            <strong>
                                {isTutorial ? '튜토리얼' : chart.title}
                                {isTutorial && <span className="gp-badge">처음이라면 추천</span>}
                            </strong>
                            <small>{chart.artist} · {chart.bpm} BPM · 동작 {chart.notes.length}개 · 약 {minutes}분</small>
                        </span>
                        <button type="button" className="gp-button" onClick={() => onSelect(chart.id)}>
                            시작 <span aria-hidden="true">→</span>
                        </button>
                    </section>
                );
            })}
            <button type="button" className="gp-link" onClick={onBack}>← 정면 기준 다시 잡기</button>
        </GardenLayout>
    );
}
