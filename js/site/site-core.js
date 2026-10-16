/* =========================================================
 * [AI 비서 연동 마스터 데이터 영역]
 *  - 구글 시트의 '마스터' 및 '메뉴 페이지 관리' 탭과 동기화되는 영역입니다.
 * ========================================================= */
window.CLINIC_DATA = {
    info: {
        name: "아이(I)서울한의원",
        director: "이승현",
        tel: "053-425-1900",
        address: "대구광역시 수성구 교학로 13, 만촌3차 화성파크드림 상가동 201호",
        hoursFooter: "월·금 09:00 - 18:30, 화·목 09:00 - 20:00 야간진료, 수 09:00 - 13:00, 토 09:00 - 16:00, 일요일 휴진<br>점심시간 평일 13:00 - 14:00",
        links: {
            blog: "https://blog.naver.com/iseoul23",
            carrot: "https://www.daangn.com/kr/local-profile/%EC%95%84%EC%9D%B4%EC%84%9C%EC%9A%B8%ED%95%9C%EC%9D%98%EC%9B%90-uvt9iniwbgde/",
            kakao: "https://pf.kakao.com/_ZexaxdX"
        }
    },
    menus: [
        {
            title: "병원소개",
            href: "./page-about.html",
            children: [
                { title: "병원소개", sidebarTitle: "병원소개", href: "./page-clinic-introduction.html" },
                { title: "오시는 길", sidebarTitle: "오시는 길", href: "./page-location.html" },
                { title: "진료 시간", sidebarTitle: "진료 시간", href: "./page-clinic-hours.html" }
            ]
        },
        {
            title: "성장·학습·비염",
            href: "./page-kids-learning-rhinitis.html",
            children: [
                { title: "성장 클리닉", sidebarTitle: "성장 클리닉", href: "./page-growth-clinic.html" },
                { title: "학습 클리닉", sidebarTitle: "학습 클리닉", href: "./page-learning-clinic.html" },
                { title: "비염 클리닉", sidebarTitle: "비염 클리닉", href: "./page-rhinitis-clinic.html" }
            ]
        },
        {
            title: "체질·여성",
            href: "./page-constitution-women.html",
            children: [
                { title: "체질개선 클리닉", sidebarTitle: "체질 클리닉", href: "./page-constitution-care.html" },
                { title: "여성질환 클리닉", sidebarTitle: "여성 클리닉", href: "./page-women-clinic.html" }
            ]
        },
        {
            title: "피부·비만·탈모",
            href: "./page-skin-diet-hair.html",
            children: [
                { title: "피부질환 클리닉", sidebarTitle: "피부 클리닉", href: "./page-skin-care.html" },
                { title: "비만 클리닉", sidebarTitle: "비만 클리닉", href: "./page-diet-clinic.html" },
                { title: "탈모 클리닉", sidebarTitle: "탈모 클리닉", href: "./page-hair-loss.html" }
            ]
        },
        {
            title: "통증·교통사고",
            href: "./page-pain-traffic.html",
            children: [
                { title: "통증 클리닉", sidebarTitle: "통증 클리닉", href: "./page-pain-clinic.html" },
                { title: "교통사고 클리닉", sidebarTitle: "교통사고 클리닉", href: "./page-traffic-accident.html" }
            ]
        }
    ]
};

/* ===== [공통 레이아웃 자동 렌더링] 상단 헤더 / 좌측 사이드바 / 하단 푸터 / 퀵슬롯 ===== */
(function () {
    var data = window.CLINIC_DATA;
    if (!data) return;

    var path = window.location.pathname;
    var currentFile = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    // 현재 페이지가 속한 대메뉴 찾기
    var activeGroup = null;
    data.menus.forEach(function (group) {
        var groupFile = group.href.replace('./', '');
        if (groupFile === currentFile) {
            activeGroup = group;
        }
        group.children.forEach(function (child) {
            if (child.href.replace('./', '') === currentFile) {
                activeGroup = group;
            }
        });
    });

    // 1. 상단 헤더 렌더링
    var headerEl = document.querySelector("header.clinic-header");
    if (headerEl) {
        var menuHtml = data.menus.map(function (group) {
            var isGroupActive = activeGroup === group;
            var subHtml = group.children.map(function (child) {
                return '<li><a href="' + child.href + '">' + child.title + '</a></li>';
            }).join('');

            return '<li class="has-submenu">' +
                '<a href="' + group.href + '"' + (isGroupActive ? ' class="active"' : '') + '>' + group.title + '</a>' +
                '<ul class="clinic-submenu">' + subHtml + '</ul>' +
                '</li>';
        }).join('');

        headerEl.innerHTML =
            '<div class="site-container clinic-header-row">' +
                '<a href="./index.html" class="brand brand-logo-only">' +
                    '<img src="./images/site/iseoul/logo-header.svg" alt="' + data.info.name + ' 로고" class="brand-logo-image" />' +
                '</a>' +
                '<nav class="site-nav clinic-nav" aria-label="상단 메뉴">' +
                    '<ul class="clinic-main-menu">' + menuHtml + '</ul>' +
                '</nav>' +
            '</div>';
    }

    // 2. 서브페이지 좌측 사이드바 렌더링
    var sidebarEl = document.querySelector("aside.page-sidebar");
    if (sidebarEl && activeGroup) {
        var sideHtml = activeGroup.children.map(function (child) {
            var isChildActive = child.href.replace('./', '') === currentFile;
            var label = child.sidebarTitle || child.title;
            return '<li><a href="' + child.href + '"' + (isChildActive ? ' class="active"' : '') + '>' + label + '</a></li>';
        }).join('');

        sidebarEl.innerHTML =
            '<nav aria-label="서브 메뉴">' +
                '<ul>' + sideHtml + '</ul>' +
            '</nav>';
    }

    // 3. 하단 푸터 렌더링
    var footerEl = document.querySelector("footer.site-footer");
    if (footerEl) {
        footerEl.innerHTML =
            '<div class="site-container footer-inner">' +
                '<p>' + data.info.name + ' · 대표원장 ' + data.info.director + ' | TEL ' + data.info.tel + '</p>' +
                '<p>' + data.info.address + '</p>' +
                '<div class="footer-hours"><p>' + data.info.hoursFooter + '</p></div>' +
            '</div>';
    }

    // 4. 우측 하단 퀵슬롯 렌더링
    var quickSlotEl = document.querySelector(".quick-channel-slot");
    if (quickSlotEl) {
        quickSlotEl.innerHTML =
            '<button type="button" class="quick-slot-item" data-quick-channel="blog"><strong>N</strong><span>Blog</span></button>' +
            '<button type="button" class="quick-slot-item" data-quick-channel="carrot"><strong>D</strong><span>당근</span></button>' +
            '<button type="button" class="quick-slot-item quick-slot-accent" data-quick-channel="kakao"><strong>K</strong><span>Kakao</span></button>';
    }
})();

