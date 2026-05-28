/**
 * TutorialOverlay — step 말풍선 + 진행 dot + Back/Skip/Next 버튼.
 * 헤더 드래그로 모달 위치 이동.
 *
 * 사용:
 *   const overlay = new TutorialOverlay({ onNext, onSkip, onBack });
 *   overlay.show(step, index, total);
 *   overlay.hide();
 */
export class TutorialOverlay {
    constructor({ onNext, onSkip, onBack }) {
        this.onNext = onNext;
        this.onSkip = onSkip;
        this.onBack = onBack;
        this.root = null;
        this._drag = null;
        this._build();
    }

    _build() {
        const root = document.createElement('div');
        root.id = 'tutorial-overlay';
        root.innerHTML = `
            <div class="tut-bubble">
                <div class="tut-header" data-drag-handle>
                    <span class="tut-title"></span>
                    <button class="tut-skip" type="button" title="튜토리얼 종료">✕</button>
                </div>
                <div class="tut-body"></div>
                <div class="tut-footer">
                    <div class="tut-left-actions">
                        <button class="tut-back" type="button" title="이전 step">← 이전</button>
                    </div>
                    <div class="tut-dots"></div>
                    <button class="tut-next" type="button">다음 →</button>
                </div>
            </div>
        `;
        root.querySelector('.tut-skip').addEventListener('click', () => this.onSkip && this.onSkip());
        root.querySelector('.tut-next').addEventListener('click', () => this.onNext && this.onNext());
        root.querySelector('.tut-back').addEventListener('click', () => this.onBack && this.onBack());

        // 헤더 드래그로 모달 이동.
        const header = root.querySelector('[data-drag-handle]');
        header.addEventListener('pointerdown', (e) => this._startDrag(e));

        document.body.appendChild(root);
        this.root = root;
    }

    _startDrag(e) {
        // 버튼 (.tut-skip) 클릭 시는 드래그 시작 안 함.
        if (e.target.closest('button')) return;
        const rect = this.root.getBoundingClientRect();
        this._drag = {
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            pointerId: e.pointerId,
        };
        e.target.setPointerCapture?.(e.pointerId);
        const onMove = (ev) => {
            if (!this._drag || ev.pointerId !== this._drag.pointerId) return;
            const x = ev.clientX - this._drag.offsetX;
            const y = ev.clientY - this._drag.offsetY;
            // free 모드 — placement attr 무시하고 left/top 직접 적용.
            this.root.dataset.placement = 'free';
            this.root.style.left = `${x}px`;
            this.root.style.top  = `${y}px`;
            this.root.style.right  = 'auto';
            this.root.style.bottom = 'auto';
            this.root.style.transform = 'none';
        };
        const onUp = (ev) => {
            this._drag = null;
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }

    show(step, index, total, opts = {}) {
        const titleEl = this.root.querySelector('.tut-title');
        const bodyEl  = this.root.querySelector('.tut-body');
        const dotsEl  = this.root.querySelector('.tut-dots');
        const nextEl  = this.root.querySelector('.tut-next');
        const backEl  = this.root.querySelector('.tut-back');

        titleEl.textContent = step.title;
        bodyEl.innerHTML    = step.body;
        dotsEl.innerHTML = '';
        for (let i = 0; i < total; i += 1) {
            const dot = document.createElement('span');
            dot.className = 'tut-dot' + (i === index ? ' active' : '');
            dotsEl.appendChild(dot);
        }
        nextEl.textContent = (index === total - 1) ? '마치기 ✓' : '다음 →';
        nextEl.style.display = opts.autoAdvance ? 'none' : '';
        backEl.style.visibility = (index === 0) ? 'hidden' : '';

        // placement 변경 시 inline drag style 초기화.
        this.root.style.left = ''; this.root.style.top = '';
        this.root.style.right = ''; this.root.style.bottom = '';
        this.root.style.transform = '';
        this.root.dataset.show = 'true';
        this.root.dataset.placement = step.placement || 'bottom-right';
    }

    hide() { this.root.dataset.show = 'false'; }
    bubbleEl() { return this.root.querySelector('.tut-bubble'); }
}
