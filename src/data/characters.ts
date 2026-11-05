import type { CharacterId } from '../types/character';

export interface CharacterOption {
  id: CharacterId;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  color: string;
}

export const characters: CharacterOption[] = [
  { id: 'ostrich', name: '타조', subtitle: '느긋한 정원의 리듬 메이트', description: '긴 목을 쭉! 나만의 리듬으로 함께 움직여요.', image: '/characters/타조/정면.png', color: '#e9e3f4' },
  { id: 'chicken', name: '꼬꼬', subtitle: '작지만 씩씩한 리듬 메이트', description: '콩콩, 한 걸음씩! 신나는 리듬을 함께 찾아요.', image: '/characters/닭/정면.png', color: '#fff0c4' },
  { id: 'pigeon', name: '비둘기', subtitle: '다정한 정원의 리듬 메이트', description: '구구, 가벼운 날갯짓으로 리듬을 함께 타요.', image: '/characters/비둘기/정면.png', color: '#e2e9f1' },
  { id: 'penguin', name: '펭귄', subtitle: '뒤뚱뒤뚱 유쾌한 리듬 메이트', description: '뒤뚱뒤뚱, 작은 움직임도 즐거운 춤이 돼요.', image: '/characters/펭귄/정면.png', color: '#def0e9' },
  { id: 'goose', name: '거위', subtitle: '당당한 정원의 리듬 메이트', description: '목을 쭉 펴고, 당당하게 리듬을 타요.', image: '/characters/거위/정면.png', color: '#fff0c4' },
  { id: 'peacock', name: '공작새', subtitle: '우아한 정원의 리듬 메이트', description: '날개를 활짝! 나만의 멋진 춤을 펼쳐요.', image: '/characters/공작새/정면.png', color: '#def0e9' },
  { id: 'crow', name: '까마귀', subtitle: '영리한 정원의 리듬 메이트', description: '귀를 쫑긋, 다음 박자를 함께 찾아요.', image: '/characters/까마귀/정면.png', color: '#e9e3f4' },
  { id: 'magpie', name: '까치', subtitle: '반가운 정원의 리듬 메이트', description: '반가운 친구와 기분 좋은 하루를 시작해요.', image: '/characters/까치/정면.png', color: '#e2e9f1' },
  { id: 'kingfisher', name: '물총새', subtitle: '날쌘 정원의 리듬 메이트', description: '톡톡, 가벼운 움직임으로 박자를 맞춰요.', image: '/characters/물총새/정면.png', color: '#dfeef1' },
  { id: 'fire-chicken', name: '불닭', subtitle: '열정 가득한 리듬 메이트', description: '작은 날갯짓에도 뜨거운 열정을 담아요.', image: '/characters/불닭/정면.png', color: '#f7e1d6' },
  { id: 'phoenix', name: '불사조', subtitle: '용기 가득한 리듬 메이트', description: '다시 한 번, 힘차게 날아올라요!', image: '/characters/불사조/정면.png', color: '#f8e7c9' },
  { id: 'parrot', name: '앵무새', subtitle: '재잘재잘 즐거운 리듬 메이트', description: '흥얼흥얼, 좋아하는 리듬을 함께 불러요.', image: '/characters/앵무새/정면.png', color: '#e7edcf' },
  { id: 'duck', name: '오리', subtitle: '사뿐사뿐 다정한 리듬 메이트', description: '꽥꽥, 발걸음에 즐거운 박자를 더해요.', image: '/characters/오리/정면.png', color: '#fff0c4' },
  { id: 'mallard', name: '청둥오리', subtitle: '산뜻한 정원의 리듬 메이트', description: '살랑이는 바람처럼 가볍게 움직여요.', image: '/characters/청둥오리/정면.png', color: '#deebdb' },
  { id: 'duolingo', name: '듀오링고', subtitle: '초록빛 응원의 리듬 메이트', description: '오늘도 한 걸음! 즐거운 리듬을 함께 이어가요.', image: '/characters/듀오링고/정면.png', color: '#e7edcf' },
];
