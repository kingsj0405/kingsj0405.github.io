/**
 * SceneSetup.js — Three.js 씬·카메라·조명·컨트롤 초기화
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SQ, LEVEL_H } from '../config/constants.js';

/**
 * Three.js 씬 전체를 초기화하고 필요한 객체를 반환한다.
 *
 * @param {HTMLElement} container  렌더러가 마운트될 DOM 요소
 * @returns {{ scene, camera, renderer, controls }}
 */
export function setupScene(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.0015);

    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(100, 80, 100);
    camera.lookAt(0, 20, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 조명
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const spot = new THREE.SpotLight(0xffffff, 1.2);
    spot.position.set(50, 150, 50);
    spot.castShadow = true;
    scene.add(spot);

    const rimLight = new THREE.PointLight(0x00d2ff, 0.5);
    rimLight.position.set(-50, 50, -50);
    scene.add(rimLight);

    // 받침대 & 스파인
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(15, 20, 5, 32),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    base.position.set(0, -2.5, 0);
    scene.add(base);

    const spine = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 90, 16),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    spine.position.set(0, 40, -2 * SQ);
    scene.add(spine);

    return { scene, camera, renderer, controls };
}
