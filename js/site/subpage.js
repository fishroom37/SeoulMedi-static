/* =========================================================
 * 하위 페이지 전용 스크립트 (오시는 길 등 지도 사용 페이지)
 *  - 카카오 지도 SDK 로드 및 마커/대체 지도 처리
 * ========================================================= */
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
