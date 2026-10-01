import {
    FaceLandmarker,
    FilesetResolver,
} from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;

export async function createFaceLandmarker() {
    if (faceLandmarker) {
        return faceLandmarker;
    }

    const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath: '/models/face_landmarker.task',
                delegate: 'GPU',
            },

            runningMode: 'VIDEO',

            numFaces: 1,

            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,

            outputFaceBlendshapes: false,

            //얼굴 3차원 변환 정보
            outputFacialTransformationMatrixes: true,
        }
    );

    return faceLandmarker;
}