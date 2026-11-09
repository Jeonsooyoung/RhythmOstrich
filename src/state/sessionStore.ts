// 완료된 세션 기록을 LocalStorage에 저장/조회
// 사용자별로 키를 나눠 저장: rhythmostrich.sessions.{userId}
// 테스트를 위해 storage를 인자로 받을 수 있음 (기본값은 localStorage)
import type { SessionRecord } from '../types/session';

const SESSIONS_PREFIX = 'rhythmostrich.sessions.';
const LAST_USER_KEY = 'rhythmostrich.lastUserId';

/** 사용자 1명당 보관할 최대 세션 수 (오래된 것부터 삭제) */
export const MAX_SESSIONS_PER_USER = 100;

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

function defaultStorage(): KeyValueStorage | null {
    try {
        return globalThis.localStorage ?? null;
    } catch {
        // 시크릿 모드 등에서 접근 자체가 막힌 경우
        return null;
    }
}

const sessionsKey = (userId: string) => SESSIONS_PREFIX + userId;

function isSessionRecord(value: unknown): value is SessionRecord {
    if (!value || typeof value !== 'object') return false;
    const record = value as Partial<SessionRecord>;
    return (
        record.version === 1 &&
        typeof record.id === 'string' &&
        typeof record.userId === 'string' &&
        typeof record.startedAt === 'string' &&
        !!record.game && Array.isArray(record.game.notes) &&
        !!record.pre && !!record.post
    );
}

/** 사용자의 세션 기록 목록 (오래된 순) */
export function loadSessions(
    userId: string,
    storage: KeyValueStorage | null = defaultStorage()
): SessionRecord[] {
    if (!storage) return [];
    try {
        const value: unknown = JSON.parse(storage.getItem(sessionsKey(userId)) ?? '[]');
        if (!Array.isArray(value)) return [];
        return value
            .filter(isSessionRecord)
            .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    } catch {
        return [];
    }
}

/**
 * 세션 기록 저장. 같은 id가 이미 있으면 덮어씀 (중복 저장 방지)
 * 저장에 실패하면 false (용량 초과, 저장소 차단 등)
 */
export function saveSession(
    record: SessionRecord,
    storage: KeyValueStorage | null = defaultStorage()
): boolean {
    if (!storage) return false;
    const sessions = loadSessions(record.userId, storage).filter(s => s.id !== record.id);
    sessions.push(record);
    sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    const kept = sessions.slice(-MAX_SESSIONS_PER_USER);
    try {
        storage.setItem(sessionsKey(record.userId), JSON.stringify(kept));
        return true;
    } catch {
        return false;
    }
}

/** 가장 최근 세션 (없으면 null) */
export function getLastSession(
    userId: string,
    storage: KeyValueStorage | null = defaultStorage()
): SessionRecord | null {
    const sessions = loadSessions(userId, storage);
    return sessions[sessions.length - 1] ?? null;
}

/** 사용자의 기록 전체 삭제 */
export function clearSessions(
    userId: string,
    storage: KeyValueStorage | null = defaultStorage()
): void {
    try {
        storage?.removeItem(sessionsKey(userId));
    } catch { /* 저장소를 쓸 수 없으면 무시 */ }
}

/** 이 브라우저에 기록이 있는 사용자 ID 목록 */
export function listUserIds(storage: KeyValueStorage | null = defaultStorage()): string[] {
    if (!storage) return [];
    const ids: string[] = [];
    try {
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key?.startsWith(SESSIONS_PREFIX)) ids.push(key.slice(SESSIONS_PREFIX.length));
        }
    } catch { /* 무시 */ }
    return ids.sort();
}

/** 마지막으로 입력한 사용자 ID (ID 입력칸 미리 채우기용) */
export function getLastUserId(storage: KeyValueStorage | null = defaultStorage()): string {
    try {
        return storage?.getItem(LAST_USER_KEY) ?? '';
    } catch {
        return '';
    }
}

export function setLastUserId(
    userId: string,
    storage: KeyValueStorage | null = defaultStorage()
): void {
    try {
        storage?.setItem(LAST_USER_KEY, userId);
    } catch { /* 무시 */ }
}
