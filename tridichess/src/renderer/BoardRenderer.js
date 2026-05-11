/**
 * BoardRenderer.js — 물리 보드 메시 + 클릭 가능 칸 메시 생성 (M2 버전)
 *
 * M2 변경사항:
 *   - 물리 보드 위치를 SquareId 좌표계에 맞게 갱신 (메인 보드 Z 오프셋 제거)
 *   - squareMeshes를 Map<string, THREE.Mesh>로 전환
 *   - mesh.userData.squareId = SquareId 저장 (레이캐스트 역산용)
 */

import * as THREE from 'three';
import { SQ, LEVEL_H } from '../config/constants.js';
import { squareToVector3 } from './CoordMapper.js';
import { getAllSquares, FILE_INDEX } from '../model/SquareId.js';

/**
 * 유리 보드 플레이트(물리 구조)를 씬에 추가한다.
 * @param {THREE.Scene} scene
 */
export function setupPhysicalBoards(scene) {
    const createBoard = (w, h, x, y, z, color) => {
        const geo = new THREE.BoxGeometry(w * SQ, 1, h * SQ);
        const mat = new THREE.MeshPhysicalMaterial({
            color,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.6,
            opacity: 0.5,
            transparent: true,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);

        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geo),
            new THREE.LineBasicMaterial({ color: 0x888888 })
        );
        mesh.add(edges);
    };

    // ── 메인 보드 3장 (Y 상승 + Z 후퇴 staircase, ADR-0007) ──
    // 각 다음 보드가 이전의 rank 3 위에서 시작 (2 rank 씩 겹침).
    createBoard(4, 4, 0,  0,            0,        0x003366); // W (z=0)
    createBoard(4, 4, 0,  LEVEL_H,      -2 * SQ,  0x003366); // N (z=-28)
    createBoard(4, 4, 0,  2 * LEVEL_H,  -4 * SQ,  0x003366); // B (z=-56)

    // ── 어택 보드 4장 (한 모서리가 부모 메인 보드 모서리와 겹침) ──
    // QL1 b2 = W a1, KL1 a2 = W d1 (xy 일치).
    // QL3 b1 = B a4, KL3 a1 = B d4 (xy 일치).
    // plate center: x = ±2*SQ, z(QL1/KL1) = +2*SQ, z(QL3/KL3) = -6*SQ.
    createBoard(2, 2, -2 * SQ,  LEVEL_H * 0.5,    2 * SQ, 0x660000); // QL1
    createBoard(2, 2,  2 * SQ,  LEVEL_H * 0.5,    2 * SQ, 0x660000); // KL1
    createBoard(2, 2, -2 * SQ,  LEVEL_H * 2.5,   -6 * SQ, 0x660000); // QL3
    createBoard(2, 2,  2 * SQ,  LEVEL_H * 2.5,   -6 * SQ, 0x660000); // KL3
}

/**
 * 클릭 가능한 논리 칸 메시를 생성하고 레이캐스터를 등록한다.
 *
 * @param {THREE.Scene}    scene
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Camera}   camera
 * @param {function(import('../model/SquareId.js').SquareId): void} onSquareClick
 * @returns {Map<string, THREE.Mesh>}  squareMeshes (squareId.toString() → Mesh)
 */
export function setupLogicalSquares(scene, renderer, camera, onSquareClick) {
    const geo = new THREE.BoxGeometry(SQ * 0.9, 0.5, SQ * 0.9);
    /** @type {Map<string, THREE.Mesh>} */
    const squareMeshes = new Map();

    for (const squareId of getAllSquares()) {
        const pos = squareToVector3(squareId);

        const fileIdx = FILE_INDEX[squareId.file];
        const isBlack = (fileIdx + squareId.rank) % 2 === 1;
        const mat = new THREE.MeshPhongMaterial({
            color:   isBlack ? 0x222222 : 0xeeeeee,
            emissive: 0x000000,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.userData = {
            squareId,                          // SquareId 역산용
            baseColor: mat.color.getHex(),
        };

        scene.add(mesh);
        squareMeshes.set(squareId.toString(), mesh);
    }

    // 레이캐스터 등록
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    renderer.domElement.addEventListener('pointerdown', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects([...squareMeshes.values()]);
        if (hits.length > 0) {
            onSquareClick(hits[0].object.userData.squareId);
        }
    });

    return squareMeshes;
}
