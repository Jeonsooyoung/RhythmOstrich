import * as THREE from 'three';
import type { CharacterRig } from './Characters';

/** 기본 머리의 축을 기준으로 전체 회전을 분배합니다. */
export function createNeckController(model: THREE.Object3D, rig: CharacterRig) {
    model.updateWorldMatrix(true, true);
    let cumulativeWeight = 0;
    const joints = rig.joints.map(({ name, weight }) => {
        const bone = model.getObjectByName(name);
        if (!(bone instanceof THREE.Bone)) {
            throw new Error(`목 관절을 찾을 수 없습니다: ${name}`);
        }
        cumulativeWeight += weight;
        return {
            bone,
            cumulativeWeight,
            restWorld: bone.getWorldQuaternion(new THREE.Quaternion()).normalize(),
        };
    });
    if (!joints.length || Math.abs(cumulativeWeight - 1) > 0.00001) {
        throw new Error('목 관절 회전 가중치의 합은 1이어야 합니다.');
    }
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
            inputEuler.set(
                -radians(clamp(pitch, -rig.limits.pitch, rig.limits.pitch)),
                radians(clamp(yaw, -rig.limits.yaw, rig.limits.yaw)),
                radians(clamp(roll, -rig.limits.roll, rig.limits.roll)),
            );
            target.setFromEuler(inputEuler);
        },
        update(deltaSeconds: number) {
            const alpha = 1 - Math.exp(-rig.response * Math.max(0, deltaSeconds));
            current.slerp(target, alpha);
            for (const joint of joints) {
                // 누적 회전으로 목표 월드 자세를 구하고 부모의 회전을 제거합니다.
                // 관절 축이 달라도 머리의 최종 회전이 중복되지 않습니다.
                partial.identity().slerp(current, joint.cumulativeWeight);
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
