(function () {
    var states = {
        idle: { row: 0, frames: 7, delay: 480 },
        waving: { row: 3, frames: 4, delay: 270 },
        jumping: { row: 4, frames: 5, delay: 190 },
        failed: { row: 5, frames: 8, delay: 320 },
        waiting: { row: 6, frames: 6, delay: 420 },
        running: { row: 7, frames: 6, delay: 230 },
        review: { row: 8, frames: 6, delay: 360 }
    };

    var sprite = document.getElementById("pet-sprite");
    var stateLabel = document.getElementById("preview-state");
    var stateButtons = Array.prototype.slice.call(document.querySelectorAll("[data-state]"));
    var copyPromptButton = document.getElementById("copy-prompt");
    var copyLinkButton = document.getElementById("copy-link");
    var installPrompt = document.getElementById("install-prompt");
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var currentState = "idle";
    var frame = 0;
    var timer = null;

    function renderFrame() {
        var config = states[currentState];
        sprite.style.backgroundPosition = (frame / 7 * 100) + "% " + (config.row / 10 * 100) + "%";
    }

    function scheduleNextFrame() {
        window.clearTimeout(timer);
        if (prefersReducedMotion.matches || document.hidden) {
            frame = 0;
            renderFrame();
            return;
        }

        timer = window.setTimeout(function () {
            frame = (frame + 1) % states[currentState].frames;
            renderFrame();
            scheduleNextFrame();
        }, states[currentState].delay);
    }

    function selectState(name, button) {
        if (!states[name]) return;
        currentState = name;
        frame = 0;
        stateButtons.forEach(function (candidate) {
            var active = candidate === button;
            candidate.classList.toggle("is-active", active);
            candidate.setAttribute("aria-pressed", active ? "true" : "false");
        });
        stateLabel.textContent = name;
        renderFrame();
        scheduleNextFrame();
    }

    function copyText(value, button, successLabel) {
        var original = button.textContent;
        var done = function () {
            button.textContent = successLabel;
            window.setTimeout(function () { button.textContent = original; }, 1600);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(value).then(done);
            return;
        }

        var textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        done();
    }

    stateButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            selectState(button.dataset.state, button);
        });
    });

    copyPromptButton.addEventListener("click", function () {
        copyText(installPrompt.textContent.trim(), copyPromptButton, "복사됨 ✓");
    });

    copyLinkButton.addEventListener("click", function () {
        copyText("https://yangspace.co.kr/pets/sejongyang/", copyLinkButton, "링크 복사됨 ✓");
    });

    document.addEventListener("visibilitychange", scheduleNextFrame);
    prefersReducedMotion.addEventListener("change", scheduleNextFrame);
    renderFrame();
    scheduleNextFrame();
}());
