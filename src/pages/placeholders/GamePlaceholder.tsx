// 임시 게임 화면 (1·2번 파트의 진짜 게임으로 교체 예정)
// 버튼으로 가짜 결과를 만들어 다음 화면으로 넘김
import { useState } from 'react';
import { chartToNotes } from '../../game/chart';
import type { GamePageProps } from '../../types/pages';
import type { GameResult, Judgment, NoteRecord, StretchDirection } from '../../types/session';
import '../flow.css';

const POINTS: Record<Judgment, number> = { PERFECT: 100, GOOD: 50, MISS: 0 };

function makeResult(
    chartId: string,
    notes: { id: number; targetMotion: string }[],
    pick: (index: number) => Judgment,
    playTimeSec: number,
    completed: boolean
): GameResult {
    const records: NoteRecord[] = notes.map((note, index) => ({
        noteId: note.id,
        motion: note.targetMotion as StretchDirection,
        judgment: pick(index),
    }));
    let combo = 0;
    let maxCombo = 0;
    for (const record of records) {
        combo = record.judgment === 'MISS' ? 0 : combo + 1;
        maxCombo = Math.max(maxCombo, combo);
    }
    return {
        chartId,
        notes: records,
        score: records.reduce((sum, r) => sum + POINTS[r.judgment], 0),
        maxCombo,
        playTimeSec,
        completed,
    };
}

export default function GamePlaceholder({ chart, characterId, onFinish, onAbort }: GamePageProps) {
    const [startedAt] = useState(() => Date.now());
    const notes = chartToNotes(chart);
    const elapsed = () => Math.round((Date.now() - startedAt) / 1000);
    const random = (): Judgment => (['PERFECT', 'GOOD', 'MISS'] as const)[Math.floor(Math.random() * 3)];

    return (
        <main className="flow-page">
            <span className="flow-placeholder-tag">임시 화면</span>
            <h1>{chart.title}</h1>
            <p className="flow-lead">캐릭터: {characterId} · 노트 {notes.length}개</p>
            <section className="flow-card">
                <h2>결과 만들기 (테스트용)</h2>
                <div className="flow-actions">
                    <button type="button" className="primary" onClick={() =>
                        onFinish(makeResult(chart.id, notes, () => 'PERFECT', elapsed(), true))}>
                        전부 PERFECT로 끝내기
                    </button>
                    <button type="button" onClick={() =>
                        onFinish(makeResult(chart.id, notes, random, elapsed(), true))}>
                        랜덤 판정으로 끝내기
                    </button>
                    <button type="button" onClick={() =>
                        onFinish(makeResult(chart.id, notes.slice(0, Math.ceil(notes.length / 2)), random, elapsed(), false))}>
                        중간에 종료 (절반만 기록)
                    </button>
                    <button type="button" onClick={onAbort}>기록 없이 그만두기</button>
                </div>
            </section>
        </main>
    );
}
