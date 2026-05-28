/**
 * WelcomeModal — first-visit 진입 modal.
 * "튜토리얼 시작" / "건너뛰기" / "다시 보지 않기" 3 액션.
 * localStorage flag (TUTORIAL_SEEN_KEY) 는 컨트롤러에서 관리.
 */
import { TUTORIAL_SEEN_KEY } from './steps.js';

export class WelcomeModal {
    constructor({ onStart, onSkip }) {
        this.onStart = onStart;
        this.onSkip = onSkip;
        this.root = null;
        this._build();
    }

    _build() {
        const root = document.createElement('div');
        root.id = 'tutorial-welcome';
        root.innerHTML = `
            <div class="tw-card">
                <h3>처음 오셨나요?</h3>
                <p>Tri-Dimensional Chess 는 평면 체스와 다른 <strong>3D 보드 구조</strong> 를 사용합니다.
                6단계 짧은 튜토리얼로 보드 인지·카메라 조작·첫 수까지 안내합니다 (약 2~3분).</p>
                <div class="tw-actions">
                    <button type="button" class="tw-start">튜토리얼 시작</button>
                    <button type="button" class="tw-skip">건너뛰기</button>
                </div>
                <label class="tw-never">
                    <input type="checkbox" class="tw-never-check"> 다시 보지 않기
                </label>
            </div>
        `;
        root.querySelector('.tw-start').addEventListener('click', () => this._finish('start'));
        root.querySelector('.tw-skip').addEventListener('click', () => this._finish('skip'));
        document.body.appendChild(root);
        this.root = root;
    }

    _finish(action) {
        const never = this.root.querySelector('.tw-never-check').checked;
        if (never) {
            try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1'); } catch (_) { /* private mode 등 무시 */ }
        }
        this.hide();
        if (action === 'start') this.onStart && this.onStart();
        else this.onSkip && this.onSkip();
    }

    show() { this.root.dataset.show = 'true'; }
    hide() { this.root.dataset.show = 'false'; }
}

export function isFirstVisit() {
    try { return localStorage.getItem(TUTORIAL_SEEN_KEY) !== '1'; }
    catch (_) { return true; }
}
