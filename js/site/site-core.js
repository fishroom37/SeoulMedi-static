
 /* =========================================================
 * 사이트 공통 스크립트 (모든 페이지에서 로드)
 *  - 스크롤 리빌 애니메이션
 *  - 테마(다크/라이트) 토글
 *  - 진료 중 여부/시간/날씨 표시
 *  - 스크롤 시 상단 헤더 숨김
 *  - 상단 대메뉴 드롭다운 접근성
 *  - 우측 하단 플로팅 퀵슬롯
 * ========================================================= */
(function () {
    var selector = [
        ".philosophy-opening",
        ".highlight-card",
        ".service-card",
        ".philosophy-band .philosophy-media",
        ".philosophy-band .philosophy-copy",
        ".director-card",
        ".facility-card",
        ".clinic-info-layout > *",
        ".scroll-story-card",
        ".menu-tree-card",
        ".list-row:not(.list-head)",
        ".article-content .content-photo",
        ".article-content .article-block",
        ".child-card"
    ].join(", ");

    var targets = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!targets.length) {
        return;
    }

    for (var i = 0; i < targets.length; i++) {
        var item = targets[i];
        item.classList.add("reveal-target");
        item.style.setProperty("--reveal-delay", (i % 6) * 70 + "ms");
    }

    if (!("IntersectionObserver" in window)) {
        for (var j = 0; j < targets.length; j++) {
            targets[j].classList.add("is-visible");
        }
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        for (var k = 0; k < entries.length; k++) {
            if (entries[k].isIntersecting) {
                entries[k].target.classList.add("is-visible");
            } else {
                entries[k].target.classList.remove("is-visible");
            }
        }
    }, {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.2
    });

    for (var m = 0; m < targets.length; m++) {
        observer.observe(targets[m]);
    }
})();

/* ===== 테마(다크/라이트) 토글 ===== */
(function () {
    var body = document.body;
    var toggle = document.querySelector("[data-theme-toggle]");
    var label = document.querySelector("[data-theme-toggle-label]");
    var savedTheme = "";

    try {
        savedTheme = window.localStorage.getItem("iseoulTheme") || "";
    } catch (ignore) {
        savedTheme = "";
    }

    function applyTheme(theme) {
        var isDark = theme === "dark";
        body.classList.toggle("theme-dark", isDark);
        if (label) {
            label.textContent = isDark ? "Light" : "Dark";
        }
        try {
            window.localStorage.setItem("iseoulTheme", isDark ? "dark" : "light");
        } catch (ignore) {
            // 브라우저 저장소가 막힌 경우 화면 전환만 유지한다.
        }
    }

    applyTheme(savedTheme === "dark" ? "dark" : "light");

    if (toggle) {
        toggle.addEventListener("click", function () {
            applyTheme(body.classList.contains("theme-dark") ? "light" : "dark");
        });
    }
})();

/* ===== 진료 중 여부 / 현재 시간 / 날씨 ===== */
(function () {
    var clockTargets = Array.prototype.slice.call(document.querySelectorAll("[data-local-clock]"));
    var statusTargets = Array.prototype.slice.call(document.querySelectorAll("[data-open-status]"));
    var weatherTargets = Array.prototype.slice.call(document.querySelectorAll("[data-weather]"));

    function pad(value) {
        return value < 10 ? "0" + value : String(value);
    }

    function isClinicOpen(now) {
        var day = now.getDay();
        var minutes = now.getHours() * 60 + now.getMinutes();
        var isLunch = day >= 1 && day <= 5 && minutes >= 780 && minutes < 840;

        if (isLunch) {
            return false;
        }
        if (day === 1 || day === 5) {
            return minutes >= 540 && minutes < 1110;
        }
        if (day === 2 || day === 4) {
            return minutes >= 540 && minutes < 1200;
        }
        if (day === 3) {
            return minutes >= 540 && minutes < 780;
        }
        if (day === 6) {
            return minutes >= 540 && minutes < 960;
        }
        return false;
    }

    function updateStatus() {
        var now = new Date();
        var clockText = pad(now.getHours()) + ":" + pad(now.getMinutes()) + " 기준";
        var open = isClinicOpen(now);

        clockTargets.forEach(function (target) {
            target.textContent = "현재 " + clockText;
        });

        statusTargets.forEach(function (target) {
            target.textContent = open ? "오늘 진료 중 · 요일별 시간 확인" : "오늘 휴진 또는 진료 종료";
            target.classList.toggle("closed", !open);
        });
    }

    function weatherLabel(code) {
        if (code === 0) {
            return "맑음";
        }
        if (code >= 1 && code <= 3) {
            return "구름";
        }
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
            return "비";
        }
        if (code >= 71 && code <= 77) {
            return "눈";
        }
        return "확인";
    }

    function updateWeather() {
        if (!weatherTargets.length || !window.fetch) {
            return;
        }

        var url = "https://api.open-meteo.com/v1/forecast?latitude=35.8531&longitude=128.6524&current=temperature_2m,weather_code&timezone=Asia%2FSeoul";
        window.fetch(url)
            .then(function (response) {
                return response.ok ? response.json() : null;
            })
            .then(function (data) {
                if (!data || !data.current) {
                    return;
                }
                var temperature = Math.round(data.current.temperature_2m);
                var label = weatherLabel(Number(data.current.weather_code));
                weatherTargets.forEach(function (target) {
                    target.textContent = "대구 " + temperature + "°C · " + label;
                });
            })
            .catch(function () {
                weatherTargets.forEach(function (target) {
                    target.textContent = "대구 날씨 준비 중";
                });
            });
    }

    updateStatus();
    updateWeather();
    window.setInterval(updateStatus, 30000);
})();

