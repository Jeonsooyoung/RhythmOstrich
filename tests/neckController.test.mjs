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
            THREE.MathUtils.degToRad(-20), THREE.MathUtils.degToRad(30), THREE.MathUtils.degToRad(10),
        ));
        closeRotation(head.getWorldQuaternion(new THREE.Quaternion()), restHead.clone().multiply(delta));
        closeRotation(body.quaternion, restBody);
        rig.joints.forEach(({ name }, i) => assert.ok(model.getObjectByName(name).quaternion.angleTo(restLocals[i]) > 0.01));
        controller.setAngles(0, 0, 0);
        controller.update(10);
        rig.joints.forEach(({ name }, i) => closeRotation(model.getObjectByName(name).quaternion, restLocals[i]));
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
