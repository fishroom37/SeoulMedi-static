/* =========================================================
 * 메인 페이지 전용 스크립트 (index.html)
 *  - 홈 공지 팝업(레이어) 노출/닫기/이동 처리
 * ========================================================= */
(function () {
    const popupLayer = document.getElementById('homePopupLayer');
    if (!popupLayer) {
        return;
    }

    const allCards = Array.from(popupLayer.querySelectorAll('[data-popup-card]'));
    if (!allCards.length) {
        return;
    }

    const HIDE_DURATION_MS = 24 * 60 * 60 * 1000;
    let visibleCards = [];
    let currentIndex = 0;
    const dismissedPopupIds = [];

    function getHideStorageKey(popupId) {
        return 'seoulmediPopupHideUntil_' + String(popupId || '');
    }

    function safeGetHideUntil(popupId) {
        try {
            const storedValue = window.localStorage.getItem(getHideStorageKey(popupId));
            const hideUntil = parseInt(storedValue, 10);
            return Number.isNaN(hideUntil) ? 0 : hideUntil;
        } catch (error) {
            return 0;
        }
    }

    function safeSetHideUntil(popupId, hideUntil) {
        try {
            window.localStorage.setItem(getHideStorageKey(popupId), String(hideUntil));
        } catch (error) {
            // 브라우저 저장이 막힌 환경에서는 그냥 현재 세션 닫기만 처리한다.
        }
    }

    function isTodayHidden(card) {
        const popupId = card.getAttribute('data-popup-id');
        return safeGetHideUntil(popupId) > Date.now();
    }

    function isDismissed(card) {
        const popupId = String(card.getAttribute('data-popup-id') || '');
        return dismissedPopupIds.indexOf(popupId) > -1;
    }

    function applyPopupDimensions(card) {
        const popupWidth = parseInt(card.getAttribute('data-popup-width'), 10);
        const popupHeight = parseInt(card.getAttribute('data-popup-height'), 10);

        if (!Number.isNaN(popupWidth) && popupWidth > 0) {
            card.style.setProperty('--popup-max-width', String(popupWidth) + 'px');
        }
        if (!Number.isNaN(popupHeight) && popupHeight > 0) {
            card.style.setProperty('--popup-min-height', String(popupHeight) + 'px');
        }
    }

    function refreshVisibleCards() {
        visibleCards = allCards.filter(function (card) {
            return !isTodayHidden(card) && !isDismissed(card);
        });
        if (currentIndex >= visibleCards.length) {
            currentIndex = 0;
        }
    }

    function renderCurrentCard() {
        refreshVisibleCards();

        if (!visibleCards.length) {
            popupLayer.hidden = true;
            document.body.classList.remove('is-popup-open');
            allCards.forEach(function (card) {
                card.classList.remove('is-active');
            });
            return;
        }

        popupLayer.hidden = false;
        document.body.classList.add('is-popup-open');

        allCards.forEach(function (card) {
            card.classList.remove('is-active');
        });

        const currentCard = visibleCards[currentIndex];
        if (!currentCard) {
            return;
        }

        applyPopupDimensions(currentCard);
        currentCard.classList.add('is-active');

        const counter = currentCard.querySelector('[data-popup-counter]');
        const prevButton = currentCard.querySelector('[data-popup-prev]');
        const nextButton = currentCard.querySelector('[data-popup-next]');
        const actionBox = currentCard.querySelector('.home-popup-footer-actions');

        if (counter) {
            counter.textContent = String(currentIndex + 1) + ' / ' + String(visibleCards.length);
        }
        if (actionBox) {
            actionBox.classList.toggle('single', visibleCards.length <= 1);
        }
        if (prevButton) {
            prevButton.disabled = visibleCards.length <= 1;
        }
        if (nextButton) {
            nextButton.disabled = visibleCards.length <= 1;
        }
    }

    function movePopup(direction) {
        if (visibleCards.length <= 1) {
            return;
        }

        currentIndex += direction;
        if (currentIndex < 0) {
            currentIndex = visibleCards.length - 1;
        } else if (currentIndex >= visibleCards.length) {
            currentIndex = 0;
        }
        renderCurrentCard();
    }

    function closeCurrentCard() {
        const currentCard = visibleCards[currentIndex];
        if (!currentCard) {
            popupLayer.hidden = true;
            document.body.classList.remove('is-popup-open');
            return;
        }

        const popupId = currentCard.getAttribute('data-popup-id');
        const todayHideYn = currentCard.getAttribute('data-today-hide-yn');
        const hideCheckbox = currentCard.querySelector('[data-popup-hide]');

        // 사용자가 체크한 경우에만 24시간 동안 다시 열리지 않게 저장한다.
        if (todayHideYn === 'Y' && hideCheckbox && hideCheckbox.checked) {
            safeSetHideUntil(popupId, Date.now() + HIDE_DURATION_MS);
        }

        if (dismissedPopupIds.indexOf(String(popupId || '')) < 0) {
            dismissedPopupIds.push(String(popupId || ''));
        }
        if (currentIndex >= visibleCards.length) {
            currentIndex = 0;
        }
        renderCurrentCard();
    }

    allCards.forEach(function (card) {
        const closeButton = card.querySelector('[data-popup-close]');
        const prevButton = card.querySelector('[data-popup-prev]');
        const nextButton = card.querySelector('[data-popup-next]');

        if (closeButton) {
            closeButton.addEventListener('click', closeCurrentCard);
        }
        if (prevButton) {
            prevButton.addEventListener('click', function () {
                movePopup(-1);
            });
        }
        if (nextButton) {
            nextButton.addEventListener('click', function () {
                movePopup(1);
            });
        }
    });

    popupLayer.addEventListener('click', function (event) {
        if (event.target === popupLayer) {
            closeCurrentCard();
        }
    });

    renderCurrentCard();
})();
