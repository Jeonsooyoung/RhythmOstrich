import * as THREE from 'three';
import type { CharacterRig } from './Characters';

/** 기본 머리의 축을 기준으로 전체 회전을 분배합니다. */
export function createNeckController(model: THREE.Object3D, rig: CharacterRig) {
    model.updateWorldMatrix(true, true);
    let cumulativeWeight = 0;
    let cumulativeDownWeight = 0;
    const joints = rig.joints.map(({ name, weight, pitchDownWeight = weight }) => {
        const bone = model.getObjectByName(name);
        if (!(bone instanceof THREE.Bone)) {
            throw new Error(`목 관절을 찾을 수 없습니다: ${name}`);
        }
        if (!Number.isFinite(weight) || !Number.isFinite(pitchDownWeight)
            || weight < 0 || pitchDownWeight < 0) {
            throw new Error('목 관절 회전 가중치는 0 이상의 유한한 값이어야 합니다.');
        }
        cumulativeWeight += weight;
        cumulativeDownWeight += pitchDownWeight;
        return {
            bone,
            cumulativeWeight,
            cumulativeDownWeight,
            restWorld: bone.getWorldQuaternion(new THREE.Quaternion()).normalize(),
        };
    });
    if (!joints.length || Math.abs(cumulativeWeight - 1) > 0.00001
        || Math.abs(cumulativeDownWeight - 1) > 0.00001) {
        throw new Error('목 관절 회전 가중치의 합은 1이어야 합니다.');
    }
    const blendAngle = rig.pitchDownBlendAngle ?? 20;
    if (!Number.isFinite(blendAngle) || blendAngle <= 0) {
        throw new Error('숙임 비율 전환 각도는 양수여야 합니다.');
    }
    const currentEuler = new THREE.Euler(0, 0, 0, 'XYZ');
    const reference = joints[joints.length - 1].restWorld.clone();
    const inverseReference = reference.clone().invert();
    const target = new THREE.Quaternion();
    const current = new THREE.Quaternion();
    const partial = new THREE.Quaternion();
    const worldDelta = new THREE.Quaternion();
    const parentWorld = new THREE.Quaternion();
    const inputEuler = new THREE.Euler(0, 0, 0, 'XYZ');

    return {
        setAngles(yaw: number, pitch: number, roll: number) {
            if (![yaw, pitch, roll].every(Number.isFinite)) return;
            const radians = THREE.MathUtils.degToRad;
            const clamp = THREE.MathUtils.clamp;
            // 측정 pitch의 음수는 숙이기, 양수는 들기입니다.
            const pitchGain = pitch < 0 ? rig.gain.pitchDown : rig.gain.pitchUp;
            inputEuler.set(
                -radians(clamp(pitch * pitchGain, -rig.limits.pitch, rig.limits.pitch)),
                radians(clamp(yaw * rig.gain.yaw, -rig.limits.yaw, rig.limits.yaw)),
                radians(clamp(roll * rig.gain.roll, -rig.limits.roll, rig.limits.roll)),
            );
            target.setFromEuler(inputEuler);
        },
        update(deltaSeconds: number) {
            const alpha = 1 - Math.exp(-rig.response * Math.max(0, deltaSeconds));
            current.slerp(target, alpha);
            // 보간된 현재 자세를 기준으로 비율도 연속적으로 전환합니다.
            // 회전 적용 좌표에서 양의 X 회전이 고개 숙이기에 해당합니다.
            currentEuler.setFromQuaternion(current, 'XYZ');
            const downBlend = THREE.MathUtils.smoothstep(
                THREE.MathUtils.radToDeg(currentEuler.x), 0, blendAngle,
            );
            for (const joint of joints) {
                // 누적 회전으로 목표 월드 자세를 구하고 부모의 회전을 제거합니다.
                // 관절 축이 달라도 머리의 최종 회전이 중복되지 않습니다.
                const weight = THREE.MathUtils.lerp(
                    joint.cumulativeWeight, joint.cumulativeDownWeight, downBlend,
                );
                partial.identity().slerp(current, weight);
                worldDelta.copy(reference).multiply(partial).multiply(inverseReference);
                parentWorld.identity();
                joint.bone.parent?.getWorldQuaternion(parentWorld);
                joint.bone.quaternion.copy(parentWorld.normalize().invert())
                    .multiply(worldDelta).multiply(joint.restWorld).normalize();
                joint.bone.updateWorldMatrix(false, false);
            }
        },
    };
}
