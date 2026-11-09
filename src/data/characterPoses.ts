import type { MotionType } from '../motion/motionDetector';
import type { CharacterId } from '../types/character';
import { characters } from './characters';

export const characterPoses: Record<
    MotionType,
    { file: string; label: string }
> = {
    CENTER: { file: '정면.png', label: '정면 보기' },
    LEFT_TURN: { file: '왼돌기.png', label: '왼쪽으로 목 돌리기' },
    RIGHT_TURN: { file: '오른돌기.png', label: '오른쪽으로 목 돌리기' },
    FLEXION: { file: '고개숙이기.png', label: '고개 숙이기' },
    EXTENSION: { file: '고개들기.png', label: '고개 들기' },
    LEFT_TILT: { file: '왼기울기.png', label: '왼쪽으로 기울이기' },
    RIGHT_TILT: { file: '오른기울기.png', label: '오른쪽으로 기울이기' },
};

/** 필요하면 true로 바꿔 좌우 자세 이미지를 서로 바꿉니다. */
const SWAP_LEFT_RIGHT = false;

const SWAPPED: Partial<Record<MotionType, MotionType>> = {
    LEFT_TURN: 'RIGHT_TURN',
    RIGHT_TURN: 'LEFT_TURN',
    LEFT_TILT: 'RIGHT_TILT',
    RIGHT_TILT: 'LEFT_TILT',
};

function resolveMotion(motion: MotionType | null): MotionType {
    const currentMotion = motion ?? 'CENTER';

    return SWAP_LEFT_RIGHT
        ? SWAPPED[currentMotion] ?? currentMotion
        : currentMotion;
}

function characterFolder(id: CharacterId): string {
    const image = (characters.find((character) => character.id === id) ?? characters[0]).image;
    return image.slice(0, image.lastIndexOf('/') + 1);
}

/** 캐릭터와 동작에 맞는 자세 이미지 경로. 동작이 null이면 정면 이미지입니다. */
export function getPoseImage(
    id: CharacterId,
    motion: MotionType | null,
): string {
    const pose = resolveMotion(motion);
    return characterFolder(id) + characterPoses[pose].file;
}

/** 캐릭터의 7가지 자세 이미지 경로 전부 반환합니다. */
export function getAllPoseImages(id: CharacterId): string[] {
    return Object.values(characterPoses).map(
        ({ file }) => characterFolder(id) + file,
    );
}

/** 기존 코드에서 frontImage를 넘기는 경우를 위한 호환 함수입니다. */
export function getCharacterPoseImage(
    frontImage: string,
    motion: MotionType,
): string {
    const pose = resolveMotion(motion);
    return frontImage.replace(/[^/]+$/, characterPoses[pose].file);
}