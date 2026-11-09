// 캐릭터 선택 화면과 같은 "정원" 느낌의 공통 화면 틀
// 상단 바(로고, 단계 표시) + 제목 + 내용 + 하단 잔디
import type { ReactNode } from 'react';
import { STEP_LABELS, stepNumber } from '../data/flowSteps';
import type { Phase } from '../state/sessionFlow';
import '../styles/garden.css';

interface GardenLayoutProps {
    phase: Phase;
    title: ReactNode;
    subtitle?: ReactNode;
    /** 제목 위 작은 영문 문구 */
    eyebrow?: string;
    /** 내용 폭: narrow(입력 화면), wide(보정, 결과) */
    width?: 'narrow' | 'wide';
    children: ReactNode;
}

export default function GardenLayout({ phase, title, subtitle, eyebrow, width = 'narrow', children }: GardenLayoutProps) {
    return (
        <main className="garden-page">
            <nav className="gp-nav" aria-label="진행 단계">
                <a className="gp-brand" href="#character-select" aria-label="캐릭터 선택 화면으로 이동"><img src="/logo.png" alt="" /> 리듬타조<span className="gp-brand-dot">.</span></a>
                <span className="gp-nav-label">작은 움직임, 즐거운 리듬</span>
                <span className="gp-step">{stepNumber(phase)} <span>/</span> {STEP_LABELS[phase]}</span>
            </nav>
            <div className={`gp-content gp-${width}`}>
                <header className="gp-heading">
                    {eyebrow && <span className="gp-eyebrow">{eyebrow}</span>}
                    <h1>{title}<span aria-hidden="true">✿</span></h1>
                    {subtitle && <p>{subtitle}</p>}
                </header>
                {children}
            </div>
            <div className="gp-floor" aria-hidden="true">
                <span className="gp-sprout">♧</span>
                <span className="gp-flower gp-flower-one">✿</span>
                <span className="gp-flower gp-flower-two">✿</span>
                <span className="gp-flower gp-flower-three">✿</span>
                <span className="gp-caption">매일 조금씩, 즐겁게 움직여요</span>
            </div>
        </main>
    );
}
