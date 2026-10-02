export interface HeadAngles {
    yaw: number;
    pitch: number;
    roll: number;
}

/**
 * 프로젝트 기준 머리 방향
 *
 * yaw   : 좌우 회전
 * pitch : 위아래 움직임
 * roll  : 좌우 기울임
 *
 * 실제 카메라 테스트 결과 기준
 */

// yaw
// - : 왼쪽 회전
// + : 오른쪽 회전

// pitch
// - : 굽힘(고개 숙임)
// + : 신전(고개 들기)

// roll
// + : 왼쪽 기울임
// - : 오른쪽 기울임