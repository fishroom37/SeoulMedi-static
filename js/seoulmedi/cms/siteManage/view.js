(function () {
    const cmsCommon = window.cmsCommon;
    if (!cmsCommon) {
        return;
    }

    const contextPath = cmsCommon.contextPath;
    const fetchJson = cmsCommon.fetchJson;
    const ensureScript = cmsCommon.ensureScript;
    const ensureStylesheet = cmsCommon.ensureStylesheet;
    const normalizeText = cmsCommon.normalizeText;
    const escapeHtml = cmsCommon.escapeHtml;
    const renderMessage = cmsCommon.renderMessage;
    const notifyAlert = cmsCommon.notifyAlert;

    const state = {
        viewMode: 'main',
        siteConfig: {},
        menus: [],
        selectedMenuId: null,
        menuSearchKeyword: '',
        popups: [],
        selectedPopupId: null,
        popupSearchKeyword: '',
        storageMode: '',
        editorInstances: {}
    };

    function renderConfigMessage(message, type) {
        renderMessage('siteManageConfigMessage', message, type);
    }

    function renderTopMenuMessage(message, type) {
        renderMessage('siteManageTopMenuMessage', message, type);
    }

    function renderMenuMessage(message, type) {
        renderMessage('siteManageMenuMessage', message, type);
    }

    function renderPopupMessage(message, type) {
        renderMessage('siteManagePopupMessage', message, type);
    }

    function toNumber(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
    }

    function normalizeYn(value, defaultValue) {
        const normalized = normalizeText(value).toUpperCase();
        if (!normalized) {
            return defaultValue === 'N' ? 'N' : 'Y';
        }
        return normalized === 'Y' ? 'Y' : 'N';
    }

    function normalizePopupSize(value, defaultValue, minValue) {
        const parsed = toNumber(value);
        if (parsed === null) {
            return defaultValue;
        }
        return parsed < minValue ? defaultValue : parsed;
    }

    function normalizeViewMode(value) {
        const normalized = normalizeText(value).toLowerCase();
        if (normalized === 'menu' || normalized === 'page' || normalized === 'popup') {
            return normalized;
        }
        return 'main';
    }

    async function ensureEditors(root) {
        if (!root) {
            return;
        }

        ensureStylesheet(contextPath + '/css/seoulmedi/cms/editor/vendor/suneditor.min.css');
        ensureStylesheet(contextPath + '/css/seoulmedi/cms/editor/html-editor.css');
        await ensureScript(contextPath + '/js/seoulmedi/cms/editor/vendor/suneditor.min.js');
        await ensureScript(contextPath + '/js/seoulmedi/cms/editor/vendor/suneditor-ko.js');
        await ensureScript(contextPath + '/js/seoulmedi/cms/editor/html-editor.js');

        if (!window.cmsHtmlEditor) {
            return;
        }

        state.editorInstances = {};

        root.querySelectorAll('.js-html-editor').forEach(function (textarea) {
            const editorMode = normalizeText(textarea.getAttribute('data-editor-mode')) || 'compact';
            const editor = window.cmsHtmlEditor.create(textarea, {
                mode: editorMode,
                minHeight: editorMode === 'full' ? 420 : 180
            });
            if (textarea.id) {
                state.editorInstances[textarea.id] = editor;
            }
        });
    }

    function setFieldValue(id, value) {
        const editor = state.editorInstances[id];
        if (editor) {
            editor.setHtml(normalizeText(value));
            return;
        }

        const element = document.getElementById(id);
        if (element) {
            element.value = normalizeText(value);
        }
    }

    function getFieldValue(id) {
        const editor = state.editorInstances[id];
        if (editor) {
            return normalizeText(editor.getHtml());
        }

        const element = document.getElementById(id);
        return normalizeText(element ? element.value : '');
    }

    function normalizeMenu(raw) {
        const source = raw || {};
        return {
            menuId: toNumber(source.menuId),
            parentMenuId: toNumber(source.parentMenuId),
            menuName: normalizeText(source.menuName),
            menuNameEn: normalizeText(source.menuNameEn),
            slug: normalizeText(source.slug),
            menuIntro: normalizeText(source.menuIntro),
            pageTitle: normalizeText(source.pageTitle),
            pageSubtitle: normalizeText(source.pageSubtitle),
            pageContent: normalizeText(source.pageContent),
            featuredYn: normalizeYn(source.featuredYn, 'N'),
            useYn: normalizeYn(source.useYn, 'Y'),
            sortOrder: toNumber(source.sortOrder) || 1,
            updateDt: normalizeText(source.updateDt)
        };
    }

    function normalizePopup(raw) {
        const source = raw || {};
        return {
            popupId: toNumber(source.popupId),
            popupTitle: normalizeText(source.popupTitle),
            popupSubtitle: normalizeText(source.popupSubtitle),
            popupContentHtml: normalizeText(source.popupContentHtml),
            imageUrl: normalizeText(source.imageUrl),
            linkUrl: normalizeText(source.linkUrl),
            linkLabel: normalizeText(source.linkLabel),
            popupWidth: normalizePopupSize(source.popupWidth, 520, 280),
            popupHeight: normalizePopupSize(source.popupHeight, 0, 0),
            startDt: normalizeText(source.startDt),
            endDt: normalizeText(source.endDt),
            startDtText: normalizeText(source.startDtText),
            endDtText: normalizeText(source.endDtText),
            useYn: normalizeYn(source.useYn, 'Y'),
            todayHideYn: normalizeYn(source.todayHideYn, 'Y'),
            sortOrder: toNumber(source.sortOrder) || 1,
            updateDt: normalizeText(source.updateDt)
        };
    }

    function normalizeConfig(raw) {
        const source = raw || {};
        return {
            topNoticeText: normalizeText(source.topNoticeText),
            phoneLinkLabel: normalizeText(source.phoneLinkLabel),
            blogLinkLabel: normalizeText(source.blogLinkLabel),
            siteName: normalizeText(source.siteName),
            siteNameEn: normalizeText(source.siteNameEn),
            heroBadge: normalizeText(source.heroBadge),
            heroTitle: normalizeText(source.heroTitle),
            heroSubtitle: normalizeText(source.heroSubtitle),
            introTitle: normalizeText(source.introTitle),
            introBody: normalizeText(source.introBody),
            contactPhone: normalizeText(source.contactPhone),
            reservationUrl: normalizeText(source.reservationUrl),
            blogUrl: normalizeText(source.blogUrl),
            addressText: normalizeText(source.addressText),
            businessHours: normalizeText(source.businessHours),
            footerNote: normalizeText(source.footerNote),
            highlightTitle1: normalizeText(source.highlightTitle1),
            highlightDesc1: normalizeText(source.highlightDesc1),
            highlightTitle2: normalizeText(source.highlightTitle2),
            highlightDesc2: normalizeText(source.highlightDesc2),
            highlightTitle3: normalizeText(source.highlightTitle3),
            highlightDesc3: normalizeText(source.highlightDesc3),
            clinicSectionTitle: normalizeText(source.clinicSectionTitle),
            clinicSectionSubtitle: normalizeText(source.clinicSectionSubtitle),
            clinicOverviewHtml: normalizeText(source.clinicOverviewHtml),
            clinicHoursHtml: normalizeText(source.clinicHoursHtml),
            clinicLocationHtml: normalizeText(source.clinicLocationHtml),
            clinicExtraHtml: normalizeText(source.clinicExtraHtml)
        };
    }

    function sortMenus(menus) {
        return (menus || []).slice().sort(function (a, b) {
            if (a.sortOrder !== b.sortOrder) {
                return a.sortOrder - b.sortOrder;
            }
            return normalizeText(a.menuName).localeCompare(normalizeText(b.menuName));
        });
    }

    function buildTree(menus) {
        const topMenus = sortMenus(menus.filter(function (menu) {
            return !menu.parentMenuId;
        }));

        return topMenus.map(function (menu) {
            return {
                menu: menu,
                children: sortMenus(menus.filter(function (child) {
                    return child.parentMenuId === menu.menuId;
                }))
            };
        });
    }

    function getTopMenus() {
        return sortMenus(state.menus.filter(function (menu) {
            return !menu.parentMenuId;
        }));
    }

    function getFilteredMenus() {
        const keyword = normalizeText(state.menuSearchKeyword).toLowerCase();
        if (!keyword) {
            return state.menus;
        }
        const matchedMenus = state.menus.filter(function (menu) {
            return normalizeText(menu.menuName).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(menu.slug).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(menu.pageTitle).toLowerCase().indexOf(keyword) >= 0;
        });

        const parentMenuIds = matchedMenus.map(function (menu) {
            return menu.parentMenuId;
        }).filter(function (parentMenuId) {
            return parentMenuId !== null;
        });

        return state.menus.filter(function (menu) {
            return matchedMenus.some(function (matchedMenu) {
                return matchedMenu.menuId === menu.menuId;
            }) || parentMenuIds.indexOf(menu.menuId) > -1;
        });
    }

    function getFilteredPopups() {
        const keyword = normalizeText(state.popupSearchKeyword).toLowerCase();
        if (!keyword) {
            return state.popups.slice();
        }

        return state.popups.filter(function (popup) {
            return normalizeText(popup.popupTitle).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(popup.popupSubtitle).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(popup.linkLabel).toLowerCase().indexOf(keyword) >= 0;
        });
    }

    function findMenu(menuId) {
        return state.menus.find(function (menu) {
            return menu.menuId === menuId;
        }) || null;
    }

    function findPopup(popupId) {
        return state.popups.find(function (popup) {
            return popup.popupId === popupId;
        }) || null;
    }

    function fillConfigForm(siteConfig) {
        setFieldValue('siteManageTopNoticeText', siteConfig.topNoticeText);
        setFieldValue('siteManagePhoneLinkLabel', siteConfig.phoneLinkLabel);
        setFieldValue('siteManageBlogLinkLabel', siteConfig.blogLinkLabel);
        setFieldValue('siteManageSiteName', siteConfig.siteName);
        setFieldValue('siteManageSiteNameEn', siteConfig.siteNameEn);
        setFieldValue('siteManageHeroBadge', siteConfig.heroBadge);
        setFieldValue('siteManageHeroTitle', siteConfig.heroTitle);
        setFieldValue('siteManageHeroSubtitle', siteConfig.heroSubtitle);
        setFieldValue('siteManageIntroTitle', siteConfig.introTitle);
        setFieldValue('siteManageIntroBody', siteConfig.introBody);
        setFieldValue('siteManageContactPhone', siteConfig.contactPhone);
        setFieldValue('siteManageReservationUrl', siteConfig.reservationUrl);
        setFieldValue('siteManageBlogUrl', siteConfig.blogUrl);
        setFieldValue('siteManageAddressText', siteConfig.addressText);
        setFieldValue('siteManageBusinessHours', siteConfig.businessHours);
        setFieldValue('siteManageFooterNote', siteConfig.footerNote);
        setFieldValue('siteManageHighlightTitle1', siteConfig.highlightTitle1);
        setFieldValue('siteManageHighlightDesc1', siteConfig.highlightDesc1);
        setFieldValue('siteManageHighlightTitle2', siteConfig.highlightTitle2);
        setFieldValue('siteManageHighlightDesc2', siteConfig.highlightDesc2);
        setFieldValue('siteManageHighlightTitle3', siteConfig.highlightTitle3);
        setFieldValue('siteManageHighlightDesc3', siteConfig.highlightDesc3);
        setFieldValue('siteManageClinicSectionTitle', siteConfig.clinicSectionTitle);
        setFieldValue('siteManageClinicSectionSubtitle', siteConfig.clinicSectionSubtitle);
        setFieldValue('siteManageClinicOverviewHtml', siteConfig.clinicOverviewHtml);
        setFieldValue('siteManageClinicHoursHtml', siteConfig.clinicHoursHtml);
        setFieldValue('siteManageClinicLocationHtml', siteConfig.clinicLocationHtml);
        setFieldValue('siteManageClinicExtraHtml', siteConfig.clinicExtraHtml);
    }

    function setHidden(element, hidden) {
        if (!element) {
            return;
        }
        element.hidden = !!hidden;
    }

    function getSelectedMenuName() {
        const selectedMenu = state.selectedMenuId ? findMenu(state.selectedMenuId) : null;
        return normalizeText(selectedMenu ? selectedMenu.menuName : '');
    }

    function applyViewMode(root) {
        const targetRoot = root || document.getElementById('siteManageRoot');
        if (!targetRoot) {
            return;
        }

        const currentViewMode = normalizeViewMode(state.viewMode);
        const isMainMode = currentViewMode === 'main';
        const isMenuMode = currentViewMode === 'menu';
        const isPageMode = currentViewMode === 'page';
        const isPopupMode = currentViewMode === 'popup';
        const selectedMenuName = getSelectedMenuName();

        targetRoot.querySelectorAll('[data-site-manage-section]').forEach(function (section) {
            const sectionName = normalizeText(section.getAttribute('data-site-manage-section'));
            const shouldShow = (sectionName === 'main' && isMainMode)
                || (sectionName === 'menu-quick' && isMenuMode)
                || (sectionName === 'menu-page' && (isMenuMode || isPageMode))
                || (sectionName === 'popup' && isPopupMode);
            setHidden(section, !shouldShow);
        });

        targetRoot.querySelectorAll('[data-site-manage-form-scope]').forEach(function (field) {
            const scope = normalizeText(field.getAttribute('data-site-manage-form-scope'));
            const shouldShow = scope === 'shared'
                ? (isMenuMode || isPageMode)
                : (scope === 'menu' && isMenuMode) || (scope === 'page' && isPageMode);
            setHidden(field, !shouldShow);
        });

        const panelTitle = document.getElementById('siteManageMenuPanelTitle');
        const panelHelp = document.getElementById('siteManageMenuPanelHelp');
        const detailTitle = document.getElementById('siteManageMenuDetailTitle');
        const detailHelp = document.getElementById('siteManageMenuDetailHelp');
        const searchInput = document.getElementById('siteManageMenuSearchKeyword');
        const createActions = document.getElementById('siteManageMenuCreateActions');
        const saveButton = document.getElementById('siteManageMenuSaveBtn');
        const deleteButton = document.getElementById('siteManageMenuDeleteBtn');

        if (panelTitle) {
            panelTitle.textContent = isPageMode ? '페이지 관리' : '메뉴 관리';
        }
        if (panelHelp) {
            panelHelp.textContent = isPageMode
                ? '메뉴를 선택한 뒤 해당 페이지 제목과 본문 내용을 편집합니다.'
                : '상위 메뉴와 하위 메뉴를 추가하고 노출 순서를 정리합니다.';
        }
        if (detailTitle) {
            if (isPageMode) {
                detailTitle.textContent = selectedMenuName
                    ? selectedMenuName + ' 페이지 편집'
                    : '페이지 내용 편집';
            } else {
                detailTitle.textContent = selectedMenuName
                    ? selectedMenuName + ' 메뉴 정보'
                    : '선택 메뉴 상세';
            }
        }
        if (detailHelp) {
            detailHelp.textContent = isPageMode
                ? '상세 페이지 제목, 부제, 본문 내용을 저장합니다.'
                : '메뉴명, 소개 문구, 노출 여부와 정렬 정보를 저장합니다.';
        }
        if (searchInput) {
            searchInput.placeholder = isPageMode
                ? '페이지 제목, 메뉴명으로 검색하세요.'
                : '메뉴명, 슬러그로 검색하세요.';
        }
        if (saveButton) {
            saveButton.textContent = isPageMode ? '페이지 저장' : '메뉴 저장';
        }

        setHidden(createActions, !isMenuMode);
        setHidden(deleteButton, !isMenuMode);
    }

    function renderParentMenuOptions(selectedParentMenuId) {
        const parentSelect = document.getElementById('siteManageParentMenuId');
        const currentMenuId = toNumber(getFieldValue('siteManageMenuId'));
        if (!parentSelect) {
            return;
        }

        let html = '<option value="">최상위 메뉴</option>';
        html += sortMenus(state.menus.filter(function (menu) {
            return !menu.parentMenuId && menu.menuId !== currentMenuId;
        })).map(function (menu) {
            const selected = menu.menuId === selectedParentMenuId ? 'selected' : '';
            return '<option value="' + escapeHtml(String(menu.menuId)) + '" ' + selected + '>' + escapeHtml(menu.menuName) + '</option>';
        }).join('');
        parentSelect.innerHTML = html;
    }

    function fillMenuForm(menu) {
        const menuInfo = menu || {
            menuId: '',
            parentMenuId: null,
            menuName: '',
            menuNameEn: '',
            slug: '',
            menuIntro: '',
            pageTitle: '',
            pageSubtitle: '',
            pageContent: '',
            featuredYn: 'N',
            useYn: 'Y',
            sortOrder: getNextSortOrder(null),
            updateDt: ''
        };

        setFieldValue('siteManageMenuId', menuInfo.menuId);
        renderParentMenuOptions(menuInfo.parentMenuId);
        setFieldValue('siteManageSortOrder', menuInfo.sortOrder);
        setFieldValue('siteManageMenuName', menuInfo.menuName);
        setFieldValue('siteManageMenuNameEn', menuInfo.menuNameEn);
        setFieldValue('siteManageSlug', menuInfo.slug);
        setFieldValue('siteManageMenuIntro', menuInfo.menuIntro);
        setFieldValue('siteManagePageTitle', menuInfo.pageTitle);
        setFieldValue('siteManagePageSubtitle', menuInfo.pageSubtitle);
        setFieldValue('siteManagePageContent', menuInfo.pageContent);
        setFieldValue('siteManageFeaturedYn', menuInfo.featuredYn);
        setFieldValue('siteManageUseYn', menuInfo.useYn);
        setFieldValue('siteManageUpdateDt', menuInfo.updateDt);
        applyViewMode();
    }

    function getNextSortOrder(parentMenuId) {
        const siblings = state.menus.filter(function (menu) {
            return menu.parentMenuId === parentMenuId;
        });
        if (!siblings.length) {
            return 1;
        }
        return siblings.reduce(function (maxValue, menu) {
            return Math.max(maxValue, menu.sortOrder || 1);
        }, 0) + 1;
    }

    function getNextPopupSortOrder() {
        if (!state.popups.length) {
            return 1;
        }
        return state.popups.reduce(function (maxValue, popup) {
            return Math.max(maxValue, popup.sortOrder || 1);
        }, 0) + 1;
    }

    function fillPopupForm(popup) {
        const popupInfo = normalizePopup(popup || {
            popupId: '',
            popupTitle: '',
            popupSubtitle: '',
            popupContentHtml: '',
            imageUrl: '',
            linkUrl: '',
            linkLabel: '',
            popupWidth: 520,
            popupHeight: 0,
            startDt: '',
            endDt: '',
            useYn: 'Y',
            todayHideYn: 'Y',
            sortOrder: getNextPopupSortOrder(),
            updateDt: ''
        });

        setFieldValue('siteManagePopupId', popupInfo.popupId);
        setFieldValue('siteManagePopupTitle', popupInfo.popupTitle);
        setFieldValue('siteManagePopupSortOrder', popupInfo.sortOrder);
        setFieldValue('siteManagePopupStartDt', popupInfo.startDt);
        setFieldValue('siteManagePopupEndDt', popupInfo.endDt);
        setFieldValue('siteManagePopupUseYn', popupInfo.useYn);
        setFieldValue('siteManagePopupTodayHideYn', popupInfo.todayHideYn);
        setFieldValue('siteManagePopupWidth', popupInfo.popupWidth);
        setFieldValue('siteManagePopupHeight', popupInfo.popupHeight);
        setFieldValue('siteManagePopupSubtitle', popupInfo.popupSubtitle);
        setFieldValue('siteManagePopupImageUrl', popupInfo.imageUrl);
        setFieldValue('siteManagePopupLinkUrl', popupInfo.linkUrl);
        setFieldValue('siteManagePopupLinkLabel', popupInfo.linkLabel);
        setFieldValue('siteManagePopupUpdateDt', popupInfo.updateDt);
        setFieldValue('siteManagePopupContentHtml', popupInfo.popupContentHtml);
        renderPopupPreview(popupInfo);
    }

    function renderTopMenuGrid() {
        const topMenuGrid = document.getElementById('siteManageTopMenuGrid');
        if (!topMenuGrid) {
            return;
        }

        const topMenus = getTopMenus();
        if (!topMenus.length) {
            topMenuGrid.innerHTML = '<div class="site-manage-empty">등록된 상단 메뉴가 없습니다.</div>';
            return;
        }

        topMenuGrid.innerHTML = topMenus.map(function (menu, index) {
            const childCount = state.menus.filter(function (child) {
                return child.parentMenuId === menu.menuId;
            }).length;

            return ''
                + '<article class="site-manage-top-menu-card" data-menu-id="' + escapeHtml(String(menu.menuId)) + '">'
                + '  <div class="site-manage-top-menu-card-head">'
                + '    <strong>상단 메뉴 ' + escapeHtml(String(index + 1)) + '</strong>'
                + '    <span>하위 메뉴 ' + escapeHtml(String(childCount)) + '개</span>'
                + '  </div>'
                + '  <div class="site-manage-top-menu-card-grid">'
                + '    <div>'
                + '      <label>메뉴명</label>'
                + '      <input type="text" class="site-manage-top-menu-name" value="' + escapeHtml(menu.menuName) + '" maxlength="120" />'
                + '    </div>'
                + '    <div>'
                + '      <label>영문명</label>'
                + '      <input type="text" class="site-manage-top-menu-name-en" value="' + escapeHtml(menu.menuNameEn) + '" maxlength="120" />'
                + '    </div>'
                + '    <div class="full">'
                + '      <label>메뉴 소개</label>'
                + '      <input type="text" class="site-manage-top-menu-intro" value="' + escapeHtml(menu.menuIntro) + '" maxlength="1000" />'
                + '    </div>'
                + '    <div>'
                + '      <label>슬러그</label>'
                + '      <input type="text" class="site-manage-top-menu-slug" value="' + escapeHtml(menu.slug) + '" maxlength="120" />'
                + '    </div>'
                + '    <div>'
                + '      <label>정렬 순서</label>'
                + '      <input type="number" class="site-manage-top-menu-sort-order" min="1" step="1" value="' + escapeHtml(String(menu.sortOrder || 1)) + '" />'
                + '    </div>'
                + '    <div>'
                + '      <label>사용 여부</label>'
                + '      <select class="site-manage-top-menu-use-yn">'
                + '        <option value="Y" ' + (menu.useYn === 'Y' ? 'selected' : '') + '>Y</option>'
                + '        <option value="N" ' + (menu.useYn === 'N' ? 'selected' : '') + '>N</option>'
                + '      </select>'
                + '    </div>'
                + '  </div>'
                + '  <div class="site-manage-top-menu-card-actions">'
                + '    <button type="button" class="view-action secondary site-manage-top-menu-focus">상세 편집 열기</button>'
                + '  </div>'
                + '</article>';
        }).join('');

        topMenuGrid.querySelectorAll('.site-manage-top-menu-focus').forEach(function (button) {
            button.addEventListener('click', function () {
                const card = button.closest('.site-manage-top-menu-card');
                if (!card) {
                    return;
                }

                const menuId = toNumber(card.getAttribute('data-menu-id'));
                const menu = findMenu(menuId);
                if (!menu) {
                    return;
                }

                state.selectedMenuId = menuId;
                fillMenuForm(menu);
                renderMenuList();
                renderMenuMessage('선택한 상단 메뉴 상세 편집 화면으로 이동했습니다.', null);

                const detailPanel = document.querySelector('.site-manage-menu-form-panel');
                if (detailPanel && typeof detailPanel.scrollIntoView === 'function') {
                    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });
    }

    function renderMenuList() {
        const menuList = document.getElementById('siteManageMenuList');
        const storageHint = document.getElementById('siteManageStorageHint');
        if (!menuList) {
            return;
        }

        const filteredMenus = getFilteredMenus();
        if (storageHint) {
            storageHint.textContent = state.storageMode === 'DEFAULT'
                ? '현재 기본 데이터 모드입니다. DB 스키마 적용 후 저장 데이터가 반영됩니다.'
                : 'DB 저장 데이터를 기준으로 메뉴를 표시하고 있습니다.';
        }

        if (!filteredMenus.length) {
            menuList.innerHTML = '<div class="site-manage-empty">등록된 메뉴가 없습니다.</div>';
            return;
        }

        const tree = buildTree(filteredMenus);
        menuList.innerHTML = tree.map(function (node) {
            const menu = node.menu;
            const activeClass = state.selectedMenuId === menu.menuId ? 'active' : '';
            let html = ''
                + '<div class="site-manage-menu-group">'
                + '  <button type="button" class="site-manage-menu-item depth1 ' + activeClass + '" data-menu-id="' + escapeHtml(String(menu.menuId)) + '">'
                + '    <span class="depth-badge">1</span>'
                + '    <span class="menu-label">' + escapeHtml(menu.menuName) + '</span>'
                + '    <span class="menu-slug">' + escapeHtml(menu.slug) + '</span>'
                + '  </button>';

            if (node.children.length) {
                html += '<div class="site-manage-menu-children">';
                html += node.children.map(function (child) {
                    const childActiveClass = state.selectedMenuId === child.menuId ? 'active' : '';
                    return ''
                        + '<button type="button" class="site-manage-menu-item depth2 ' + childActiveClass + '" data-menu-id="' + escapeHtml(String(child.menuId)) + '">'
                        + '  <span class="depth-badge">2</span>'
                        + '  <span class="menu-label">' + escapeHtml(child.menuName) + '</span>'
                        + '  <span class="menu-slug">' + escapeHtml(child.slug) + '</span>'
                        + '</button>';
                }).join('');
                html += '</div>';
            }

            html += '</div>';
            return html;
        }).join('');

        menuList.querySelectorAll('[data-menu-id]').forEach(function (button) {
            button.addEventListener('click', function () {
                const menuId = toNumber(button.getAttribute('data-menu-id'));
                state.selectedMenuId = menuId;
                fillMenuForm(findMenu(menuId));
                renderMenuList();
                renderMenuMessage('', null);
            });
        });
    }

    function buildPopupScheduleLabel(popup) {
        const startText = normalizeText(popup.startDtText || popup.startDt);
        const endText = normalizeText(popup.endDtText || popup.endDt);

        if (!startText && !endText) {
            return '상시 노출';
        }
        if (!startText) {
            return '종료: ' + endText;
        }
        if (!endText) {
            return '시작: ' + startText;
        }
        return startText + ' ~ ' + endText;
    }

    function renderPopupList() {
        const popupList = document.getElementById('siteManagePopupList');
        if (!popupList) {
            return;
        }

        const filteredPopups = getFilteredPopups();
        if (!filteredPopups.length) {
            popupList.innerHTML = '<div class="site-manage-empty">등록된 팝업이 없습니다.</div>';
            return;
        }

        popupList.innerHTML = filteredPopups.map(function (popup) {
            const activeClass = state.selectedPopupId === popup.popupId ? 'active' : '';
            const scheduleLabel = buildPopupScheduleLabel(popup);
            return ''
                + '<button type="button" class="site-manage-popup-item ' + activeClass + '" data-popup-id="' + escapeHtml(String(popup.popupId || '')) + '">'
                + '  <div class="site-manage-popup-item-head">'
                + '    <strong class="site-manage-popup-item-title">' + escapeHtml(popup.popupTitle || '제목 없음') + '</strong>'
                + '    <span class="site-manage-popup-badge ' + (popup.useYn === 'Y' ? '' : 'off') + '">' + escapeHtml(popup.useYn === 'Y' ? '노출' : '중지') + '</span>'
                + '  </div>'
                + '  <div class="site-manage-popup-item-meta">'
                + '    <span>' + escapeHtml(scheduleLabel) + '</span>'
                + '    <span>하루 숨김 ' + escapeHtml(popup.todayHideYn) + '</span>'
                + '    <span>' + escapeHtml(String(popup.popupWidth)) + 'px</span>'
                + '  </div>'
                + '</button>';
        }).join('');

        popupList.querySelectorAll('[data-popup-id]').forEach(function (button) {
            button.addEventListener('click', function () {
                const popupId = toNumber(button.getAttribute('data-popup-id'));
                state.selectedPopupId = popupId;
                fillPopupForm(findPopup(popupId));
                renderPopupList();
                renderPopupMessage('', null);
            });
        });
    }

    function buildConfigPayload() {
        return {
            topNoticeText: getFieldValue('siteManageTopNoticeText'),
            phoneLinkLabel: getFieldValue('siteManagePhoneLinkLabel'),
            blogLinkLabel: getFieldValue('siteManageBlogLinkLabel'),
            siteName: getFieldValue('siteManageSiteName'),
            siteNameEn: getFieldValue('siteManageSiteNameEn'),
            heroBadge: getFieldValue('siteManageHeroBadge'),
            heroTitle: getFieldValue('siteManageHeroTitle'),
            heroSubtitle: getFieldValue('siteManageHeroSubtitle'),
            introTitle: getFieldValue('siteManageIntroTitle'),
            introBody: getFieldValue('siteManageIntroBody'),
            contactPhone: getFieldValue('siteManageContactPhone'),
            reservationUrl: getFieldValue('siteManageReservationUrl'),
            blogUrl: getFieldValue('siteManageBlogUrl'),
            addressText: getFieldValue('siteManageAddressText'),
            businessHours: getFieldValue('siteManageBusinessHours'),
            footerNote: getFieldValue('siteManageFooterNote'),
            highlightTitle1: getFieldValue('siteManageHighlightTitle1'),
            highlightDesc1: getFieldValue('siteManageHighlightDesc1'),
            highlightTitle2: getFieldValue('siteManageHighlightTitle2'),
            highlightDesc2: getFieldValue('siteManageHighlightDesc2'),
            highlightTitle3: getFieldValue('siteManageHighlightTitle3'),
            highlightDesc3: getFieldValue('siteManageHighlightDesc3'),
            clinicSectionTitle: getFieldValue('siteManageClinicSectionTitle'),
            clinicSectionSubtitle: getFieldValue('siteManageClinicSectionSubtitle'),
            clinicOverviewHtml: getFieldValue('siteManageClinicOverviewHtml'),
            clinicHoursHtml: getFieldValue('siteManageClinicHoursHtml'),
            clinicLocationHtml: getFieldValue('siteManageClinicLocationHtml'),
            clinicExtraHtml: getFieldValue('siteManageClinicExtraHtml')
        };
    }

    function buildMenuPayload() {
        return {
            menuId: toNumber(getFieldValue('siteManageMenuId')),
            parentMenuId: toNumber(getFieldValue('siteManageParentMenuId')),
            sortOrder: getFieldValue('siteManageSortOrder'),
            menuName: getFieldValue('siteManageMenuName'),
            menuNameEn: getFieldValue('siteManageMenuNameEn'),
            slug: getFieldValue('siteManageSlug'),
            menuIntro: getFieldValue('siteManageMenuIntro'),
            pageTitle: getFieldValue('siteManagePageTitle'),
            pageSubtitle: getFieldValue('siteManagePageSubtitle'),
            pageContent: getFieldValue('siteManagePageContent'),
            featuredYn: getFieldValue('siteManageFeaturedYn') || 'N',
            useYn: getFieldValue('siteManageUseYn') || 'Y'
        };
    }

    function buildPopupPayload() {
        return {
            popupId: toNumber(getFieldValue('siteManagePopupId')),
            popupTitle: getFieldValue('siteManagePopupTitle'),
            sortOrder: getFieldValue('siteManagePopupSortOrder'),
            startDt: getFieldValue('siteManagePopupStartDt'),
            endDt: getFieldValue('siteManagePopupEndDt'),
            useYn: getFieldValue('siteManagePopupUseYn') || 'Y',
            todayHideYn: getFieldValue('siteManagePopupTodayHideYn') || 'Y',
            popupWidth: getFieldValue('siteManagePopupWidth'),
            popupHeight: getFieldValue('siteManagePopupHeight'),
            popupSubtitle: getFieldValue('siteManagePopupSubtitle'),
            imageUrl: getFieldValue('siteManagePopupImageUrl'),
            linkUrl: getFieldValue('siteManagePopupLinkUrl'),
            linkLabel: getFieldValue('siteManagePopupLinkLabel'),
            popupContentHtml: getFieldValue('siteManagePopupContentHtml')
        };
    }

    function renderPopupPreview(popup) {
        const preview = document.getElementById('siteManagePopupPreview');
        if (!preview) {
            return;
        }

        const popupInfo = normalizePopup(popup || buildPopupPayload());
        if (!popupInfo.popupTitle && !popupInfo.popupSubtitle && !popupInfo.popupContentHtml && !popupInfo.imageUrl) {
            preview.innerHTML = '<div class="site-manage-popup-preview-empty">팝업 내용을 입력하면 여기에서 바로 미리 확인할 수 있습니다.</div>';
            return;
        }

        const previewStyles = [];
        previewStyles.push('max-width:' + String(popupInfo.popupWidth) + 'px;');
        if (popupInfo.popupHeight > 0) {
            previewStyles.push('min-height:' + String(popupInfo.popupHeight) + 'px;');
        }

        const linkHtml = popupInfo.linkUrl
            ? '<a href="' + escapeHtml(popupInfo.linkUrl) + '" class="site-manage-popup-preview-link" target="_blank" rel="noopener">'
                + escapeHtml(popupInfo.linkLabel || '자세히 보기')
                + '</a>'
            : '';
        const imageHtml = popupInfo.imageUrl
            ? '<img src="' + escapeHtml(popupInfo.imageUrl) + '" alt="' + escapeHtml(popupInfo.popupTitle || '팝업 이미지') + '" class="site-manage-popup-preview-image" />'
            : '';
        const scheduleLabel = buildPopupScheduleLabel(popupInfo);

        preview.innerHTML = ''
            + '<div class="site-manage-popup-preview-card" style="' + previewStyles.join(' ') + '">'
            + imageHtml
            + '  <div class="site-manage-popup-preview-body">'
            + '    <span class="site-manage-popup-preview-label">HOMEPAGE POPUP</span>'
            + '    <strong class="site-manage-popup-preview-title">' + escapeHtml(popupInfo.popupTitle || '제목 없음') + '</strong>'
            + (popupInfo.popupSubtitle ? '<p class="site-manage-popup-preview-subtitle">' + escapeHtml(popupInfo.popupSubtitle) + '</p>' : '')
            + (popupInfo.popupContentHtml ? '<div class="site-manage-popup-preview-content">' + popupInfo.popupContentHtml + '</div>' : '')
            + '    <div class="site-manage-popup-preview-meta">'
            + '      <span>' + escapeHtml(scheduleLabel) + '</span>'
            + '      <span>하루 숨김 ' + escapeHtml(popupInfo.todayHideYn) + '</span>'
            + '    </div>'
            + linkHtml
            + '  </div>'
            + '</div>';
    }

    async function loadInitData(preferredMenuId, preferredPopupId) {
        const data = await fetchJson(contextPath + '/seoulmedi/cms/siteManage/api/init.do', {
            method: 'GET'
        });

        if (!data.success) {
            throw new Error(data.message || '홈페이지 관리 데이터를 불러오지 못했습니다.');
        }

        state.siteConfig = normalizeConfig(data.siteConfig || {});
        state.menus = (data.menus || []).map(normalizeMenu);
        state.popups = (data.popups || []).map(normalizePopup);
        state.storageMode = normalizeText(data.storageMode);
        fillConfigForm(state.siteConfig);

        if (preferredMenuId && findMenu(preferredMenuId)) {
            state.selectedMenuId = preferredMenuId;
        } else if (state.selectedMenuId && findMenu(state.selectedMenuId)) {
            // 기존 선택을 유지한다.
        } else {
            const topMenu = getTopMenus()[0];
            state.selectedMenuId = topMenu ? topMenu.menuId : null;
        }

        if (preferredPopupId && findPopup(preferredPopupId)) {
            state.selectedPopupId = preferredPopupId;
        } else if (state.selectedPopupId && findPopup(state.selectedPopupId)) {
            // 기존 선택을 유지한다.
        } else {
            const firstPopup = state.popups[0];
            state.selectedPopupId = firstPopup ? firstPopup.popupId : null;
        }

        fillMenuForm(state.selectedMenuId ? findMenu(state.selectedMenuId) : null);
        fillPopupForm(state.selectedPopupId ? findPopup(state.selectedPopupId) : null);
        renderTopMenuGrid();
        renderMenuList();
        renderPopupList();
        applyViewMode();
    }

    async function saveConfig() {
        const payload = buildConfigPayload();
        const data = await fetchJson(contextPath + '/seoulmedi/cms/siteManage/api/siteConfig/save.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!data.success) {
            throw new Error(data.message || '기본 정보 저장에 실패했습니다.');
        }

        renderConfigMessage(data.message || '기본 정보가 저장되었습니다.', 'success');
        notifyAlert(data.message || '기본 정보가 저장되었습니다.');
        await loadInitData(state.selectedMenuId, state.selectedPopupId);
    }

    async function saveTopMenus() {
        const topMenuCards = Array.from(document.querySelectorAll('.site-manage-top-menu-card[data-menu-id]'));
        if (!topMenuCards.length) {
            renderTopMenuMessage('저장할 상단 메뉴가 없습니다.', 'error');
            return;
        }

        for (const card of topMenuCards) {
            const menuId = toNumber(card.getAttribute('data-menu-id'));
            const originalMenu = findMenu(menuId);
            if (!originalMenu) {
                continue;
            }

            const payload = {
                menuId: originalMenu.menuId,
                parentMenuId: null,
                sortOrder: normalizeText(card.querySelector('.site-manage-top-menu-sort-order').value),
                menuName: normalizeText(card.querySelector('.site-manage-top-menu-name').value),
                menuNameEn: normalizeText(card.querySelector('.site-manage-top-menu-name-en').value),
                slug: normalizeText(card.querySelector('.site-manage-top-menu-slug').value),
                menuIntro: normalizeText(card.querySelector('.site-manage-top-menu-intro').value),
                pageTitle: normalizeText(card.querySelector('.site-manage-top-menu-name').value),
                pageSubtitle: originalMenu.pageSubtitle,
                pageContent: originalMenu.pageContent,
                featuredYn: originalMenu.featuredYn,
                useYn: normalizeText(card.querySelector('.site-manage-top-menu-use-yn').value) || originalMenu.useYn
            };

            if (!payload.menuName) {
                throw new Error('상단 메뉴명은 비워둘 수 없습니다.');
            }
            if (!payload.slug) {
                throw new Error('상단 메뉴 슬러그는 비워둘 수 없습니다.');
            }

            const data = await fetchJson(contextPath + '/seoulmedi/cms/siteManage/api/menu/save.do', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!data.success) {
                throw new Error(data.message || '상단 메뉴 저장에 실패했습니다.');
            }
        }

        await loadInitData(state.selectedMenuId, state.selectedPopupId);
        renderTopMenuMessage('상단 메뉴 정보가 저장되었습니다.', 'success');
        notifyAlert('상단 메뉴 정보가 저장되었습니다.');
    }

    async function saveMenu() {
        const payload = buildMenuPayload();
        if (state.viewMode === 'menu' && !payload.pageTitle) {
            payload.pageTitle = payload.menuName;
        }
        if (!payload.menuName) {
            renderMenuMessage('메뉴명은 필수입니다.', 'error');
            return;
        }
        if (!payload.slug) {
            renderMenuMessage('슬러그는 필수입니다.', 'error');
            return;
        }
        if (!payload.pageTitle) {
            renderMenuMessage('페이지 제목은 필수입니다.', 'error');
            return;
        }

        const data = await fetchJson(contextPath + '/seoulmedi/cms/siteManage/api/menu/save.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!data.success) {
            throw new Error(data.message || '메뉴 저장에 실패했습니다.');
        }

        await loadInitData();
        const savedMenu = state.menus.find(function (menu) {
            return menu.slug === payload.slug;
        });
        if (savedMenu) {
            state.selectedMenuId = savedMenu.menuId;
            fillMenuForm(savedMenu);
            renderMenuList();
        }
        renderMenuMessage(data.message || '메뉴 정보가 저장되었습니다.', 'success');
        notifyAlert(data.message || '메뉴 정보가 저장되었습니다.');
    }

    async function deleteMenu() {
        const menuId = toNumber(getFieldValue('siteManageMenuId'));
        if (!menuId) {
            renderMenuMessage('삭제할 메뉴를 선택해 주세요.', 'error');
            return;
        }

        if (!window.confirm('선택한 메뉴를 삭제하시겠습니까?')) {
            return;
        }

        const data = await fetchJson(contextPath + '/seoulmedi/cms/siteManage/api/menu/delete.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ menuId: menuId })
        });

        if (!data.success) {
            throw new Error(data.message || '메뉴 삭제에 실패했습니다.');
        }

        state.selectedMenuId = null;
        await loadInitData(null, state.selectedPopupId);
        renderMenuMessage(data.message || '메뉴가 삭제되었습니다.', 'success');
        notifyAlert(data.message || '메뉴가 삭제되었습니다.');
    }

    async function savePopup() {
        const payload = buildPopupPayload();
        if (!payload.popupTitle) {
            renderPopupMessage('팝업 제목은 필수입니다.', 'error');
            return;
        }

        const currentPopupId = payload.popupId;
        const data = await fetchJson(contextPath + '/seoulmedi/cms/siteManage/api/popup/save.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!data.success) {
            throw new Error(data.message || '팝업 저장에 실패했습니다.');
        }

        await loadInitData(state.selectedMenuId, currentPopupId);
        if (!currentPopupId) {
            const matchedPopup = state.popups.find(function (popup) {
                return popup.popupTitle === payload.popupTitle
                    && popup.sortOrder === (toNumber(payload.sortOrder) || 1);
            }) || state.popups[0] || null;

            if (matchedPopup) {
                state.selectedPopupId = matchedPopup.popupId;
                fillPopupForm(matchedPopup);
                renderPopupList();
            }
        }

        renderPopupMessage(data.message || '팝업 정보가 저장되었습니다.', 'success');
        notifyAlert(data.message || '팝업 정보가 저장되었습니다.');
    }

    async function deletePopup() {
        const popupId = toNumber(getFieldValue('siteManagePopupId'));
        if (!popupId) {
            renderPopupMessage('삭제할 팝업을 선택해 주세요.', 'error');
            return;
        }

        if (!window.confirm('선택한 팝업을 삭제하시겠습니까?')) {
            return;
        }

        const data = await fetchJson(contextPath + '/seoulmedi/cms/siteManage/api/popup/delete.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ popupId: popupId })
        });

        if (!data.success) {
            throw new Error(data.message || '팝업 삭제에 실패했습니다.');
        }

        state.selectedPopupId = null;
        await loadInitData(state.selectedMenuId, null);
        renderPopupMessage(data.message || '팝업이 삭제되었습니다.', 'success');
        notifyAlert(data.message || '팝업이 삭제되었습니다.');
    }

    function prepareNewDepth1() {
        state.selectedMenuId = null;
        fillMenuForm({
            menuId: '',
            parentMenuId: null,
            menuName: '',
            menuNameEn: '',
            slug: '',
            menuIntro: '',
            pageTitle: '',
            pageSubtitle: '',
            pageContent: '',
            featuredYn: 'N',
            useYn: 'Y',
            sortOrder: getNextSortOrder(null),
            updateDt: ''
        });
        renderMenuList();
        renderMenuMessage('상위 메뉴 신규 등록 상태입니다.', null);
    }

    function prepareNewDepth2() {
        const selectedMenu = state.selectedMenuId ? findMenu(state.selectedMenuId) : null;
        const parentMenuId = selectedMenu
            ? (selectedMenu.parentMenuId || selectedMenu.menuId)
            : null;

        if (!parentMenuId) {
            renderMenuMessage('하위 메뉴를 만들려면 먼저 상위 메뉴를 선택하세요.', 'error');
            return;
        }

        state.selectedMenuId = null;
        fillMenuForm({
            menuId: '',
            parentMenuId: parentMenuId,
            menuName: '',
            menuNameEn: '',
            slug: '',
            menuIntro: '',
            pageTitle: '',
            pageSubtitle: '',
            pageContent: '',
            featuredYn: 'N',
            useYn: 'Y',
            sortOrder: getNextSortOrder(parentMenuId),
            updateDt: ''
        });
        renderMenuList();
        renderMenuMessage('하위 메뉴 신규 등록 상태입니다.', null);
    }

    function prepareNewPopup() {
        state.selectedPopupId = null;
        fillPopupForm({
            popupId: '',
            popupTitle: '',
            popupSubtitle: '',
            popupContentHtml: '',
            imageUrl: '',
            linkUrl: '',
            linkLabel: '',
            popupWidth: 520,
            popupHeight: 0,
            startDt: '',
            endDt: '',
            useYn: 'Y',
            todayHideYn: 'Y',
            sortOrder: getNextPopupSortOrder(),
            updateDt: ''
        });
        renderPopupList();
        renderPopupMessage('팝업 신규 등록 상태입니다.', null);
    }

    function bindEvents(root) {
        if (!root || root.getAttribute('data-events-bound') === 'Y') {
            return;
        }

        const searchInput = document.getElementById('siteManageMenuSearchKeyword');
        const popupSearchInput = document.getElementById('siteManagePopupSearchKeyword');
        const configSaveBtn = document.getElementById('siteManageConfigSaveBtn');
        const topMenuSaveBtn = document.getElementById('siteManageTopMenuSaveBtn');
        const menuSaveBtn = document.getElementById('siteManageMenuSaveBtn');
        const menuDeleteBtn = document.getElementById('siteManageMenuDeleteBtn');
        const popupSaveBtn = document.getElementById('siteManagePopupSaveBtn');
        const popupDeleteBtn = document.getElementById('siteManagePopupDeleteBtn');
        const newDepth1Btn = document.getElementById('siteManageNewDepth1Btn');
        const newDepth2Btn = document.getElementById('siteManageNewDepth2Btn');
        const popupNewBtn = document.getElementById('siteManagePopupNewBtn');
        const popupFormPanel = root.querySelector('.site-manage-popup-form-panel');

        if (!searchInput || !popupSearchInput || !configSaveBtn || !topMenuSaveBtn || !menuSaveBtn || !menuDeleteBtn
            || !popupSaveBtn || !popupDeleteBtn || !newDepth1Btn || !newDepth2Btn || !popupNewBtn || !popupFormPanel) {
            return;
        }

        root.setAttribute('data-events-bound', 'Y');

        searchInput.addEventListener('input', function () {
            state.menuSearchKeyword = normalizeText(searchInput.value);
            renderMenuList();
        });

        popupSearchInput.addEventListener('input', function () {
            state.popupSearchKeyword = normalizeText(popupSearchInput.value);
            renderPopupList();
        });

        // 팝업 편집 중에는 입력 값이 바뀌는 즉시 오른쪽 미리보기를 다시 그린다.
        popupFormPanel.addEventListener('input', function () {
            renderPopupPreview();
        });
        popupFormPanel.addEventListener('change', function () {
            renderPopupPreview();
        });

        configSaveBtn.addEventListener('click', async function () {
            try {
                await saveConfig();
            } catch (error) {
                console.error(error);
                renderConfigMessage(error.message || '기본 정보 저장 중 오류가 발생했습니다.', 'error');
            }
        });

        topMenuSaveBtn.addEventListener('click', async function () {
            try {
                await saveTopMenus();
            } catch (error) {
                console.error(error);
                renderTopMenuMessage(error.message || '상단 메뉴 저장 중 오류가 발생했습니다.', 'error');
            }
        });

        menuSaveBtn.addEventListener('click', async function () {
            try {
                await saveMenu();
            } catch (error) {
                console.error(error);
                renderMenuMessage(error.message || '메뉴 저장 중 오류가 발생했습니다.', 'error');
            }
        });

        menuDeleteBtn.addEventListener('click', async function () {
            try {
                await deleteMenu();
            } catch (error) {
                console.error(error);
                renderMenuMessage(error.message || '메뉴 삭제 중 오류가 발생했습니다.', 'error');
            }
        });

        popupSaveBtn.addEventListener('click', async function () {
            try {
                await savePopup();
            } catch (error) {
                console.error(error);
                renderPopupMessage(error.message || '팝업 저장 중 오류가 발생했습니다.', 'error');
            }
        });

        popupDeleteBtn.addEventListener('click', async function () {
            try {
                await deletePopup();
            } catch (error) {
                console.error(error);
                renderPopupMessage(error.message || '팝업 삭제 중 오류가 발생했습니다.', 'error');
            }
        });

        newDepth1Btn.addEventListener('click', prepareNewDepth1);
        newDepth2Btn.addEventListener('click', prepareNewDepth2);
        popupNewBtn.addEventListener('click', prepareNewPopup);
    }

    window.initCmsSiteManageView = async function initCmsSiteManageView(root) {
        const targetRoot = root || document.getElementById('siteManageRoot');
        if (!targetRoot) {
            return;
        }

        state.viewMode = normalizeViewMode(targetRoot.getAttribute('data-view-mode'));
        state.siteConfig = {};
        state.menus = [];
        state.selectedMenuId = null;
        state.menuSearchKeyword = '';
        state.popups = [];
        state.selectedPopupId = null;
        state.popupSearchKeyword = '';
        state.storageMode = '';
        state.editorInstances = {};

        await ensureEditors(targetRoot);
        applyViewMode(targetRoot);
        bindEvents(targetRoot);
        renderConfigMessage('홈페이지 정보를 불러오는 중입니다.', null);
        renderTopMenuMessage('', null);
        renderMenuMessage('', null);
        renderPopupMessage('', null);

        try {
            await loadInitData();
            renderConfigMessage('홈페이지 정보를 불러왔습니다.', 'success');
        } catch (error) {
            console.error(error);
            renderConfigMessage('홈페이지 정보를 불러오지 못했습니다.', 'error');
        }
    };
})();
