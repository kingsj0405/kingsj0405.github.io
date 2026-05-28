/**
 * TutorialArrows — Step 3 등에서 "여기 클릭!" 강조 화살표 오버레이.
 *
 *   - 3D 뷰: squareMesh.position 을 카메라로 projection → DOM 화살표 배치 (frame loop).
 *   - 2D Control Panel: data-sq 셀에 클래스 부착 → CSS 화살표.
 *
 * 사용:
 *   const arrows = new TutorialArrows({ camera, renderer, squareMeshes });
 *   arrows.point('b3(W)', { label: '여기 클릭!' });
 *   arrows.point('b4(W)');
 *   ...
 *   arrows.clear();
 */
import * as THREE from 'three';

const PANEL_CLASS = 'tut-arrow-2d';

export class TutorialArrows {
    constructor({ camera, renderer, squareMeshes }) {
        this.camera = camera;
        this.renderer = renderer;
        this.squareMeshes = squareMeshes;
        this.root = null;
        this.items = []; // [{ sqKey, label, arrowEl, panelCells }]
        this._raf = null;
        this._build();
    }

    _build() {
        const root = document.createElement('div');
        root.id = 'tutorial-arrows';
        document.body.appendChild(root);
        this.root = root;
    }

    point(sqKey, { label = '여기 클릭!' } = {}) {
        const arrowEl = document.createElement('div');
        arrowEl.className = 'tut-arrow';
        arrowEl.innerHTML = `<div class="tut-arrow-mark">▼</div><div class="tut-arrow-label">${label}</div>`;
        this.root.appendChild(arrowEl);

        const panelCells = Array.from(document.querySelectorAll(`#panel-2d [data-sq="${sqKey}"]`));
        panelCells.forEach(c => c.classList.add(PANEL_CLASS));

        this.items.push({ sqKey, label, arrowEl, panelCells });
        if (!this._raf) this._loop();
    }

    clear() {
        for (const it of this.items) {
            it.arrowEl.remove();
            it.panelCells.forEach(c => c.classList.remove(PANEL_CLASS));
        }
        this.items = [];
        if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    }

    destroy() {
        this.clear();
        if (this.root) { this.root.remove(); this.root = null; }
    }

    _loop() {
        if (this.items.length === 0) { this._raf = null; return; }
        this._update();
        this._raf = requestAnimationFrame(() => this._loop());
    }

    _update() {
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const v = new THREE.Vector3();
        for (const it of this.items) {
            const mesh = this.squareMeshes.get(it.sqKey);
            if (!mesh) { it.arrowEl.style.opacity = '0'; continue; }
            v.copy(mesh.position);
            v.y += 14; // 칸 위로 띄움
            v.project(this.camera);
            const x = rect.left + (v.x * 0.5 + 0.5) * rect.width;
            const y = rect.top  + (-v.y * 0.5 + 0.5) * rect.height;
            const inFront = v.z < 1;
            it.arrowEl.style.left = `${x}px`;
            it.arrowEl.style.top  = `${y}px`;
            it.arrowEl.style.opacity = inFront ? '1' : '0';
        }
    }
}
