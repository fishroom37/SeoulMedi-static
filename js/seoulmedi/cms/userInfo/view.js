(function () {
    const cmsCommon = window.cmsCommon;
    if (!cmsCommon) {
        return;
    }

    const contextPath = cmsCommon.contextPath;
    const fetchJson = cmsCommon.fetchJson;
    const ensureScript = cmsCommon.ensureScript;
    const normalizeText = cmsCommon.normalizeText;
    const escapeHtml = cmsCommon.escapeHtml;
    const renderMessage = cmsCommon.renderMessage;
    const notifyAlert = cmsCommon.notifyAlert;
    const postcodeScriptUrl = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    const defaultInitialPassword = 'Change1234!';

    const state = {
        users: [],
        organizations: [],
        authCodes: [],
        searchKeyword: '',
        selectedLoginId: null,
        draftRow: null,
        isRoleAdmin: false,
        currentOrganizationCode: ''
    };

    function renderGridMessage(message, type) {
        renderMessage('userInfoGridMessage', message, type);
    }

    function renderDetailMessage(message, type) {
        renderMessage('userInfoDetailMessage', message, type);
    }

    function normalizeYn(value, defaultValue) {
        const normalizedDefault = defaultValue === 'Y' ? 'Y' : 'N';
        return normalizeText(value).toUpperCase() === 'Y' ? 'Y' : normalizedDefault;
    }

    function normalizeActive(value) {
        const normalized = normalizeText(value).toUpperCase();
        if (normalized === 'N' || normalized === '0') {
            return 'N';
        }
        return 'Y';
    }

    function normalizeBool(value) {
        const normalized = normalizeText(value).toLowerCase();
        return value === true || normalized === 'true' || normalized === 'y' || normalized === '1';
    }

    function normalizeAuthCode(raw) {
        const source = raw || {};
        return {
            authCode: normalizeText(source.authCode),
            authName: normalizeText(source.authName),
            authDesc: normalizeText(source.authDesc)
        };
    }

    function normalizeUser(raw) {
        const source = raw || {};
        return {
            loginId: normalizeText(source.loginId),
            loginType: normalizeText(source.loginType),
            userName: normalizeText(source.userName),
            phoneNumber: normalizeText(source.phoneNumber),
            email: normalizeText(source.email),
            isActive: normalizeActive(source.isActive),
            companyYn: normalizeYn(source.companyYn, 'N'),
            authCode: normalizeText(source.authCode),
            authCodesSummary: normalizeText(source.authCodesSummary)
        };
    }

    function normalizeOrganization(raw) {
        const source = raw || {};
        return {
            organizationCode: normalizeText(source.organizationCode),
            organizationName: normalizeText(source.organizationName)
        };
    }

    function normalizeDraft(raw) {
        const source = raw || {};
        return {
            loginId: normalizeText(source.loginId),
            loginType: normalizeText(source.loginType),
            userName: normalizeText(source.userName),
            phoneNumber: normalizeText(source.phoneNumber),
            email: normalizeText(source.email),
            isActive: normalizeActive(source.isActive || 'Y'),
            companyYn: normalizeYn(source.companyYn, 'N'),
            authCode: normalizeText(source.authCode),
            authCodesSummary: normalizeText(source.authCodesSummary)
        };
    }

    function findUser(loginId) {
        return state.users.find(function (user) {
            return user.loginId === loginId;
        }) || null;
    }

    function getFilteredUsers() {
        const keyword = normalizeText(state.searchKeyword).toLowerCase();
        return state.users.filter(function (user) {
            if (!keyword) {
                return true;
            }
            return normalizeText(user.loginId).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(user.userName).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(user.email).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(user.phoneNumber).toLowerCase().indexOf(keyword) >= 0;
        });
    }

    function getRenderedRows() {
        const rows = getFilteredUsers().map(function (user) {
            return Object.assign({ isDraft: false }, user);
        });
        if (state.draftRow) {
            rows.unshift(Object.assign({ isDraft: true }, state.draftRow));
        }
        return rows;
    }

    // ROLE_ADMIN인 경우에만 권한 컬럼을 표시한다.
    function applyRoleBasedVisibility() {
        const root = document.getElementById('userInfoRoot');
        if (!root) {
            return;
        }
        root.classList.toggle('hide-auth-column', !state.isRoleAdmin);
    }

    // ROLE_ADMIN은 사용자 목록에서 권한을 바로 변경할 수 있도록 select 옵션을 만든다.
    function buildGridAuthOptions(selectedAuthCode) {
        const normalizedSelected = normalizeText(selectedAuthCode);
        let html = '<option value="">선택</option>';
        html += state.authCodes.map(function (authCodeItem) {
            const authCode = normalizeText(authCodeItem.authCode);
            const authName = normalizeText(authCodeItem.authName);
            const selected = normalizedSelected === authCode ? 'selected' : '';
            const label = authName ? (authCode + ' / ' + authName) : authCode;
            return '<option value="' + escapeHtml(authCode) + '" ' + selected + '>' + escapeHtml(label) + '</option>';
        }).join('');
        return html;
    }

    function renderGridAuthCell(row) {
        return '<select class="user-info-grid-select" data-field="authCode">' + buildGridAuthOptions(row.authCode) + '</select>';
    }

    function renderUserTable() {
        const tableBody = document.getElementById('userInfoTableBody');
        if (!tableBody) {
            return;
        }

        const rows = getRenderedRows();
        if (!rows.length) {
            const emptyColspan = state.isRoleAdmin ? '9' : '8';
            tableBody.innerHTML = '<tr class="user-info-empty-row"><td colspan="' + emptyColspan + '">등록된 사용자가 없습니다.</td></tr>';
            return;
        }

        tableBody.innerHTML = rows.map(function (row) {
            const isActiveY = row.isActive === 'Y' ? 'selected' : '';
            const isActiveN = row.isActive === 'N' ? 'selected' : '';
            const companyY = row.companyYn === 'Y' ? 'selected' : '';
            const companyN = row.companyYn === 'N' ? 'selected' : '';

            if (row.isDraft) {
                const authCellHtml = state.isRoleAdmin
                    ? ('<td class="user-info-auth-cell">' + renderGridAuthCell(row) + '</td>')
                    : '';
                return (
                    '<tr class="is-draft active" data-row-type="draft">' +
                        '<td><input type="text" class="user-info-grid-input" data-field="loginId" value="' + escapeHtml(row.loginId) + '" maxlength="50" placeholder="로그인 ID" /></td>' +
                        '<td><input type="text" class="user-info-grid-input" data-field="userName" value="' + escapeHtml(row.userName) + '" maxlength="100" /></td>' +
                        '<td><input type="text" class="user-info-grid-input" data-field="email" value="' + escapeHtml(row.email) + '" maxlength="100" /></td>' +
                        '<td><input type="text" class="user-info-grid-input" data-field="phoneNumber" value="' + escapeHtml(row.phoneNumber) + '" maxlength="20" /></td>' +
                        '<td><input type="text" class="user-info-grid-input" data-field="loginType" value="' + escapeHtml(row.loginType) + '" maxlength="20" /></td>' +
                        '<td><select class="user-info-grid-select" data-field="isActive"><option value="Y" ' + isActiveY + '>Y</option><option value="N" ' + isActiveN + '>N</option></select></td>' +
                        '<td><select class="user-info-grid-select" data-field="companyYn"><option value="Y" ' + companyY + '>Y</option><option value="N" ' + companyN + '>N</option></select></td>' +
                        authCellHtml +
                        '<td><div class="user-info-grid-actions"><button type="button" class="view-action" data-action="save-row">저장</button><button type="button" class="view-action secondary" data-action="cancel-row">취소</button></div></td>' +
                    '</tr>'
                );
            }

            const activeClass = state.selectedLoginId === row.loginId ? 'active' : '';
            const authCellHtml = state.isRoleAdmin
                ? ('<td class="user-info-auth-cell">' + renderGridAuthCell(row) + '</td>')
                : '';
            return (
                '<tr class="' + activeClass + '" data-row-type="saved" data-login-id="' + escapeHtml(row.loginId) + '">' +
                    '<td><button type="button" class="user-info-grid-login-btn" data-action="detail">' + escapeHtml(row.loginId) + '</button></td>' +
                    '<td><input type="text" class="user-info-grid-input" data-field="userName" value="' + escapeHtml(row.userName) + '" maxlength="100" /></td>' +
                    '<td><input type="text" class="user-info-grid-input" data-field="email" value="' + escapeHtml(row.email) + '" maxlength="100" /></td>' +
                    '<td><input type="text" class="user-info-grid-input" data-field="phoneNumber" value="' + escapeHtml(row.phoneNumber) + '" maxlength="20" /></td>' +
                    '<td><input type="text" class="user-info-grid-input" data-field="loginType" value="' + escapeHtml(row.loginType) + '" maxlength="20" /></td>' +
                    '<td><select class="user-info-grid-select" data-field="isActive"><option value="Y" ' + isActiveY + '>Y</option><option value="N" ' + isActiveN + '>N</option></select></td>' +
                    '<td><select class="user-info-grid-select" data-field="companyYn"><option value="Y" ' + companyY + '>Y</option><option value="N" ' + companyN + '>N</option></select></td>' +
                    authCellHtml +
                    '<td><div class="user-info-grid-actions"><button type="button" class="view-action secondary" data-action="detail">상세</button><button type="button" class="view-action" data-action="save-row">저장</button></div></td>' +
                '</tr>'
            );
        }).join('');
    }

    function syncDraftRowFromElement(targetElement) {
        const row = targetElement ? targetElement.closest('tr[data-row-type="draft"]') : null;
        if (!row || !state.draftRow) {
            return;
        }

        const field = targetElement.getAttribute('data-field');
        if (!field) {
            return;
        }
        state.draftRow[field] = normalizeText(targetElement.value);
    }

    function buildGridPayload(row) {
        if (!row) {
            return null;
        }

        const rowType = row.getAttribute('data-row-type');
        let loginId = normalizeText(row.getAttribute('data-login-id'));
        if (rowType === 'draft') {
            const loginIdInput = row.querySelector('[data-field="loginId"]');
            loginId = normalizeText(loginIdInput ? loginIdInput.value : '');
        }
        if (!loginId) {
            return null;
        }

        const userNameInput = row.querySelector('[data-field="userName"]');
        const emailInput = row.querySelector('[data-field="email"]');
        const phoneInput = row.querySelector('[data-field="phoneNumber"]');
        const loginTypeInput = row.querySelector('[data-field="loginType"]');
        const isActiveSelect = row.querySelector('[data-field="isActive"]');
        const companyYnSelect = row.querySelector('[data-field="companyYn"]');
        const authCodeSelect = row.querySelector('[data-field="authCode"]');

        const payload = {
            loginId: loginId,
            userName: normalizeText(userNameInput ? userNameInput.value : ''),
            email: normalizeText(emailInput ? emailInput.value : ''),
            phoneNumber: normalizeText(phoneInput ? phoneInput.value : ''),
            loginType: normalizeText(loginTypeInput ? loginTypeInput.value : ''),
            isActive: normalizeActive(isActiveSelect ? isActiveSelect.value : 'Y'),
            companyYn: normalizeYn(companyYnSelect ? companyYnSelect.value : 'N', 'N')
        };

        if (state.isRoleAdmin) {
            payload.authCode = normalizeText(authCodeSelect ? authCodeSelect.value : '');
        }

        if (!state.isRoleAdmin) {
            payload.organizationCode = normalizeText(state.currentOrganizationCode);
        }

        return payload;
    }

    function getModal() {
        return document.getElementById('userInfoDetailModal');
    }

    function setDetailFormMode(isExisting) {
        const loginIdInput = document.getElementById('userInfoDetailLoginId');
        if (!loginIdInput) {
            return;
        }
        loginIdInput.readOnly = isExisting;
    }

    function setFieldValue(id, value) {
        const element = document.getElementById(id);
        if (!element) {
            return;
        }
        element.value = normalizeText(value);
    }

    function renderOrganizationOptions(selectedOrganizationCode) {
        const organizationSelect = document.getElementById('userInfoDetailOrganizationCode');
        if (!organizationSelect) {
            return;
        }

        const normalizedSelected = normalizeText(selectedOrganizationCode);
        let html = '<option value="">조직 미선택</option>';
        html += state.organizations.map(function (organization) {
            const selected = normalizedSelected === organization.organizationCode ? 'selected' : '';
            const label = organization.organizationName || organization.organizationCode;
            return '<option value="' + escapeHtml(organization.organizationCode) + '" ' + selected + '>' + escapeHtml(label) + '</option>';
        }).join('');
        organizationSelect.innerHTML = html;

        if (!organizationSelect.value && normalizedSelected) {
            organizationSelect.value = normalizedSelected;
        }
    }

    function applyOrganizationPolicyToForm() {
        const organizationSelect = document.getElementById('userInfoDetailOrganizationCode');
        const companyCodeInput = document.getElementById('userInfoDetailCompanyCode');
        if (!organizationSelect || !companyCodeInput) {
            return;
        }

        if (state.isRoleAdmin) {
            organizationSelect.disabled = false;
            companyCodeInput.readOnly = false;
            return;
        }

        const forcedOrgCode = normalizeText(state.currentOrganizationCode);
        organizationSelect.disabled = true;
        companyCodeInput.readOnly = true;

        if (forcedOrgCode) {
            organizationSelect.value = forcedOrgCode;
            companyCodeInput.value = forcedOrgCode;
        }
    }

    function fillDetailForm(userData) {
        const userInfo = userData && userData.userInfo ? userData.userInfo : {};
        const userDetail = userData && userData.userDetail ? userData.userDetail : {};

        setDetailFormMode(Boolean(normalizeText(userInfo.loginId)));
        setFieldValue('userInfoDetailLoginId', userInfo.loginId);
        setFieldValue('userInfoDetailLoginType', userInfo.loginType);
        setFieldValue('userInfoDetailUserName', userInfo.userName);
        setFieldValue('userInfoDetailPhoneNumber', userInfo.phoneNumber);
        setFieldValue('userInfoDetailEmail', userInfo.email);
        setFieldValue('userInfoDetailIsActive', normalizeActive(userInfo.isActive));
        setFieldValue('userInfoDetailPassword', '');
        setFieldValue('userInfoDetailPasswordConfirm', '');
        setFieldValue('userInfoDetailCompanyYn', normalizeYn(userDetail.companyYn, 'N'));
        setFieldValue('userInfoDetailCompanyCode', userDetail.companyCode);
        setFieldValue('userInfoDetailUuidInfo', userDetail.uuidInfo);
        setFieldValue('userInfoDetailAddressZip', userDetail.addressZip);
        setFieldValue('userInfoDetailAddress', userDetail.address);
        setFieldValue('userInfoDetailAddressDtl', userDetail.addressDtl);
        setFieldValue('userInfoDetailPersonalInterest', userDetail.personalInterest);
        setFieldValue('userInfoDetailPersonalBio', userDetail.personalBio);
        setFieldValue('userInfoDetailMailYn', normalizeYn(userDetail.mailYn, 'N'));
        setFieldValue('userInfoDetailSnsYn', normalizeYn(userDetail.snsYn, 'N'));
        setFieldValue('userInfoDetailInsertDt', userInfo.insertDt || userDetail.insertDt);
        setFieldValue('userInfoDetailUpdateDt', userInfo.updateDt || userDetail.updateDt);

        renderOrganizationOptions(userDetail.organizationCode);
        applyOrganizationPolicyToForm();
    }

    function buildDetailPayload() {
        function getValue(id) {
            const element = document.getElementById(id);
            return normalizeText(element ? element.value : '');
        }

        const requestedOrganizationCode = getValue('userInfoDetailOrganizationCode');
        const requestedCompanyCode = getValue('userInfoDetailCompanyCode');
        const forcedOrganizationCode = normalizeText(state.currentOrganizationCode);

        const effectiveOrganizationCode = state.isRoleAdmin ? requestedOrganizationCode : forcedOrganizationCode;
        const effectiveCompanyCode = state.isRoleAdmin ? requestedCompanyCode : forcedOrganizationCode;

        const payload = {
            loginId: getValue('userInfoDetailLoginId'),
            loginType: getValue('userInfoDetailLoginType'),
            userName: getValue('userInfoDetailUserName'),
            phoneNumber: getValue('userInfoDetailPhoneNumber'),
            email: getValue('userInfoDetailEmail'),
            isActive: normalizeActive(getValue('userInfoDetailIsActive')),
            password: getValue('userInfoDetailPassword'),
            passwordConfirm: getValue('userInfoDetailPasswordConfirm'),
            companyYn: normalizeYn(getValue('userInfoDetailCompanyYn'), 'N'),
            companyCode: effectiveCompanyCode,
            organizationCode: effectiveOrganizationCode,
            uuidInfo: getValue('userInfoDetailUuidInfo'),
            addressZip: getValue('userInfoDetailAddressZip'),
            address: getValue('userInfoDetailAddress'),
            addressDtl: getValue('userInfoDetailAddressDtl'),
            personalInterest: getValue('userInfoDetailPersonalInterest'),
            personalBio: getValue('userInfoDetailPersonalBio'),
            mailYn: normalizeYn(getValue('userInfoDetailMailYn'), 'N'),
            snsYn: normalizeYn(getValue('userInfoDetailSnsYn'), 'N')
        };

        return payload;
    }

    function openDetailModal() {
        const modal = getModal();
        if (!modal) {
            return;
        }
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        renderDetailMessage('', null);
    }

    function closeDetailModal() {
        const modal = getModal();
        if (!modal) {
            return;
        }
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        renderDetailMessage('', null);
    }

    // 사용자 상세에서 다음 우편번호를 검색해 주소 필드를 자동 입력한다.
    async function openUserInfoAddressSearch() {
        const addressZipInput = document.getElementById('userInfoDetailAddressZip');
        const addressInput = document.getElementById('userInfoDetailAddress');
        const addressDtlInput = document.getElementById('userInfoDetailAddressDtl');
        if (!addressZipInput || !addressInput || !addressDtlInput) {
            return;
        }

        if (typeof ensureScript !== 'function') {
            renderDetailMessage('주소 검색 스크립트 로더를 찾을 수 없습니다.', 'error');
            return;
        }

        try {
            await ensureScript(postcodeScriptUrl);
        } catch (error) {
            console.error(error);
            renderDetailMessage('다음 주소 검색 서비스를 불러오지 못했습니다.', 'error');
            return;
        }

        if (!(window.daum && typeof window.daum.Postcode === 'function')) {
            renderDetailMessage('다음 주소 검색 서비스를 불러오지 못했습니다.', 'error');
            return;
        }

        new window.daum.Postcode({
            oncomplete: function (data) {
                let address = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
                let extraAddress = '';

                if (data.userSelectedType === 'R') {
                    if (data.bname && /[동로가]$/.test(data.bname)) {
                        extraAddress += data.bname;
                    }
                    if (data.buildingName && data.apartment === 'Y') {
                        extraAddress += (extraAddress ? ', ' : '') + data.buildingName;
                    }
                    if (extraAddress) {
                        address += ' (' + extraAddress + ')';
                    }
                }

                addressZipInput.value = normalizeText(data.zonecode);
                addressInput.value = normalizeText(address);
                addressDtlInput.value = '';
                addressDtlInput.focus();
                renderDetailMessage('주소를 불러왔습니다. 상세 주소를 이어서 입력해 주세요.', 'success');
            }
        }).open();
    }

    async function loadUserInitData(preferredLoginId) {
        const data = await fetchJson(contextPath + '/seoulmedi/cms/userInfo/api/init.do', {
            method: 'GET'
        });

        if (!data.success) {
            throw new Error(data.message || '사용자 목록을 불러오지 못했습니다.');
        }

        state.users = (data.users || []).map(normalizeUser);
        state.organizations = (data.organizations || []).map(normalizeOrganization);
        state.authCodes = (data.authCodes || []).map(normalizeAuthCode);
        state.isRoleAdmin = normalizeBool(data.isRoleAdmin);
        state.currentOrganizationCode = normalizeText(data.currentOrganizationCode);

        // 조직 선택 옵션은 tb_org_info 목록만 사용한다.
        // 현재 로그인 사용자의 조직코드만 강제값으로만 사용하고 옵션에서는 제외하지 않는다.

        if (preferredLoginId && findUser(preferredLoginId)) {
            state.selectedLoginId = preferredLoginId;
        } else if (state.selectedLoginId && findUser(state.selectedLoginId)) {
            // 기존 선택 유지
        } else {
            state.selectedLoginId = state.users.length ? state.users[0].loginId : null;
        }

        applyRoleBasedVisibility();
        renderUserTable();
    }

    async function loadUserDetail(loginId) {
        const data = await fetchJson(
            contextPath + '/seoulmedi/cms/userInfo/api/detail.do?loginId=' + encodeURIComponent(loginId),
            { method: 'GET' }
        );

        if (!data.success) {
            throw new Error(data.message || '사용자 상세 정보를 불러오지 못했습니다.');
        }
        return data.user || {};
    }

    function createDraftRow() {
        if (state.draftRow) {
            renderGridMessage('이미 신규 행이 있습니다. 먼저 저장하거나 취소해 주세요.', null);
            return;
        }

        state.draftRow = normalizeDraft({
            isActive: 'Y',
            companyYn: 'N',
            authCode: state.authCodes.length ? state.authCodes[0].authCode : ''
        });
        renderUserTable();
        renderGridMessage('신규 행이 생성되었습니다. 로그인 ID 입력 후 저장해 주세요.', null);
    }

    function cancelDraftRow() {
        if (!state.draftRow) {
            return;
        }
        state.draftRow = null;
        renderUserTable();
        renderGridMessage('신규 행 생성을 취소했습니다.', null);
    }

    async function openDetailByLoginId(loginId) {
        state.selectedLoginId = loginId;
        renderUserTable();

        const userDetail = await loadUserDetail(loginId);
        fillDetailForm(userDetail);
        openDetailModal();
    }

    async function saveGridRow(row) {
        const payload = buildGridPayload(row);
        const isDraftRow = row && row.getAttribute('data-row-type') === 'draft';
        if (!payload || !payload.loginId) {
            renderGridMessage('로그인 ID는 필수입니다.', 'error');
            return;
        }
        if (state.isRoleAdmin && !normalizeText(payload.authCode)) {
            renderGridMessage('권한 옵션을 선택해 주세요.', 'error');
            return;
        }

        const data = await fetchJson(contextPath + '/seoulmedi/cms/userInfo/api/grid/save.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!data.success) {
            throw new Error(data.message || '저장 중 오류가 발생했습니다.');
        }

        state.draftRow = null;
        await loadUserInitData(payload.loginId);
        const successMessage = isDraftRow
            ? ((data.message || '사용자 정보가 저장되었습니다.') + ' 초기 비밀번호는 ' + defaultInitialPassword + ' 입니다.')
            : (data.message || '사용자 정보가 저장되었습니다.');
        renderGridMessage(successMessage, 'success');
        notifyAlert(successMessage);
    }

    async function saveDetail() {
        const payload = buildDetailPayload();
        if (!payload.loginId) {
            renderDetailMessage('로그인 ID는 필수입니다.', 'error');
            return;
        }
        if (payload.password || payload.passwordConfirm) {
            if (!payload.password) {
                renderDetailMessage('새 비밀번호를 입력해 주세요.', 'error');
                return;
            }
            if (!payload.passwordConfirm) {
                renderDetailMessage('새 비밀번호 확인을 입력해 주세요.', 'error');
                return;
            }
            if (payload.password.length < 8) {
                renderDetailMessage('비밀번호는 8자 이상으로 입력해 주세요.', 'error');
                return;
            }
            if (payload.password !== payload.passwordConfirm) {
                renderDetailMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.', 'error');
                return;
            }
        }

        const data = await fetchJson(contextPath + '/seoulmedi/cms/userInfo/api/save.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!data.success) {
            throw new Error(data.message || '상세 저장 중 오류가 발생했습니다.');
        }

        await loadUserInitData(payload.loginId);
        closeDetailModal();
        renderGridMessage(data.message || '상세 정보가 저장되었습니다.', 'success');
        notifyAlert(data.message || '상세 정보가 저장되었습니다.');
    }

    function bindEvents(root) {
        if (!root || root.getAttribute('data-events-bound') === 'Y') {
            return;
        }

        const searchInput = document.getElementById('userInfoSearchKeyword');
        const newBtn = document.getElementById('userInfoNewBtn');
        const tableBody = document.getElementById('userInfoTableBody');
        const modal = getModal();
        const modalSaveBtn = document.getElementById('userInfoDetailSaveBtn');
        const modalCloseBtn = document.getElementById('userInfoDetailCloseBtn');
        const modalCancelBtn = document.getElementById('userInfoDetailCancelBtn');
        const addressZipInput = document.getElementById('userInfoDetailAddressZip');
        const addressSearchBtn = document.getElementById('userInfoDetailAddressSearchBtn');

        if (!searchInput || !newBtn || !tableBody || !modal || !modalSaveBtn || !modalCloseBtn || !modalCancelBtn) {
            return;
        }

        root.setAttribute('data-events-bound', 'Y');

        searchInput.addEventListener('input', function () {
            state.searchKeyword = normalizeText(searchInput.value);
            renderUserTable();
        });

        newBtn.addEventListener('click', function () {
            createDraftRow();
        });

        tableBody.addEventListener('input', function (event) {
            if (event.target && event.target.matches('[data-field]')) {
                syncDraftRowFromElement(event.target);
            }
        });

        tableBody.addEventListener('change', function (event) {
            if (event.target && event.target.matches('[data-field]')) {
                syncDraftRowFromElement(event.target);
            }
        });

        tableBody.addEventListener('click', async function (event) {
            const clickedButton = event.target.closest('button[data-action]');
            if (!clickedButton) {
                return;
            }

            const action = clickedButton.getAttribute('data-action');
            const row = clickedButton.closest('tr');
            if (!row) {
                return;
            }

            if (action === 'cancel-row') {
                cancelDraftRow();
                return;
            }

            if (action === 'save-row') {
                try {
                    await saveGridRow(row);
                } catch (error) {
                    console.error(error);
                    renderGridMessage(error.message || '저장 중 오류가 발생했습니다.', 'error');
                }
                return;
            }

            if (action === 'detail') {
                const rowType = row.getAttribute('data-row-type');
                if (rowType === 'draft') {
                    renderGridMessage('신규 행을 먼저 저장한 뒤 상세를 열어 주세요.', 'error');
                    return;
                }

                const loginId = normalizeText(row.getAttribute('data-login-id'));
                if (!loginId) {
                    return;
                }

                try {
                    await openDetailByLoginId(loginId);
                } catch (error) {
                    console.error(error);
                    renderGridMessage(error.message || '상세 정보를 불러오지 못했습니다.', 'error');
                }
            }
        });

        modalSaveBtn.addEventListener('click', async function () {
            try {
                await saveDetail();
            } catch (error) {
                console.error(error);
                renderDetailMessage(error.message || '상세 저장 중 오류가 발생했습니다.', 'error');
            }
        });

        modalCloseBtn.addEventListener('click', function () {
            closeDetailModal();
        });

        modalCancelBtn.addEventListener('click', function () {
            closeDetailModal();
        });

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeDetailModal();
            }
        });

        if (addressSearchBtn) {
            addressSearchBtn.addEventListener('click', async function () {
                await openUserInfoAddressSearch();
            });
        }

        if (addressZipInput) {
            addressZipInput.addEventListener('dblclick', async function () {
                await openUserInfoAddressSearch();
            });

            addressZipInput.addEventListener('keydown', async function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    await openUserInfoAddressSearch();
                }
            });
        }
    }

    window.initCmsUserInfoView = async function initCmsUserInfoView(root) {
        const targetRoot = root || document.getElementById('userInfoRoot');
        if (!targetRoot) {
            return;
        }

        state.users = [];
        state.organizations = [];
        state.authCodes = [];
        state.searchKeyword = '';
        state.selectedLoginId = null;
        state.draftRow = null;
        state.isRoleAdmin = false;
        state.currentOrganizationCode = '';

        applyRoleBasedVisibility();
        bindEvents(targetRoot);
        renderGridMessage('사용자 정보를 불러오는 중입니다.', null);
        renderDetailMessage('', null);

        try {
            await loadUserInitData();
            renderGridMessage('사용자 정보를 불러왔습니다.', 'success');
        } catch (error) {
            console.error(error);
            renderGridMessage('사용자 정보를 불러오지 못했습니다.', 'error');
        }
    };
})();





