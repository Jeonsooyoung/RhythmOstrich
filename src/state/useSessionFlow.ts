// 진행 중인 세션 상태 + 저장 + 새로고침 복구를 묶은 훅 (App에서 한 번만 사용)
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { CharacterId } from '../types/character';
import type { CalibrationSnapshot, GameResult, SelfAssessment, SessionRecord } from '../types/session';
import {
    buildSessionRecord,
    createDraft,
    createSessionId,
    getPhase,
    isInProgress,
    restoreDraft,
    sessionReducer,
    type SessionDraft,
} from './sessionFlow';
import { loadSessions, saveSession, setLastUserId } from './sessionStore';

/** 진행 중인 세션은 탭을 닫으면 사라지도록 sessionStorage에 보관 */
const DRAFT_KEY = 'rhythmostrich.draft';

const now = () => new Date().toISOString();

function readDraft(): SessionDraft | null {
    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        return raw ? restoreDraft(JSON.parse(raw)) : null;
    } catch {
        return null;
    }
}

function writeDraft(draft: SessionDraft) {
    try {
        if (isInProgress(draft)) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        else sessionStorage.removeItem(DRAFT_KEY);
    } catch { /* 저장소를 쓸 수 없으면 새로고침 복구만 안 됨 */ }
}

export function useSessionFlow() {
    const [initial] = useState(() => {
        const restored = readDraft();
        return restored
            ? { draft: restored, restored: isInProgress(restored) }
            : { draft: createDraft(createSessionId()), restored: false };
    });
    const [draft, dispatch] = useReducer(sessionReducer, initial.draft);
    const [restoredNotice, setRestoredNotice] = useState(initial.restored);
    const [saveFailed, setSaveFailed] = useState(false);

    useEffect(() => { writeDraft(draft); }, [draft]);

    /** 결과 화면용: 이전 기록 + 이번 기록 (저장에 실패해도 이번 기록은 보이도록 합침) */
    const history = useMemo<SessionRecord[]>(() => {
        const record = draft.record;
        if (!record) return [];
        return [...loadSessions(record.userId).filter(s => s.id !== record.id), record]
            .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    }, [draft.record]);

    const actions = useMemo(() => ({
        setUser(userId: string) {
            setLastUserId(userId.trim());
            dispatch({ type: 'SET_USER', userId });
        },
        submitPre: (assessment: SelfAssessment) => dispatch({ type: 'SUBMIT_PRE', assessment }),
        calibrated: (calibration: CalibrationSnapshot) => dispatch({ type: 'CALIBRATED', calibration }),
        selectCharacter: (characterId: CharacterId) => dispatch({ type: 'SELECT_CHARACTER', characterId }),
        selectSong: (chartId: string) => dispatch({ type: 'SELECT_SONG', chartId, now: now() }),
        finishGame: (result: GameResult) => dispatch({ type: 'FINISH_GAME', result }),
        abortGame: () => dispatch({ type: 'ABORT_GAME' }),
        back: () => dispatch({ type: 'BACK' }),
        recalibrate: () => dispatch({ type: 'RECALIBRATE' }),
        replay: () => dispatch({ type: 'REPLAY', reassess: false, sessionId: createSessionId() }),
        replayWithReassess: () => dispatch({ type: 'REPLAY', reassess: true, sessionId: createSessionId() }),
        reset() {
            setSaveFailed(false);
            dispatch({ type: 'RESET', sessionId: createSessionId() });
        },
    }), []);

    /** 사후 평가 제출: 세션 기록을 만들어 LocalStorage에 저장한 뒤 결과 화면으로 */
    const submitPost = useCallback((assessment: SelfAssessment) => {
        const at = now();
        const record = buildSessionRecord(draft, assessment, at);
        if (record) setSaveFailed(!saveSession(record));
        dispatch({ type: 'SUBMIT_POST', assessment, now: at });
    }, [draft]);

    return {
        draft,
        phase: getPhase(draft),
        history,
        saveFailed,
        restoredNotice,
        dismissRestoredNotice: () => setRestoredNotice(false),
        actions: { ...actions, submitPost },
    };
}
