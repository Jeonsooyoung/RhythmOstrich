import { useEffect, useSyncExternalStore } from 'react';
import WebcamView from './components/WebcamView';
import { stepNumber } from './data/flowSteps';
import { charts, findChart } from './game/charts';
import CalibrationPage from './pages/CalibrationPage';
import CharacterSelect from './pages/CharacterSelect';
import GamePlay from './pages/GamePlay';
import UserIdPage from './pages/UserIdPage';
import {
  AssessmentPage,
  GamePage,
  ResultPage,
  SongSelectPage,
} from './pages/flowPages';
import { useSessionFlow } from './state/useSessionFlow';
import { useWebcam } from './hooks/useWebcam';
import './styles/garden.css';

function subscribeRoute(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

const getRoute = () => window.location.hash;

/** 전체 진행 순서: 사용자 ID → 사전 평가 → 캐릭터 → 곡 → 정면 기준 → 게임 → 사후 평가 → 결과 */
function GameFlow({ preview = false, characterSelect = false }: { preview?: boolean; characterSelect?: boolean }) {
  const camera = useWebcam();
  const {
    draft,
    phase,
    history,
    saveFailed,
    restoredNotice,
    dismissRestoredNotice,
    actions,
  } = useSessionFlow();

  const { stopCamera } = camera;
  useEffect(() => {
    if (characterSelect || (!preview && phase !== 'calibration' && phase !== 'game')) stopCamera();
  }, [phase, preview, characterSelect, stopCamera]);

  let screen;
  const returnToCharacter = () => {
    camera.stopCamera();
    actions.returnToCharacter();
    window.location.hash = '#character-select';
  };

  switch (phase) {
    case 'userId':
      screen = <UserIdPage onSubmit={actions.setUser} />;
      break;

    case 'preAssessment':
      screen = (
        <AssessmentPage
          mode="pre"
          initial={draft.previousPre ?? undefined}
          onComplete={actions.submitPre}
          onBack={actions.back}
        />
      );
      break;

    case 'character':
      screen = (
        <CharacterSelect
          stepNumber={stepNumber('character')}
          onConfirm={actions.selectCharacter}
          onBack={actions.back}
        />
      );
      break;

    case 'calibration':
      screen = draft.characterId && (
        <CalibrationPage
          camera={camera}
          characterId={draft.characterId}
          onComplete={actions.calibrated}
          onBack={actions.back}
        />
      );
      break;

    case 'song':
      screen = (
        <SongSelectPage
          charts={charts}
          onSelect={actions.selectSong}
          onBack={actions.back}
        />
      );
      break;

    case 'game': {
      const chart = findChart(draft.chartId);

      screen = chart && draft.characterId && draft.calibration ? (
        <GamePage
          chart={chart}
          onCharacterSelect={returnToCharacter}
          camera={camera}
          key={draft.sessionId}
          characterId={draft.characterId}
          calibration={draft.calibration}
          onAbort={actions.abortGame}
        />
      ) : (
        <main className="garden-page">
          <p>곡 정보를 찾을 수 없어요.</p>
          <button
            type="button"
            className="gp-button"
            onClick={actions.abortGame}
          >
            노래 고르기로
          </button>
        </main>
      );
      break;
    }

    case 'postAssessment':
      screen = (
        <AssessmentPage
          key={draft.sessionId}
          mode="post"
          onComplete={actions.submitPost}
        />
      );
      break;

    case 'result':
      screen = draft.record && (
        <ResultPage
          record={draft.record}
          history={history}
          onReplay={actions.replay}
          onReplayWithReassess={actions.replayWithReassess}
          onHome={actions.reset}
        />
      );
      break;
  }

  if (characterSelect) {
    return <CharacterSelect stepNumber={stepNumber('character')} onConfirm={id => {
      actions.selectCharacter(id);
      window.location.hash = '';
    }} />;
  }

  if (preview) {
    return <GamePlay chart={findChart(draft.chartId)} onCharacterSelect={returnToCharacter} camera={camera} calibration={draft.calibration} characterId={draft.characterId ?? undefined} />;
  }

  return (
    <>
      {restoredNotice && (
        <div className="gp-banner" role="status">
          <span>
            진행 중이던 세션을 이어서 할게요.
            {phase === 'calibration' &&
              ' 카메라가 다시 켜져서 정면 기준을 다시 잡아야 해요.'}
          </span>
          <span>
            <button type="button" onClick={dismissRestoredNotice}>
              확인
            </button>{' '}
            <button
              type="button"
              onClick={() => {
                dismissRestoredNotice();
                actions.reset();
              }}
            >
              처음부터
            </button>
          </span>
        </div>
      )}

      {saveFailed && phase === 'result' && (
        <div className="gp-banner warning" role="alert">
          기록을 저장하지 못했어요. 브라우저 저장 공간이나 시크릿 모드 여부를 확인해 주세요.
        </div>
      )}

      {screen}

      {import.meta.env.DEV && (
        <div className="flow-dev-bar">
          phase: {phase} · {draft.sessionId.slice(0, 8)}
        </div>
      )}
    </>
  );
}

function App() {
  const route = useSyncExternalStore(subscribeRoute, getRoute, () => '');


  // 개발용 웹캠 테스트 화면은 #camera로 계속 접근 가능
  if (route === '#camera') {
    return (
      <div>
        <a href="#">← 게임으로 돌아가기</a>
        <h1>RhythmOstrich</h1>
        <WebcamView />
      </div>
    );
  }

  return <GameFlow preview={route === '#game'} characterSelect={route === '#character-select'} />;
}

export default App;