/* ===== 스크롤 리빌 애니메이션 ===== */
(function () {
    var selector = [
        ".philosophy-opening", ".highlight-card", ".service-card",
        ".philosophy-band .philosophy-media", ".philosophy-band .philosophy-copy",
        ".director-card", ".facility-card", ".clinic-info-layout > *",
        ".scroll-story-card", ".menu-tree-card", ".list-row:not(.list-head)",
        ".article-content .content-photo", ".article-content .article-block", ".child-card"
    ].join(", ");

    var targets = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!targets.length) return;

    for (var i = 0; i < targets.length; i++) {
        targets[i].classList.add("reveal-target");
        targets[i].style.setProperty("--reveal-delay", (i % 6) * 70 + "ms");
    }

    if (!("IntersectionObserver" in window)) {
        targets.forEach(function (t) { t.classList.add("is-visible"); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });

    targets.forEach(function (t) { observer.observe(t); });
})();

/* ===== 스크롤 시 상단 헤더 자동 숨김 ===== */
(function () {
    var autoHideHeader = document.querySelector("[data-auto-hide-header]");
    if (!autoHideHeader) return;

    var body = document.body;
    var lastScrollY = window.pageYOffset || window.scrollY || 0;
    var showTimer = 0;

    function handleScroll() {
        var currentY = window.pageYOffset || window.scrollY || 0;
        if (currentY <= 10) {
            window.clearTimeout(showTimer);
            body.classList.remove("is-header-scrolling");
        } else if (Math.abs(currentY - lastScrollY) >= 4) {
            body.classList.add("is-header-scrolling");
            window.clearTimeout(showTimer);
            showTimer = window.setTimeout(function () {
                body.classList.remove("is-header-scrolling");
            }, 1200);
        }
        lastScrollY = currentY;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
})();

/* ===== 상단 대메뉴 드롭다운 접근성 ===== */
(function () {
    var parentItems = Array.prototype.slice.call(document.querySelectorAll(".clinic-main-menu > li.has-submenu"));
    if (!parentItems.length) return;

    function closeAll(except) {
        parentItems.forEach(function (item) {
            if (item !== except) {
                item.classList.remove("is-submenu-open");
                var link = item.querySelector(":scope > a");
                if (link) link.setAttribute("aria-expanded", "false");
            }
        });
    }

    parentItems.forEach(function (item) {
        var link = item.querySelector(":scope > a");
        if (link) link.setAttribute("aria-expanded", "false");

        item.addEventListener("mouseenter", function () { closeAll(item); });
        if (link) {
            link.addEventListener("click", function (event) {
                if (window.matchMedia("(max-width: 980px)").matches) {
                    event.preventDefault();
                    var willOpen = !item.classList.contains("is-submenu-open");
                    closeAll(item);
                    item.classList.toggle("is-submenu-open", willOpen);
                    link.setAttribute("aria-expanded", willOpen ? "true" : "false");
                }
            });
        }
    });

    document.addEventListener("click", function (event) {
        parentItems.forEach(function (item) {
            if (!item.contains(event.target)) {
                item.classList.remove("is-submenu-open");
            }
        });
    });
})();

/* ===== 우측 하단 플로팅 퀵슬롯 클릭 이벤트 ===== */
(function () {
    var slotButtons = Array.prototype.slice.call(document.querySelectorAll("[data-quick-channel]"));
    if (!slotButtons.length) return;

    var channelLinks = (window.CLINIC_DATA && window.CLINIC_DATA.info.links) || {};

    slotButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            var key = button.getAttribute("data-quick-channel") || "";
            var url = channelLinks[key];
            if (url) {
                window.open(url, "_blank", "noopener");
            }
        });
    });
})();
