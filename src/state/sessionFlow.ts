// 전체 게임 진행 순서 (phase)와 진행 중인 세션 데이터(draft)
// React와 무관한 순수 함수로 두어 테스트할 수 있게 함
//
// 진행 순서
//   userId → preAssessment → character → song → calibration → game → postAssessment → result
//
// phase는 따로 저장하지 않고 draft에 "아직 비어 있는 첫 값"으로 정해짐
// 그래서 값을 채우면 다음 화면으로, 값을 비우면 그 화면으로 돌아감
import type { CharacterId } from '../types/character';
import type {
    CalibrationSnapshot,
    GameResult,
    SelfAssessment,
    SessionRecord,
} from '../types/session';

export type Phase =
    | 'userId'
    | 'preAssessment'
    | 'character'
    | 'calibration'
    | 'song'
    | 'game'
    | 'postAssessment'
    | 'result';

export const PHASE_ORDER: readonly Phase[] = [
    'userId',
    'preAssessment',
    'character',
    'song',
    'calibration',
    'game',
    'postAssessment',
    'result',
];

export interface SessionDraft {
    version: 1;
    sessionId: string;
    userId: string | null;
    pre: SelfAssessment | null;
    /** 재플레이에서 이전 사전 평가를 그대로 쓰는 중인지 */
    preReused: boolean;
    /** 재평가할 때 미리 채워 줄 이전 사전 평가 */
    previousPre: SelfAssessment | null;
    calibration: CalibrationSnapshot | null;
    characterId: CharacterId | null;
    chartId: string | null;
    startedAt: string | null;
    game: GameResult | null;
    /** 사후 평가까지 끝나 저장된 세션 기록 */
    record: SessionRecord | null;
}

export type SessionAction =
    | { type: 'SET_USER'; userId: string }
    | { type: 'SUBMIT_PRE'; assessment: SelfAssessment }
    | { type: 'CALIBRATED'; calibration: CalibrationSnapshot }
    | { type: 'SELECT_CHARACTER'; characterId: CharacterId }
    | { type: 'SELECT_SONG'; chartId: string; now: string }
    | { type: 'FINISH_GAME'; result: GameResult }
    | { type: 'ABORT_GAME' }
    | { type: 'SUBMIT_POST'; assessment: SelfAssessment; now: string }
    | { type: 'BACK' }
    | { type: 'RECALIBRATE' }
    /** 재플레이. reassess가 true면 사전 평가부터, false면 이전 사전 평가를 그대로 쓰고 곡 선택부터 */
    | { type: 'REPLAY'; reassess: boolean; sessionId: string }
    /** 처음으로 (사용자 ID부터) */
    | { type: 'RESET'; sessionId: string }
    | { type: 'RESTORE'; draft: SessionDraft };

export function createSessionId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDraft(sessionId: string): SessionDraft {
    return {
        version: 1,
        sessionId,
        userId: null,
        pre: null,
        preReused: false,
        previousPre: null,
        calibration: null,
        characterId: null,
        chartId: null,
        startedAt: null,
        game: null,
        record: null,
    };
}

/** 현재 화면 = draft에서 아직 비어 있는 첫 단계 */
export function getPhase(draft: SessionDraft): Phase {
    if (!draft.userId) return 'userId';
    if (!draft.pre) return 'preAssessment';
    if (!draft.characterId) return 'character';
    if (!draft.chartId) return 'song';
    if (!draft.calibration) return 'calibration';
    if (!draft.game) return 'game';
    if (!draft.record) return 'postAssessment';
    return 'result';
}

/** 한 판의 플레이 결과만 비움 (재플레이, 곡 다시 고르기) */
const clearPlay = (draft: SessionDraft): SessionDraft => ({
    ...draft,
    chartId: null,
    startedAt: null,
    game: null,
    record: null,
});

export function sessionReducer(draft: SessionDraft, action: SessionAction): SessionDraft {
    switch (action.type) {
        case 'SET_USER':
            return { ...draft, userId: action.userId.trim() || null };

        case 'SUBMIT_PRE':
            return { ...draft, pre: action.assessment, preReused: false };

        case 'CALIBRATED':
            return { ...draft, calibration: action.calibration };

        case 'SELECT_CHARACTER':
            return { ...draft, characterId: action.characterId };

        case 'SELECT_SONG':
            return { ...clearPlay(draft), calibration: null, chartId: action.chartId, startedAt: action.now };

        case 'FINISH_GAME':
            if (getPhase(draft) !== 'game') return draft;
            return { ...draft, game: action.result };

        case 'ABORT_GAME':
            return clearPlay(draft);

        case 'SUBMIT_POST': {
            const record = buildSessionRecord(draft, action.assessment, action.now);
            return record ? { ...draft, record } : draft;
        }

        case 'BACK':
            return goBack(draft);

        case 'RECALIBRATE':
            return { ...clearPlay(draft), calibration: null };

        case 'REPLAY': {
            if (!draft.pre) return draft;
            const next = { ...clearPlay(draft), sessionId: action.sessionId, previousPre: draft.pre };
            return action.reassess
                ? { ...next, pre: null, preReused: false }
                : { ...next, preReused: true };
        }

        case 'RESET':
            return createDraft(action.sessionId);

        case 'RESTORE':
            return action.draft;
    }
}

/** 이전 화면으로: 이전 단계에서 입력한 값을 비움 */
function goBack(draft: SessionDraft): SessionDraft {
    switch (getPhase(draft)) {
        case 'preAssessment':
            return { ...draft, userId: null };
        case 'character':
            // 사전 평가를 다시 고칠 수 있도록 값은 미리 채워 둠
            return { ...draft, pre: null, previousPre: draft.pre ?? draft.previousPre, preReused: false };
        case 'calibration':
            return { ...clearPlay(draft), calibration: null };
        case 'song':
            return { ...draft, characterId: null, calibration: null };
        case 'game':
            return clearPlay(draft);
        default:
            // 게임이 끝난 뒤(사후 평가, 결과)에는 뒤로 갈 수 없음
            return draft;
    }
}

/** draft + 사후 평가 → 저장할 세션 기록. 필요한 값이 비어 있으면 null */
export function buildSessionRecord(
    draft: SessionDraft,
    post: SelfAssessment,
    now: string
): SessionRecord | null {
    const { userId, pre, characterId, chartId, game, startedAt } = draft;
    if (!userId || !pre || !characterId || !chartId || !game || !startedAt) return null;
    return {
        version: 1,
        id: draft.sessionId,
        userId,
        chartId,
        characterId,
        startedAt,
        endedAt: now,
        game,
        pre,
        post,
        preReused: draft.preReused,
    };
}

/**
 * 새로고침 후 복구할 draft
 * - 입력값만 있으면 되는 화면은 그대로 복구
 * - 보정, 게임 중이었다면 웹캠이 다시 켜지므로 보정부터 다시 (게임 도중 기록은 버림)
 */
export function restoreDraft(raw: unknown): SessionDraft | null {
    if (!raw || typeof raw !== 'object') return null;
    const draft = raw as Partial<SessionDraft>;
    if (draft.version !== 1 || typeof draft.sessionId !== 'string') return null;
    const full: SessionDraft = { ...createDraft(draft.sessionId), ...draft } as SessionDraft;

    if (getPhase(full) === 'game') {
        return { ...full, game: null, record: null, calibration: null };
    }
    return full;
}

/** 첫 화면이 아닌 곳에서 이어서 하는지 (복구 안내 표시용) */
export const isInProgress = (draft: SessionDraft) => getPhase(draft) !== 'userId';
