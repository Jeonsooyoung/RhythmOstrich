import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { CHARACTER_RIGS } from '../src/three/Characters.ts';
import { createNeckController } from '../src/three/neckController.ts';

// 실제 GLB의 관절 변환과 계층을 사용합니다. 텍스처/WebGL은 필요 없습니다.
function loadSkeleton(modelPath) {
    const bytes = readFileSync(new URL(`../public${modelPath}`, import.meta.url));
    const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    const joints = new Set(gltf.skins.flatMap(skin => skin.joints));
    const nodes = gltf.nodes.map((data, index) => {
        const node = joints.has(index) ? new THREE.Bone() : new THREE.Object3D();
        node.name = data.name ?? '';
        if (data.translation) node.position.fromArray(data.translation);
        if (data.rotation) node.quaternion.fromArray(data.rotation);
        if (data.scale) node.scale.fromArray(data.scale);
        if (data.matrix) new THREE.Matrix4().fromArray(data.matrix)
            .decompose(node.position, node.quaternion, node.scale);
        return node;
    });
    gltf.nodes.forEach((data, index) => {
        for (const child of data.children ?? []) nodes[index].add(nodes[child]);
    });
    const model = new THREE.Group();
    for (const index of gltf.scenes[gltf.scene ?? 0].nodes) model.add(nodes[index]);
    model.updateWorldMatrix(true, true);
    return model;
}
function closeRotation(actual, expected) {
    const error = actual.clone().normalize().angleTo(expected.clone().normalize());
    assert.ok(error < 1e-6, `rotation error: ${error}`);
}

for (const [name, rig] of Object.entries(CHARACTER_RIGS)) {
    test(`${name}: distribute rotation, preserve body and return to rest`, () => {
        const model = loadSkeleton(rig.modelPath);
        const head = model.getObjectByName('Head');
        const body = model.getObjectByName('Body');
        const restHead = head.getWorldQuaternion(new THREE.Quaternion());
        const restBody = body.quaternion.clone();
        const restLocals = rig.joints.map(({ name }) => model.getObjectByName(name).quaternion.clone());
        const controller = createNeckController(model, rig);
        controller.update(1);
        rig.joints.forEach(({ name }, i) => closeRotation(model.getObjectByName(name).quaternion, restLocals[i]));
        controller.setAngles(30, 20, 10);
        controller.update(10);
        const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(-24), THREE.MathUtils.degToRad(36), THREE.MathUtils.degToRad(12),
        ));
        closeRotation(head.getWorldQuaternion(new THREE.Quaternion()), restHead.clone().multiply(delta));
        closeRotation(body.quaternion, restBody);
        rig.joints.forEach(({ name }, i) => assert.ok(model.getObjectByName(name).quaternion.angleTo(restLocals[i]) > 0.01));
        controller.setAngles(0, 0, 0);
        controller.update(10);
        rig.joints.forEach(({ name }, i) => closeRotation(model.getObjectByName(name).quaternion, restLocals[i]));
    });
    test(`${name}: emphasize downward pitch and clamp amplified output`, () => {
        const model = loadSkeleton(rig.modelPath);
        const head = model.getObjectByName('Head');
        const rest = head.getWorldQuaternion(new THREE.Quaternion());
        // 화면에서 조정하는 캐릭터 설정과 별개로 배율/제한 계산을 검증합니다.
        const controller = createNeckController(model, {
            ...rig,
            gain: { ...rig.gain, pitchDown: 1.8, pitchUp: 1.2 },
            limits: { ...rig.limits, pitch: 40 },
        });
        for (const [input, output] of [[-10, 18], [10, -12], [-30, 40], [0, 0]]) {
            controller.setAngles(0, input, 0);
            controller.update(10);
            const delta = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(output),
            );
            closeRotation(head.getWorldQuaternion(new THREE.Quaternion()), rest.clone().multiply(delta));
        }
    });
    test(`${name}: smoothing is frame-rate independent and inputs are bounded`, () => {
        const results = [30, 60, 120].map(fps => {
            const model = loadSkeleton(rig.modelPath);
            const controller = createNeckController(model, rig);
            controller.setAngles(999, 999, 999);
            for (let i = 0; i < fps; i++) controller.update(1 / fps);
            return model.getObjectByName('Head').getWorldQuaternion(new THREE.Quaternion());
        });
        closeRotation(results[0], results[1]);
        closeRotation(results[1], results[2]);
        const model = loadSkeleton(rig.modelPath);
        const controller = createNeckController(model, rig);
        controller.setAngles(rig.limits.yaw, rig.limits.pitch, rig.limits.roll);
        controller.setAngles(NaN, 0, 0);
        controller.update(1);
        closeRotation(results[0], model.getObjectByName('Head').getWorldQuaternion(new THREE.Quaternion()));
    });
}

