// ==========ツールランチャー（改造版）=========
// ========== バージョン管理 ==========
const APP_VERSION = '3.2.3β';

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
    sidebarVisible: true,    // PCサイドバーの表示状態

    register: function(toolId, toolConfig) {
        this.tools[toolId] = toolConfig;
    },

    isMobile: function() {
        return window.innerWidth <= 768;
    },

    isTabletLandscape: function() {
        // タブレット横向き（768px超, かつ 縦横比が横長）
        return window.innerWidth > 768 && window.innerWidth < 1024 && window.innerHeight < window.innerWidth;
    },

    init: function(containerId) {
        checkVersionUpdate();
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('コンテナが見つかりません:', containerId);
            return;
        }

        // サイドバーの表示状態を復元
        this.sidebarVisible = localStorage.getItem('dqx_sidebar_visible') !== 'false';

        // ========== Pull to Refresh（スワイプ引っ張り再読み込み）禁止 ==========
        let touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            if (touchY > touchStartY && window.scrollY === 0) {
                e.preventDefault();
            }
        }, { passive: false });

        // ========== ストレージキーのクリーンアップ（不正なキーを削除） ==========
        this.cleanupStorage();

        this.darkMode = localStorage.getItem('darkMode') === 'dark';
        this.applyDarkMode();
        this.showLauncher();

        this.boundResizeHandler = () => {
            if (this.currentTool === null) {
                this.showLauncher();
            } else {
                this.renderToolMenu();
            }
        };
        window.addEventListener('resize', this.boundResizeHandler);
    },

    cleanupStorage: function() {
        // 許可されたlocalStorage キーのリスト
        const allowedLocalStorageKeys = [
            'dqx_app_version',
            'dqx_card_order',
            'dqx_test_token',
            'dqx_dev_mode',
            'darkMode',
            'dqx_craft_last',
            'dqx_chars_final10',
            'dqx_disabled_final10',
            'dqx_hidden_tasks_v1',
            'dqx_limited_checks_v3',
            'dqx_lap_notify',
            'dqx_shopping_cart',
            'dqx_material_prices',
            'dqx_sidebar_visible'
        ];

        // ========== localStorageのクリーンアップ ==========
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (!key) continue;

            // 許可リストに含まれている、または'dqx_check_final10_'で始まるキーは保持
            const isAllowed = allowedLocalStorageKeys.includes(key) || key.startsWith('dqx_check_final10_');
            if (!isAllowed) {
                try {
                    localStorage.removeItem(key);
                    console.log(`[Storage Cleanup] localStorage から削除: ${key}`);
                } catch (e) {
                    console.warn(`[Storage Cleanup] localStorage の削除に失敗: ${key}`, e);
                }
            }
        }

        // ========== sessionStorageのクリーンアップ ==========
        const allowedSessionStorageKeys = ['dqx_reload_count'];
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (!key) continue;

            if (!allowedSessionStorageKeys.includes(key)) {
                try {
                    sessionStorage.removeItem(key);
                    console.log(`[Storage Cleanup] sessionStorage から削除: ${key}`);
                } catch (e) {
                    console.warn(`[Storage Cleanup] sessionStorage の削除に失敗: ${key}`, e);
                }
            }
        }
    },

    applyDarkMode: function() {
        document.body.classList.toggle('dark-mode', this.darkMode);
        const btn = document.getElementById('global-dark-toggle');
        if (btn) {
            btn.textContent = this.darkMode ? '☀️' : '🌙';
        }
    },

    toggleDarkMode: function() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode ? 'dark' : 'light');
        this.applyDarkMode();
        if (this.currentTool === null) {
            this.showLauncher();
        } else {
            this.renderToolMenu();
        }
    },

    toggleSidebar: function() {
        this.sidebarVisible = !this.sidebarVisible;
        localStorage.setItem('dqx_sidebar_visible', String(this.sidebarVisible));
        this.renderToolMenu();
    },

    showLauncher: function() {
        // 保存された順序を読み込み
        const savedOrder = localStorage.getItem('dqx_card_order');
        const order = savedOrder ? JSON.parse(savedOrder) : null;
        
        // トークンが有効かチェック
        const hasValidToken = () => {
            const token = localStorage.getItem('dqx_test_token');
            return token && token.length >= 40;
        };
        
        // ツールを順序に従ってソート
        let toolEntries = Object.entries(this.tools);
        if (order) {
            toolEntries.sort((a, b) => {
                const aIdx = order.indexOf(a[0]);
                const bIdx = order.indexOf(b[0]);
                if (aIdx === -1 && bIdx === -1) return 0;
                if (aIdx === -1) return 1;
                if (bIdx === -1) return -1;
                return aIdx - bIdx;
            });
        }
        
        const isValidToken = hasValidToken();
        
        const cardButtons = toolEntries.map(([id, tool]) => {
            const icon = tool.icon || '🔧';
            const name = tool.name;
            const desc = tool.desc || '';
            const isDisabled = tool.requiresToken && !isValidToken;
            const disabledClass = isDisabled ? 'tool-card-disabled' : '';
            
            return `
                <div class="tool-card ${disabledClass}" data-tool-id="${id}" data-requires-token="${tool.requiresToken || false}">
                    <div class="tool-card-icon">${icon}</div>
                    <div class="tool-card-name">${name}</div>
                    <div class="tool-card-desc">${desc}</div>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="home-container">
                <div class="home-header">
                    <h1 class="home-title">🎮 DQXツール</h1>
                    <button id="global-dark-toggle" class="dark-toggle-btn">${this.darkMode ? '☀️' : '🌙'}</button>
                </div>
                <div class="home-grid">
                    ${cardButtons}
                </div>
                <div class="home-footer">
                    © 2026 yuffy_rre
                </div>
            </div>
        `;

        const toggleBtn = document.getElementById('global-dark-toggle');
        if (toggleBtn) {
            toggleBtn.onclick = () => this.toggleDarkMode();
        }

        // カードクリックイベント
        document.querySelectorAll('.tool-card').forEach(card => {
            card.onclick = () => {
                const toolId = card.dataset.toolId;
                const requiresToken = card.dataset.requiresToken === 'true';
                const isValidTokenNow = hasValidToken();
                
                if (requiresToken && !isValidTokenNow) {
                    const token = prompt('GitHub APIトークンを入力してください（開発者専用）');
                    if (token && token.length >= 40) {
                        localStorage.setItem('dqx_test_token', token);
                        this.showLauncher();
                    }
                    return;
                }
                this.loadTool(toolId);
            };
        });
        
        // SortableJS を初期化（ドラッグ＆ドロップ）
        const homeGrid = this.container.querySelector('.home-grid');
        if (homeGrid && typeof Sortable !== 'undefined') {
            if (this.sortableInstance) {
                this.sortableInstance.destroy();
            }
            this.sortableInstance = new Sortable(homeGrid, {
                animation: 150,
                onEnd: () => {
                    const newOrder = [...homeGrid.children].map(card => card.dataset.toolId);
                    localStorage.setItem('dqx_card_order', JSON.stringify(newOrder));
                }
            });
        }
    },

    renderToolMenu: function() {
        const isMobile = this.isMobile();

        // hideInMenu が true のツールは除外
        const menuEntries = Object.entries(this.tools).filter(([id, tool]) => !tool.hideInMenu);

        const menuButtons = menuEntries.map(([id, tool]) => {
            const icon = tool.icon || '🔧';
            const name = tool.name;
            const isActive = (this.currentTool === id);
            return `
                <button class="tool-menu-btn ${isActive ? 'active' : ''}" data-tool-id="${id}">
                    ${icon}<span class="menu-btn-label">${name}</span>
                </button>
            `;
        }).join('');

        const oldBar = document.getElementById('tool-menu-bar');
        if (oldBar) oldBar.remove();

        const menuBar = document.createElement('div');
        menuBar.id = 'tool-menu-bar';
        
        if (isMobile) {
            // スマホ：左スクロール＋右固定レイアウト
            menuBar.className = 'tool-menu-bottom';
            menuBar.innerHTML = `
                <div class="tool-menu-scroll">
                    ${menuButtons}
                </div>
                <div class="tool-menu-fixed">
                    <button class="tool-menu-btn home-btn" data-action="home">🏠<span class="menu-btn-label">ホーム</span></button>
                    <button class="tool-menu-btn dark-mode-btn" data-action="dark">${this.darkMode ? '☀️' : '🌙'}<span class="menu-btn-label">${this.darkMode ? 'ライト' : 'ダーク'}</span></button>
                </div>
            `;
            
            // イベント設定
            const homeBtn = menuBar.querySelector('[data-action="home"]');
            if (homeBtn) homeBtn.onclick = () => this.goHome();
            
            const darkBtn = menuBar.querySelector('[data-action="dark"]');
            if (darkBtn) darkBtn.onclick = () => this.toggleDarkMode();
            
            menuBar.querySelectorAll('.tool-menu-scroll .tool-menu-btn').forEach(btn => {
                btn.onclick = () => {
                    const toolId = btn.dataset.toolId;
                    if (toolId && this.currentTool !== toolId) {
                        this.loadTool(toolId);
                    }
                };
            });
        } else {
            // PC／タブレット横向き：右サイドバー（縦スクロール＋固定ボタン）
            const isHidden = !this.sidebarVisible;
            menuBar.className = 'tool-menu-sidebar';
            menuBar.style.display = isHidden ? 'none' : '';
            
            menuBar.innerHTML = `
                <div class="tool-menu-sidebar-scroll">
                    ${menuButtons}
                </div>
                <div class="tool-menu-sidebar-fixed">
                    <button class="tool-menu-btn sidebar-toggle-btn" data-action="toggle-sidebar">◀<span class="menu-btn-label">格納</span></button>
                    <button class="tool-menu-btn home-btn" data-action="home">🏠<span class="menu-btn-label">ホーム</span></button>
                    <button class="tool-menu-btn dark-mode-btn" data-action="dark">${this.darkMode ? '☀️' : '🌙'}<span class="menu-btn-label">${this.darkMode ? 'ライト' : 'ダーク'}</span></button>
                </div>
            `;
            
            document.body.appendChild(menuBar);
            
            // イベント設定
            const toggleBtn = menuBar.querySelector('[data-action="toggle-sidebar"]');
            if (toggleBtn) toggleBtn.onclick = () => this.toggleSidebar();
            
            const homeBtn = menuBar.querySelector('[data-action="home"]');
            if (homeBtn) homeBtn.onclick = () => this.goHome();
            
            const darkBtn = menuBar.querySelector('[data-action="dark"]');
            if (darkBtn) darkBtn.onclick = () => this.toggleDarkMode();
            
            menuBar.querySelectorAll('.tool-menu-sidebar-scroll .tool-menu-btn').forEach(btn => {
                btn.onclick = () => {
                    const toolId = btn.dataset.toolId;
                    if (toolId && this.currentTool !== toolId) {
                        this.loadTool(toolId);
                    }
                };
            });

            // 格納状態を適用（ツールコンテナのパディング調整）
            this.applySidebarState();
        }
        
        document.body.appendChild(menuBar);
        this.updateContainerPadding();
    },

    applySidebarState: function() {
        // サイドバー格納時のツールコンテナパディング調整
        const toolContainer = document.getElementById('dqx-tool-container');
        const menuBar = document.getElementById('tool-menu-bar');
        if (toolContainer && menuBar) {
            const isHidden = !this.sidebarVisible;
            if (isHidden) {
                toolContainer.style.paddingRight = '0';
                // 格納中はハンバーガー的な表示として、復元ボタンをフロート表示
                let floatBtn = document.getElementById('sidebar-float-toggle');
                if (!floatBtn) {
                    floatBtn = document.createElement('button');
                    floatBtn.id = 'sidebar-float-toggle';
                    floatBtn.className = 'sidebar-float-btn';
                    floatBtn.textContent = '▶';
                    floatBtn.title = 'ツールバーを表示';
                    document.body.appendChild(floatBtn);
                    floatBtn.onclick = () => this.toggleSidebar();
                }
                floatBtn.style.display = 'flex';
            } else {
                toolContainer.style.paddingRight = '80px';
                const floatBtn = document.getElementById('sidebar-float-toggle');
                if (floatBtn) floatBtn.style.display = 'none';
                // ツールバー表示時に格納ボタンのアイコンを更新
                const toggleBtn = menuBar.querySelector('[data-action="toggle-sidebar"]');
                if (toggleBtn) {
                    toggleBtn.innerHTML = '◀<span class="menu-btn-label">格納</span>';
                }
            }
        }
    },

    updateContainerPadding: function() {
        const isMobile = this.isMobile();
        const toolContainer = document.getElementById('dqx-tool-container');
        if (!toolContainer) return;

        if (isMobile) {
            toolContainer.style.paddingBottom = '70px';
            toolContainer.style.paddingRight = '0';
        } else {
            const isHidden = !this.sidebarVisible;
            toolContainer.style.paddingBottom = '0';
            toolContainer.style.paddingRight = isHidden ? '0' : '80px';
        }
    },

    addDarkModeButtonToMenu: function() {
        // PC版では既に固定ボタンとして実装済みのため、この関数は使用しない
        // ただし互換性のために残しておく
    },

    // テストツール読み込み用の共通関数
    loadTestTool: async function(toolId, tool) {
        const config = tool.testToolConfig;
        if (!config) return false;
        
        let token = localStorage.getItem('dqx_test_token');
        if (!token) {
            token = prompt(`🔑 ${tool.name}を使用するためのGitHub APIトークンを入力してください（開発者専用）`);
            if (!token) return false;
            localStorage.setItem('dqx_test_token', token);
        }
        
        const loadingDiv = document.createElement('div');
        loadingDiv.textContent = '読み込み中...';
        loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#000;color:#fff;padding:20px;border-radius:10px;z-index:10001;';
        document.body.appendChild(loadingDiv);
        
        try {
            const res = await fetch(`https://api.github.com/repos/rre1111/dqx-private-api/contents/${config.filename}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const code = await res.text();
            
            const script = document.createElement('script');
            script.dataset.testTool = config.filename;
            script.textContent = code;
            document.head.appendChild(script);
            
            loadingDiv.remove();
            
            if (typeof window[config.globalName] !== 'undefined' && typeof window[config.globalName].render === 'function') {
                this.container.innerHTML = '';
                const newContainer = document.createElement('div');
                newContainer.id = 'dqx-tool-container';
                this.container.appendChild(newContainer);
                window[config.globalName].render('#dqx-tool-container');
                this.currentTool = toolId;
                this.renderToolMenu();
                return true;
            } else {
                throw new Error('ツール読み込み失敗');
            }
        } catch(e) {
            loadingDiv.remove();
            console.error(e);
            alert(`認証失敗: ${e.message}`);
            localStorage.removeItem('dqx_test_token');
            this.goHome();
            return false;
        }
    },

    loadTool: async function(toolId) {
        const tool = this.tools[toolId];
        if (!tool) return;
        if (this.currentTool === toolId) return;

        // テストツール（hideInMenu + testToolConfig）は特別処理
        if (tool.hideInMenu && tool.testToolConfig) {
            this.destroyCurrentTool();
            const oldContainer = document.getElementById('dqx-tool-container');
            if (oldContainer) oldContainer.remove();
            await this.loadTestTool(toolId, tool);
            return;
        }

        this.destroyCurrentTool();

        const oldContainer = document.getElementById('dqx-tool-container');
        if (oldContainer) oldContainer.remove();

        const toolContainer = document.createElement('div');
        toolContainer.id = 'dqx-tool-container';
        this.container.appendChild(toolContainer);

        const loadingImages = [
            { src: './images/dqx_loading.jpg',  weight: 30 },
            { src: './images/dqx_loading2.jpg', weight: 25 },
            { src: './images/dqx_loading3.jpg', weight: 25 },
            { src: './images/dqx_loading4.jpg', weight: 18 },
            { src: './images/dqx_loading5.jpg', weight: 2  },
        ];
        const totalWeight = loadingImages.reduce((sum, img) => sum + img.weight, 0);
        let rand = Math.random() * totalWeight;
        const randomImage = loadingImages.find(img => (rand -= img.weight) < 0).src;

        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'dqx-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 20000;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            transition: opacity 0.3s;
        `;
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="margin-bottom: 24px;">
                    <img src="${randomImage}" style="width: 320px; max-width: 80vw; height: auto; opacity: 0.95;" onerror="this.style.display='none'">
                </div>
                <div id="dqx-loading-text" style="color: white; font-size: 1.3rem; font-weight: bold; margin-bottom: 20px;">
                    読み込み中...
                </div>
                <div style="color: #aaa; font-size: 0.7rem; max-width: 90%; margin: 0 auto; line-height: 1.5;">
                    このページで利用している株式会社スクウェア・エニックスを代表とする共同著作者が権利を所有する画像の転載・配布は禁止いたします。<br>
                    (C) ARMOR PROJECT/BIRD STUDIO/SQUARE ENIX All Rights Reserved.
                </div>
            </div>
        `;
        document.body.appendChild(loadingDiv);

        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            this.removeOldToolScripts(tool.url);
            await this.loadScript(tool.url);

            const fn = tool.renderFn
                .split('.')
                .reduce((obj, key) => obj && obj[key], window);

            loadingDiv.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 300));
            loadingDiv.remove();

            if (typeof fn === 'function') {
                this.container.innerHTML = '';
                const newToolContainer = document.createElement('div');
                newToolContainer.id = 'dqx-tool-container';
                this.container.appendChild(newToolContainer);

                fn('#dqx-tool-container');
                this.currentTool = toolId;
                this.renderToolMenu();
            } else {
                toolContainer.innerHTML = '<div style="color: red; text-align: center; padding: 40px;">エラー: ツールの読み込みに失敗しました</div>';
                this.goHome();
            }
        } catch(e) {
            loadingDiv.remove();
            console.error('ツール読み込みエラー:', e);
            toolContainer.innerHTML = '<div style="color: red; text-align: center; padding: 40px;">エラー: ツールの読み込みに失敗しました</div>';
            this.goHome();
        }
    },

    goHome: function() {
        this.destroyCurrentTool();

        const menuBar = document.getElementById('tool-menu-bar');
        if (menuBar) menuBar.remove();

        const floatBtn = document.getElementById('sidebar-float-toggle');
        if (floatBtn) floatBtn.remove();

        const oldContainer = document.getElementById('dqx-tool-container');
        if (oldContainer) oldContainer.remove();

        const newContainer = document.createElement('div');
        newContainer.id = 'dqx-tool-container';
        this.container.appendChild(newContainer);

        this.removeTestToolScripts();

        this.currentTool = null;
        this.showLauncher();
    },

    destroyCurrentTool: function() {
        if (this.currentTool) {
            const tool = this.tools[this.currentTool];
            if (tool) {
                if (tool.testToolConfig) {
                    const testGlobalName = tool.testToolConfig.globalName;
                    if (window[testGlobalName] && typeof window[testGlobalName].destroy === 'function') {
                        window[testGlobalName].destroy();
                    }
                } else if (tool.renderFn) {
                    const globalName = tool.renderFn.split('.')[0];
                    if (window[globalName] && typeof window[globalName].destroy === 'function') {
                        window[globalName].destroy();
                    }
                }
            }
        }

        this.removeTestToolScripts();

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
        const floatBtn = document.getElementById('sidebar-float-toggle');
        if (floatBtn) floatBtn.remove();
    },

    removeOldToolScripts: function(url) {
        const cacheBustUrl = url + '?v=' + APP_VERSION;
        const rawUrl = url;

        document.querySelectorAll(`script[src="${cacheBustUrl}"]`).forEach(script => script.remove());
        document.querySelectorAll(`script[src="${rawUrl}"]`).forEach(script => script.remove());
    },

    removeTestToolScripts: function() {
        document.querySelectorAll('script[data-test-tool]').forEach(script => script.remove());
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
