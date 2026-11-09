import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MAX_SESSIONS_PER_USER,
    clearSessions,
    getLastSession,
    listUserIds,
    loadSessions,
    saveSession,
} from '../src/state/sessionStore.ts';

function memoryStorage() {
    const map = new Map();
    return {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => map.set(k, String(v)),
        removeItem: (k) => map.delete(k),
        key: (i) => [...map.keys()][i] ?? null,
        get length() { return map.size; },
        map,
    };
}

const assessment = { discomfort: 3, stiffness: 2, rom: {}, recordedAt: '2026-11-09T00:00:00.000Z' };
const record = (id, startedAt, userId = 'user1') => ({
    version: 1,
    id,
    userId,
    chartId: 'tutorial',
    characterId: 'ostrich',
    startedAt,
    endedAt: startedAt,
    game: { chartId: 'tutorial', notes: [], score: 0, maxCombo: 0, playTimeSec: 60, completed: true },
    pre: assessment,
    post: assessment,
    preReused: false,
});

test('저장한 세션을 사용자별로 오래된 순서로 불러옴', () => {
    const storage = memoryStorage();
    saveSession(record('b', '2026-11-09T02:00:00Z'), storage);
    saveSession(record('a', '2026-11-09T01:00:00Z'), storage);
    saveSession(record('c', '2026-11-09T03:00:00Z', 'user2'), storage);

    assert.deepEqual(loadSessions('user1', storage).map((s) => s.id), ['a', 'b']);
    assert.equal(getLastSession('user1', storage).id, 'b');
    assert.deepEqual(listUserIds(storage), ['user1', 'user2']);
});

test('같은 id를 다시 저장하면 덮어씀 (새로고침 후 중복 저장 방지)', () => {
    const storage = memoryStorage();
    saveSession(record('a', '2026-11-09T01:00:00Z'), storage);
    saveSession(record('a', '2026-11-09T01:00:00Z'), storage);
    assert.equal(loadSessions('user1', storage).length, 1);
});

test('최대 개수를 넘으면 오래된 기록부터 삭제', () => {
    const storage = memoryStorage();
    for (let i = 0; i < MAX_SESSIONS_PER_USER + 5; i++) {
        saveSession(record(`s${i}`, new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString()), storage);
    }
    const sessions = loadSessions('user1', storage);
    assert.equal(sessions.length, MAX_SESSIONS_PER_USER);
    assert.equal(sessions[0].id, 's5');
});

test('깨진 데이터나 저장소가 없어도 오류 없이 빈 목록', () => {
    const storage = memoryStorage();
    storage.setItem('rhythmostrich.sessions.user1', '{not json');
    assert.deepEqual(loadSessions('user1', storage), []);
    storage.setItem('rhythmostrich.sessions.user1', JSON.stringify([{ id: 'x' }]));
    assert.deepEqual(loadSessions('user1', storage), []);
    assert.deepEqual(loadSessions('user1', null), []);
    assert.equal(saveSession(record('a', '2026-11-09T01:00:00Z'), null), false);
});

test('저장 공간이 꽉 차면 false를 돌려줌', () => {
    const storage = memoryStorage();
    storage.setItem = () => { throw new Error('QuotaExceededError'); };
    assert.equal(saveSession(record('a', '2026-11-09T01:00:00Z'), storage), false);
});

test('기록 삭제', () => {
    const storage = memoryStorage();
    saveSession(record('a', '2026-11-09T01:00:00Z'), storage);
    clearSessions('user1', storage);
    assert.deepEqual(loadSessions('user1', storage), []);
});
