// 값이 어디서 왔는지 표시하는 작은 꼬리표
// webcam: 웹캠으로 판정한 게임 결과 / self: 사용자가 직접 입력한 자가 평가
import './SourceBadge.css';

const LABELS = {
    webcam: { icon: '🎥', text: '웹캠 판정' },
    self: { icon: '✋', text: '직접 입력' },
} as const;

export default function SourceBadge({ source }: { source: keyof typeof LABELS }) {
    const { icon, text } = LABELS[source];
    return (
        <span className={`gp-source gp-source-${source}`}>
            <span aria-hidden="true">{icon}</span> {text}
        </span>
    );
}
