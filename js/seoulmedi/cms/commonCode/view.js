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
    const notifyAlert = cmsCommon.notifyAlert;

    const commonCodeState = {
        groups: [],
        details: [],
        selectedGrpCd: null,
        selectedDtlCd: null,
        groupSearchKeyword: '',
        detailSearchKeyword: ''
    };

    function renderGroupMessage(message, type) {
        renderMessage('commonCodeGroupMessage', message, type);
    }

    function renderDetailMessage(message, type) {
        renderMessage('commonCodeDetailMessage', message, type);
    }

    function normalizeUseYn(value) {
        return normalizeText(value) === 'N' ? 'N' : 'Y';
    }

    function normalizeGroupData(rawGroup) {
        const parsedCount = parseInt(rawGroup.detailCount, 10);
        return {
            grpCd: normalizeText(rawGroup.grpCd),
            grpNm: normalizeText(rawGroup.grpNm),
            grpDesc: normalizeText(rawGroup.grpDesc),
            useYn: normalizeUseYn(rawGroup.useYn),
            regDt: normalizeText(rawGroup.regDt),
            detailCount: Number.isNaN(parsedCount) ? 0 : parsedCount
        };
    }

    function normalizeDetailData(rawDetail) {
        const parsedSort = parseInt(rawDetail.sortOrdr, 10);
        return {
            grpCd: normalizeText(rawDetail.grpCd),
            dtlCd: normalizeText(rawDetail.dtlCd),
            dtlNm: normalizeText(rawDetail.dtlNm),
            sortOrdr: Number.isNaN(parsedSort) || parsedSort < 1 ? 1 : parsedSort,
            useYn: normalizeUseYn(rawDetail.useYn),
            regDt: normalizeText(rawDetail.regDt)
        };
    }

    function getFilteredGroups() {
        const keyword = normalizeText(commonCodeState.groupSearchKeyword).toLowerCase();
        return commonCodeState.groups.filter(function (group) {
            if (!keyword) {
                return true;
            }

            return normalizeText(group.grpCd).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(group.grpNm).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(group.grpDesc).toLowerCase().indexOf(keyword) >= 0;
        });
    }

    function getFilteredDetails() {
        const keyword = normalizeText(commonCodeState.detailSearchKeyword).toLowerCase();
        return commonCodeState.details.filter(function (detail) {
            if (!keyword) {
                return true;
            }

            return normalizeText(detail.dtlCd).toLowerCase().indexOf(keyword) >= 0
                || normalizeText(detail.dtlNm).toLowerCase().indexOf(keyword) >= 0;
        });
    }

    function findGroupByCode(grpCd) {
        return commonCodeState.groups.find(function (group) {
            return group.grpCd === grpCd;
        }) || null;
    }

    function findDetailByCode(dtlCd) {
        return commonCodeState.details.find(function (detail) {
            return detail.dtlCd === dtlCd;
        }) || null;
    }

    function setGroupFormMode(isExisting) {
        const grpCdInput = document.getElementById('commonCodeGrpCd');
        if (grpCdInput) {
            grpCdInput.readOnly = isExisting;
        }
    }

    function setDetailFormMode(isExisting) {
        const dtlCdInput = document.getElementById('commonCodeDtlCd');
        if (dtlCdInput) {
            dtlCdInput.readOnly = isExisting;
        }
    }

    function fillGroupForm(groupInfo) {
        const grpCdInput = document.getElementById('commonCodeGrpCd');
        const grpNmInput = document.getElementById('commonCodeGrpNm');
        const grpDescInput = document.getElementById('commonCodeGrpDesc');
        const useYnSelect = document.getElementById('commonCodeGroupUseYn');
        const regDtInput = document.getElementById('commonCodeGroupRegDt');

        if (!grpCdInput || !grpNmInput || !grpDescInput || !useYnSelect || !regDtInput) {
            return;
        }

        if (!groupInfo) {
            setGroupFormMode(false);
            grpCdInput.value = '';
            grpNmInput.value = '';
            grpDescInput.value = '';
            useYnSelect.value = 'Y';
            regDtInput.value = '';
            return;
        }

        setGroupFormMode(true);
        grpCdInput.value = groupInfo.grpCd || '';
        grpNmInput.value = groupInfo.grpNm || '';
        grpDescInput.value = groupInfo.grpDesc || '';
        useYnSelect.value = groupInfo.useYn || 'Y';
        regDtInput.value = groupInfo.regDt || '';
    }

    function fillDetailForm(detailInfo) {
        const grpCdInput = document.getElementById('commonCodeDetailGrpCd');
        const dtlCdInput = document.getElementById('commonCodeDtlCd');
        const dtlNmInput = document.getElementById('commonCodeDtlNm');
        const sortOrdrInput = document.getElementById('commonCodeDetailSortOrdr');
        const useYnSelect = document.getElementById('commonCodeDetailUseYn');
        const regDtInput = document.getElementById('commonCodeDetailRegDt');

        if (!grpCdInput || !dtlCdInput || !dtlNmInput || !sortOrdrInput || !useYnSelect || !regDtInput) {
            return;
        }

        if (!detailInfo) {
            setDetailFormMode(false);
            grpCdInput.value = commonCodeState.selectedGrpCd || '';
            dtlCdInput.value = '';
            dtlNmInput.value = '';
            sortOrdrInput.value = '1';
            useYnSelect.value = 'Y';
            regDtInput.value = '';
            return;
        }

        setDetailFormMode(Boolean(detailInfo.dtlCd));
        grpCdInput.value = detailInfo.grpCd || commonCodeState.selectedGrpCd || '';
        dtlCdInput.value = detailInfo.dtlCd || '';
        dtlNmInput.value = detailInfo.dtlNm || '';
        sortOrdrInput.value = String(detailInfo.sortOrdr || 1);
        useYnSelect.value = detailInfo.useYn || 'Y';
        regDtInput.value = detailInfo.regDt || '';
    }

    function getUseLabel(useYn) {
        return useYn === 'N' ? '미사용' : '사용';
    }

    function renderGroupList() {
        const groupList = document.getElementById('commonCodeGroupList');
        if (!groupList) {
            return;
        }

        if (!commonCodeState.groups.length) {
            groupList.innerHTML = '<div class="common-code-empty">등록된 그룹 코드가 없습니다. 그룹 신규 버튼으로 추가하세요.</div>';
            return;
        }

        const filteredGroups = getFilteredGroups();
        if (!filteredGroups.length) {
            groupList.innerHTML = '<div class="common-code-empty">검색 조건에 맞는 그룹 코드가 없습니다.</div>';
            return;
        }

        groupList.innerHTML = filteredGroups.map(function (group) {
            const activeClass = commonCodeState.selectedGrpCd === group.grpCd ? 'active' : '';
            return (
                '<button type="button" class="common-code-group-item ' + activeClass + '" data-grp-cd="' + escapeHtml(group.grpCd) + '">' +
                    '<div class="common-code-group-main">' +
                        '<strong>' + escapeHtml(group.grpNm || group.grpCd) + '</strong>' +
                        '<span>' + escapeHtml(group.grpCd) + '</span>' +
                    '</div>' +
                    '<div class="common-code-group-side">' +
                        '<span class="common-code-badge" data-use-yn="' + escapeHtml(group.useYn) + '">' + escapeHtml(getUseLabel(group.useYn)) + '</span>' +
                        '<span class="common-code-count">' + escapeHtml(String(group.detailCount || 0)) + '건</span>' +
                    '</div>' +
                '</button>'
            );
        }).join('');

        groupList.querySelectorAll('[data-grp-cd]').forEach(function (button) {
            button.addEventListener('click', async function () {
                const grpCd = button.getAttribute('data-grp-cd');
                try {
                    await selectGroup(grpCd);
                } catch (error) {
                    console.error(error);
                    renderGroupMessage(error.message || '그룹 코드 정보를 불러오지 못했습니다.', 'error');
                }
            });
        });
    }

    function renderDetailList() {
        const detailList = document.getElementById('commonCodeDetailList');
        if (!detailList) {
            return;
        }

        if (!commonCodeState.selectedGrpCd) {
            detailList.innerHTML = '<div class="common-code-empty">그룹 코드를 선택하면 상세 코드 목록이 표시됩니다.</div>';
            return;
        }

        if (!commonCodeState.details.length) {
            detailList.innerHTML = '<div class="common-code-empty">등록된 상세 코드가 없습니다. 상세 신규 버튼으로 추가하세요.</div>';
            return;
        }

        const filteredDetails = getFilteredDetails();
        if (!filteredDetails.length) {
            detailList.innerHTML = '<div class="common-code-empty">검색 조건에 맞는 상세 코드가 없습니다.</div>';
            return;
        }

        detailList.innerHTML = filteredDetails.map(function (detail) {
            const activeClass = commonCodeState.selectedDtlCd === detail.dtlCd ? 'active' : '';
            const detailName = normalizeText(detail.dtlNm || detail.dtlCd);
            const detailCode = normalizeText(detail.dtlCd);
            return (
                '<button type="button" class="common-code-detail-item ' + activeClass + '" data-dtl-cd="' + escapeHtml(detailCode) + '">' +
                    '<span class="common-code-detail-code" title="' + escapeHtml(detailCode) + '">' + escapeHtml(detailCode) + '</span>' +
                    '<span class="common-code-detail-name" title="' + escapeHtml(detailName) + '">' + escapeHtml(detailName) + '</span>' +
                    '<span class="common-code-order">정렬 ' + escapeHtml(String(detail.sortOrdr || 1)) + '</span>' +
                    '<span class="common-code-badge" data-use-yn="' + escapeHtml(detail.useYn) + '">' + escapeHtml(getUseLabel(detail.useYn)) + '</span>' +
                '</button>'
            );
        }).join('');

        detailList.querySelectorAll('[data-dtl-cd]').forEach(function (button) {
            button.addEventListener('click', function () {
                selectDetail(button.getAttribute('data-dtl-cd'));
            });
        });
    }

    function getNextDetailSortOrdr() {
        return commonCodeState.details.reduce(function (maxValue, detail) {
            return Math.max(maxValue, detail.sortOrdr || 1);
        }, 0) + 1;
    }

    function prepareNewGroupForm() {
        commonCodeState.selectedGrpCd = null;
        commonCodeState.selectedDtlCd = null;
        commonCodeState.details = [];
        renderGroupList();
        renderDetailList();
        fillGroupForm(null);
        fillDetailForm(null);
        renderGroupMessage('신규 그룹 코드 등록 상태입니다. 그룹 코드를 입력한 뒤 저장하세요.', null);
        renderDetailMessage('그룹 코드를 먼저 저장해야 상세 코드를 추가할 수 있습니다.', null);
    }

    function prepareNewDetailForm() {
        if (!commonCodeState.selectedGrpCd) {
            renderDetailMessage('상세 코드를 추가하려면 먼저 그룹 코드를 선택하세요.', 'error');
            return;
        }

        commonCodeState.selectedDtlCd = null;
        renderDetailList();
        fillDetailForm({
            grpCd: commonCodeState.selectedGrpCd,
            dtlCd: '',
            dtlNm: '',
            sortOrdr: getNextDetailSortOrdr(),
            useYn: 'Y',
            regDt: ''
        });
        renderDetailMessage('신규 상세 코드 등록 상태입니다. 상세 코드를 입력한 뒤 저장하세요.', null);
    }

    async function loadGroupDetail(grpCd) {
        const data = await fetchJson(
            contextPath + '/seoulmedi/cms/commonCode/api/group/detail.do?grpCd=' + encodeURIComponent(grpCd),
            { method: 'GET' }
        );

        if (!data.success) {
            throw new Error(data.message || '그룹 코드 정보를 불러오지 못했습니다.');
        }

        return {
            groupInfo: normalizeGroupData(data.groupInfo || {}),
            detailCodes: (data.detailCodes || []).map(normalizeDetailData)
        };
    }

    async function selectGroup(grpCd, preferredDtlCd) {
        const previousSelectedDtlCd = commonCodeState.selectedDtlCd;
        const detailData = await loadGroupDetail(grpCd);

        commonCodeState.selectedGrpCd = detailData.groupInfo.grpCd;
        commonCodeState.selectedDtlCd = null;
        commonCodeState.details = detailData.detailCodes;
        commonCodeState.groups = commonCodeState.groups.map(function (group) {
            if (group.grpCd !== detailData.groupInfo.grpCd) {
                return group;
            }
            return Object.assign({}, group, detailData.groupInfo, {
                detailCount: detailData.detailCodes.length
            });
        });

        renderGroupList();
        fillGroupForm(detailData.groupInfo);

        if (!commonCodeState.details.length) {
            renderDetailList();
            fillDetailForm(null);
            renderDetailMessage('선택한 그룹에 등록된 상세 코드가 없습니다. 상세 신규 버튼으로 추가하세요.', null);
            return;
        }

        const targetDtlCd = (preferredDtlCd && findDetailByCode(preferredDtlCd))
            ? preferredDtlCd
            : ((previousSelectedDtlCd && findDetailByCode(previousSelectedDtlCd))
                ? previousSelectedDtlCd
                : commonCodeState.details[0].dtlCd);

        renderDetailList();
        selectDetail(targetDtlCd);
    }

    function selectDetail(dtlCd) {
        const detailInfo = findDetailByCode(dtlCd);
        if (!detailInfo) {
            commonCodeState.selectedDtlCd = null;
            renderDetailList();
            fillDetailForm(null);
            return;
        }

        commonCodeState.selectedDtlCd = detailInfo.dtlCd;
        renderDetailList();
        fillDetailForm(detailInfo);
        renderDetailMessage('', null);
    }

    async function loadCommonCodeInitData(preferredGrpCd, preferredDtlCd) {
        const data = await fetchJson(contextPath + '/seoulmedi/cms/commonCode/api/init.do', {
            method: 'GET'
        });

        if (!data.success) {
            throw new Error(data.message || '공통 코드 정보를 불러오지 못했습니다.');
        }

        commonCodeState.groups = (data.groups || []).map(normalizeGroupData);

        if (!commonCodeState.groups.length) {
            prepareNewGroupForm();
            return;
        }

        const targetGrpCd = (preferredGrpCd && findGroupByCode(preferredGrpCd))
            ? preferredGrpCd
            : ((commonCodeState.selectedGrpCd && findGroupByCode(commonCodeState.selectedGrpCd))
                ? commonCodeState.selectedGrpCd
                : commonCodeState.groups[0].grpCd);

        await selectGroup(targetGrpCd, preferredDtlCd);
    }

    async function syncGroupSelectionBySearch() {
        const filteredGroups = getFilteredGroups();
        if (!filteredGroups.length) {
            commonCodeState.selectedGrpCd = null;
            commonCodeState.selectedDtlCd = null;
            commonCodeState.details = [];
            renderGroupList();
            renderDetailList();
            fillGroupForm(null);
            fillDetailForm(null);
            renderGroupMessage('검색 조건에 맞는 그룹 코드가 없습니다.', null);
            return;
        }

        if (!filteredGroups.some(function (group) { return group.grpCd === commonCodeState.selectedGrpCd; })) {
            await selectGroup(filteredGroups[0].grpCd);
            return;
        }

        renderGroupList();
    }

    function syncDetailSelectionBySearch() {
        const filteredDetails = getFilteredDetails();
        if (!filteredDetails.length) {
            commonCodeState.selectedDtlCd = null;
            renderDetailList();
            fillDetailForm(null);
            renderDetailMessage('검색 조건에 맞는 상세 코드가 없습니다.', null);
            return;
        }

        if (!filteredDetails.some(function (detail) { return detail.dtlCd === commonCodeState.selectedDtlCd; })) {
            selectDetail(filteredDetails[0].dtlCd);
            return;
        }

        renderDetailList();
    }

    function buildGroupPayload() {
        return {
            grpCd: normalizeText(document.getElementById('commonCodeGrpCd').value),
            grpNm: normalizeText(document.getElementById('commonCodeGrpNm').value),
            grpDesc: normalizeText(document.getElementById('commonCodeGrpDesc').value),
            useYn: normalizeUseYn(document.getElementById('commonCodeGroupUseYn').value)
        };
    }

    function buildDetailPayload() {
        return {
            grpCd: normalizeText(document.getElementById('commonCodeDetailGrpCd').value),
            dtlCd: normalizeText(document.getElementById('commonCodeDtlCd').value),
            dtlNm: normalizeText(document.getElementById('commonCodeDtlNm').value),
            sortOrdr: normalizeText(document.getElementById('commonCodeDetailSortOrdr').value),
            useYn: normalizeUseYn(document.getElementById('commonCodeDetailUseYn').value)
        };
    }

    async function saveGroup() {
        const payload = buildGroupPayload();

        if (!payload.grpCd) {
            renderGroupMessage('그룹 코드는 필수입니다.', 'error');
            return;
        }
        if (!payload.grpNm) {
            renderGroupMessage('그룹 코드명은 필수입니다.', 'error');
            return;
        }

        const data = await fetchJson(contextPath + '/seoulmedi/cms/commonCode/api/group/save.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!data.success) {
            throw new Error(data.message || '그룹 코드 저장에 실패했습니다.');
        }

        await loadCommonCodeInitData(payload.grpCd);
        renderGroupMessage(data.message || '그룹 코드 정보가 저장되었습니다.', 'success');
        notifyAlert(data.message || '그룹 코드 정보가 저장되었습니다.');
    }

    async function deleteGroup() {
        const grpCd = normalizeText(document.getElementById('commonCodeGrpCd').value);
        if (!grpCd) {
            renderGroupMessage('삭제할 그룹 코드를 선택하세요.', 'error');
            return;
        }

        const confirmed = window.confirm('선택한 그룹 코드를 삭제하시겠습니까?\n하위 상세 코드도 함께 삭제됩니다.');
        if (!confirmed) {
            renderGroupMessage('그룹 코드 삭제를 취소했습니다.', null);
            return;
        }

        const data = await fetchJson(contextPath + '/seoulmedi/cms/commonCode/api/group/delete.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grpCd: grpCd })
        });

        if (!data.success) {
            throw new Error(data.message || '그룹 코드 삭제에 실패했습니다.');
        }

        commonCodeState.selectedGrpCd = null;
        commonCodeState.selectedDtlCd = null;
        await loadCommonCodeInitData();
        renderGroupMessage(data.message || '그룹 코드가 삭제되었습니다.', 'success');
        notifyAlert(data.message || '그룹 코드가 삭제되었습니다.');
    }

    async function saveDetail() {
        const payload = buildDetailPayload();

        if (!payload.grpCd) {
            renderDetailMessage('상세 코드가 속할 그룹 코드를 먼저 선택하세요.', 'error');
            return;
        }
        if (!payload.dtlCd) {
            renderDetailMessage('상세 코드는 필수입니다.', 'error');
            return;
        }
        if (!payload.dtlNm) {
            renderDetailMessage('상세 코드명은 필수입니다.', 'error');
            return;
        }

        const data = await fetchJson(contextPath + '/seoulmedi/cms/commonCode/api/detail/save.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!data.success) {
            throw new Error(data.message || '상세 코드 저장에 실패했습니다.');
        }

        await loadCommonCodeInitData(payload.grpCd, payload.dtlCd);
        renderDetailMessage(data.message || '상세 코드 정보가 저장되었습니다.', 'success');
        notifyAlert(data.message || '상세 코드 정보가 저장되었습니다.');
    }

    async function deleteDetail() {
        const payload = buildDetailPayload();
        if (!payload.grpCd || !payload.dtlCd) {
            renderDetailMessage('삭제할 상세 코드를 선택하세요.', 'error');
            return;
        }

        const confirmed = window.confirm('선택한 상세 코드를 삭제하시겠습니까?');
        if (!confirmed) {
            renderDetailMessage('상세 코드 삭제를 취소했습니다.', null);
            return;
        }

        const data = await fetchJson(contextPath + '/seoulmedi/cms/commonCode/api/detail/delete.do', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grpCd: payload.grpCd,
                dtlCd: payload.dtlCd
            })
        });

        if (!data.success) {
            throw new Error(data.message || '상세 코드 삭제에 실패했습니다.');
        }

        await loadCommonCodeInitData(payload.grpCd);
        renderDetailMessage(data.message || '상세 코드가 삭제되었습니다.', 'success');
        notifyAlert(data.message || '상세 코드가 삭제되었습니다.');
    }

    function bindCommonCodeEvents(root) {
        if (!root || root.getAttribute('data-events-bound') === 'Y') {
            return;
        }

        const groupSearchInput = document.getElementById('commonCodeGroupSearchKeyword');
        const detailSearchInput = document.getElementById('commonCodeDetailSearchKeyword');
        const groupNewBtn = document.getElementById('commonCodeGroupNewBtn');
        const groupSaveBtn = document.getElementById('commonCodeGroupSaveBtn');
        const groupDeleteBtn = document.getElementById('commonCodeGroupDeleteBtn');
        const detailNewBtn = document.getElementById('commonCodeDetailNewBtn');
        const detailSaveBtn = document.getElementById('commonCodeDetailSaveBtn');
        const detailDeleteBtn = document.getElementById('commonCodeDetailDeleteBtn');

        if (!groupSearchInput || !detailSearchInput || !groupNewBtn || !groupSaveBtn || !groupDeleteBtn || !detailNewBtn || !detailSaveBtn || !detailDeleteBtn) {
            return;
        }

        root.setAttribute('data-events-bound', 'Y');
        groupSearchInput.value = commonCodeState.groupSearchKeyword || '';
        detailSearchInput.value = commonCodeState.detailSearchKeyword || '';

        groupSearchInput.addEventListener('input', async function () {
            commonCodeState.groupSearchKeyword = normalizeText(groupSearchInput.value);
            try {
                await syncGroupSelectionBySearch();
            } catch (error) {
                console.error(error);
                renderGroupMessage(error.message || '그룹 코드 검색 중 오류가 발생했습니다.', 'error');
            }
        });

        detailSearchInput.addEventListener('input', function () {
            commonCodeState.detailSearchKeyword = normalizeText(detailSearchInput.value);
            syncDetailSelectionBySearch();
        });

        groupNewBtn.addEventListener('click', function () {
            prepareNewGroupForm();
        });

        groupSaveBtn.addEventListener('click', async function () {
            try {
                await saveGroup();
            } catch (error) {
                console.error(error);
                renderGroupMessage(error.message || '그룹 코드 저장 중 오류가 발생했습니다.', 'error');
            }
        });

        groupDeleteBtn.addEventListener('click', async function () {
            try {
                await deleteGroup();
            } catch (error) {
                console.error(error);
                renderGroupMessage(error.message || '그룹 코드 삭제 중 오류가 발생했습니다.', 'error');
            }
        });

        detailNewBtn.addEventListener('click', function () {
            prepareNewDetailForm();
        });

        detailSaveBtn.addEventListener('click', async function () {
            try {
                await saveDetail();
            } catch (error) {
                console.error(error);
                renderDetailMessage(error.message || '상세 코드 저장 중 오류가 발생했습니다.', 'error');
            }
        });

        detailDeleteBtn.addEventListener('click', async function () {
            try {
                await deleteDetail();
            } catch (error) {
                console.error(error);
                renderDetailMessage(error.message || '상세 코드 삭제 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    window.initCmsCommonCodeView = async function initCmsCommonCodeView(root) {
        const targetRoot = root || document.getElementById('commonCodeRoot');
        if (!targetRoot) {
            return;
        }

        commonCodeState.groupSearchKeyword = '';
        commonCodeState.detailSearchKeyword = '';
        commonCodeState.selectedGrpCd = null;
        commonCodeState.selectedDtlCd = null;
        commonCodeState.groups = [];
        commonCodeState.details = [];

        bindCommonCodeEvents(targetRoot);
        renderGroupMessage('공통 코드 정보를 불러오는 중입니다.', null);
        renderDetailMessage('', null);

        try {
            await loadCommonCodeInitData();
            renderGroupMessage('공통 코드 정보를 불러왔습니다.', 'success');
        } catch (error) {
            console.error(error);
            renderGroupMessage('공통 코드 정보를 불러오지 못했습니다.', 'error');
        }
    };
})();