test('ostrich: bowing uses more neck while turns and upward pitch stay unchanged', () => {
    const rig = CHARACTER_RIGS.ostrich;
    const originalRig = {
        ...rig,
        joints: rig.joints.map(({ name, weight }) => ({ name, weight })),
    };
    for (const angles of [[25, 0, 0], [0, 15, 0], [0, 0, 15], [0, -20, 0], [25, -20, 10]]) {
        const original = loadSkeleton(rig.modelPath);
        const updated = loadSkeleton(rig.modelPath);
        const restNeck = updated.getObjectByName('Neck03').quaternion.clone();
        const controllers = [createNeckController(original, originalRig), createNeckController(updated, rig)];
        for (const controller of controllers) {
            controller.setAngles(...angles);
            controller.update(10);
        }
        closeRotation(
            original.getObjectByName('Head').getWorldQuaternion(new THREE.Quaternion()),
            updated.getObjectByName('Head').getWorldQuaternion(new THREE.Quaternion()),
        );
        if (angles[1] >= 0) {
            for (const { name } of rig.joints) {
                closeRotation(original.getObjectByName(name).quaternion, updated.getObjectByName(name).quaternion);
            }
        } else {
            const oldBend = original.getObjectByName('Neck03').quaternion.angleTo(restNeck);
            const newBend = updated.getObjectByName('Neck03').quaternion.angleTo(restNeck);
            assert.ok(newBend > oldBend * 1.5);
            const oldPosition = original.getObjectByName('Head').getWorldPosition(new THREE.Vector3());
            const newPosition = updated.getObjectByName('Head').getWorldPosition(new THREE.Vector3());
            assert.ok(oldPosition.distanceTo(newPosition) > 0.01);
        }
    }
});

test('ostrich: downward transition is continuous, frame-rate independent and returns to rest', () => {
    const rig = CHARACTER_RIGS.ostrich;
    const results = [30, 60, 120].map(fps => {
        const model = loadSkeleton(rig.modelPath);
        const rest = rig.joints.map(({ name }) => model.getObjectByName(name).quaternion.clone());
        const controller = createNeckController(model, rig);
        controller.setAngles(20, -20, 10);
        for (let i = 0; i < fps; i++) controller.update(1 / fps);
        const bowed = rig.joints.map(({ name }) => model.getObjectByName(name).quaternion.clone());
        controller.setAngles(0, 0, 0);
        controller.update(10);
        rig.joints.forEach(({ name }, i) => closeRotation(model.getObjectByName(name).quaternion, rest[i]));
        return bowed;
    });
    results[0].forEach((q, i) => {
        closeRotation(q, results[1][i]);
        closeRotation(q, results[2][i]);
    });
    const model = loadSkeleton(rig.modelPath);
    const controller = createNeckController(model, rig);
    // 정면과 전환 완료 경계의 양쪽에서 작은 입력 변화가 관절을 튀게 하지 않아야 합니다.
    for (const boundary of [0, -rig.pitchDownBlendAngle / rig.gain.pitchDown]) {
        controller.setAngles(20, boundary - 0.0001, 0);
        controller.update(10);
        const before = rig.joints.map(({ name }) => model.getObjectByName(name).quaternion.clone());
        controller.setAngles(20, boundary + 0.0001, 0);
        controller.update(10);
        rig.joints.forEach(({ name }, i) => {
            assert.ok(model.getObjectByName(name).quaternion.angleTo(before[i]) < 0.0001);
        });
    }
});

for (const [name, rig] of Object.entries(CHARACTER_RIGS)) {
    test(`${name}: body follows shoulders without adding rotation to the head`, () => {
        const model = loadSkeleton(rig.modelPath);
        const head = model.getObjectByName('Head');
        const body = model.getObjectByName('Body');
        const restHead = head.getWorldQuaternion(new THREE.Quaternion()).normalize();
        const restBody = body.getWorldQuaternion(new THREE.Quaternion()).normalize();
        const restLocals = rig.joints.map(({ name }) => model.getObjectByName(name).quaternion.clone());
        const controller = createNeckController(model, rig);
        controller.setBodyAngles(20, 10);
        controller.setAngles(20, 0, 10);
        controller.update(10);
        const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            0, THREE.MathUtils.degToRad(24), THREE.MathUtils.degToRad(12),
        ));
        const worldDelta = restHead.clone().multiply(rotation).multiply(restHead.clone().invert());
        closeRotation(body.getWorldQuaternion(new THREE.Quaternion()), worldDelta.clone().multiply(restBody));
        closeRotation(head.getWorldQuaternion(new THREE.Quaternion()), restHead.clone().multiply(rotation));
        // 얼굴과 몸통 방향이 같다면 목의 상대 회전은 기본 자세입니다.
        rig.joints.forEach(({ name }, i) => closeRotation(model.getObjectByName(name).quaternion, restLocals[i]));
        controller.setAngles(0, 0, 0);
        controller.update(10);
        closeRotation(head.getWorldQuaternion(new THREE.Quaternion()), restHead);
        closeRotation(body.getWorldQuaternion(new THREE.Quaternion()), worldDelta.clone().multiply(restBody));
        controller.setBodyAngles(0, 0);
        controller.update(10);
        closeRotation(body.getWorldQuaternion(new THREE.Quaternion()), restBody);
        rig.joints.forEach(({ name }, i) => closeRotation(model.getObjectByName(name).quaternion, restLocals[i]));
    });
    test(`${name}: shoulder smoothing is frame-rate independent with bounded inputs`, () => {
        const results = [30, 60, 120].map(fps => {
            const model = loadSkeleton(rig.modelPath);
            const controller = createNeckController(model, rig);
            controller.setBodyAngles(1000, -1000);
            controller.setBodyAngles(NaN, 0);
            for (let i = 0; i < fps; i++) controller.update(1 / fps);
            return model.getObjectByName('Body').getWorldQuaternion(new THREE.Quaternion());
        });
        closeRotation(results[0], results[1]);
        closeRotation(results[1], results[2]);
        const model = loadSkeleton(rig.modelPath);
        const controller = createNeckController(model, rig);
        controller.setBodyAngles(rig.body.limits.yaw / rig.body.gain.yaw, -rig.body.limits.roll / rig.body.gain.roll);
        controller.update(1);
        closeRotation(results[0], model.getObjectByName('Body').getWorldQuaternion(new THREE.Quaternion()));
    });
}
