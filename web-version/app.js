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
        
        this.initElements();
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
            clearBtn: document.getElementById('clearBtn'),
            fileInput: document.getElementById('fileInput'),
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
        this.elements.clearBtn.addEventListener('click', () => this.clearFiles());
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileLoad(e));
        this.elements.searchInput.addEventListener('input', () => this.filterFiles());
        
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
        
        // 页面加载时恢复数据
        this.loadFromStorage();
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
            };
            reader.readAsText(file);
        });
        
        // 延迟100ms后清空input，确保文件读取完成
        setTimeout(() => {
            event.target.value = '';
        }, 100);
    }
    
    clearFiles() {
        if (confirm('确定要清空所有加载的文件吗？')) {
            this.loadedFiles = [];
            this.filteredFiles = [];
            this.renderFileList();
            this.updateUI();
        }
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
        
        localStorage.setItem('theme', this.currentTheme);
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.currentTheme = savedTheme;
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
        
        // 更新视图模式按钮状态
        this.elements.editModeBtn.classList.toggle('active', this.currentMode === 'edit');
        this.elements.splitModeBtn.classList.toggle('active', this.currentMode === 'split');
        this.elements.previewModeBtn.classList.toggle('active', this.currentMode === 'preview');
        
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
    
    saveToStorage() {
        const data = {
            currentFile: this.currentFile,
            currentContent: this.elements.editor.value,
            loadedFiles: this.loadedFiles,
            currentTheme: this.currentTheme,
            currentMode: this.currentMode
        };
        localStorage.setItem('markdownEditor', JSON.stringify(data));
    }
    
    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('markdownEditor') || '{}');
            
            if (data.loadedFiles) {
                this.loadedFiles = data.loadedFiles;
                this.filteredFiles = [...this.loadedFiles];
                this.renderFileList();
            }
            
            if (data.currentFile && data.currentContent !== undefined) {
                this.currentFile = data.currentFile;
                this.currentContent = data.currentContent;
                this.elements.editor.value = data.currentContent;
                this.updatePreview();
            }
            
            if (data.currentTheme) {
                this.currentTheme = data.currentTheme;
                document.documentElement.setAttribute('data-theme', this.currentTheme);
                this.elements.themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
            }
            
            if (data.currentMode) {
                this.currentMode = data.currentMode;
                this.elements.editorContainer.className = `editor-container mode-${this.currentMode}`;
                const modeTexts = {
                    split: '👁️ 预览',
                    edit: '📝 编辑',
                    preview: '🔄 分割'
                };
                this.elements.modeToggle.textContent = modeTexts[this.currentMode];
            }
            
            this.updateUI();
        } catch (error) {
            console.error('加载存储数据失败:', error);
        }
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});