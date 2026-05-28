/**
 * TutorialController — step index 상태 머신.
 * GameState/렌더러와 격리되어 있다 (Phase 2 first-step prototype 한정).
 * 후속 sprint 에서 step.predicate 라우팅 + 격리 GameState 인스턴스 추가 예정 (ADR-0012).
 */
import { STEPS, TUTORIAL_SEEN_KEY } from './steps.js';
import { TutorialOverlay } from './TutorialOverlay.js';
import { WelcomeModal, isFirstVisit } from './WelcomeModal.js';

export class TutorialController {
    constructor() {
        this.index = -1;
        this.steps = STEPS;
        this.overlay = new TutorialOverlay({
            onNext: () => this.next(),
            onSkip: () => this.end(),
        });
        this.welcome = null;
    }

    /** 첫 방문이면 welcome modal 노출, 아니면 no-op. */
    maybeAutoLaunch() {
        if (!isFirstVisit()) return;
        this.welcome = new WelcomeModal({
            onStart: () => this.start(),
            onSkip: () => { /* 게임으로 바로 진입 */ },
        });
        this.welcome.show();
    }

    start() {
        this.index = 0;
        this.overlay.show(this.steps[0], 0, this.steps.length);
    }

    next() {
        if (this.index < 0) return;
        if (this.index >= this.steps.length - 1) { this.end(); return; }
        this.index += 1;
        this.overlay.show(this.steps[this.index], this.index, this.steps.length);
    }

    end() {
        this.index = -1;
        this.overlay.hide();
        try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1'); } catch (_) { /* 무시 */ }
    }

    /** 사이드바 버튼에서 재진입. */
    restart() {
        if (this.welcome) this.welcome.hide();
        this.start();
    }
}
