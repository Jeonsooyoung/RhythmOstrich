import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { characters } from '../data/characters';
import { useSelectedCharacter } from '../state/characterSelection';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import { extractHeadAngles } from '../mediapipe/motionExtractor';
import type { CalibrationSnapshot } from '../types/session';
import type { CharacterId } from '../types/character';
import { calibrateAngles } from '../motion/calibrate';
import { detectMotion } from '../motion/motionDetector';
import { characterPoses, getCharacterPoseImage } from '../data/characterPoses';
import './GamePlay.css';

const phases = [
  { id: 'CALL', title: '먼저 리듬을 살펴봐요', hint: '사과 노트가 오는 방향을 살펴보세요.' },
  { id: 'RESPONSE', title: '이제 함께 움직여요', hint: '원을 향해 오는 리듬에 맞춰 움직여보세요.' },
  { id: 'RESET', title: '정면을 보고 쉬어가요', hint: '어깨를 편하게 하고 다음 리듬을 준비해요.' },
] as const;

// Layout preview paths only. These are independent of charts and audio time.
const lanes = [
  { motion: 'LEFT_TURN', label: '왼쪽 돌리기', path: 'M 62,280 L 245,280', color: '#83986c', target: [245, 280], labelAt: [75, 319], curved: false },
  { motion: 'RIGHT_TURN', label: '오른쪽 돌리기', path: 'M 658,280 L 475,280', color: '#83986c', target: [475, 280], labelAt: [545, 319], curved: false },
  { motion: 'LEFT_TILT', label: '왼쪽 기울이기', path: 'M 70,170 Q 165,150 260,224', color: '#a396bb', target: [260, 224], labelAt: [75, 143], curved: true },
  { motion: 'RIGHT_TILT', label: '오른쪽 기울이기', path: 'M 650,170 Q 555,150 460,224', color: '#a396bb', target: [460, 224], labelAt: [530, 143], curved: true },
  { motion: 'EXTENSION', label: '고개 들기', path: 'M 360,35 L 360,165', color: '#c4a469', target: [360, 165], labelAt: [385, 90], curved: false },
  { motion: 'FLEXION', label: '고개 숙이기', path: 'M 360,525 L 360,395', color: '#c4a469', target: [360, 395], labelAt: [385, 485], curved: false },
] as const;

interface CameraPreviewProps {
  camera: ReturnType<typeof useWebcam>;
  onVideo: (video: HTMLVideoElement | null) => void;
  trackingStatus: string;
  trackingError: string | null;
}

function CameraPreview({ camera, onVideo, trackingStatus, trackingError }: CameraPreviewProps) {
  const { stream, error, isLoading, startCamera, stopCamera } = camera;
  const video = useRef<HTMLVideoElement>(null);
  const attachVideo = useCallback((element: HTMLVideoElement | null) => {
    video.current = element;
    onVideo(element);
  }, [onVideo]);
  useEffect(() => {
    if (video.current) video.current.srcObject = stream;
  }, [stream]);
  return <section className="play-camera play-card" aria-label="웹캠 영상">
    <div className="play-card-heading"><span>나의 움직임</span><span className="play-live">{stream ? '● LIVE' : '○ CAMERA'}</span></div>
    <div className="play-camera-screen">
      <video key={stream?.id ?? 'idle'} ref={attachVideo} autoPlay playsInline muted hidden={!stream} />
      {!stream && <div className="play-camera-placeholder"><span aria-hidden="true">◎</span><strong>여기에 내가 보여요</strong><p>편안하게, 얼굴과 어깨가 보이도록</p></div>}
      <span className="play-camera-corner" aria-hidden="true" />
    </div>
    {error && <p className="play-camera-error" role="status">{error}</p>}
    <button className="play-camera-toggle" onClick={stream ? stopCamera : startCamera} disabled={isLoading}>{isLoading ? '카메라 연결 중…' : stream ? '카메라 끄기' : '카메라 켜기'}</button>
    <p className="play-camera-caption" role="status">{trackingStatus}</p>
    {stream && trackingError && <p className="play-camera-error" role="alert">{trackingError}</p>}
  </section>;
}

interface GamePlayProps {
  camera: ReturnType<typeof useWebcam>;
  calibration?: CalibrationSnapshot | null;
  characterId?: CharacterId;
  onAbort?: () => void;
}

