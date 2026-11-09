// 2D 캐릭터 자세 이미지 (public/characters/{이름}/{자세}.png)
import type { MotionType } from '../motion/motionDetector';
import type { CharacterId } from '../types/character';
import { characters } from './characters';

const POSE_FILES: Record<MotionType, string> = {
    CENTER: '정면',
    LEFT_TURN: '왼돌기',
    RIGHT_TURN: '오른돌기',
    LEFT_TILT: '왼기울기',
    RIGHT_TILT: '오른기울기',
    FLEXION: '고개숙이기',
    EXTENSION: '고개들기',
};

/**
 * 사용자가 왼쪽으로 돌렸을 때 화면 속 캐릭터가 반대쪽으로 도는 것처럼 보이면 true로 바꿈
 * (이미지의 "왼쪽"이 캐릭터 기준인지 보는 사람 기준인지에 따라 다름)
 */
const SWAP_LEFT_RIGHT = false;

const SWAPPED: Partial<Record<MotionType, MotionType>> = {
    LEFT_TURN: 'RIGHT_TURN',
    RIGHT_TURN: 'LEFT_TURN',
    LEFT_TILT: 'RIGHT_TILT',
    RIGHT_TILT: 'LEFT_TILT',
};

function characterFolder(id: CharacterId): string {
    const image = (characters.find(character => character.id === id) ?? characters[0]).image;
    return image.slice(0, image.lastIndexOf('/') + 1);
}

/** 캐릭터와 동작에 맞는 자세 이미지 경로. 동작이 없으면(null) 정면 */
export function getPoseImage(id: CharacterId, motion: MotionType | null): string {
    const pose = motion === null ? 'CENTER' : SWAP_LEFT_RIGHT ? SWAPPED[motion] ?? motion : motion;
    return characterFolder(id) + POSE_FILES[pose] + '.png';
}

/** 캐릭터의 7가지 자세 이미지 경로 전부 (미리 불러오기용) */
export function getAllPoseImages(id: CharacterId): string[] {
    return Object.values(POSE_FILES).map(file => characterFolder(id) + file + '.png');
}
