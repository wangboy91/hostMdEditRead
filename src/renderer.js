const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// 应用状态
let currentFile = null;
let currentContent = '';
let isModified = false;
let currentMode = 'split'; // split, edit, preview
let currentTheme = 'light';
let markdownFiles = [];
let filteredFiles = [];
let editor = null;

// DOM 元素 - 将在initApp中初始化
let elements = {};

// 初始化应用
function initApp() {
    // 初始化DOM元素
    elements = {
        // 工具栏按钮
        newBtn: document.getElementById('newBtn'),
        openBtn: document.getElementById('openBtn'),
        saveBtn: document.getElementById('saveBtn'),
        saveAsBtn: document.getElementById('saveAsBtn'),
        modeToggle: document.getElementById('modeToggle'),
        themeToggle: document.getElementById('themeToggle'),
        
        // 侧边栏
        scanBtn: document.getElementById('scanBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        searchInput: document.getElementById('searchInput'),
        fileList: document.getElementById('fileList'),
        
        // 编辑器和预览
        editor: document.getElementById('editor'),
        preview: document.getElementById('preview'),
        editorContainer: document.getElementById('editor-container'),
        editorPanel: document.getElementById('editor-panel'),
        previewPanel: document.getElementById('preview-panel'),
        splitter: document.getElementById('splitter'),
        
        // 状态栏
        currentFile: document.getElementById('currentFile'),
        fileCount: document.getElementById('fileCount'),
        wordCount: document.getElementById('wordCount'),
        cursorPosition: document.getElementById('cursorPosition'),
        fileSize: document.getElementById('fileSize')
    };
    
    // 检查关键元素是否存在
    const requiredElements = ['editor', 'preview'];
    const optionalElements = ['fileCount', 'wordCount', 'currentFile', 'cursorPosition', 'fileSize'];
    
    for (const elementName of requiredElements) {
        if (!elements[elementName]) {
            console.error(`Required element not found: ${elementName}`);
            return;
        }
    }
    
    // 警告缺失的可选元素
    for (const elementName of optionalElements) {
        if (!elements[elementName]) {
            console.warn(`Optional element not found: ${elementName}`);
        }
    }
    
    setupEventListeners();
    setupEditor();
    loadTheme();
    updateUI();
    
    // 配置 marked
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) {}
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 工具栏按钮
    elements.newBtn.addEventListener('click', newFile);
    elements.openBtn.addEventListener('click', openFile);
    elements.saveBtn.addEventListener('click', saveFile);
    elements.saveAsBtn.addEventListener('click', saveAsFile);
    elements.modeToggle.addEventListener('click', toggleMode);
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // 侧边栏
    elements.scanBtn.addEventListener('click', scanFiles);
    elements.refreshBtn.addEventListener('click', refreshFileList);
    elements.searchInput.addEventListener('input', filterFiles);
    
    // 编辑器
    elements.editor.addEventListener('input', onEditorChange);
    elements.editor.addEventListener('scroll', syncScroll);
    elements.editor.addEventListener('keydown', onEditorKeydown);
    
    // 分割线拖拽
    setupSplitterDrag();
    
    // 菜单事件
    ipcRenderer.on('menu-new-file', newFile);
    ipcRenderer.on('menu-open-file', (event, filePath) => {
        if (filePath) {
            loadFile(filePath);
        } else {
            openFile();
        }
    });
    ipcRenderer.on('menu-save-file', saveFile);
    ipcRenderer.on('menu-save-as', saveAsFile);
    ipcRenderer.on('menu-toggle-mode', toggleMode);
    ipcRenderer.on('menu-scan-files', scanFiles);
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // 窗口关闭前检查
    window.addEventListener('beforeunload', (e) => {
        if (isModified) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// 设置编辑器
function setupEditor() {
    // 使用简单的 textarea 作为编辑器
    elements.editor.style.fontFamily = 'Monaco, Menlo, "Ubuntu Mono", monospace';
    elements.editor.style.fontSize = '14px';
    elements.editor.style.lineHeight = '1.5';
    elements.editor.style.tabSize = '4';
    
    // 支持 Tab 键缩进
    elements.editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = elements.editor.selectionStart;
            const end = elements.editor.selectionEnd;
            const value = elements.editor.value;
            
            elements.editor.value = value.substring(0, start) + '    ' + value.substring(end);
            elements.editor.selectionStart = elements.editor.selectionEnd = start + 4;
            
            onEditorChange();
        }
    });
}

