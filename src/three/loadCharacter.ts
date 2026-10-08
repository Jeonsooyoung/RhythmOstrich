import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function loadCharacter(
    path: string,
    onLoad: (model: THREE.Group) => void
) {
    const loader = new GLTFLoader();

    loader.load(
        path,
        (gltf) => {
            const model = gltf.scene;

            model.traverse((child) => {
                console.log(child.name, child.type);
            });

            onLoad(model);
        },
        undefined,
        (error) => {
            console.error('GLB 로드 실패:', error);
        }
    );
}