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
 * 부호 방향은 실제 카메라 테스트 결과 기준으로 확정
 */