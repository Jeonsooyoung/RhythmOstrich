import * as THREE from 'three';
import { loadCharacter } from './loadCharacter';
import type { CharacterRig } from './Characters';
import { createNeckController } from './neckController';

export interface CharacterController {
    setHeadAngles: (
        yaw: number,
        pitch: number,
        roll: number
    ) => void;

    dispose: () => void;
}

export function createCharacterScene(
    container: HTMLDivElement,
    rig: CharacterRig
): CharacterController {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight =
        new THREE.AmbientLight(0xffffff, 2);

    scene.add(ambientLight);

    const directionalLight =
        new THREE.DirectionalLight(0xffffff, 3);

    directionalLight.position.set(2, 3, 4);
    scene.add(directionalLight);

    let neckController: ReturnType<typeof createNeckController> | null = null;
    let disposed = false;
    const latestAngles = { yaw: 0, pitch: 0, roll: 0 };

    loadCharacter(rig.modelPath, (model) => {
        if (disposed) return;
        scene.add(model);

        // 모델 크기와 중심 계산
        const box = new THREE.Box3().setFromObject(model);

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        // 모델을 화면 중심으로 이동
        model.position.sub(center);

        const maxSize = Math.max(
            size.x,
            size.y,
            size.z
        );

        camera.position.set(
            0,
            0,
            maxSize * 1.2
        );

        camera.lookAt(0, 0, 0);

        try {
            neckController = createNeckController(model, rig);
            neckController.setAngles(latestAngles.yaw, latestAngles.pitch, latestAngles.roll);
        } catch (error) {
            console.error('목 관절 연결 실패:', error);
        }
    });

    function setHeadAngles(yaw: number, pitch: number, roll: number) {
        Object.assign(latestAngles, { yaw, pitch, roll });
        neckController?.setAngles(yaw, pitch, roll);
    }

    let animationFrameId = 0;

    let lastFrameTime = performance.now();

    function animate() {
        const now = performance.now();
        neckController?.update(Math.min((now - lastFrameTime) / 1000, 0.1));
        lastFrameTime = now;
        animationFrameId =
            requestAnimationFrame(animate);

        renderer.render(scene, camera);
    }

    animate();

    function dispose() {
        disposed = true;
        cancelAnimationFrame(animationFrameId);

        renderer.dispose();

        if (renderer.domElement.parentElement) {
            renderer.domElement.parentElement.removeChild(
                renderer.domElement
            );
        }
    }

    return {
        setHeadAngles,
        dispose,
    };
}