// 채보(JSON, 박 단위) → 유지 판정용 노트(초 단위) 변환
// 형식과 공식은 docs/rhythm-design.md 4절, 6절 기준
import { createNoteJudge } from '../motion/holdDetector.ts';
import type { MotionType } from '../motion/motionDetector';
import type { NoteData } from '../types/game';

export interface ChartNote {
    motion: MotionType;
    callBeat: number;     // 시연 시작 박
    responseBeat: number; // 판정 구간 시작 박
}

export interface ChartData {
    id: string;
    title: string;
    artist: string;
    audio: string;
    bpm: number;
    offsetSec: number;   // 0번 박의 재생 시간
    beatsPerBar: number;
    judge: {
        windowBeats: number;      // 판정 구간 길이(박)
        holdBeats: number;        // 성공에 필요한 연속 유지(박)
        dropToleranceSec: number; // 흔들림 허용(초) = 유지 판정의 graceTime
    };
    notes: ChartNote[];
}

/** 박 번호 → 음악 재생 시간(초): 첫 박(초) + 박 번호 × 60 / BPM */
export function beatToSec(chart: ChartData, beat: number): number {
    return chart.offsetSec + (beat * 60) / chart.bpm;
}

/** 채보의 노트를 유지 판정용 NoteData로 변환 (id는 1부터) */
export function chartToNotes(chart: ChartData): NoteData[] {
    const { windowBeats, holdBeats } = chart.judge;

    return chart.notes.map((note, index) => ({
        id: index + 1,
        targetMotion: note.motion,
        responseStart: beatToSec(chart, note.responseBeat),
        responseEnd: beatToSec(chart, note.responseBeat + windowBeats),
        holdTime: (holdBeats * 60) / chart.bpm,
    }));
}

/** 채보 하나로 곡 전체 판정기 생성 (흔들림 허용값도 채보에서 가져옴) */
export function createChartJudge(chart: ChartData) {
    return createNoteJudge(chartToNotes(chart), chart.judge.dropToleranceSec);
}
