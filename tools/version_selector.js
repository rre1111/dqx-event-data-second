// ========== 傭兵ツール バージョンセレクタ（修正版） ==========
(function(global) {
    const VERSIONS = [
        { version: 'v1.5.5', date: '2026-05-12', url: './old_tools/ver155.html', desc: 'はてなブログ版' },
        { version: 'v1.4.5', date: '2026-04-xx', url: './old_tools/ver145.html', desc: '' },
        { version: 'v1.4.1', date: '2026-04-xx', url: './old_tools/ver141.html', desc: 'ウェブフック版' },
        { version: 'v1.3.0', date: '2026-03-xx', url: './old_tools/ver130.html', desc: '' },
        { version: 'v1.2.6', date: '2026-03-xx', url: './old_tools/ver126.html', desc: 'Blue Edition' },
        { version: 'v1.1.7', date: '2026-02-xx', url: './old_tools/ver117.html', desc: '' }
    ];

    let currentIframe = null;
    let isPreviewMode = false;
    let selectedUrl = '';
    let currentContainerSelector = '';  // ★修正①: 変数名を明確に
    let currentContainer = null;         // ★修正②: コンテナ参照を保持

    const VersionSelector = {
        render: function(selector) {
            // ★修正③: エラーチェック強化
            if (!selector) {
                console.error('VersionSelector: selector is required');
                return;
            }
            
            currentContainerSelector = selector;
            currentContainer = document.querySelector(selector);
            
            if (!currentContainer) {
                console.error('VersionSelector: container not found:', selector);
                return;
            }

            // ★修正④: 以前のレンダリングを完全クリア
            this.destroy();
            
            const isMobile = window.innerWidth <= 768;

            if (!isMobile) {
                this.renderPc(currentContainer);
            } else {
                if (!isPreviewMode) {
                    this.renderMobileList(currentContainer);
                } else {
                    this.renderMobilePreview(currentContainer);
                }
            }
        },

        renderMobileList: function(container) {
            isPreviewMode = false;
            selectedUrl = '';
            
            const versionRows = VERSIONS.map((v, index) => `
                <div class="version-item" data-url="${v.url}" data-version="${v.version}" data-index="${index}">
                    <div class="version-info">
                        <strong>${v.version}</strong>
                        ${v.desc ? `<span class="version-desc">${this.escapeHtml(v.desc)}</span>` : ''}
                        <div class="version-date">${v.date}</div>
                    </div>
                    <button class="preview-btn">▶ 選択</button>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="vs-mobile-list">
                    <div class="vs-header">
                        <h2>📜 傭兵ツール 過去バージョン</h2>
                        <p>バージョンを選ぶとプレビュー表示されます</p>
                    </div>
                    <div class="vs-list">
                        ${versionRows}
                    </div>
                </div>
            `;

            this.addStyles(container);

            // ★修正⑤: イベントリスナーを確実にバインド（重複防止）
            const versionItems = document.querySelectorAll('.version-item');
            versionItems.forEach(item => {
                // 既存のイベントを削除してから追加
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);
                
                const url = newItem.dataset.url;
                const btn = newItem.querySelector('.preview-btn');
                
                const selectVersion = (e) => {
                    if (e) e.stopPropagation();
                    selectedUrl = url;
                    isPreviewMode = true;
                    this.render(currentContainerSelector);
                };

                if (btn) {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        selectVersion();
                    };
                }
                newItem.onclick = selectVersion;
            });
        },

        renderMobilePreview: function(container) {
            if (!selectedUrl) {
                // エラー時はリストに戻る
                isPreviewMode = false;
                this.render(currentContainerSelector);
                return;
            }

            container.innerHTML = `
                <div class="vs-mobile-preview">
                    <div class="preview-header">
                        <button id="backToListBtn" class="back-btn">← 戻る</button>
                        <span class="preview-version">${this.getVersionFromUrl(selectedUrl)}</span>
                    </div>
                    <div id="previewArea" class="preview-content"></div>
                </div>
            `;

            this.addStyles(container);

            // 戻るボタンのイベント
            const backBtn = document.getElementById('backToListBtn');
            if (backBtn) {
                backBtn.onclick = () => {
                    this.destroy();  // iframeを確実に破棄
                    isPreviewMode = false;
                    selectedUrl = '';
                    this.render(currentContainerSelector);
                };
            }

            // iframeを読み込む
            const previewArea = document.getElementById('previewArea');
            if (previewArea && selectedUrl) {
                if (currentIframe) {
                    currentIframe.remove();
                    currentIframe = null;
                }
                
                const iframe = document.createElement('iframe');
                iframe.src = selectedUrl;
                iframe.style.cssText = 'width:100%;height:100%;border:none;background:white;';
                iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms';
                previewArea.appendChild(iframe);
                currentIframe = iframe;
            }
        },

        renderPc: function(container) {
            const versionRows = VERSIONS.map((v, index) => `
                <div class="version-item" data-url="${v.url}" data-version="${v.version}" data-index="${index}">
                    <div class="version-info">
                        <strong>${v.version}</strong>
                        ${v.desc ? `<span class="version-desc">${this.escapeHtml(v.desc)}</span>` : ''}
                        <div class="version-date">${v.date}</div>
                    </div>
                    <button class="preview-btn">プレビュー</button>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="vs-pc">
                    <div class="vs-header">
                        <h2>📜 傭兵ツール 過去バージョン</h2>
                        <p>バージョンを選択すると右側に表示されます</p>
                    </div>
                    <div class="vs-main">
                        <div class="vs-list">
                            ${versionRows}
                        </div>
                        <div id="pcPreviewArea" class="vs-preview-area">
                            <div class="vs-placeholder">左からバージョンを選んでください</div>
                        </div>
                    </div>
                </div>
            `;

            this.addStyles(container);

            // PC用イベント
            const versionItems = document.querySelectorAll('.version-item');
            versionItems.forEach(item => {
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);
                
                const url = newItem.dataset.url;
                const btn = newItem.querySelector('.preview-btn');
                
                const showPreview = () => {
                    const previewArea = document.getElementById('pcPreviewArea');
                    if (!previewArea) return;
                    
                    if (currentIframe) {
                        currentIframe.remove();
                        currentIframe = null;
                    }
                    
                    const iframe = document.createElement('iframe');
                    iframe.src = url;
                    iframe.style.cssText = 'width:100%;height:100%;border:none;background:white;';
                    iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms';
                    previewArea.innerHTML = '';
                    previewArea.appendChild(iframe);
                    currentIframe = iframe;
                };

                if (btn) {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        showPreview();
                    };
                }
                newItem.onclick = showPreview;
            });
        },

        getVersionFromUrl: function(url) {
            const match = url.match(/ver(\d+)\.html/);
            if (match) {
                const verNum = match[1];
                const version = VERSIONS.find(v => v.url === url);
                return version ? version.version : `v${verNum[0]}.${verNum[1]}.${verNum[2]}`;
            }
            return '旧バージョン';
        },

        escapeHtml: function(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        },

        addStyles: function(container) {
            const oldStyle = document.getElementById('vs-styles');
            if (oldStyle) oldStyle.remove();

            const style = document.createElement('style');
            style.id = 'vs-styles';
            style.textContent = `
                .vs-pc { display: flex; flex-direction: column; height: 100%; min-height: 500px; }
                .vs-header { padding: 16px; border-bottom: 1px solid #ddd; background: #f9f9f9; }
                .vs-header h2 { margin: 0 0 8px 0; font-size: 1.2rem; }
                .vs-header p { margin: 0; font-size: 13px; color: #666; }
                .vs-main { display: flex; flex: 1; }
                .vs-list { width: 260px; border-right: 1px solid #ddd; overflow-y: auto; }
                .version-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; }
                .version-item:hover { background: #f0f7ff; }
                .version-info { flex: 1; }
                .version-desc { font-size: 11px; color: #0066cc; margin-left: 6px; }
                .version-date { font-size: 10px; color: #999; margin-top: 4px; }
                .preview-btn { background: #0066cc; color: white; border: none; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 12px; }
                .preview-btn:hover { background: #0052a3; }
                .vs-preview-area { flex: 1; background: #f5f5f5; }
                .vs-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #999; }
                
                /* スマホ：リスト画面 */
                .vs-mobile-list { display: flex; flex-direction: column; height: 100%; }
                .vs-mobile-list .vs-list { width: 100%; border-right: none; flex: 1; }
                
                /* スマホ：プレビュー画面 */
                .vs-mobile-preview { display: flex; flex-direction: column; height: 100vh; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000; background: white; }
                .preview-header { display: flex; align-items: center; padding: 12px 16px; background: #0066cc; color: white; gap: 16px; }
                .back-btn { background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 14px; }
                .back-btn:hover { background: rgba(255,255,255,0.3); }
                .preview-version { font-size: 14px; font-weight: bold; }
                .preview-content { flex: 1; background: white; overflow: auto; }
                
                /* ダークモード */
                body.dark-mode .vs-header { background: #1e293b; border-bottom-color: #334155; }
                body.dark-mode .vs-header p { color: #94a3b8; }
                body.dark-mode .vs-list { background: #0f172a; border-right-color: #334155; }
                body.dark-mode .version-item { border-bottom-color: #1e293b; }
                body.dark-mode .version-item:hover { background: #1e293b; }
                body.dark-mode .version-desc { color: #60a5fa; }
                body.dark-mode .version-date { color: #64748b; }
                body.dark-mode .vs-preview-area { background: #0f172a; }
                body.dark-mode .vs-mobile-preview { background: #0f172a; }
                body.dark-mode .preview-content { background: #0f172a; }
                body.dark-mode .preview-header { background: #0f172a; border-bottom: 1px solid #334155; }
            `;
            container.appendChild(style);
        },

        destroy: function() {
            // ★修正⑥: 完全な破棄処理
            if (currentIframe) {
                currentIframe.remove();
                currentIframe = null;
            }
            
            // プレビューモードをリセット
            isPreviewMode = false;
            selectedUrl = '';
            currentContainerSelector = '';
            currentContainer = null;
            
            // スタイルは残しても良いが、一応削除オプション（コメントアウト）
            // const style = document.getElementById('vs-styles');
            // if (style) style.remove();
        }
    };

    global.VersionSelector = VersionSelector;
})(window);
