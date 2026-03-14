(function () {
    var STORAGE_KEY = "preferred-language";
    var QUERY_KEY = "lang";
    var SUPPORTED_LANGUAGES = ["ko", "en"];
    var repoMetadata = null;
    var currentDictionary = null;

    function detectPreferredLanguage() {
        var saved = window.localStorage.getItem(STORAGE_KEY);
        if (SUPPORTED_LANGUAGES.indexOf(saved) !== -1) {
            return saved;
        }

        return navigator.language && navigator.language.toLowerCase().indexOf("ko") === 0 ? "ko" : "en";
    }

    function getLanguageFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var value = params.get(QUERY_KEY);
        return SUPPORTED_LANGUAGES.indexOf(value) !== -1 ? value : null;
    }

    function resolveLanguage() {
        return getLanguageFromUrl() || detectPreferredLanguage();
    }

    function updateLanguageUrl(language) {
        var url = new URL(window.location.href);
        url.searchParams.set(QUERY_KEY, language);
        window.history.replaceState({}, "", url.toString());
    }

    function getNestedValue(dictionary, key) {
        return key.split(".").reduce(function (value, token) {
            if (!value || typeof value !== "object") {
                return null;
            }
            return value[token];
        }, dictionary);
    }

    function applyTranslations(dictionary) {
        currentDictionary = dictionary;
        document.documentElement.lang = dictionary.lang || "en";

        document.querySelectorAll("[data-i18n]").forEach(function (node) {
            var value = getNestedValue(dictionary, node.dataset.i18n);
            if (typeof value === "string") {
                node.textContent = value;
            }
        });

        document.querySelectorAll("[data-i18n-html]").forEach(function (node) {
            var value = getNestedValue(dictionary, node.dataset.i18nHtml);
            if (typeof value === "string") {
                node.innerHTML = value;
            }
        });

        var page = document.body.dataset.page;
        if (page) {
            var title = getNestedValue(dictionary, page + ".meta.title");
            var ogTitle = getNestedValue(dictionary, page + ".meta.ogTitle");
            var description = getNestedValue(dictionary, page + ".meta.description");

            if (title) {
                document.title = title;
            }

            if (ogTitle) {
                var ogTitleMeta = document.getElementById("meta-og-title");
                if (ogTitleMeta) {
                    ogTitleMeta.setAttribute("content", ogTitle);
                }
            }

            if (description) {
                var descriptionMeta = document.getElementById("meta-description");
                if (descriptionMeta) {
                    descriptionMeta.setAttribute("content", description);
                }
            }
        }

        updateFooter(dictionary);
        updateLanguageSwitcher(dictionary.lang || "en");
        updateLocalizedLinks(dictionary.lang || "en");
    }

    function updateLanguageSwitcher(activeLanguage) {
        document.querySelectorAll("[data-lang-switch]").forEach(function (button) {
            var isActive = button.dataset.langSwitch === activeLanguage;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    function updateLocalizedLinks(language) {
        document.querySelectorAll("[data-localized-link]").forEach(function (link) {
            var href = link.getAttribute("href");
            if (!href || href.indexOf("http") === 0) {
                return;
            }

            var url = new URL(href, window.location.origin);
            url.searchParams.set(QUERY_KEY, language);
            link.setAttribute("href", url.pathname + url.search + url.hash);
        });
    }

    function formatLastUpdated(dateString, language) {
        var locale = language === "ko" ? "ko-KR" : "en-US";
        return new Date(dateString).toLocaleString(locale, {
            timeZone: "Asia/Seoul",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short"
        });
    }

    function updateFooter(dictionary) {
        var yearNode = document.getElementById("cr_end");
        if (yearNode) {
            yearNode.textContent = String(new Date().getUTCFullYear());
        }

        var titleNode = document.getElementById("cr_title");
        if (titleNode) {
            titleNode.textContent = document.title;
        }

        if (!repoMetadata) {
            fetch("https://api.github.com/users/kingsj0405/repos")
                .then(function (response) {
                    return response.json();
                })
                .then(function (repos) {
                    repoMetadata = repos.find(function (repo) {
                        return repo.name === "kingsj0405.github.io";
                    }) || null;
                    updateFooter(dictionary);
                })
                .catch(function () {
                    var lastUpdatedNode = document.getElementById("last_update");
                    if (lastUpdatedNode) {
                        lastUpdatedNode.textContent = "";
                    }
                });
            return;
        }

        var startYearNode = document.getElementById("cr_from");
        if (startYearNode && repoMetadata.created_at) {
            startYearNode.textContent = String(new Date(repoMetadata.created_at).getUTCFullYear());
        }

        var lastUpdatedNode = document.getElementById("last_update");
        if (lastUpdatedNode && repoMetadata.pushed_at) {
            lastUpdatedNode.textContent = getNestedValue(dictionary, "common.footer.lastUpdated") + ": " + formatLastUpdated(repoMetadata.pushed_at, dictionary.lang || "en");
        }
    }

    function initEmailToggle(dictionary) {
        var button = document.getElementById("iemail");
        var email = document.getElementById("demail");
        if (!button || !email) {
            return;
        }

        var shown = email.dataset.shown === "true";
        button.addEventListener("click", function () {
            shown = !shown;
            email.dataset.shown = shown ? "true" : "false";
            email.textContent = shown ? "angelo.yang@lgresearch.ai" : "";
            email.style.opacity = shown ? "1" : "0";
            var key = shown ? "home.hero.hideEmail" : "home.hero.showEmail";
            var label = getNestedValue(currentDictionary || dictionary, key);
            if (label) {
                button.textContent = label;
            }
        });
    }

    function attachLanguageSwitcher() {
        document.querySelectorAll("[data-lang-switch]").forEach(function (button) {
            button.addEventListener("click", function () {
                var nextLanguage = button.dataset.langSwitch;
                if (SUPPORTED_LANGUAGES.indexOf(nextLanguage) === -1) {
                    return;
                }

                window.localStorage.setItem(STORAGE_KEY, nextLanguage);
                updateLanguageUrl(nextLanguage);
                boot(nextLanguage);
            });
        });
    }

    function boot(language) {
        fetch("/assets/i18n/" + language + ".json", { cache: "no-store" })
            .then(function (response) {
                return response.json();
            })
            .then(function (dictionary) {
                applyTranslations(dictionary);
                var button = document.getElementById("iemail");
                var email = document.getElementById("demail");
                if (button && email && email.dataset.shown === "true") {
                    button.textContent = getNestedValue(dictionary, "home.hero.hideEmail") || button.textContent;
                }
            });
    }

    document.addEventListener("DOMContentLoaded", function () {
        attachLanguageSwitcher();
        initEmailToggle({
            home: {
                hero: {
                    showEmail: "Show Email",
                    hideEmail: "Hide Email"
                }
            }
        });
        var language = resolveLanguage();
        window.localStorage.setItem(STORAGE_KEY, language);
        updateLanguageUrl(language);
        boot(language);
    });
}());
