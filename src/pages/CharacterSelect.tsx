import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { characters } from '../data/characters';
import { selectCharacter, useSelectedCharacter } from '../state/characterSelection';
import { canToggleCharacterLock, isCharacterUnlocked, lockCharacter, unlockCharacter, useCharacterUnlocks } from '../state/characterUnlock';
import type { CharacterId } from '../types/character';
import './CharacterSelect.css';

const DURATION = 460;

interface CharacterSelectProps {
  /** 선택 완료 시 다음 화면으로 (진행 화면에서 사용) */
  onConfirm?: (id: CharacterId) => void;
  onBack?: () => void;
}

export default function CharacterSelect({ onConfirm, onBack }: CharacterSelectProps = {}) {
  const saved = useSelectedCharacter();
  useCharacterUnlocks();
  const [index, setIndex] = useState(() => Math.max(0, characters.findIndex(c => c.id === saved)));
  const [direction, setDirection] = useState(1);
  const [moving, setMoving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const character = characters[index];
  const isRestricted = !isCharacterUnlocked(character.id);
  const unlockClicks = useRef({ count: 0, lastClick: 0 });
  const [justUnlocked, setJustUnlocked] = useState(false);
  useEffect(() => () => clearTimeout(timer.current), []);

  function move(step: number) {
    if (locked.current || characters.length < 2 || step % characters.length === 0) return;
    locked.current = true;
    setDirection(step);
    setMoving(true);
    setConfirmed(false);
    setJustUnlocked(false);
    unlockClicks.current = { count: 0, lastClick: 0 };
    setIndex(current => (current + step + characters.length) % characters.length);
    timer.current = setTimeout(() => { locked.current = false; setMoving(false); }, DURATION);
  }

  function clickProfile() {
    if (locked.current || !canToggleCharacterLock(character.id)) return;
    const now = Date.now();
    const previous = unlockClicks.current;
    const count = now - previous.lastClick <= 1500 ? previous.count + 1 : 1;
    unlockClicks.current = { count, lastClick: now };
    if (count >= 7) {
      if (isRestricted) {
        unlockCharacter(character.id);
        setJustUnlocked(true);
      } else {
        if (saved === character.id) selectCharacter('ostrich');
        lockCharacter(character.id);
        setJustUnlocked(false);
      }
      setConfirmed(false);
      unlockClicks.current = { count: 0, lastClick: 0 };
    }
  }

  return (
    <main className="character-page" onKeyDown={event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}>
      <nav className="garden-nav" aria-label="화면 메뉴">
        <a className="garden-brand" href="#character-select"><span aria-hidden="true">♬</span> 리듬타조<span className="brand-dot">.</span></a>
        <span className="garden-label">작은 움직임, 즐거운 리듬</span>
        <span className="step-tag">01 <span>/</span> 친구 만나기</span>
      </nav>
      <div className="garden-content">
        <header className="selection-heading">
          <span className="eyebrow">FIND YOUR RHYTHM, FIND YOUR FRIEND</span>
          <h1>캐릭터 선택<span aria-hidden="true">✿</span></h1>
          <p>함께 운동할 새 친구를 골라보세요!</p>
        </header>
        <section className="bird-carousel" aria-label="캐릭터 선택" aria-roledescription="캐러셀" tabIndex={0}>
          <span className="floating-note note-left" aria-hidden="true">♫</span>
          <span className="floating-note note-right" aria-hidden="true">♪</span>
          <span className="little-leaf" aria-hidden="true">❧</span>
          {([-1, 1] as const).map(side => {
            const neighbor = characters[(index + side + characters.length) % characters.length];
            return <button key={side} className={`neighbor neighbor-${side === -1 ? 'left' : 'right'}`} onClick={() => move(side)} disabled={moving} aria-label={`${side === -1 ? '이전' : '다음'} 캐릭터: ${neighbor.name}`}>
              <span className={`neighbor-disc ${!isCharacterUnlocked(neighbor.id) ? 'is-restricted' : ''}`}><img src={neighbor.image} alt="" />{!isCharacterUnlocked(neighbor.id) && <span className="neighbor-lock" aria-hidden="true">🔒</span>}</span>
              <span>{neighbor.name}</span>
            </button>;
          })}
          <button className="carousel-arrow arrow-left" onClick={() => move(-1)} disabled={moving} aria-label="이전 캐릭터">‹</button>
          <div className={`profile-frame ${isRestricted ? 'is-restricted' : ''}`} style={{ '--bird-color': character.color } as CSSProperties}>
            <span className="friend-badge"><span aria-hidden="true">✦</span> YOUR NEW FRIEND</span>
            <div className="bird-stage">
              <img key={index} className={`hero-bird ${moving ? 'is-moving' : ''}`} style={{ '--direction': direction } as CSSProperties} src={character.image} alt={character.name} draggable="false" />
            </div>
            {canToggleCharacterLock(character.id) && <button type="button" className="profile-unlock" onClick={clickProfile} disabled={moving} aria-label={`${character.name} 프로필, 7번 연속 누르면 ${isRestricted ? '잠금 해제' : '다시 잠금'}`} aria-describedby="character-availability">{isRestricted && <span className="profile-lock" aria-hidden="true">🔒</span>}</button>}
            <span className="bird-shadow" aria-hidden="true" />
            <span className="frame-flower" aria-hidden="true">✿</span>
            <span className="frame-sparkle" aria-hidden="true">✧</span>
          </div>
          <button className="carousel-arrow arrow-right" onClick={() => move(1)} disabled={moving} aria-label="다음 캐릭터">›</button>
        </section>
        <section className="character-details" aria-label="선택한 친구">
          <div aria-live="polite" aria-atomic="true">
            <p className="character-subtitle">{character.subtitle}</p>
            <h2>{character.name}</h2>
            <p className="character-description">{character.description}</p>
          </div>
          <div className="page-indicators" aria-label="캐릭터 위치">
            {characters.map((item, position) => <button key={item.id} aria-label={`${item.name} 선택`} aria-current={position === index ? 'true' : undefined} disabled={moving} onClick={() => move((position - index + characters.length) % characters.length)} className={position === index ? 'active' : ''} />)}
          </div>
          <button className="confirm-character" disabled={moving || isRestricted} onClick={() => { if (isRestricted) return; selectCharacter(character.id); setConfirmed(true); onConfirm?.(character.id); }}>{confirmed ? '선택 완료!' : '선택 완료'} <span aria-hidden="true">{isRestricted ? '🔒' : confirmed ? '✓' : '→'}</span></button>
          <p id="character-availability" className="selection-status" role="status">{isRestricted ? '아직 선택할 수 없습니다.' : confirmed ? `${character.name}와 함께할 준비가 되었어요!` : justUnlocked ? `${character.name}의 잠금이 해제되었어요!` : '마음에 드는 친구와 리듬을 시작해요.'}</p>
          {onBack
            ? <button type="button" className="selection-back" onClick={onBack}>← 뒤로가기</button>
            : <a className="selection-back" href="#camera">← 뒤로가기</a>}
        </section>
      </div>
      <div className="garden-floor" aria-hidden="true"><span className="garden-sprout">♧</span><span className="floor-flower flower-one">✿</span><span className="floor-flower flower-two">✿</span><span className="floor-flower flower-three">✿</span><span className="seed-trail">· · ·</span><span className="garden-caption">매일 조금씩, 즐겁게 움직여요</span><span className="grass-tuft">⌁⌁</span></div>
    </main>
  );
}
