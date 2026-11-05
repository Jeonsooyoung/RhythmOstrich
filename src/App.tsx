import WebcamView from './components/WebcamView';
import { useSyncExternalStore } from 'react';
import CharacterSelect from './pages/CharacterSelect';

function subscribeRoute(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}
const getRoute = () => window.location.hash;

function App() {
  const route = useSyncExternalStore(subscribeRoute, getRoute, () => '');
  if (route !== '#camera') return <CharacterSelect />;
  return (
    <div>
      <a href="#character-select">캐릭터 선택으로 이동 →</a>
      <h1>RhythmOstrich</h1>

      <WebcamView />
    </div>
  );
}

export default App;
