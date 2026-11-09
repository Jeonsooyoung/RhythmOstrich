// 진행 단계별 상단 단계 표시 (번호 / 이름)
import { PHASE_ORDER, type Phase } from '../state/sessionFlow';

export const STEP_LABELS: Record<Phase, string> = {
    userId: '시작하기',
    preAssessment: '몸 상태 체크',
    character: '친구 만나기',
    calibration: '정면 맞추기',
    song: '노래 고르기',
    game: '리듬 스트레칭',
    postAssessment: '운동 후 체크',
    result: '오늘의 기록',
};

/** 단계 번호 ('01' ~ '08') */
export function stepNumber(phase: Phase): string {
    return String(PHASE_ORDER.indexOf(phase) + 1).padStart(2, '0');
}
