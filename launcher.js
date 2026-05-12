// ==========ツールランチャー（改造版）=========

const DQXTools = {

    tools: {},
    currentTool: null,
    container: null,
    darkMode: false,

    // ----- 登録機能（変更なし）-----
    register: function(toolId, toolConfig) {
        this.tools[toolId] = toolConfig;
    },

    isMobile: function() {
        return window.innerWidth <= 768;
    },

    // ----- 初期化（変更なし）-----
    init: function(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('コンテナが見つかりません:', containerId);
            return;
        }
        this.darkMode = localStorage.getItem('darkMode') === 'dark';
        this.applyDarkMode();
        this.showLauncher();  // ホーム画面を表示
        window.addEventListener('resize', () => {
            if (this.currentTool === null) {
                this.showLauncher();
            } else {
                this.renderToolMenu();  // リサイズ時にメニュー再描画
            }
        });
    },

    // ----- ダークモード（変更なし）-----
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
        // 現在の画面を再描画
        if (this.currentTool === null) {
            this.showLauncher();
        } else {
            this.renderToolMenu();
        }
    },

    // ==================== 【新規】ホーム画面（カードグリッド） ====================
    showLauncher: function() {
        const isMobile = this.isMobile();
        
        // カードボタンのHTMLを生成
        const cardButtons = Object.entries(this.tools).map(([id, tool]) => {
            const icon = tool.icon || '🔧';
            const name = tool.name;
            const desc = tool.desc || '';
            return `
                <div class="tool-card" data-tool-id="${id}">
                    <div class="tool-card-icon">${icon}</div>
                    <div class="tool-card-name">${name}</div>
                    <div class="tool-card-desc">${desc}</div>
                </div>
            `;
        }).join('');

        // ホーム画面のHTML
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
                    © yuffy-1111
                </div>
            </div>
        `;

        // ダークモードボタンのイベント
        const toggleBtn = document.getElementById('global-dark-toggle');
        if (toggleBtn) {
            toggleBtn.onclick = () => this.toggleDarkMode();
        }

        // カードクリックでツール起動
        document.querySelectorAll('.tool-card').forEach(card => {
            card.onclick = () => {
                const toolId = card.dataset.toolId;
                this.loadTool(toolId);
            };
        });
    },

    // ==================== 【新規】ツール画面のメニュー（PC:右サイドバー / スマホ:下部） ====================
    renderToolMenu: function() {
        const isMobile = this.isMobile();
        
        // メニューボタンのHTMLを生成
        const menuButtons = Object.entries(this.tools).map(([id, tool]) => {
            const icon = tool.icon || '🔧';
            const name = tool.name;
            const isActive = (this.currentTool === id);
            return `
                <button class="tool-menu-btn ${isActive ? 'active' : ''}" data-tool-id="${id}">
                    ${icon}<span class="menu-btn-label">${name}</span>
                </button>
            `;
        }).join('');

        // 既存のメニューバーがあれば削除
        const oldBar = document.getElementById('tool-menu-bar');
        if (oldBar) oldBar.remove();

        // メニューバーを作成
        const menuBar = document.createElement('div');
        menuBar.id = 'tool-menu-bar';
        menuBar.className = isMobile ? 'tool-menu-bottom' : 'tool-menu-sidebar';
        menuBar.innerHTML = menuButtons;
        document.body.appendChild(menuBar);

        // ツール本体のコンテナに右/下の余白を設定
        const toolContainer = document.getElementById('dqx-tool-container');
        if (toolContainer) {
            if (isMobile) {
                toolContainer.style.paddingBottom = '70px';
                toolContainer.style.paddingRight = '0';
            } else {
                toolContainer.style.paddingBottom = '0';
                toolContainer.style.paddingRight = '80px';
            }
        }

        // ボタンのイベント設定
        document.querySelectorAll('.tool-menu-btn').forEach(btn => {
            btn.onclick = () => {
                const toolId = btn.dataset.tool-id;
                if (toolId && this.currentTool !== toolId) {
                    this.loadTool(toolId);
                }
            };
        });

        // ダークモードボタンは別途追加（常に一番下/右端に表示）
        this.addDarkModeButtonToMenu();
    },

    // ==================== 【新規】メニュー内にダークモードボタンを追加 ====================
    addDarkModeButtonToMenu: function() {
        const menuBar = document.getElementById('tool-menu-bar');
        if (!menuBar) return;
        
        const isMobile = this.isMobile();
        const darkBtn = document.createElement('button');
        darkBtn.className = 'tool-menu-btn dark-mode-btn';
        darkBtn.innerHTML = this.darkMode ? '☀️<span class="menu-btn-label">ライト</span>' : '🌙<span class="menu-btn-label">ダーク</span>';
        darkBtn.onclick = () => this.toggleDarkMode();
        
        if (isMobile) {
            menuBar.appendChild(darkBtn);
        } else {
            menuBar.appendChild(darkBtn);
        }
    },

    // ==================== 【改造】ツール読み込み ====================
    loadTool: async function(toolId) {
        const tool = this.tools[toolId];
        if (!tool) return;
        if (this.currentTool === toolId) return;

        // パスワード確認
        if (tool.password) {
            const inputPass = prompt(`🔒 「${tool.name}」のパスワードを入力してください:`);
            if (inputPass !== tool.password) {
                alert('パスワードが違います。');
                return;
            }
        }

        // 現在のツールを破棄
        this.destroyCurrentTool();

        // ツールコンテナを作り直し
        const oldContainer = document.getElementById('dqx-tool-container');
        if (oldContainer) oldContainer.remove();

        const toolContainer = document.createElement('div');
        toolContainer.id = 'dqx-tool-container';
        this.container.appendChild(toolContainer);

        // ========== ローディング画面 ==========
        const loadingImages = [
            { src: './images/dqx_loading.jpg',  weight: 30 },
            { src: './images/dqx_loading2.jpg',  weight: 25 },
            { src: './images/dqx_loading3.jpg',  weight: 25 },
            { src: './images/dqx_loading4.jpg',  weight: 17 },
            { src: './images/dqx_loading5.jpg',  weight: 3 },
        ];
        const totalWeight = loadingImages.reduce((sum, img) => sum + img.weight, 0);
        let rand = Math.random() * totalWeight;
        const randomImage = loadingImages.find(img => (rand -= img.weight) < 0).src;

        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'dqx-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(4px);
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
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            const oldScript = document.querySelector(`script[src="${tool.url}"]`);
            if (oldScript) oldScript.remove();

            await this.loadScript(tool.url);

            const fn = tool.renderFn
                .split('.')
                .reduce((obj, key) => obj && obj[key], window);

            loadingDiv.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 300));
            loadingDiv.remove();

            if (typeof fn === 'function') {
                fn('#dqx-tool-container');
                this.currentTool = toolId;
                // 【改造】ツールメニューを表示（ホームボタンではなく全ツールボタン）
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

    // ==================== 【改造】ホームに戻る ====================
    goHome: function() {
        this.destroyCurrentTool();

        // ツールメニューバーを削除
        const menuBar = document.getElementById('tool-menu-bar');
        if (menuBar) menuBar.remove();

        // ツールコンテナを削除
        const oldContainer = document.getElementById('dqx-tool-container');
        if (oldContainer) oldContainer.remove();

        const newContainer = document.createElement('div');
        newContainer.id = 'dqx-tool-container';
        this.container.appendChild(newContainer);

        // スクリプトを削除
        const scripts = document.querySelectorAll('script[src*="dqx-checker.js"], script[src*="exp-calculator.js"]');
        scripts.forEach(script => script.remove());

        this.currentTool = null;
        this.showLauncher();  // ホーム画面を表示
    },

    // ----- 以下は変更なし -----
    destroyCurrentTool: function() {
        if (this.currentTool === 'exp-calc' && window.ExpCalculator && window.ExpCalculator.destroy) {
            window.ExpCalculator.destroy();
        }
        if (this.currentTool === 'daily-checker' && window.DQXDailyChecker && window.DQXDailyChecker.destroy) {
            window.DQXDailyChecker.destroy();
        }
        // 新しいツール用の汎用destroy
        if (this.currentTool) {
            const tool = this.tools[this.currentTool];
            if (tool && window[tool.renderFn.split('.')[0]] && window[tool.renderFn.split('.')[0]].destroy) {
                window[tool.renderFn.split('.')[0]].destroy();
            }
        }
    },

    loadScript: function(url) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${url}"]`);
            if (existing) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Script load failed: ${url}`));
            document.head.appendChild(script);
        });
    }

};
