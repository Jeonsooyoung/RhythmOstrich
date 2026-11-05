# 캐릭터 선택 화면

## 실행과 경로

```sh
npm install
npm run dev
```

터미널에 표시된 로컬 주소를 열면 선택 화면이 표시됩니다. 명시적인 경로는 `/#character-select`입니다. 기존 라우터가 없어 브라우저 해시를 사용합니다. 뒤로가기는 기존 웹캠 화면 `/#camera`로 이동하고, 그 화면의 링크로 선택 화면으로 돌아올 수 있습니다. 게임 컴포넌트와 로직은 변경하지 않았습니다.

## 파일

- `src/App.tsx`: 해시 경로와 기존 화면 연결
- `src/pages/CharacterSelect.tsx`: 선택 UI, 순환 전환, 키보드 입력, 선택 완료 피드백
- `src/pages/CharacterSelect.css`: 화면 내부에 한정한 반응형 스타일과 애니메이션
- `src/data/characters.ts`: 캐릭터 표시 데이터
- `src/state/characterSelection.ts`: 선택 상태, 구독 훅, 영구 저장
- `public/characters/{타조,닭,비둘기,펭귄}/정면.png`: 선택 화면에 사용하는 원본 2D 이미지
- `src/types/character.ts`: 2D 캐릭터 ID 타입

## 이미지 교체

선택 화면은 제공받은 닭·타조 정면 PNG를 사용합니다. 원본 파일을 변형 없이 복사했으며 기존 GLB 모델은 변경하지 않았습니다. 다른 PNG, WebP 또는 SVG를 `public/characters/`에 넣고 `src/data/characters.ts`의 `image`를 `/characters/파일명.png` 등으로 바꾸세요. `name`, `subtitle`, `description`, `color`도 같은 파일에서 바꿀 수 있습니다. 이미지는 모두 `object-fit: contain`으로 원본 비율을 유지합니다.

현재 2D ID는 `ostrich`, `chicken`, `pigeon`, `penguin`입니다. 캐릭터별 폴더에 정리된 7개 자세 중 선택 화면은 `정면.png`만 사용합니다. 새 캐릭터는 `src/types/character.ts`와 `src/data/characters.ts`에 추가하세요. 2D ID는 기존 3D 모델 타입과 독립적으로 관리합니다.

## 선택 정보 전달

캐러셀 이동은 임시 선택이며 **선택 완료**를 누를 때만 저장됩니다. 화면은 그대로 유지되고 완료 메시지를 표시합니다. 게임으로 자동 이동하지 않습니다.

```tsx
import { useSelectedCharacter } from './state/characterSelection';

// 향후 게임 컴포넌트 내부에서 사용
const characterId = useSelectedCharacter(); // 'ostrich' | 'chicken' | 'pigeon' | 'penguin'
```

React 외부에서는 `getSelectedCharacter()`로 읽을 수 있습니다. `localStorage` 키는 `rhythmostrich.character`이며, 저장 공간을 사용할 수 없어도 메모리 상태로 동작합니다. 저장된 ID가 잘못되었거나 없다면 타조가 기본값입니다. 기존 웹캠 화면의 내부 캐릭터 선택에는 아직 연결하지 않았습니다.

## 확인 항목

### 잠금 캐릭터

해제된 특별 캐릭터도 중앙 프로필을 다시 7번 연속 누르면 재잠금됩니다. 같은 클릭 간격/횟수 초기화 규칙을 적용하며 기본 캐릭터는 잠기지 않습니다. 재잠금 상태도 저장됩니다. 현재 확정된 캐릭터를 재잠금하면 저장된 선택은 타조로 변경하고, 보고 있던 프로필은 그대로 두어 잠금 표시를 확인할 수 있습니다.

듀오링고, 불사조, 물총새, 불닭, 공작새는 기본 잠금 상태입니다. 중앙/이웃 프로필을 흐리게 표시하며 중앙에 자물쇠와 `아직 선택할 수 없습니다.` 안내를 표시합니다. 잠긴 캐릭터는 선택 완료할 수 없습니다.

중앙 프로필을 7번 연속 클릭(클릭 사이 1.5초 이하)하면 해당 캐릭터만 해제됩니다. 다른 캐릭터로 이동하거나 1.5초가 지나면 연속 횟수가 초기화됩니다. 전환 애니메이션 중 클릭은 세지 않습니다. 잠긴 프로필 버튼은 Enter/Space로도 작동합니다. 해제 후 선택 완료를 눌러야 선택 정보가 저장됩니다.

해제 목록은 `src/state/characterUnlock.ts`에서 관리하고 `localStorage`의 `rhythmostrich.unlockedCharacters`에 저장합니다. 저장을 사용할 수 없으면 현재 실행 중에만 유지됩니다. 기존에 선택한 캐릭터가 잠긴 상태라면 초기 선택은 타조로 돌아갑니다. 잠금 동작을 다시 확인하려면 개발자 도구에서 이 저장 키를 삭제하고 새로고침하세요.

1. 화살표, 양쪽 미리보기, 페이지 점, 키보드 좌우 방향키로 이동합니다. 키보드는 선택 화면 내부에 포커스가 있을 때 동작합니다.
2. 빠르게 연속 클릭해도 460ms 전환 중 추가 입력이 차단되고 마지막/첫 번째가 이어지는지 확인합니다.
3. 선택 완료 후 새로고침하면 확정한 캐릭터가 복원되는지 확인합니다.
4. 너비 320px, 390px, PC 화면에서 버튼과 이미지가 잘리지 않는지 확인합니다. 낮은 화면에서는 세로 스크롤을 허용합니다.
5. 운영체제의 모션 감소 설정을 켜면 슬라이드와 바운스가 생략됩니다.

자동 검사: `npm run build`, `npm run lint`. 전체 lint에는 기존 `WebcamView.tsx:212`의 `react-hooks/set-state-in-effect` 오류가 있습니다. 작업 범위 밖인 기존 게임 코드는 유지했습니다.
