/**
 * TutorialController — step state machine + lifecycle dispatch.
 * Step 의 onEnter/onExit 콜백이 실제 effect (카메라/라벨/click filter) 를 수행.
 *
 * api: 호스트 (main.js) 가 제공하는 hook 묶음 (ADR-0012).
 */
import { STEPS, TUTORIAL_SEEN_KEY, restoreTutorialSnapshot } from './steps.js';
import { TutorialOverlay } from './TutorialOverlay.js';
import { WelcomeModal, isFirstVisit } from './WelcomeModal.js';

export class TutorialController {
    constructor({ api }) {
        this.api = api;
        this.index = -1;
        this.steps = STEPS;
        this.overlay = new TutorialOverlay({
            onNext: () => this.next(),
            onSkip: () => this.end(),
        });
        this.welcome = null;
    }

    maybeAutoLaunch() {
        if (!isFirstVisit()) return;
        this.welcome = new WelcomeModal({
            onStart: () => this.start(),
            onSkip: () => { /* 게임으로 바로 진입 */ },
        });
        this.welcome.show();
    }

    start() {
        if (this.index >= 0) this._exitCurrent();
        this.index = 0;
        this._enterCurrent();
    }

    next() {
        if (this.index < 0) return;
        this._exitCurrent();
        if (this.index >= this.steps.length - 1) { this.end(true); return; }
        this.index += 1;
        this._enterCurrent();
    }

    end(silent = false) {
        if (this.index >= 0) this._exitCurrent();
        this.index = -1;
        this.overlay.hide();
        restoreTutorialSnapshot(this.api);
        try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1'); } catch (_) { /* 무시 */ }
    }

    restart() {
        if (this.welcome) this.welcome.hide();
        this.start();
    }

    _enterCurrent() {
        const step = this.steps[this.index];
        if (!step) return;
        this.overlay.show(step, this.index, this.steps.length, { autoAdvance: !!step.autoAdvance });
        if (step.spotlight) {
            this._spotlightEl = document.querySelector(step.spotlight);
            if (this._spotlightEl) this._spotlightEl.classList.add('tut-spotlight');
        }
        if (typeof step.onEnter === 'function') {
            try {
                step.onEnter.call(step, { api: this.api, controller: this, bubble: this.overlay.bubbleEl() });
            } catch (err) {
                console.error('Tutorial step onEnter error:', err);
            }
        }
    }

    _exitCurrent() {
        const step = this.steps[this.index];
        if (!step) return;
        if (typeof step.onExit === 'function') {
            try { step.onExit.call(step, { api: this.api, controller: this }); }
            catch (err) { console.error('Tutorial step onExit error:', err); }
        }
        if (this._spotlightEl) {
            this._spotlightEl.classList.remove('tut-spotlight');
            this._spotlightEl = null;
        }
    }
}
