(function () {
    const cmsCommon = window.cmsCommon;
    if (!cmsCommon) {
        return;
    }

    const contextPath = cmsCommon.contextPath;
    const fetchJson = cmsCommon.fetchJson;
    const normalizeText = cmsCommon.normalizeText;
    const escapeHtml = cmsCommon.escapeHtml;
    const renderMessage = cmsCommon.renderMessage;

    const state = {
        histories: [],
        keyword: '',
        typeFilter: '',
        successFilter: ''
    };

    function renderHistoryMessage(message, type) {
        renderMessage('accessHistoryMessage', message, type);
    }

    function normalizeHistory(raw) {
        const source = raw || {};
        return {
            historyId: normalizeText(source.historyId),
            loginId: normalizeText(source.loginId),
            userName: normalizeText(source.userName),
            accessType: normalizeText(source.accessType),
            successYn: normalizeText(source.successYn) === 'N' ? 'N' : 'Y',
            requestUri: normalizeText(source.requestUri),
            ipAddress: normalizeText(source.ipAddress),
            userAgent: normalizeText(source.userAgent),
            accessMessage: normalizeText(source.accessMessage),
            accessDt: normalizeText(source.accessDt)
        };
    }

    function getFilteredHistories() {
        const keyword = normalizeText(state.keyword).toLowerCase();
        return state.histories.filter(function (history) {
            if (state.typeFilter && history.accessType !== state.typeFilter) {
                return false;
            }
            if (state.successFilter && history.successYn !== state.successFilter) {
                return false;
            }
            if (!keyword) {
                return true;
            }
            return history.loginId.toLowerCase().indexOf(keyword) >= 0
                || history.userName.toLowerCase().indexOf(keyword) >= 0
                || history.requestUri.toLowerCase().indexOf(keyword) >= 0
                || history.ipAddress.toLowerCase().indexOf(keyword) >= 0;
        });
    }

    function renderHistoryTable() {
        const tableBody = document.getElementById('accessHistoryTableBody');
        if (!tableBody) {
            return;
        }

        const rows = getFilteredHistories();
        if (!rows.length) {
            tableBody.innerHTML = '<tr><td colspan="8" class="access-history-empty">표시할 접속 이력이 없습니다.</td></tr>';
            return;
        }

        tableBody.innerHTML = rows.map(function (history) {
            const statusClass = history.successYn === 'Y' ? 'success' : 'error';
            const statusLabel = history.successYn === 'Y' ? '성공' : '실패';
            return ''
                + '<tr>'
                + '  <td>' + escapeHtml(history.accessDt) + '</td>'
                + '  <td>' + escapeHtml(history.loginId) + '</td>'
                + '  <td>' + escapeHtml(history.userName) + '</td>'
                + '  <td>' + escapeHtml(history.accessType) + '</td>'
                + '  <td><span class="access-history-badge ' + statusClass + '">' + escapeHtml(statusLabel) + '</span></td>'
                + '  <td title="' + escapeHtml(history.requestUri) + '">' + escapeHtml(history.requestUri) + '</td>'
                + '  <td>' + escapeHtml(history.ipAddress) + '</td>'
                + '  <td title="' + escapeHtml(history.accessMessage) + '">' + escapeHtml(history.accessMessage) + '</td>'
                + '</tr>';
        }).join('');
    }

    async function loadInitData() {
        const data = await fetchJson(contextPath + '/seoulmedi/cms/accessHistory/api/init.do', {
            method: 'GET'
        });

        if (!data.success) {
            throw new Error(data.message || '접속 이력을 불러오지 못했습니다.');
        }

        state.histories = (data.histories || []).map(normalizeHistory);
        renderHistoryTable();
    }

    function bindEvents(root) {
        if (!root || root.getAttribute('data-events-bound') === 'Y') {
            return;
        }

        const searchInput = document.getElementById('accessHistorySearchKeyword');
        const typeFilter = document.getElementById('accessHistoryTypeFilter');
        const successFilter = document.getElementById('accessHistorySuccessFilter');
        if (!searchInput || !typeFilter || !successFilter) {
            return;
        }

        root.setAttribute('data-events-bound', 'Y');

        searchInput.addEventListener('input', function () {
            state.keyword = normalizeText(searchInput.value);
            renderHistoryTable();
        });

        typeFilter.addEventListener('change', function () {
            state.typeFilter = normalizeText(typeFilter.value);
            renderHistoryTable();
        });

        successFilter.addEventListener('change', function () {
            state.successFilter = normalizeText(successFilter.value);
            renderHistoryTable();
        });
    }

    window.initCmsAccessHistoryView = async function initCmsAccessHistoryView(root) {
        const targetRoot = root || document.getElementById('accessHistoryRoot');
        if (!targetRoot) {
            return;
        }

        state.histories = [];
        state.keyword = '';
        state.typeFilter = '';
        state.successFilter = '';

        bindEvents(targetRoot);
        renderHistoryMessage('접속 이력을 불러오는 중입니다.', null);

        try {
            await loadInitData();
            renderHistoryMessage('접속 이력을 불러왔습니다.', 'success');
        } catch (error) {
            console.error(error);
            renderHistoryMessage('접속 이력을 불러오지 못했습니다.', 'error');
        }
    };
})();

