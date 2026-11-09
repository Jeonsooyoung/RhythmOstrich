// 채보 목록 (이 폴더의 JSON을 자동으로 불러옴)
import type { ChartData } from '../chart';

const modules = import.meta.glob<ChartData>('./*.json', { eager: true, import: 'default' });

/** 튜토리얼이 맨 앞, 나머지는 제목 순 */
export const charts: ChartData[] = Object.values(modules).sort((a, b) =>
    a.id === 'tutorial' ? -1 : b.id === 'tutorial' ? 1 : a.title.localeCompare(b.title)
);

export function findChart(id: string | null): ChartData | null {
    return charts.find(chart => chart.id === id) ?? null;
}
