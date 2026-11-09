// 각 페이지가 받는 props 약속
// 페이지는 props로 데이터를 받고 콜백으로 결과만 돌려줌
// 저장, 화면 전환, 초기화는 App(SessionProvider)이 담당하므로 페이지에서 신경 쓰지 않아도 됨
import type { ChartData } from '../game/chart';
import type { CharacterId } from './character';
import type {
    CalibrationSnapshot,
    GameResult,
    SelfAssessment,
    SessionRecord,
} from './session';

/** 사전/사후 자가 평가 화면 (3번 파트, 하나의 화면을 mode로 나눠 사용) */
export interface AssessmentPageProps {
    mode: 'pre' | 'post';
    /** 미리 채워 둘 값 (사전 평가를 다시 할 때 이전 값). 사후 평가에는 넘기지 않음 */
    initial?: SelfAssessment;
    onComplete: (assessment: SelfAssessment) => void;
    onBack?: () => void;
}

/**
 * 게임 화면 (1, 2번 파트)
 * 재플레이 때는 key가 바뀌어 컴포넌트가 새로 만들어지므로
 * 오디오, 노트, 판정기는 컴포넌트 안에서 만들고 언마운트 때 정리하면 됨
 */
export interface GamePageProps {
    chart: ChartData;
    characterId: CharacterId;
    calibration: CalibrationSnapshot;
    /** 곡이 끝났거나 사용자가 종료를 눌렀을 때 (중간 종료는 completed: false) */
    onFinish: (result: GameResult) => void;
    /** 기록 없이 곡 선택으로 돌아갈 때 */
    onAbort: () => void;
}

/** 결과 화면 (3번 파트) */
export interface ResultPageProps {
    record: SessionRecord;
    /** 이 사용자의 이전 기록 (오래된 순, record 포함) */
    history: SessionRecord[];
    /** 사전 평가를 그대로 쓰고 곡 선택부터 다시 */
    onReplay: () => void;
    /** 사전 평가부터 다시 (이전 값이 미리 채워짐) */
    onReplayWithReassess: () => void;
    /** 사용자 ID 입력부터 처음으로 */
    onHome: () => void;
}
