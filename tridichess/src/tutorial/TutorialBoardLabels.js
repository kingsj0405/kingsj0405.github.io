/**
 * TutorialBoardLabels — Step 1 보드 식별 DOM 라벨 오버레이.
 * THREE.Vector3 → screen 투영으로 각 프레임 위치 갱신.
 *
 * 사용:
 *   const labels = new TutorialBoardLabels({ camera, renderer, getBoardCenter, state });
 *   labels.show();
 *   labels.hide();
 *   // render loop 또는 OrbitControls change 에서 labels.update();
 */
import * as THREE from 'three';
import { getBoardCenter } from '../renderer/CoordMapper.js';

const LABEL_DEFS = [
    { id: 'W',   text: 'Main W',   cls: 'main' },
    { id: 'N',   text: 'Main N',   cls: 'main' },
    { id: 'B',   text: 'Main B',   cls: 'main' },
    { id: 'QL1', text: 'AB QL1',   cls: 'ab' },
    { id: 'KL1', text: 'AB KL1',   cls: 'ab' },
    { id: 'QL3', text: 'AB QL3',   cls: 'ab' },
    { id: 'KL3', text: 'AB KL3',   cls: 'ab' },
];

export class TutorialBoardLabels {
    constructor({ camera, renderer, getState }) {
        this.camera = camera;
        this.renderer = renderer;
        this.getState = getState;
        this.root = null;
        this.labels = [];
        this._raf = null;
        this._visible = false;
        this._build();
    }

    _build() {
        const root = document.createElement('div');
        root.id = 'tutorial-board-labels';
        document.body.appendChild(root);
        this.root = root;

        for (const def of LABEL_DEFS) {
            const el = document.createElement('div');
            el.className = 'tut-board-label ' + def.cls;
            el.textContent = def.text;
            root.appendChild(el);
            this.labels.push({ ...def, el });
        }
    }

    show() {
        this._visible = true;
        this.root.dataset.show = 'true';
        this._loop();
    }

    hide() {
        this._visible = false;
        this.root.dataset.show = 'false';
        if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    }

    _loop() {
        if (!this._visible) return;
        this.update();
        this._raf = requestAnimationFrame(() => this._loop());
    }

    update() {
        const state = this.getState();
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const v = new THREE.Vector3();
        for (const lbl of this.labels) {
            const c = getBoardCenter(lbl.id, state);
            v.set(c.x, c.y + (lbl.cls === 'ab' ? 6 : 8), c.z);
            v.project(this.camera);
            const x = rect.left + (v.x * 0.5 + 0.5) * rect.width;
            const y = rect.top  + (-v.y * 0.5 + 0.5) * rect.height;
            const inFront = v.z < 1;
            lbl.el.style.left = `${x}px`;
            lbl.el.style.top  = `${y}px`;
            lbl.el.style.opacity = inFront ? '1' : '0';
        }
    }
}
