/**
 * DebugOverlay.js — 각 칸에 좌표 라벨 ("a1(W)" 등)을 표시하는 개발용 오버레이
 *
 * CSS2DRenderer를 사용해 3D 공간에 HTML 라벨을 띄운다.
 * 토글 버튼으로 표시/숨김을 전환한다.
 */

import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { squareToVector3 } from '../renderer/CoordMapper.js';
import { getAllSquares } from '../model/SquareId.js';

export class DebugOverlay {
    /**
     * @param {HTMLElement}   container  Three.js 렌더러가 붙어있는 DOM 컨테이너
     * @param {THREE.Scene}   scene
     */
    constructor(container, scene) {
        this._scene   = scene;
        this._visible = false;
        this._labels  = []; // { object: CSS2DObject, div: HTMLDivElement }[]

        // CSS2DRenderer 생성 및 마운트
        this._css2d = new CSS2DRenderer();
        this._css2d.setSize(container.clientWidth, container.clientHeight);
        Object.assign(this._css2d.domElement.style, {
            position:      'absolute',
            top:           '0px',
            left:          '0px',
            pointerEvents: 'none',
        });
        container.appendChild(this._css2d.domElement);

        this._initLabels();
    }

    /** 모든 칸에 라벨 CSS2DObject 생성 (초기에 숨김) */
    _initLabels() {
        for (const sq of getAllSquares()) {
            const div = document.createElement('div');
            div.textContent = sq.toString();
            div.style.cssText = [
                'color:#00ff88',
                'font-size:8px',
                'font-family:monospace',
                'background:rgba(0,0,0,0.7)',
                'padding:1px 3px',
                'border-radius:2px',
                'white-space:nowrap',
                'display:none',
            ].join(';');

            const labelObj = new CSS2DObject(div);
            const pos = squareToVector3(sq);
            labelObj.position.set(pos.x, pos.y + 4, pos.z);

            this._scene.add(labelObj);
            this._labels.push({ object: labelObj, div });
        }
    }

    /** 라벨 표시/숨김 토글 */
    toggle() {
        this._visible = !this._visible;
        const display = this._visible ? 'block' : 'none';
        for (const { div } of this._labels) {
            div.style.display = display;
        }
    }

    get isVisible() { return this._visible; }

    /**
     * 렌더 루프에서 매 프레임 호출한다.
     * @param {THREE.Camera} camera
     */
    render(camera) {
        this._css2d.render(this._scene, camera);
    }

    /**
     * 뷰포트 크기 변경 시 호출한다.
     * @param {number} width
     * @param {number} height
     */
    onResize(width, height) {
        this._css2d.setSize(width, height);
    }
}
