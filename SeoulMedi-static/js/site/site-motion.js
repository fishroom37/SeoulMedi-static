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

(function () {
    var maps = Array.prototype.slice.call(document.querySelectorAll("[data-map-provider='kakao']"));
    if (!maps.length) {
        return;
    }

    function buildMapQuery(map) {
        var title = map.getAttribute("data-title") || "";
        var pin = map.querySelector(".clinic-map-pin span");
        var address = pin ? pin.textContent : "";
        return (title + " " + address).trim() || "대구 수성구 교학로 13";
    }

    function ensureMapActions(map) {
        if (map.querySelector(".clinic-map-actions")) {
            return;
        }

        var query = encodeURIComponent(buildMapQuery(map));
        var actionBox = document.createElement("div");
        actionBox.className = "clinic-map-actions";
        actionBox.innerHTML = ""
            + "<a href=\"https://map.naver.com/p/search/" + query + "\" target=\"_blank\" rel=\"noopener\">네이버 지도</a>"
            + "<a href=\"https://map.kakao.com/link/search/" + query + "\" target=\"_blank\" rel=\"noopener\">카카오 지도</a>"
            + "<a href=\"https://map.daum.net/link/search/" + query + "\" target=\"_blank\" rel=\"noopener\">다음 지도</a>";
        map.appendChild(actionBox);
    }

    function markFallback(map, message) {
        map.classList.add("is-fallback");
        if (!message) {
            return;
        }

        var guide = map.querySelector(".clinic-map-guide");
        if (!guide) {
            guide = document.createElement("p");
            guide.className = "clinic-map-guide";
            map.appendChild(guide);
        }
        guide.textContent = message;
    }

    maps.forEach(function (map) {
        ensureMapActions(map);
    });

    var key = document.documentElement.getAttribute("data-kakao-map-key") || "";
    if (!key) {
        maps.forEach(function (map) {
            markFallback(map, "현재 지도 키가 등록되지 않아 대체 지도로 표시됩니다. 아래 네이버/카카오/다음 버튼을 이용해 주세요.");
        });
        return;
    }

    function drawMaps() {
        if (!window.kakao || !window.kakao.maps) {
            return;
        }

        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, function (character) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "\"": "&quot;",
                    "'": "&#39;"
                }[character];
            });
        }

        window.kakao.maps.load(function () {
            maps.forEach(function (map) {
                var canvas = map.querySelector(".clinic-map-canvas");
                if (!canvas) {
                    return;
                }

                var lat = Number(map.getAttribute("data-lat"));
                var lng = Number(map.getAttribute("data-lng"));
                if (!isFinite(lat) || !isFinite(lng)) {
                    markFallback(map, "지도 좌표를 확인할 수 없어 대체 지도로 표시됩니다.");
                    return;
                }
                var title = map.getAttribute("data-title") || "아이(I)서울한의원";
                var position = new window.kakao.maps.LatLng(lat, lng);
                var kakaoMap = new window.kakao.maps.Map(canvas, {
                    center: position,
                    level: 3
                });
                var marker = new window.kakao.maps.Marker({
                    position: position,
                    map: kakaoMap,
                    title: title
                });
                var infoWindow = new window.kakao.maps.InfoWindow({
                    content: "<div style=\"padding:8px 10px;font-size:13px;font-weight:700;\">" + escapeHtml(title) + "</div>"
                });
                infoWindow.open(kakaoMap, marker);
                map.classList.add("is-api-ready");
            });
        });
    }

    var script = document.createElement("script");
    script.src = "https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=" + encodeURIComponent(key);
    script.async = true;
    script.onload = drawMaps;
    script.onerror = function () {
        maps.forEach(function (map) {
            markFallback(map, "지도 서버 연결이 원활하지 않아 대체 지도로 표시됩니다.");
        });
    };
    document.head.appendChild(script);
})();
