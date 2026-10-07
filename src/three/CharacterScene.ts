import * as THREE from 'three';
import { loadCharacter } from './loadCharacter';

export function createCharacterScene(
    container: HTMLDivElement
) {
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

    // GLB 불러오기
    loadCharacter(
        '/models/3DChicken.glb',
        (model) => {
            scene.add(model);

            // 모델 전체 크기와 중심 계산
            const box = new THREE.Box3().setFromObject(model);

            const size = new THREE.Vector3();
            const center = new THREE.Vector3();

            box.getSize(size);
            box.getCenter(center);

            // 모델 중심을 원점으로 이동
            model.position.sub(center);

            // 모델 크기에 맞게 카메라 거리 자동 설정
            const maxSize = Math.max(
                size.x,
                size.y,
                size.z
            );

            const distance = maxSize * 1.2;

            camera.position.set(
                0,
                0,
                distance
            );

            camera.lookAt(0, 0, 0);

            console.log('캐릭터 크기:', size);
            console.log('캐릭터 중심:', center);
            console.log('캐릭터 로드 완료');
        }
    );

    function animate() {
        requestAnimationFrame(animate);

        renderer.render(scene, camera);
    }

    animate();

    return {
        scene,
        camera,
        renderer,
    };
}