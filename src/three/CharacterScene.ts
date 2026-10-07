import * as THREE from 'three';
import { loadCharacter } from './loadCharacter';

export interface CharacterController {
    setHeadAngles: (
        yaw: number,
        pitch: number,
        roll: number
    ) => void;

    dispose: () => void;
}

export function createCharacterScene(
    container: HTMLDivElement
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

    renderer.setPixelRatio(window.devicePixelRatio);

    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight =
        new THREE.AmbientLight(0xffffff, 2);

    scene.add(ambientLight);

    const directionalLight =
        new THREE.DirectionalLight(0xffffff, 3);

    directionalLight.position.set(2, 3, 4);
    scene.add(directionalLight);

    // Bone
    let headBone: THREE.Bone | null = null;

    // 원래 Head Bone 회전값
    const headBaseRotation = new THREE.Euler();

    loadCharacter(
        '/models/3DChicken.glb',
        (model) => {
            scene.add(model);

            // 모델 중심 / 카메라 위치 계산
            const box = new THREE.Box3().setFromObject(model);

            const size = new THREE.Vector3();
            const center = new THREE.Vector3();

            box.getSize(size);
            box.getCenter(center);

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

            // Head Bone 찾기
            const head = model.getObjectByName('Head');

            if (head instanceof THREE.Bone) {
                headBone = head;

                // Blender에서 만들어둔 기본 자세 저장
                headBaseRotation.copy(head.rotation);

                console.log('Head Bone 연결 성공:', headBone);
            } else {
                console.error('Head Bone을 찾지 못했습니다.');
            }
        }
    );

    function setHeadAngles(
        yaw: number,
        pitch: number,
        roll: number
    ) {
        if (!headBone) return;

        // degree → radian
        const yawRad = THREE.MathUtils.degToRad(yaw);
        const pitchRad = THREE.MathUtils.degToRad(pitch);
        const rollRad = THREE.MathUtils.degToRad(roll);

        // 일단 일반적인 XYZ 축 기준으로 테스트
        headBone.rotation.x =
            headBaseRotation.x - pitchRad;

        headBone.rotation.y =
            headBaseRotation.y + yawRad;

        headBone.rotation.z =
            headBaseRotation.z + rollRad;
    }

    let animationFrameId = 0;

    function animate() {
        animationFrameId =
            requestAnimationFrame(animate);

        renderer.render(scene, camera);
    }

    animate();

    function dispose() {
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