export default function GamePlay({ camera, calibration: snapshot, characterId, onAbort }: GamePlayProps) {
  const selected = useSelectedCharacter();
  const character = characters.find(item => item.id === (characterId ?? selected)) ?? characters[0];
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const [note, setNote] = useState(() => ({ index: Math.floor(Math.random() * lanes.length), serial: 0, success: false }));
  const lane = lanes[note.index];
  const noteAnimation = useRef<SVGAnimateMotionElement>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const faceResult = useFaceLandmarker(camera.stream ? videoElement : null, setTrackingError);
  const calibration = snapshot?.head;
  const matrix = faceResult?.facialTransformationMatrixes?.[0];
  const faceDetected = !!camera.stream && (faceResult?.faceLandmarks.length ?? 0) > 0 && !!matrix;
  const angles = faceDetected && matrix ? extractHeadAngles(matrix.data) : null;
  const motion = !paused && angles && calibration
    ? detectMotion(calibrateAngles(angles, calibration)) : 'CENTER';
  const poseImage = getCharacterPoseImage(character.image, motion);
  const trackingStatus = !camera.stream ? '카메라를 켜면 자세를 따라해요'
    : paused ? '일시정지 중이에요'
    : !faceDetected ? '얼굴이 화면에 보이도록 앉아주세요'
    : !calibration ? '정면 맞추기 화면에서 기준을 설정해 주세요'
    : '저장한 정면 기준 적용 중 · 고개 움직임을 따라해요';
  const matched = !paused && faceDetected && !!calibration && !trackingError && motion === lane.motion;
  useEffect(() => {
    if (!matched || note.success) return;
    // Commit at the next frame; cleanup cancels stale matches after a note change.
    const frame = requestAnimationFrame(() => {
      setNote(current => current.serial === note.serial && !current.success
        ? { ...current, success: true } : current);
    });
    return () => cancelAnimationFrame(frame);
  }, [matched, note.serial, note.success]);
  useEffect(() => {
    if (!note.success || paused) return;
    const timer = window.setTimeout(() => {
      const index = Math.floor(Math.random() * lanes.length);
      setNote(current => current.serial === note.serial && current.success
        ? { index, serial: current.serial + 1, success: false } : current);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [note.success, note.serial, paused]);
  useEffect(() => {
    const animation = noteAnimation.current;
    if (!animation) return;
    const next = () => {
      const index = Math.floor(Math.random() * lanes.length);
      setNote(current => current.serial === note.serial && !current.success
        ? { index, serial: current.serial + 1, success: false } : current);
    };
    animation.addEventListener('endEvent', next);
    animation.beginElement();
    return () => animation.removeEventListener('endEvent', next);
  }, [note.serial, note.success]);
  useEffect(() => {
    // Cache all poses before the user turns, avoiding image fetches on each motion.
    Object.keys(characterPoses).forEach(key => {
      const image = new Image();
      image.src = getCharacterPoseImage(character.image, key as keyof typeof characterPoses);
    });
  }, [character.image]);
  const scene = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (paused || reduced.matches) scene.current?.pauseAnimations();
      else scene.current?.unpauseAnimations();
    };
    sync();
    reduced.addEventListener('change', sync);
    return () => reduced.removeEventListener('change', sync);
  }, [paused]);

  return <main className="play-page" style={{ '--friend-color': character.color } as CSSProperties}>
    <nav className="play-nav" aria-label="화면 메뉴">
      <span className="play-brand"><span aria-hidden="true">♬</span> 리듬타조<span className="play-brand-dot">.</span></span>
      <span className="play-nav-caption">작은 움직임, 즐거운 리듬</span>
      <span className="play-step">02 / 함께 리듬 타기</span>
    </nav>
    <div className="play-content">
      <header className="play-heading"><div><span className="play-eyebrow">A LITTLE MOVE, A HAPPY RHYTHM</span><h1>우리의 리듬 정원<span aria-hidden="true">✿</span></h1><p>{character.name}와 함께, 가볍게 움직여볼까요?</p></div><span className="play-preview-tag">화면 미리보기</span></header>
      <div className="play-layout">
        <section className={`play-field play-card ${paused ? 'is-paused' : ''}`} aria-label="게임 플레이 공간">
          <div className="play-phase-tabs" aria-label="진행 단계 미리보기">{phases.map((item, index) => <button key={item.id} aria-pressed={phase === index} onClick={() => setPhase(index)} disabled={paused}><span>0{index + 1}</span> {item.id}</button>)}</div>
          <div className="play-instruction" role="status"><h2>{paused ? '잠시 쉬어가요' : phases[phase].title}</h2><p>{paused ? '준비되면 이어하기를 눌러주세요.' : phases[phase].hint}</p></div>
          <p className="play-path-legend"><span>↔ 돌리기</span><span>⌒ 기울이기</span><span>↕ 들기·숙이기</span></p>
          <div className="play-scene">
            <svg ref={scene} viewBox="0 0 720 560" role="img" aria-label={note.success ? 'sucess, 사과를 획득했어요' : `${character.name}의 현재 자세: ${characterPoses[motion].label}. 사과 한 개가 ${lane.label} 경로로 이동 중`}>
              <defs><image id="preview-apple" href="/notes/apple.png" x="-17" y="-17" width="34" height="34" preserveAspectRatio="xMidYMid meet" /><marker id="preview-path-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1,1 L 9,5 L 1,9" fill="none" stroke="context-stroke" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
              <circle cx="360" cy="280" r="115" fill="none" stroke="#e8e7d8" strokeWidth="18"/>
              <circle cx="360" cy="280" r="115" fill="none" stroke="#a2b38b" strokeWidth="2"/>
              <circle cx="360" cy="280" r="91" fill={character.color} stroke="#fffdf4" strokeWidth="7"/>
              <g><path d={lane.path} fill="none" stroke={lane.color} strokeWidth="3" strokeDasharray={lane.curved ? '5 7' : undefined} strokeLinecap="round" markerEnd="url(#preview-path-arrow)"/><circle cx={lane.target[0]} cy={lane.target[1]} r="7" fill="#fffdf6" stroke={lane.color} strokeWidth="2"/><text x={lane.labelAt[0]} y={lane.labelAt[1]} className="play-turn-label">{lane.label}</text></g>
              <image href={poseImage} x="280" y="194" width="160" height="168" preserveAspectRatio="xMidYMid meet"/>
              {!note.success && <g key={note.serial}><use href="#preview-apple"/><animateMotion ref={noteAnimation} dur="2s" begin="indefinite" repeatCount="1" fill="freeze" path={lane.path} rotate="0"/></g>}
            </svg>
            <div className="play-success-feedback" role="status" aria-live="polite">{note.success && <span key={note.serial}>sucess <span aria-hidden="true">✦</span></span>}</div>
            {paused && <div className="play-paused-badge"><span aria-hidden="true">Ⅱ</span> 일시정지</div>}
          </div>
          <div className="play-motion"><span className="play-motion-icon" aria-hidden="true">{motion === 'CENTER' ? '◎' : motion.endsWith('TILT') ? '⌒' : '↔'}</span><div><span>내 동작 · {paused ? '일시정지' : faceDetected && calibration ? '실시간' : '인식 대기'}</span><strong>{characterPoses[motion].label}</strong></div><span className="play-motion-flower" aria-hidden="true">✿</span></div>
          <p className="play-demo-caption">사과는 한 번에 하나씩 무작위 방향에서 와요 · 캐릭터는 내 고개 움직임을 따라해요</p>
        </section>
        <aside className="play-sidebar" aria-label="게임 정보">
          <section className="play-score play-card"><div className="play-card-heading"><span>나의 점수</span><span aria-hidden="true">✦</span></div><strong>000000</strong><div className="play-score-foot"><span>SCORE</span><span>집계 대기</span></div></section>
          <CameraPreview camera={{ ...camera, startCamera: () => { setTrackingError(null); return camera.startCamera(); } }} onVideo={setVideoElement} trackingStatus={trackingStatus} trackingError={trackingError} />
          <div className="play-friend"><img src={character.image} alt=""/><p><strong>{character.name}와 함께하고 있어요</strong><span>작은 움직임도 멋진 리듬이 돼요.</span></p></div>
          <button className="play-pause" aria-pressed={paused} onClick={() => setPaused(value => !value)}><span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{paused ? '이어하기' : '일시정지'}</button>
          {onAbort && <button className="play-camera-toggle" onClick={onAbort}>노래 고르기로</button>}
        </aside>
      </div>
      <footer className="play-progress play-card"><span className="play-progress-note" aria-hidden="true">♫</span><div className="play-progress-main"><div className="play-progress-heading"><strong>오늘의 리듬</strong><span>곡 진행 · 미리보기</span></div><div className="play-progress-track" role="progressbar" aria-label="곡 진행 미리보기" aria-valuemin={0} aria-valuemax={100} aria-valuenow={35} aria-valuetext="35%, 화면 배치용 예시"><span /></div></div><span className="play-progress-status">음악 준비 중</span></footer>
    </div>
    <div className="play-floor" aria-hidden="true">✿ <span>매일 조금씩, 즐겁게 움직여요</span> ♧</div>
  </main>;
}