/* ===== 홈 메뉴 이동 / 맨 위로 스크롤 ===== */
(function () {
    var focusButtons = Array.prototype.slice.call(document.querySelectorAll("[data-nav-focus]"));
    var topButtons = Array.prototype.slice.call(document.querySelectorAll("[data-scroll-top]"));
    var menuTabs = document.getElementById("homeMenuTabs");

    focusButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            if (menuTabs && typeof menuTabs.scrollIntoView === "function") {
                menuTabs.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    topButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });
})();

/* ===== 스크롤 시 상단 헤더 자동 숨김 ===== */
(function () {
    var autoHideHeader = document.querySelector("[data-auto-hide-header]");
    if (!autoHideHeader) {
        return;
    }

    var body = document.body;
    var hideDelayMs = 1200;
    var minMovePx = 4;
    var lastScrollY = window.pageYOffset || window.scrollY || 0;
    var showTimer = 0;

    function showHeaderNow() {
        body.classList.remove("is-header-scrolling");
    }

    function queueShowHeader() {
        window.clearTimeout(showTimer);
        showTimer = window.setTimeout(function () {
            showHeaderNow();
        }, hideDelayMs);
    }

    function handleScroll() {
        var currentY = window.pageYOffset || window.scrollY || 0;
        var moved = Math.abs(currentY - lastScrollY) >= minMovePx;

        if (currentY <= 10) {
            window.clearTimeout(showTimer);
            showHeaderNow();
        } else if (moved) {
            body.classList.add("is-header-scrolling");
            queueShowHeader();
        } else {
            queueShowHeader();
        }
        lastScrollY = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
})();

/* ===== 상단 대메뉴 드롭다운(터치/키보드 접근성 보강) ===== */
(function () {
    var parentItems = Array.prototype.slice.call(document.querySelectorAll(".clinic-main-menu > li.has-submenu"));
    if (!parentItems.length) {
        return;
    }

    function closeAll(except) {
        parentItems.forEach(function (item) {
            if (item !== except) {
                item.classList.remove("is-submenu-open");
                var link = item.querySelector(":scope > a");
                if (link) {
                    link.setAttribute("aria-expanded", "false");
                }
            }
        });
    }

    parentItems.forEach(function (item) {
        var link = item.querySelector(":scope > a");
        if (link) {
            link.setAttribute("aria-expanded", "false");
        }

        item.addEventListener("mouseenter", function () {
            closeAll(item);
        });

        if (link) {
            link.addEventListener("click", function (event) {
                if (window.matchMedia("(max-width: 980px)").matches) {
                    event.preventDefault();
                    var willOpen = !item.classList.contains("is-submenu-open");
                    closeAll(item);
                    item.classList.toggle("is-submenu-open", willOpen);
                    link.setAttribute("aria-expanded", willOpen ? "true" : "false");
                }
            });        }

        item.addEventListener("focusin", function () {
            closeAll(item);
            item.classList.add("is-submenu-open");
            if (link) {
                link.setAttribute("aria-expanded", "true");
            }
        });

        item.addEventListener("focusout", function (event) {
            if (!item.contains(event.relatedTarget)) {
                item.classList.remove("is-submenu-open");
                if (link) {
                    link.setAttribute("aria-expanded", "false");
                }
            }
        });
    });

    document.addEventListener("click", function (event) {
        parentItems.forEach(function (item) {
            if (!item.contains(event.target)) {
                item.classList.remove("is-submenu-open");
                var link = item.querySelector(":scope > a");
                if (link) {
                    link.setAttribute("aria-expanded", "false");
                }
            }
        });
    });
})();

/* ===== 우측 하단 플로팅 퀵슬롯(네이버 블로그 / 당근마켓 / 카카오톡) ===== */
(function () {
    var slotButtons = Array.prototype.slice.call(document.querySelectorAll("[data-quick-channel]"));
    if (!slotButtons.length) {
        return;
    }

    var channelLinks = {
        blog: "https://blog.naver.com/iseoul23",
        carrot: "https://www.daangn.com/kr/local-profile/%EC%95%84%EC%9D%B4%EC%84%9C%EC%9A%B8%ED%95%9C%EC%9D%98%EC%9B%90-uvt9iniwbgde/",
        kakao: "https://pf.kakao.com/_ZexaxdX"
    };

    slotButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            var key = button.getAttribute("data-quick-channel") || "";
            var url = channelLinks[key];
            if (url) {
                window.open(url, "_blank", "noopener");
                return;
            }
            window.alert("해당 서비스 바로가기를 준비 중입니다.");
        });
    });
})();
