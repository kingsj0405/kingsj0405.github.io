/**
 * TutorialOverlay — step 말풍선 + 진행 dot + Skip/Next 버튼.
 * DOM-only. Three.js / GameState 의존 없음.
 *
 * 사용:
 *   const overlay = new TutorialOverlay({ onNext, onSkip });
 *   overlay.show(step, index, total);
 *   overlay.hide();
 */
export class TutorialOverlay {
    constructor({ onNext, onSkip }) {
        this.onNext = onNext;
        this.onSkip = onSkip;
        this.root = null;
        this._build();
    }

    _build() {
        const root = document.createElement('div');
        root.id = 'tutorial-overlay';
        root.innerHTML = `
            <div class="tut-bubble">
                <div class="tut-header">
                    <span class="tut-title"></span>
                    <button class="tut-skip" type="button" title="튜토리얼 종료">✕</button>
                </div>
                <div class="tut-body"></div>
                <div class="tut-footer">
                    <div class="tut-dots"></div>
                    <button class="tut-next" type="button">다음 →</button>
                </div>
            </div>
        `;
        root.querySelector('.tut-skip').addEventListener('click', () => this.onSkip && this.onSkip());
        root.querySelector('.tut-next').addEventListener('click', () => this.onNext && this.onNext());
        document.body.appendChild(root);
        this.root = root;
    }

    show(step, index, total) {
        const titleEl = this.root.querySelector('.tut-title');
        const bodyEl  = this.root.querySelector('.tut-body');
        const dotsEl  = this.root.querySelector('.tut-dots');
        const nextEl  = this.root.querySelector('.tut-next');

        titleEl.textContent = step.title;
        bodyEl.innerHTML    = step.body;
        dotsEl.innerHTML = '';
        for (let i = 0; i < total; i += 1) {
            const dot = document.createElement('span');
            dot.className = 'tut-dot' + (i === index ? ' active' : '');
            dotsEl.appendChild(dot);
        }
        nextEl.textContent = (index === total - 1) ? '마치기 ✓' : '다음 →';
        this.root.dataset.show = 'true';
        this.root.dataset.placement = step.placement || 'bottom-right';
    }

    hide() {
        this.root.dataset.show = 'false';
    }
}
