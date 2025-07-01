// main.js - IDE의 시작점

// --- 유틸리티 및 상태 관리 ---
const DOM = {}; // DOM 요소를 캐싱할 객체

// --- 기능별 클래스 정의 ---

/**
 * 가상 파일 시스템 (IndexedDB) 관리
 */
class VFS {
    // ... (기존 App.fs 객체의 모든 코드가 이 클래스 안으로 이동)
    // 예: init(), mkdir(), write(), read(), list(), getNodeByPath() 등
    // 모든 메서드는 async/await를 사용하여 비동기적으로 안전하게 작동합니다.
}

/**
 * 터미널 및 코드 실행 환경 관리 (핵심 개선)
 */
class TerminalManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.pyodide = null;
        this.isPythonReady = false;
        this.isPythonLoading = false;
        // Lua도 동일하게 관리
    }

    // Python 실행 환경을 '필요할 때' 로드하는 함수
    async _ensurePythonReady() {
        if (this.isPythonReady) return;
        if (this.isPythonLoading) {
            this.ui.showNotification('Python 환경을 로딩 중입니다...', 'warning');
            return;
        }

        this.isPythonLoading = true;
        this.ui.showTerminalSpinner('Python 환경 로딩 중...');
        try {
            this.pyodide = await loadPyodide();
            this.pyodide.setStdout({ batched: (s) => this.ui.logToTerminal(s) });
            this.pyodide.setStderr({ batched: (s) => this.ui.logToTerminal(s, 'error') });
            this.isPythonReady = true;
            this.ui.logToTerminal('Python 환경이 준비되었습니다.', 'info');
        } catch (e) {
            this.ui.logToTerminal(`Python 환경 로딩 실패: ${e}`, 'error');
        } finally {
            this.isPythonLoading = false;
            this.ui.hideTerminalSpinner();
        }
    }

    // 코드 실행 요청을 처리하는 메인 함수
    async runCode(language, code, path) {
        this.ui.logToTerminal(`\n$ ${path} (${language}) 실행...`, 'prompt');
        
        if (language === 'python') {
            await this._ensurePythonReady(); // 실행 직전에 로드!
            if (this.isPythonReady) {
                await this.pyodide.runPythonAsync(code);
            }
        } else if (language === 'javascript') {
            // ... JS 실행 로직
        } else if (language === 'lua') {
            // ... Lua 실행 로직 (필요시 로드)
        }
        this.ui.logToTerminal('--- 실행 종료 ---', 'info');
    }
}


/**
 * Ace 에디터 인스턴스, 탭, 파일 상태 등 관리
 */
class EditorManager {
    constructor(uiManager, vfs, terminalManager) {
        this.ui = uiManager;
        this.vfs = vfs;
        this.terminal = terminalManager;
        this.editors = { pane1: null, pane2: null };
        this.openFiles = { pane1: new Map(), pane2: new Map() };
        // ... (기타 에디터 관련 상태)
    }

    init() {
        // Ace 에디터 생성 및 설정
    }

    async openFile(path) {
        // 1. VFS에서 파일 내용 읽기
        // 2. Ace 세션 생성
        // 3. UI 매니저를 통해 탭 생성 및 에디터 내용 설정
    }
    
    saveActiveFile() { /* ... */ }
    
    runActiveFile() {
        const activePath = /* ... */;
        const language = /* ... */;
        const content = /* ... */;
        this.terminal.runCode(language, content, activePath);
        this.ui.showBottomPanel('internal-terminal');
    }
}

/**
 * 모든 DOM 조작, UI 이벤트, 레이아웃 변경 관리
 */
class UIManager {
    constructor() { /* ... */ }

    cacheDOM() { /* ... */ }
    
    initEventListeners(editorManager, vfs, terminalManager) {
        // 모든 클릭, 드래그, 키보드 이벤트 리스너를 여기에 등록
        // 예: DOM.run_btn.onclick = () => editorManager.runActiveFile();
    }
    
    renderExplorer() { /* ... */ }
    logToTerminal(msg, level) { /* ... */ }
    showTerminalSpinner(text) { /* ... */ }
    hideTerminalSpinner() { /* ... */ }
    // ... (모달, 알림, 상태바 업데이트 등 모든 UI 관련 메서드)
}


// --- 애플리케이션 시작 ---
async function main() {
    const ui = new UIManager();
    ui.cacheDOM(); // 가장 먼저 DOM 요소들을 찾음

    const vfs = new VFS();
    const terminal = new TerminalManager(ui);
    const editor = new EditorManager(ui, vfs, terminal);
    
    // 이벤트 리스너들을 각 매니저와 연결하여 등록
    ui.initEventListeners(editor, vfs, terminal);
    
    // 에디터와 설정 초기화
    editor.init();
    // settings.init();

    // VFS(파일 시스템)를 먼저 초기화 (가장 중요)
    await vfs.init();

    // VFS가 준비된 후 파일 탐색기를 렌더링
    await ui.renderExplorer();

    // 모든 준비가 끝나면 알림 표시
    ui.showNotification('Index-Space IDE가 준비되었습니다!', 'success');
}

// DOM이 로드되면 main 함수를 실행하여 IDE를 시작합니다.
document.addEventListener('DOMContentLoaded', main);
