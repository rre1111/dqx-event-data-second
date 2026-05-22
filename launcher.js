// ==========ツールランチャー（改造版）=========
// ========== バージョン管理 ==========
const APP_VERSION = '3.0.2β';

// バージョン情報をグローバルに公開（HTML側と整合性チェック用）
window.LAUNCHER_VERSION = APP_VERSION;

function checkVersionUpdate() {
    const storedVersion = localStorage.getItem('dqx_app_version');
    if (storedVersion !== APP_VERSION) {
        if (storedVersion) {
            alert(`アップデートされました！\n\n${storedVersion} → ${APP_VERSION}\n新機能・修正が含まれています。`);
        } else {
            alert(`ようこそ！\n\nDQXツール ver.${APP_VERSION}`);
        }
        localStorage.setItem('dqx_app_version', APP_VERSION);
    }
}

const DQXTools = {
    tools: {},
    currentTool: null,
    container: null,
    darkMode: false,
    boundResizeHandler: null,
    sortableInstance: null,  // SortableJSインスタンスを保存

    register: function(toolId, toolConfig) {
        this.tools[toolId] = toolConfig;
    },

    isMobile: function() {
        return window.innerWidth <= 768;
    },

    init: function(containerId) {
        checkVersionUpdate();
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('コンテナが見つかりません:', containerId);
            return;
        }

        // ========== Pull to Refresh（スワイプ引っ張り再読み込み）禁止 ==========
        let touchStartY = 0;
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && window.scrollY === 0) {
                const touchMoveY = e.touches[0].clientY;
                if (touchMoveY > touchStartY) {
                    e.preventDefault(); // 下スクロールでの更新を塞ぐ
                }
            }
        }, { passive: false });

        // 初期設定
        this.loadSettings();
        this.renderHome();
    },

    loadSettings: function() {
        this.darkMode = localStorage.getItem('dqx_dark_mode') === 'true';
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    },

    toggleDarkMode: function() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('dqx_dark_mode', this.darkMode);
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    },

    renderHome: function() {
        this.destroyCurrentTool();
        this.currentTool = null;

        // メニューバーをクリア
        const oldMenu = document.querySelector('.tool-menu-sidebar, .tool-menu-bottom');
        if (oldMenu) oldMenu.remove();
        document.body.style.paddingLeft = '0';
        document.body.style.paddingBottom = '0';

        let html = `
            <div class="home-container">
                <div class="home-header">
                    <h1 class="home-title">DQXツール群</h1>
                    <button id="darkToggleBtn" class="dark-toggle-btn">${this.darkMode ? '☀️' : '🌙'}</button>
                </div>
                <div class="home-grid" id="homeGrid"></div>
            </div>
        `;
        this.container.innerHTML = html;

        document.getElementById('darkToggleBtn').onclick = () => {
            this.toggleDarkMode();
            const btn = document.getElementById('darkToggleBtn');
            if (btn) btn.textContent = this.darkMode ? '☀️' : '🌙';
        };

        const grid = document.getElementById('homeGrid');
        
        // 並び替え対象のIDリストを生成（非表示フラグがないもの）
        const sortedIds = Object.keys(this.tools).filter(id => !this.tools[id].hideInMenu);

        // 認証キーの存在チェック
        const hasToken = !!localStorage.getItem('dqx_test_token');

        // ホーム画面でのツールカード生成
        sortedIds.forEach(toolId => {
            const tool = this.tools[toolId];
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.dataset.id = toolId;
            card.innerHTML = `
                <div class="tool-card-icon">${tool.icon}</div>
                <div class="tool-card-name">${tool.name}</div>
                <div class="tool-card-desc">${tool.desc || ''}</div>
            `;
            
            // 非公開テストツール、かつ認証キーがない場合に見た目変更用クラスを付与（クリックは可能）
            if (tool.testToolConfig && !hasToken) {
                card.classList.add('test-tool-locked');
            }
            
            // タップ時の挙動（既存の認証ロジックなどへそのまま流す）
            card.onclick = () => this.switchTool(toolId);
            grid.appendChild(card);
        });
    },

    switchTool: function(toolId) {
        const tool = this.tools[toolId];
        if (!tool) return;

        // 非公開テストツールの認証要求チェック
        if (tool.testToolConfig) {
            const token = localStorage.getItem('dqx_test_token');
            if (!token) {
                // 設定画面からトークン入力を促す、または認証用のダイアログを開く
                const inputToken = prompt('🔒 このツールはデベロッパー専用のテストツールです。\n利用するには認証トークンを入力してください:');
                if (inputToken) {
                    localStorage.setItem('dqx_test_token', inputToken);
                    alert('トークンを保存しました。もう一度ツールを起動してください。');
                    this.renderHome();
                }
                return; // ここで止める（既存ロジック）
            }
        }

        this.destroyCurrentTool();
        this.currentTool = toolId;

        this.container.innerHTML = `<div style="text-align:center;padding:40px;">⏳ ツールを読み込み中...</div>`;

        // 共通メニューバーの生成（サイドまたはボトム）
        this.renderMenuBar();

        if (tool.url) {
            this.loadScript(tool.url).then(() => {
                this.executeRender(tool);
            }).catch(err => {
                console.error(err);
                this.container.innerHTML = `<div style="color:red;padding:20px;">ツールの読み込みに失敗しました。</div>`;
            });
        } else {
            this.executeRender(tool);
        }
    },

    executeRender: function(tool) {
        this.container.innerHTML = `<div id="tool-runtime-container"></div>`;
        if (tool.renderFn) {
            try {
                const parts = tool.renderFn.split('.');
                let fn = window;
                parts.forEach(p => { fn = fn[p]; });
                if (typeof fn === 'function') {
                    fn('#tool-runtime-container');
                } else if (tool.testToolConfig) {
                    // 非公開側から注入されたロジックを実行するケース
                    const gName = tool.testToolConfig.globalName;
                    if (window[gName] && typeof window[gName].render === 'function') {
                        window[gName].render('#tool-runtime-container');
                    } else {
                        this.container.innerHTML = `<div style="padding:20px;">🔒 認証は成功していますが、ロジックが注入されていません。</div>`;
                    }
                }
            } catch (e) {
                console.error(e);
                this.container.innerHTML = `<div style="color:red;padding:20px;">初期化エラーが発生しました。</div>`;
            }
        } else if (tool.testToolConfig) {
            // トークンがある場合の非公開ツールインジェクション実行
            const gName = tool.testToolConfig.globalName;
            if (window[gName] && typeof window[gName].render === 'function') {
                window[gName].render('#tool-runtime-container');
            } else {
                this.container.innerHTML = `<div style="padding:20px;">🔒 テスト環境が準備されていません（スクリプト未注入）</div>`;
            }
        }
    },

    renderMenuBar: function() {
        const isMobile = this.isMobile();
        const menu = document.createElement('div');
        menu.className = isMobile ? 'tool-menu-bottom' : 'tool-menu-sidebar';

        let menuHtml = `
            <div class="menu-item-home" id="menuHomeBtn">🏠 <span>ホーム</span></div>
            <div class="menu-items-scroll">
        `;

        Object.keys(this.tools).forEach(id => {
            const t = this.tools[id];
            if (t.hideInMenu) return; // ツールバーに隠す設定のものは除外
            const activeClass = (id === this.currentTool) ? 'active' : '';
            menuHtml += `<div class="menu-item ${activeClass}" data-id="${id}">${t.icon}<span>${t.name}</span></div>`;
        });

        menuHtml += `</div>`;
        menu.innerHTML = menuHtml;
        document.body.appendChild(menu);

        if (isMobile) {
            document.body.style.paddingBottom = '60px';
            document.body.style.paddingLeft = '0';
        } else {
            document.body.style.paddingLeft = '90px';
            document.body.style.paddingBottom = '0';
        }

        document.getElementById('menuHomeBtn').onclick = () => this.renderHome();
        
        menu.querySelectorAll('.menu-item').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                this.switchTool(id);
            };
        });
    },

    destroyCurrentTool: function() {
        if (this.currentTool && this.tools[this.currentTool]) {
            const tool = this.tools[this.currentTool];
            if (tool.renderFn) {
                const parts = tool.renderFn.split('.');
                if (parts.length > 0) {
                    const objName = parts[0];
                    if (window[objName] && typeof window[objName].destroy === 'function') {
                        window[objName].destroy();
                    }
                }
            }
            if (tool.testToolConfig) {
                const globalName = tool.testToolConfig.globalName;
                if (window[globalName] && typeof window[globalName].destroy === 'function') {
                    window[globalName].destroy();
                }
            }
        }
        
        const possibleGlobalNames = ['DQtool', 'DQtool2', 'DQtool3', 'Tool4'];
        possibleGlobalNames.forEach(globalName => {
            if (window[globalName] && typeof window[globalName].destroy === 'function') {
                window[globalName].destroy();
            }
        });
    },

    destroy: function() {
        if (this.sortableInstance) {
            this.sortableInstance.destroy();
            this.sortableInstance = null;
        }
        if (this.boundResizeHandler) {
            window.removeEventListener('resize', this.boundResizeHandler);
            this.boundResizeHandler = null;
        }
    },

    loadScript: function(url) {
        const cacheBustUrl = url + '?v=' + APP_VERSION;
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${cacheBustUrl}"]`);
            if (existing) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = cacheBustUrl;
            script.onload  = () => resolve();
            script.onerror = () => reject(new Error(`Script load failed: ${url}`));
            document.head.appendChild(script);
        });
    }
};

if (typeof window.DQXTools === 'undefined') {
    window.DQXTools = DQXTools;
}
