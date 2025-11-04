// Web版 Markdown 编辑器
class MarkdownEditor {
    constructor() {
        this.currentFile = null;
        this.currentContent = '';
        this.isModified = false;
        this.currentMode = 'split';
        this.currentTheme = 'light';
        this.loadedFiles = [];
        this.filteredFiles = [];
        this.recentFiles = []; // 最近文件记录
        
        this.initElements();
        this.loadFromStorage(); // 先加载数据
        this.setupEventListeners();
        this.loadTheme();
        this.updateUI();
        this.setupMarked();
    }
    
    initElements() {
        this.elements = {
            // 工具栏按钮
            newBtn: document.getElementById('newBtn'),
            loadFileBtn: document.getElementById('loadFileBtn'),
            saveBtn: document.getElementById('saveBtn'),
            exportBtn: document.getElementById('exportBtn'),
            editModeBtn: document.getElementById('editModeBtn'),
            splitModeBtn: document.getElementById('splitModeBtn'),
            previewModeBtn: document.getElementById('previewModeBtn'),
            themeToggle: document.getElementById('themeToggle'),
            
            // 侧边栏
            loadBtn: document.getElementById('loadBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            fileInput: document.getElementById('fileInput'),
            searchInput: document.getElementById('searchInput'),
            fileList: document.getElementById('fileList'),
            
            // 标签页
            filesTab: document.getElementById('filesTab'),
            recentTab: document.getElementById('recentTab'),
            recentList: document.getElementById('recentList'),
            recentFiles: document.getElementById('recentFiles'),
            
            // 历史下拉菜单
            historyBtn: document.getElementById('historyBtn'),
            historyDropdown: document.getElementById('historyDropdown'),
            historyList: document.getElementById('historyList'),
            
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
    }
    
    setupEventListeners() {
        // 工具栏按钮
        this.elements.newBtn.addEventListener('click', () => this.newFile());
        this.elements.loadFileBtn.addEventListener('click', () => this.loadFiles());
        this.elements.saveBtn.addEventListener('click', () => this.saveFile());
        this.elements.exportBtn.addEventListener('click', () => this.exportHTML());
        this.elements.editModeBtn.addEventListener('click', () => this.setMode('edit'));
        this.elements.splitModeBtn.addEventListener('click', () => this.setMode('split'));
        this.elements.previewModeBtn.addEventListener('click', () => this.setMode('preview'));
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // 侧边栏
        this.elements.loadBtn.addEventListener('click', () => this.loadFiles());
        this.elements.refreshBtn.addEventListener('click', () => this.refreshFileList());
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileLoad(e));
        this.elements.searchInput.addEventListener('input', () => this.filterFiles());
        
        // 标签页
        this.elements.filesTab.addEventListener('click', () => this.switchTab('files'));
        this.elements.recentTab.addEventListener('click', () => this.switchTab('recent'));
        
        // 历史下拉菜单
        this.elements.historyBtn.addEventListener('click', () => this.toggleHistoryDropdown());
        
        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!this.elements.historyBtn.contains(e.target) && !this.elements.historyDropdown.contains(e.target)) {
                this.closeHistoryDropdown();
            }
        });
        
        // 编辑器
        this.elements.editor.addEventListener('input', () => this.onEditorChange());
        this.elements.editor.addEventListener('scroll', () => this.syncScroll());
        this.elements.editor.addEventListener('keydown', (e) => this.onEditorKeydown(e));
        
        // 分割线拖拽
        this.setupSplitterDrag();
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // 自动保存
        setInterval(() => this.autoSave(), 30000);
    }
    
    setupMarked() {
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
    
    setupSplitterDrag() {
        let isDragging = false;
        
        this.elements.splitter.addEventListener('mousedown', (e) => {
            isDragging = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const containerRect = this.elements.editorContainer.getBoundingClientRect();
            const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            
            if (newWidth > 20 && newWidth < 80) {
                this.elements.editorPanel.style.flex = `0 0 ${newWidth}%`;
                this.elements.previewPanel.style.flex = `0 0 ${100 - newWidth}%`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        });
    }
    
    // 本地存储管理
    saveToStorage() {
        try {
            const data = {
                currentFile: this.currentFile,
                currentContent: this.elements.editor.value,
                loadedFiles: this.loadedFiles,
                recentFiles: this.recentFiles,
                currentTheme: this.currentTheme,
                currentMode: this.currentMode
            };
            localStorage.setItem('markdownEditorWeb', JSON.stringify(data));
        } catch (error) {
            console.error('保存本地数据失败:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('markdownEditorWeb') || '{}');
            
            if (data.loadedFiles) {
                this.loadedFiles = data.loadedFiles;
                this.filteredFiles = [...this.loadedFiles];
            }
            
            if (data.recentFiles) {
                this.recentFiles = data.recentFiles;
            }
            
            if (data.currentFile && data.currentContent !== undefined) {
                this.currentFile = data.currentFile;
                this.currentContent = data.currentContent;
                if (this.elements.editor) {
                    this.elements.editor.value = data.currentContent;
                }
            }
            
            if (data.currentTheme) {
                this.currentTheme = data.currentTheme;
            }
            
            if (data.currentMode) {
                this.currentMode = data.currentMode;
            }
        } catch (error) {
            console.error('加载本地数据失败:', error);
            // 重置为默认值
            this.recentFiles = [];
        }
    }
    
    // 添加文件到最近记录
    addToRecentFiles(fileName, content) {
        if (!fileName) return;
        
        // 移除已存在的记录
        this.recentFiles = this.recentFiles.filter(file => file.name !== fileName);
        
        // 添加到开头
        this.recentFiles.unshift({
            name: fileName,
            content: content,
            timestamp: Date.now(),
            size: new Blob([content]).size
        });
        
        // 保持最多10条记录
        if (this.recentFiles.length > 10) {
            this.recentFiles = this.recentFiles.slice(0, 10);
        }
        
        this.saveToStorage();
    }
    
    // 标签页切换
    switchTab(tabName) {
        // 更新标签按钮状态
        this.elements.filesTab.classList.toggle('active', tabName === 'files');
        this.elements.recentTab.classList.toggle('active', tabName === 'recent');
        
        // 更新内容显示
        this.elements.fileList.classList.toggle('active', tabName === 'files');
        this.elements.recentList.classList.toggle('active', tabName === 'recent');
        
        // 如果切换到最近记录标签，渲染最近记录
        if (tabName === 'recent') {
            this.renderRecentRecords();
        }
    }
    
    // 渲染最近记录
    renderRecentRecords() {
        this.renderRecentFiles();
    }
    
    // 渲染最近文件
    renderRecentFiles() {
        if (!this.elements.recentFiles) return;
        
        if (this.recentFiles.length === 0) {
            this.elements.recentFiles.innerHTML = '<div class="recent-empty">暂无最近文件</div>';
            return;
        }
        
        const html = this.recentFiles.map(file => {
            const timeStr = this.formatTime(file.timestamp);
            return `
                <div class="recent-item" data-name="${file.name}">
                    <div class="recent-item-name">📄 ${file.name}</div>
                    <div class="recent-item-path">大小: ${this.formatFileSize(file.size)}</div>
                    <div class="recent-item-time">${timeStr}</div>
                </div>
            `;
        }).join('');
        
        this.elements.recentFiles.innerHTML = html;
        
        // 添加点击事件
        this.elements.recentFiles.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => {
                const fileName = item.dataset.name;
                const file = this.recentFiles.find(f => f.name === fileName);
                if (file && (!this.isModified || confirm('当前文件未保存，确定要打开新文件吗？'))) {
                    this.loadFileContent({
                        name: file.name,
                        content: file.content,
                        size: file.size,
                        id: Date.now()
                    });
                    // 切换到文件列表标签
                    this.switchTab('files');
                }
            });
        });
    }
    
    // 切换历史下拉菜单
    toggleHistoryDropdown() {
        const dropdown = this.elements.historyBtn.parentElement;
        const isActive = dropdown.classList.contains('active');
        
        if (isActive) {
            this.closeHistoryDropdown();
        } else {
            this.openHistoryDropdown();
        }
    }
    
    // 打开历史下拉菜单
    openHistoryDropdown() {
        const dropdown = this.elements.historyBtn.parentElement;
        dropdown.classList.add('active');
        this.renderHistoryList();
    }
    
    // 关闭历史下拉菜单
    closeHistoryDropdown() {
        const dropdown = this.elements.historyBtn.parentElement;
        dropdown.classList.remove('active');
    }
    
    // 渲染历史列表
    renderHistoryList() {
        if (!this.elements.historyList) return;
        
        if (this.recentFiles.length === 0) {
            this.elements.historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>';
            return;
        }
        
        const html = this.recentFiles.slice(0, 5).map(file => {
            return `
                <div class="history-item" data-name="${file.name}">
                    <div class="history-item-name">📄 ${file.name}</div>
                    <div class="history-item-path">大小: ${this.formatFileSize(file.size)}</div>
                </div>
            `;
        }).join('');
        
        this.elements.historyList.innerHTML = html;
        
        // 添加点击事件
        this.elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const fileName = item.dataset.name;
                const file = this.recentFiles.find(f => f.name === fileName);
                this.closeHistoryDropdown();
                
                if (file && (!this.isModified || confirm('当前文件未保存，确定要打开新文件吗？'))) {
                    this.loadFileContent({
                        name: file.name,
                        content: file.content,
                        size: file.size,
                        id: Date.now()
                    });
                    // 确保在文件列表标签
                    this.switchTab('files');
                }
            });
        });
    }
    
    // 格式化时间
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN');
    }
    
    newFile() {
        if (this.isModified && !confirm('当前文件未保存，确定要新建文件吗？')) {
            return;
        }
        
        this.currentFile = null;
        this.currentContent = '';
        this.isModified = false;
        this.elements.editor.value = '';
        this.updatePreview();
        this.updateUI();
    }
    
    loadFiles() {
        this.elements.fileInput.click();
    }
    
    refreshFileList() {
        // Web版本：清空当前文件列表，让用户重新选择
        if (this.loadedFiles.length > 0) {
            if (confirm('确定要清空当前文件列表吗？这将清除所有已加载的文件。')) {
                this.loadedFiles = [];
                this.filteredFiles = [];
                this.currentFile = null;
                this.currentContent = '';
                this.isModified = false;
                this.elements.editor.value = '';
                this.updatePreview();
                this.renderFileList();
                this.updateUI();
                this.saveToStorage();
            }
        } else {
            // 如果没有文件，直接触发文件选择
            this.loadFiles();
        }
    }
    
    handleFileLoad(event) {
        const files = Array.from(event.target.files);
        const markdownFiles = files.filter(file => 
            file.name.toLowerCase().endsWith('.md') || 
            file.name.toLowerCase().endsWith('.markdown')
        );
        
        if (markdownFiles.length === 0) {
            alert('请选择Markdown文件（.md或.markdown）');
            return;
        }
        
        markdownFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    name: file.name,
                    content: e.target.result,
                    size: file.size,
                    modified: new Date(file.lastModified),
                    id: Date.now() + Math.random()
                };
                
                // 检查是否已存在同名文件
                const existingIndex = this.loadedFiles.findIndex(f => f.name === file.name);
                if (existingIndex >= 0) {
                    this.loadedFiles[existingIndex] = fileData;
                } else {
                    this.loadedFiles.push(fileData);
                }
                
                this.filteredFiles = [...this.loadedFiles];
                this.renderFileList();
                this.updateUI();
                
                // 如果是第一个文件，自动加载
                if (this.loadedFiles.length === 1) {
                    this.loadFileContent(fileData);
                }
                
                this.saveToStorage();
            };
            reader.readAsText(file);
        });
        
        // 延迟100ms后清空input，确保文件读取完成
        setTimeout(() => {
            event.target.value = '';
        }, 100);
    }
    
    filterFiles() {
        const query = this.elements.searchInput.value.toLowerCase();
        if (!query) {
            this.filteredFiles = [...this.loadedFiles];
        } else {
            this.filteredFiles = this.loadedFiles.filter(file => 
                file.name.toLowerCase().includes(query)
            );
        }
        this.renderFileList();
    }
    
    renderFileList() {
        if (this.filteredFiles.length === 0) {
            this.elements.fileList.innerHTML = `
                <div class="empty-state">
                    <p>${this.loadedFiles.length === 0 ? '点击"加载文件"开始浏览Markdown文档' : '没有找到匹配的文件'}</p>
                </div>
            `;
            return;
        }
        
        const html = this.filteredFiles.map(file => `
            <div class="file-item" data-id="${file.id}">
                <div class="file-name">${file.name}</div>
                <div class="file-path">大小: ${this.formatFileSize(file.size)} | 修改: ${file.modified.toLocaleDateString()}</div>
            </div>
        `).join('');
        
        this.elements.fileList.innerHTML = html;
        
        // 添加点击事件
        this.elements.fileList.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const fileId = item.dataset.id;
                const file = this.loadedFiles.find(f => f.id == fileId);
                if (file) {
                    if (this.isModified && !confirm('当前文件未保存，确定要打开新文件吗？')) {
                        return;
                    }
                    this.loadFileContent(file);
                }
            });
        });
        
        this.updateFileListSelection();
    }
    
    loadFileContent(file) {
        this.currentFile = file.name;
        this.currentContent = file.content;
        this.isModified = false;
        this.elements.editor.value = file.content;
        this.updatePreview();
        this.updateUI();
        this.updateFileListSelection();
        
        // 添加到最近文件记录
        this.addToRecentFiles(file.name, file.content);
    }
    
    updateFileListSelection() {
        this.elements.fileList.querySelectorAll('.file-item').forEach(item => {
            const fileId = item.dataset.id;
            const file = this.loadedFiles.find(f => f.id == fileId);
            item.classList.toggle('active', file && file.name === this.currentFile);
        });
    }
    
    saveFile() {
        const content = this.elements.editor.value;
        const fileName = this.currentFile || 'untitled.md';
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.currentContent = content;
        this.isModified = false;
        this.updateUI();
        
        // 添加到最近文件记录
        this.addToRecentFiles(fileName, content);
    }
    
    exportHTML() {
        const content = this.elements.editor.value;
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.currentFile || 'Markdown文档'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2 { border-bottom: 1px solid #eee; padding-bottom: 8px; }
        code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background-color: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background-color: #f4f4f4; }
    </style>
</head>
<body>
${marked.parse(content)}
</body>
</html>`;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = (this.currentFile || 'untitled').replace(/\.md$/, '.html');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    setMode(mode) {
        this.currentMode = mode;
        this.elements.editorContainer.className = `editor-container mode-${this.currentMode}`;
        
        // 更新按钮状态
        this.elements.editModeBtn.classList.toggle('active', mode === 'edit');
        this.elements.splitModeBtn.classList.toggle('active', mode === 'split');
        this.elements.previewModeBtn.classList.toggle('active', mode === 'preview');
        
        this.saveToStorage();
    }
    
    toggleMode() {
        const modes = ['split', 'edit', 'preview'];
        const currentIndex = modes.indexOf(this.currentMode);
        const newMode = modes[(currentIndex + 1) % modes.length];
        this.setMode(newMode);
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.elements.themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        
        this.saveToStorage();
    }
    
    loadTheme() {
        // currentTheme 已经在 loadFromStorage 中设置
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.elements.themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
    
    onEditorChange() {
        const newContent = this.elements.editor.value;
        this.isModified = newContent !== this.currentContent;
        this.updatePreview();
        this.updateUI();
    }
    
    updatePreview() {
        const content = this.elements.editor.value;
        if (content.trim()) {
            this.elements.preview.innerHTML = marked.parse(content);
        } else {
            this.elements.preview.innerHTML = `
                <div class="welcome-content">
                    <h1>欢迎使用 Markdown Editor & Reader</h1>
                    <p>开始在左侧编辑器中输入 Markdown 内容，右侧将实时显示预览效果。</p>
                </div>
            `;
        }
        
        // 重新高亮代码
        this.elements.preview.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
    }
    
    syncScroll() {
        if (this.currentMode !== 'split') return;
        
        const editorScrollTop = this.elements.editor.scrollTop;
        const editorScrollHeight = this.elements.editor.scrollHeight - this.elements.editor.clientHeight;
        const previewScrollHeight = this.elements.preview.scrollHeight - this.elements.preview.clientHeight;
        
        if (editorScrollHeight > 0 && previewScrollHeight > 0) {
            const scrollRatio = editorScrollTop / editorScrollHeight;
            this.elements.preview.scrollTop = scrollRatio * previewScrollHeight;
        }
    }
    
    onEditorKeydown(e) {
        // Tab键缩进
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.elements.editor.selectionStart;
            const end = this.elements.editor.selectionEnd;
            const value = this.elements.editor.value;
            
            this.elements.editor.value = value.substring(0, start) + '    ' + value.substring(end);
            this.elements.editor.selectionStart = this.elements.editor.selectionEnd = start + 4;
            
            this.onEditorChange();
        }
        
        // 更新光标位置
        setTimeout(() => this.updateCursorPosition(), 0);
    }
    
    updateCursorPosition() {
        const textarea = this.elements.editor;
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        
        const lines = text.substring(0, cursorPos).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        this.elements.cursorPosition.textContent = `行 ${line}, 列 ${column}`;
    }
    
    handleKeyboardShortcuts(e) {
        const ctrl = e.ctrlKey || e.metaKey;
        
        if (ctrl && e.key === 'n') {
            e.preventDefault();
            this.newFile();
        } else if (ctrl && e.key === 'o') {
            e.preventDefault();
            this.loadFiles();
        } else if (ctrl && e.key === 's') {
            e.preventDefault();
            this.saveFile();
        } else if (ctrl && e.key === 'e') {
            e.preventDefault();
            this.toggleMode();
        }
    }
    
    updateUI() {
        // 更新文件名显示
        const fileName = this.currentFile || '未命名文档';
        const modifiedIndicator = this.isModified ? ' *' : '';
        this.elements.currentFile.textContent = fileName + modifiedIndicator;
        
        // 更新文件计数
        this.elements.fileCount.textContent = `文件: ${this.filteredFiles.length}`;
        
        // 更新字数统计
        const content = this.elements.editor.value;
        const wordCount = content.length;
        const charCount = content.replace(/\s/g, '').length;
        this.elements.wordCount.textContent = `字数: ${charCount} / ${wordCount}`;
        
        // 更新文件大小
        const size = new Blob([content]).size;
        this.elements.fileSize.textContent = this.formatFileSize(size);
        
        // 更新视图模式按钮状态
        this.elements.editModeBtn.classList.toggle('active', this.currentMode === 'edit');
        this.elements.splitModeBtn.classList.toggle('active', this.currentMode === 'split');
        this.elements.previewModeBtn.classList.toggle('active', this.currentMode === 'preview');
        
        // 更新光标位置
        this.updateCursorPosition();
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    
    autoSave() {
        if (this.isModified) {
            this.saveToStorage();
        }
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});