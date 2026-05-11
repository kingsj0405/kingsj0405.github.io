/**
 * BoardRenderer.js — 물리 보드 메시 + 클릭 가능 칸 메시 (M4 D-3: state-aware).
 *
 *   - setupPhysicalBoards(scene, state) — 4 AB plate 는 state.boards anchor 따라
 *   - setupLogicalSquares(scene, ..., state) — 각 칸 mesh 의 위치 동적
 *   - updateBoardPositions(state) — AB 가 이동했을 때 plate + square mesh 위치 갱신
 */

import * as THREE from 'three';
import { SQ, LEVEL_H } from '../config/constants.js';
import { squareToVector3, getBoardCenter } from './CoordMapper.js';
import { getAllSquares, LEVELS } from '../model/SquareId.js';

let _mainPlateMeshes = {};       // boardId → Mesh
let _attackPlateMeshes = {};
let _squareMeshes = new Map();   // sqKey → Mesh (for AB updates)

export function setupPhysicalBoards(scene, state) {
    const createBoard = (w, h, x, y, z, color) => {
        const geo = new THREE.BoxGeometry(w * SQ, 1, h * SQ);
        const mat = new THREE.MeshPhysicalMaterial({
            color, metalness: 0.1, roughness: 0.1,
            transmission: 0.6, opacity: 0.5, transparent: true,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);

        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geo),
            new THREE.LineBasicMaterial({ color: 0x888888 })
        );
        mesh.add(edges);
        return mesh;
    };

    // 메인 보드 3장 (고정)
    for (const id of ['W', 'N', 'B']) {
        const c = getBoardCenter(id, state);
        _mainPlateMeshes[id] = createBoard(4, 4, c.x, c.y, c.z, 0x003366);
    }

    // 어택 보드 4장 (state 기반 동적 위치)
    for (const id of ['QL1', 'KL1', 'QL3', 'KL3']) {
        const c = getBoardCenter(id, state);
        _attackPlateMeshes[id] = createBoard(2, 2, c.x, c.y, c.z, 0x660000);
    }
}

/**
 * AB 가 움직였을 때 plate + 그 보드의 squareMeshes 위치 갱신.
 */
export function updateBoardPositions(state) {
    for (const id of ['QL1', 'KL1', 'QL3', 'KL3']) {
        const plate = _attackPlateMeshes[id];
        if (!plate) continue;
        const c = getBoardCenter(id, state);
        plate.position.set(c.x, c.y, c.z);
    }
    // 모든 AB 칸 mesh 갱신
    for (const [key, mesh] of _squareMeshes) {
        const sq = mesh.userData.squareId;
        if (LEVELS.MAIN.includes(sq.level)) continue;
        const pos = squareToVector3(sq, state);
        mesh.position.copy(pos);
    }
}

export function setupLogicalSquares(scene, renderer, camera, onSquareClick, state) {
    const geo = new THREE.BoxGeometry(SQ * 0.9, 0.5, SQ * 0.9);
    _squareMeshes = new Map();

    for (const squareId of getAllSquares()) {
        const pos = squareToVector3(squareId, state);
        const fileIdx = { a: 0, b: 1, c: 2, d: 3 }[squareId.file];
        const isBlack = (fileIdx + squareId.rank) % 2 === 1;
        const mat = new THREE.MeshPhongMaterial({
            color: isBlack ? 0x222222 : 0xeeeeee,
            emissive: 0x000000,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        mesh.userData = { squareId, baseColor: mat.color.getHex() };
        scene.add(mesh);
        _squareMeshes.set(squareId.toString(), mesh);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    renderer.domElement.addEventListener('pointerdown', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects([..._squareMeshes.values()]);
        if (hits.length > 0) onSquareClick(hits[0].object.userData.squareId);
    });

    return _squareMeshes;
}
