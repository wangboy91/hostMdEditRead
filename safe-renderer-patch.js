// 安全的updateUI函数 - 替换原有的updateUI函数
function updateUI() {
    try {
        // 确保所有必要的变量都已初始化
        if (typeof filteredFiles === 'undefined') {
            window.filteredFiles = [];
        }
        if (typeof markdownFiles === 'undefined') {
            window.markdownFiles = [];
        }
        if (typeof currentFile === 'undefined') {
            window.currentFile = null;
        }
        if (typeof isModified === 'undefined') {
            window.isModified = false;
        }

        // 更新文件名显示
        const fileName = currentFile ? path.basename(currentFile) : '未命名文档';
        const modifiedIndicator = isModified ? ' *' : '';
        if (elements && elements.currentFile) {
            elements.currentFile.textContent = fileName + modifiedIndicator;
        }
        
        // 更新文件计数
        if (elements && elements.fileCount) {
            const count = (filteredFiles && Array.isArray(filteredFiles)) ? filteredFiles.length : 0;
            elements.fileCount.textContent = `文件: ${count}`;
        }
        
        // 更新字数统计
        let content = '';
        if (elements && elements.editor && elements.editor.value !== undefined) {
            content = elements.editor.value;
        }
        
        const wordCount = content ? content.length : 0;
        const charCount = content ? content.replace(/\s/g, '').length : 0;
        
        if (elements && elements.wordCount) {
            elements.wordCount.textContent = `字数: ${charCount} / ${wordCount}`;
        }
        
        // 更新文件大小
        if (elements && elements.fileSize) {
            const size = new Blob([content]).size;
            const sizeText = size < 1024 ? `${size} B` : 
                            size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` :
                            `${(size / (1024 * 1024)).toFixed(1)} MB`;
            elements.fileSize.textContent = sizeText;
        }
        
        // 更新光标位置
        updateCursorPosition();
        
    } catch (error) {
        console.error('updateUI error:', error);
        // 即使出错也不要阻止应用运行
    }
}

// 安全的updateCursorPosition函数
function updateCursorPosition() {
    try {
        if (!elements || !elements.editor || !elements.cursorPosition) {
            return;
        }
        
        const textarea = elements.editor;
        const text = textarea.value || '';
        const cursorPos = textarea.selectionStart || 0;
        
        const lines = text.substring(0, cursorPos).split('\n');
        const line = lines ? lines.length : 1;
        const column = (lines && lines.length > 0) ? lines[lines.length - 1].length + 1 : 1;
        
        elements.cursorPosition.textContent = `行 ${line}, 列 ${column}`;
    } catch (error) {
        console.error('updateCursorPosition error:', error);
        // 设置默认值
        if (elements && elements.cursorPosition) {
            elements.cursorPosition.textContent = '行 1, 列 1';
        }
    }
}

// 安全的renderFileList函数
function renderFileList() {
    try {
        if (!elements || !elements.fileList) {
            return;
        }

        // 确保数组已初始化
        if (!Array.isArray(filteredFiles)) {
            filteredFiles = [];
        }
        if (!Array.isArray(markdownFiles)) {
            markdownFiles = [];
        }

        if (filteredFiles.length === 0) {
            elements.fileList.innerHTML = `
                <div class="empty-state">
                    <p>${markdownFiles.length === 0 ? '点击"扫描文件"开始浏览Markdown文档' : '没有找到匹配的文件'}</p>
                </div>
            `;
            return;
        }
        
        const html = filteredFiles.map(file => `
            <div class="file-item" data-path="${file.path || ''}">
                <div class="file-name">${file.name || '未知文件'}</div>
                <div class="file-path">${file.directory || ''}</div>
            </div>
        `).join('');
        
        elements.fileList.innerHTML = html;
        
        // 添加点击事件
        elements.fileList.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const filePath = item.dataset.path;
                if (filePath && (isModified && !confirm('当前文件未保存，确定要打开新文件吗？') || !isModified)) {
                    loadFile(filePath);
                }
            });
        });
        
        updateFileListSelection();
    } catch (error) {
        console.error('renderFileList error:', error);
        if (elements && elements.fileList) {
            elements.fileList.innerHTML = '<div class="empty-state"><p>文件列表加载出错</p></div>';
        }
    }
}