// 设置分割线拖拽
function setupSplitterDrag() {
    let isDragging = false;
    
    elements.splitter.addEventListener('mousedown', (e) => {
        isDragging = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const containerRect = elements.editorContainer.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        
        if (newWidth > 20 && newWidth < 80) {
            elements.editorPanel.style.flex = `0 0 ${newWidth}%`;
            elements.previewPanel.style.flex = `0 0 ${100 - newWidth}%`;
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

// 新建文件
function newFile() {
    if (isModified && !confirm('当前文件未保存，确定要新建文件吗？')) {
        return;
    }
    
    currentFile = null;
    currentContent = '';
    isModified = false;
    elements.editor.value = '';
    updatePreview();
    updateUI();
}

// 打开文件
async function openFile() {
    if (isModified && !confirm('当前文件未保存，确定要打开新文件吗？')) {
        return;
    }
    
    try {
        const result = await ipcRenderer.invoke('choose-directory');
        if (result.success) {
            const files = await ipcRenderer.invoke('scan-markdown-files', result.path);
            if (files.success && files.files.length > 0) {
                loadFile(files.files[0].path);
            }
        }
    } catch (error) {
        console.error('打开文件失败:', error);
        alert('打开文件失败: ' + error.message);
    }
}

// 加载文件
async function loadFile(filePath) {
    try {
        const result = await ipcRenderer.invoke('read-file', filePath);
        if (result.success) {
            currentFile = filePath;
            currentContent = result.content;
            isModified = false;
            elements.editor.value = currentContent;
            updatePreview();
            updateUI();
            
            // 更新文件列表中的选中状态
            updateFileListSelection();
        } else {
            alert('读取文件失败: ' + result.error);
        }
    } catch (error) {
        console.error('加载文件失败:', error);
        alert('加载文件失败: ' + error.message);
    }
}

// 保存文件
async function saveFile() {
    if (!currentFile) {
        return saveAsFile();
    }
    
    try {
        const result = await ipcRenderer.invoke('save-file', currentFile, elements.editor.value);
        if (result.success) {
            currentContent = elements.editor.value;
            isModified = false;
            updateUI();
        } else {
            alert('保存文件失败: ' + result.error);
        }
    } catch (error) {
        console.error('保存文件失败:', error);
        alert('保存文件失败: ' + error.message);
    }
}

// 另存为
async function saveAsFile() {
    try {
        const result = await ipcRenderer.invoke('show-save-dialog', {
            filters: [
                { name: 'Markdown Files', extensions: ['md', 'markdown'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            defaultPath: currentFile ? path.basename(currentFile) : 'untitled.md'
        });
        
        if (!result.canceled && result.filePath) {
            const saveResult = await ipcRenderer.invoke('save-file', result.filePath, elements.editor.value);
            if (saveResult.success) {
                currentFile = result.filePath;
                currentContent = elements.editor.value;
                isModified = false;
                updateUI();
                
                // 刷新文件列表
                if (markdownFiles.length > 0) {
                    refreshFileList();
                }
            } else {
                alert('保存文件失败: ' + saveResult.error);
            }
        }
    } catch (error) {
        console.error('另存为失败:', error);
        alert('另存为失败: ' + error.message);
    }
}

// 扫描文件
async function scanFiles() {
    try {
        const result = await ipcRenderer.invoke('choose-directory');
        if (result.success) {
            elements.scanBtn.innerHTML = '<div class="loading"></div> 扫描中...';
            elements.scanBtn.disabled = true;
            
            const scanResult = await ipcRenderer.invoke('scan-markdown-files', result.path);
            if (scanResult.success) {
                markdownFiles = scanResult.files;
                filteredFiles = [...markdownFiles];
                renderFileList();
                updateUI();
            } else {
                alert('扫描文件失败: ' + scanResult.error);
            }
        }
    } catch (error) {
        console.error('扫描文件失败:', error);
        alert('扫描文件失败: ' + error.message);
    } finally {
        elements.scanBtn.innerHTML = '📁 扫描文件';
        elements.scanBtn.disabled = false;
    }
}

// 刷新文件列表
function refreshFileList() {
    renderFileList();
}

// 过滤文件
function filterFiles() {
    const query = elements.searchInput.value.toLowerCase();
    if (!query) {
        filteredFiles = [...markdownFiles];
    } else {
        filteredFiles = markdownFiles.filter(file => 
            file.name.toLowerCase().includes(query) ||
            file.path.toLowerCase().includes(query)
        );
    }
    renderFileList();
}

// 渲染文件列表
function renderFileList() {
    try {
        if (!elements || !elements.fileList) {
            console.warn('fileList element not found');
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
        
        const html = filteredFiles.map(file => {
            const safePath = file && file.path ? file.path : '';
            const safeName = file && file.name ? file.name : '未知文件';
            const safeDirectory = file && file.directory ? file.directory : '';
            
            return `
                <div class="file-item" data-path="${safePath}">
                    <div class="file-name">${safeName}</div>
                    <div class="file-path">${safeDirectory}</div>
                </div>
            `;
        }).join('');
        
        elements.fileList.innerHTML = html;
        
        // 添加点击事件
        elements.fileList.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const filePath = item.dataset.path;
                if (filePath && (!isModified || confirm('当前文件未保存，确定要打开新文件吗？'))) {
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

// 更新文件列表选中状态
function updateFileListSelection() {
    try {
        if (elements && elements.fileList) {
            elements.fileList.querySelectorAll('.file-item').forEach(item => {
                item.classList.toggle('active', item.dataset.path === currentFile);
            });
        }
    } catch (error) {
        console.error('updateFileListSelection error:', error);
    }
}

// 切换模式
function toggleMode() {
    const modes = ['split', 'edit', 'preview'];
    const currentIndex = modes.indexOf(currentMode);
    currentMode = modes[(currentIndex + 1) % modes.length];
    
    elements.editorContainer.className = `editor-container mode-${currentMode}`;
    
    // 更新按钮文本
    const modeTexts = {
        split: '👁️ 预览',
        edit: '📝 编辑',
        preview: '🔄 分割'
    };
    elements.modeToggle.textContent = modeTexts[currentMode];
}

// 切换主题
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    elements.themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    
    // 保存主题设置
    localStorage.setItem('theme', currentTheme);
}

// 加载主题
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    elements.themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

// 编辑器内容变化
function onEditorChange() {
    const newContent = elements.editor.value;
    isModified = newContent !== currentContent;
    updatePreview();
    updateUI();
}

// 更新预览
function updatePreview() {
    const content = elements.editor.value;
    if (content.trim()) {
        elements.preview.innerHTML = marked.parse(content);
    } else {
        elements.preview.innerHTML = `
            <div class="welcome-content">
                <h1>欢迎使用 Markdown Editor & Reader</h1>
                <p>开始在左侧编辑器中输入 Markdown 内容，右侧将实时显示预览效果。</p>
            </div>
        `;
    }
    
    // 重新高亮代码
    elements.preview.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
}

// 同步滚动
function syncScroll() {
    if (currentMode !== 'split') return;
    
    const editorScrollTop = elements.editor.scrollTop;
    const editorScrollHeight = elements.editor.scrollHeight - elements.editor.clientHeight;
    const previewScrollHeight = elements.preview.scrollHeight - elements.preview.clientHeight;
    
    if (editorScrollHeight > 0 && previewScrollHeight > 0) {
        const scrollRatio = editorScrollTop / editorScrollHeight;
        elements.preview.scrollTop = scrollRatio * previewScrollHeight;
    }
}

// 编辑器按键处理
function onEditorKeydown(e) {
    // 更新光标位置
    setTimeout(updateCursorPosition, 0);
}

// 更新光标位置
function updateCursorPosition() {
    if (!elements.editor || !elements.cursorPosition) {
        return;
    }
    
    const textarea = elements.editor;
    const text = textarea.value || '';
    const cursorPos = textarea.selectionStart || 0;
    
    const lines = text.substring(0, cursorPos).split('\n');
    const line = lines ? lines.length : 1;
    const column = (lines && lines.length > 0) ? lines[lines.length - 1].length + 1 : 1;
    
    elements.cursorPosition.textContent = `行 ${line}, 列 ${column}`;
}

// 处理键盘快捷键
function handleKeyboardShortcuts(e) {
    const ctrl = e.ctrlKey || e.metaKey;
    
    if (ctrl && e.key === 'n') {
        e.preventDefault();
        newFile();
    } else if (ctrl && e.key === 'o') {
        e.preventDefault();
        openFile();
    } else if (ctrl && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
            saveAsFile();
        } else {
            saveFile();
        }
    } else if (ctrl && e.key === 'e') {
        e.preventDefault();
        toggleMode();
    } else if (ctrl && e.key === 'f') {
        e.preventDefault();
        scanFiles();
    }
}

// 更新UI
function updateUI() {
    try {
        // 确保所有必要的变量都已初始化
        if (typeof filteredFiles === 'undefined') {
            filteredFiles = [];
        }
        if (typeof markdownFiles === 'undefined') {
            markdownFiles = [];
        }
        if (typeof currentFile === 'undefined') {
            currentFile = null;
        }
        if (typeof isModified === 'undefined') {
            isModified = false;
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
        if (elements && elements.editor && typeof elements.editor.value === 'string') {
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

// 应用启动
document.addEventListener('DOMContentLoaded', initApp);