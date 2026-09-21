(function () {
    const instanceMap = new WeakMap();

    function normalizeText(value) {
        if (value === undefined || value === null) {
            return '';
        }
        return String(value);
    }

    function escapeAttribute(value) {
        return normalizeText(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function readFileAsDataUrl(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = function () {
                resolve(normalizeText(reader.result));
            };
            reader.onerror = function () {
                reject(new Error('이미지 파일을 읽지 못했습니다.'));
            };
            reader.readAsDataURL(file);
        });
    }

    function isImageFile(file) {
        return !!(file && file.type && file.type.indexOf('image/') === 0);
    }

    function buildImageHtml(imageUrl, altText) {
        return '<img src="' + escapeAttribute(imageUrl) + '" alt="' + escapeAttribute(altText || '') + '" />';
    }

    function createHeaderButton(label, className, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }

    function createFallbackEditor(textarea, options) {
        const wrapper = document.createElement('div');
        wrapper.className = 'cms-html-editor is-fallback';
        wrapper.setAttribute('data-editor-mode', options.mode);

        const clone = document.createElement('textarea');
        clone.className = 'cms-html-editor-fallback';
        clone.style.minHeight = String(options.minHeight) + 'px';
        clone.value = normalizeText(textarea.value);

        textarea.style.display = 'none';
        textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);
        wrapper.appendChild(clone);

        clone.addEventListener('input', function () {
            textarea.value = normalizeText(clone.value);
        });

        const instance = {
            setHtml: function (html) {
                const normalizedHtml = normalizeText(html);
                clone.value = normalizedHtml;
                textarea.value = normalizedHtml;
            },
            getHtml: function () {
                return normalizeText(clone.value).trim();
            },
            setMode: function () {},
            focus: function () {
                clone.focus();
            },
            sync: function () {
                textarea.value = normalizeText(clone.value);
            },
            textarea: textarea,
            wrapper: wrapper
        };

        instanceMap.set(textarea, instance);
        return instance;
    }

    function createEditor(textarea, options) {
        if (!textarea || instanceMap.has(textarea)) {
            return instanceMap.get(textarea) || null;
        }

        const config = Object.assign({
            mode: 'compact',
            minHeight: 180
        }, options || {});

        if (!window.SUNEDITOR || typeof window.SUNEDITOR.create !== 'function') {
            return createFallbackEditor(textarea, config);
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'cms-html-editor';
        wrapper.setAttribute('data-editor-mode', config.mode);

        const header = document.createElement('div');
        header.className = 'cms-html-editor-header';

        const actionRow = document.createElement('div');
        actionRow.className = 'cms-html-editor-actions';

        const modeRow = document.createElement('div');
        modeRow.className = 'cms-html-editor-modes';

        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.className = 'cms-html-editor-file';
        imageInput.hidden = true;

        const host = document.createElement('div');
        host.className = 'cms-html-editor-host';

        const helperText = document.createElement('span');
        helperText.className = 'cms-html-editor-helper';
        helperText.textContent = '이미지 파일을 드래그하거나 붙여넣을 수 있습니다.';

        const visualButton = createHeaderButton('디자인 편집', 'cms-html-editor-mode active', function () {
            instance.setMode('visual');
        });
        const sourceButton = createHeaderButton('HTML 코드', 'cms-html-editor-mode', function () {
            instance.setMode('source');
        });

        modeRow.appendChild(visualButton);
        modeRow.appendChild(sourceButton);

        const imageUrlButton = createHeaderButton('이미지 URL', 'cms-html-editor-button', function () {
            const imageUrl = window.prompt('삽입할 이미지 주소를 입력하세요.', 'https://');
            if (!imageUrl) {
                return;
            }
            const altText = window.prompt('이미지 설명 문구를 입력하세요.', '') || '';
            instance.setMode('visual');
            editor.insertHTML(buildImageHtml(imageUrl, altText), true);
            instance.sync();
        });
        const imageFileButton = createHeaderButton('이미지 파일', 'cms-html-editor-button', function () {
            imageInput.click();
        });

        async function insertImageFiles(files, promptAltText) {
            const imageFiles = Array.prototype.slice.call(files || []).filter(isImageFile);
            if (!imageFiles.length) {
                return;
            }

            try {
                const htmlList = await Promise.all(imageFiles.map(async function (file) {
                    const dataUrl = await readFileAsDataUrl(file);
                    const altText = promptAltText
                        ? (window.prompt('이미지 설명 문구를 입력하세요.', file.name || '') || '')
                        : (file.name || '');
                    return buildImageHtml(dataUrl, altText);
                }));
                instance.setMode('visual');
                editor.insertHTML(htmlList.join(''), true);
                instance.sync();
            } catch (error) {
                window.alert(error.message || '이미지 삽입 중 오류가 발생했습니다.');
            }
        }

        imageInput.addEventListener('change', async function () {
            const file = imageInput.files && imageInput.files[0];
            if (!file) {
                return;
            }

            try {
                await insertImageFiles([file], true);
            } finally {
                imageInput.value = '';
            }
        });

        actionRow.appendChild(imageUrlButton);
        actionRow.appendChild(imageFileButton);

        header.appendChild(actionRow);
        header.appendChild(helperText);
        header.appendChild(modeRow);
        header.appendChild(imageInput);
        wrapper.appendChild(header);
        wrapper.appendChild(host);

        textarea.style.display = 'none';
        textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);

        const buttonList = config.mode === 'full'
            ? [
                ['undo', 'redo'],
                ['formatBlock', 'fontSize', 'bold', 'underline', 'italic', 'strike'],
                ['fontColor', 'hiliteColor', 'removeFormat'],
                ['align', 'list', 'lineHeight'],
                ['table', 'link', 'blockquote', 'horizontalRule'],
                ['fullScreen', 'showBlocks', 'preview']
            ]
            : [
                ['formatBlock', 'bold', 'underline', 'italic'],
                ['fontColor', 'removeFormat'],
                ['list', 'link', 'blockquote']
            ];

        const editor = window.SUNEDITOR.create(host, {
            lang: window.SUNEDITOR_LANG && window.SUNEDITOR_LANG.ko ? window.SUNEDITOR_LANG.ko : undefined,
            width: '100%',
            minHeight: String(config.minHeight) + 'px',
            height: config.mode === 'full' ? '420px' : String(config.minHeight) + 'px',
            defaultStyle: 'font-size: 14px;',
            buttonList: buttonList,
            formats: ['p', 'h2', 'h3', 'blockquote'],
            resizingBar: true,
            showPathLabel: false,
            charCounter: config.mode === 'full',
            imageFileInput: false,
            imageUploadUrl: null,
            videoFileInput: false
        });

        function clearDragState() {
            wrapper.classList.remove('is-dragover');
        }

        function isSourceMode() {
            return !!(editor && editor.core && editor.core._variable && editor.core._variable.isCodeView);
        }

        function refreshModeButtons() {
            const sourceMode = isSourceMode();
            visualButton.classList.toggle('active', !sourceMode);
            sourceButton.classList.toggle('active', sourceMode);
        }

        editor.onChange = function (contents) {
            textarea.value = normalizeText(contents);
            refreshModeButtons();
        };

        wrapper.addEventListener('dragover', function (event) {
            const files = event.dataTransfer && event.dataTransfer.files;
            const hasImage = Array.prototype.slice.call(files || []).some(isImageFile);
            if (!hasImage) {
                return;
            }
            event.preventDefault();
            wrapper.classList.add('is-dragover');
        });

        wrapper.addEventListener('dragleave', function (event) {
            if (wrapper.contains(event.relatedTarget)) {
                return;
            }
            clearDragState();
        });

        wrapper.addEventListener('drop', async function (event) {
            const files = event.dataTransfer && event.dataTransfer.files;
            const hasImage = Array.prototype.slice.call(files || []).some(isImageFile);
            if (!hasImage) {
                return;
            }
            event.preventDefault();
            clearDragState();
            await insertImageFiles(files, false);
        });

        wrapper.addEventListener('paste', async function (event) {
            const clipboardData = event.clipboardData;
            const files = clipboardData && clipboardData.files;
            const hasImage = Array.prototype.slice.call(files || []).some(isImageFile);
            if (!hasImage) {
                return;
            }
            event.preventDefault();
            await insertImageFiles(files, false);
        });

        const instance = {
            setHtml: function (html) {
                const normalizedHtml = normalizeText(html);
                editor.setContents(normalizedHtml);
                textarea.value = normalizedHtml;
                refreshModeButtons();
            },
            getHtml: function () {
                return normalizeText(editor.getContents()).trim();
            },
            setMode: function (mode) {
                const nextMode = mode === 'source' ? 'source' : 'visual';
                const sourceMode = isSourceMode();
                if ((nextMode === 'source' && !sourceMode) || (nextMode === 'visual' && sourceMode)) {
                    if (editor.core && typeof editor.core.toggleCodeView === 'function') {
                        editor.core.toggleCodeView();
                    }
                }
                refreshModeButtons();
            },
            focus: function () {
                if (typeof editor.focus === 'function') {
                    editor.focus();
                    return;
                }
                if (editor.core && typeof editor.core.focus === 'function') {
                    editor.core.focus();
                }
            },
            sync: function () {
                textarea.value = normalizeText(editor.getContents());
                refreshModeButtons();
            },
            textarea: textarea,
            wrapper: wrapper
        };

        instance.setHtml(textarea.value || '');
        instanceMap.set(textarea, instance);
        return instance;
    }

    window.cmsHtmlEditor = {
        create: createEditor,
        getInstance: function (textarea) {
            return instanceMap.get(textarea) || null;
        }
    };
})();
