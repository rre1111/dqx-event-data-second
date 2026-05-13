// ========== 傭兵ツール バージョンセレクタ ==========
(function(global) {
    const VERSIONS = [
        { version: 'v1.5.5', date: '2026-05-12', url: './old_tools/ver155.html', desc: 'はてなブログ版' },
        { version: 'v1.4.5', date: '2026-04-xx', url: './old_tools/ver145.html', desc: '' },
        { version: 'v1.4.1', date: '2026-04-xx', url: './old_tools/ver141.html', desc: 'ウェブフック版' },
        { version: 'v1.3.0', date: '2026-03-xx', url: './old_tools/ver130.html', desc: '' },
        { version: 'v1.2.6', date: '2026-03-xx', url: './old_tools/ver126.html', desc: 'Blue Edition' },
        { version: 'v1.1.7', date: '2026-02-xx', url: './old_tools/ver117.html', desc: '' }
    ];

    const VersionSelector = {
        currentIframe: null,
        isPreviewMode: false,  // スマホでプレビューモードか

        render: function(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                // ===== スマホ：初期はリスト表示 =====
                this.renderMobileList(container);
            } else {
                // ===== PC：左リスト + 右プレビュー（現状維持）=====
                this.renderPcLayout(container);
            }
        },

        // スマホ：リスト表示
        renderMobileList: function(container) {
            this.isPreviewMode = false;
            
            const versionRows = VERSIONS.map(v => `
                <div class="version-item" data-url="${v.url}" data-version="${v.version}">
                    <div class="version-info">
                        <strong>${v.version}</strong>
                        ${v.desc ? `<span class="version-desc">${v.desc}</span>` : ''}
                        <div class="version-date">${v.date}</div>
                    </div>
                    <button class="preview-btn">▶ 選択</button>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="vs-mobile-container">
                    <div class="vs-header">
                        <h2>📜 傭兵ツール 過去バージョン</h2>
                        <p>バージョンを選ぶと、画面いっぱいにプレビュー表示されます</p>
                    </div>
                    <div class="vs-list-mobile">
                        ${versionRows}
                    </div>
                </div>
            `;

            // スタイル
            this.addStyles(container);
            
            // イベント設定
            document.querySelectorAll('.version-item').forEach(item => {
                const btn = item.querySelector('.preview-btn');
                const url = item.dataset.url;
                const version = item.dataset.version;
                
                const selectVersion = () => {
                    this.switchToFullPreview(container, url, version);
                };
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    selectVersion();
                };
                item.onclick = selectVersion;
            });
        },

        // スマホ：プレビュー全画面表示
        switchToFullPreview: function(container, url, version) {
            this.isPreviewMode = true;
            
            // 以前のiframeを削除
            if (this.currentIframe) {
                this.currentIframe.remove();
            }
            
            // プレビュー専用レイアウトに切り替え（ヘッダー＋プレビューのみ）
            container.innerHTML = `
                <div class="vs-mobile-preview-full">
                    <div class="vs-preview-header">
                        <span>📜 ${version}</span>
                        <button id="backToListBtn" class="back-btn">← 戻る</button>
                    </div>
                    <div id="fullPreviewArea" class="vs-preview-area"></div>
                </div>
            `;
            
            // iframe作成
            const previewArea = document.getElementById('fullPreviewArea');
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.cssText = 'width:100%;height:100%;border:none;background:white;';
            previewArea.appendChild(iframe);
            this.currentIframe = iframe;
            
            // 戻るボタン
            const backBtn = document.getElementById('backToListBtn');
            if (backBtn) {
                backBtn.onclick = () => {
                    this.renderMobileList(container);
                };
            }
            
            // スタイル再適用
            this.addStyles(container);
        },

        // PC：現状維持のレイアウト
        renderPcLayout: function(container) {
            const versionRows = VERSIONS.map(v => `
                <div class="version-item" data-url="${v.url}" data-version="${v.version}">
                    <div class="version-info">
                        <strong>${v.version}</strong>
                        ${v.desc ? `<span class="version-desc">${v.desc}</span>` : ''}
                        <div class="version-date">${v.date}</div>
                    </div>
                    <button class="preview-btn">📺 プレビュー</button>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="vs-container">
                    <div class="vs-header">
                        <h2>📜 傭兵ツール 過去バージョン</h2>
                        <p>バージョンを選択すると、右側のフレームでプレビューできます。</p>
                    </div>
                    <div class="vs-main">
                        <div class="vs-list">
                            ${versionRows}
                        </div>
                        <div class="vs-preview">
                            <div class="vs-placeholder">左のリストからバージョンを選んでください</div>
                        </div>
                    </div>
                </div>
            `;

            this.addStyles(container);
            
            // PC用イベント
            document.querySelectorAll('.version-item').forEach(item => {
                const btn = item.querySelector('.preview-btn');
                const url = item.dataset.url;
                const version = item.dataset.version;
                
                const showPreview = () => {
                    const previewArea = document.querySelector('.vs-preview');
                    if (this.currentIframe) this.currentIframe.remove();
                    const iframe = document.createElement('iframe');
                    iframe.src = url;
                    iframe.className = 'vs-iframe';
                    iframe.title = `傭兵ツール ${version}`;
                    previewArea.innerHTML = '';
                    previewArea.appendChild(iframe);
                    this.currentIframe = iframe;
                };
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    showPreview();
                };
                item.onclick = showPreview;
            });
        },

        addStyles: function(container) {
            // 既存のスタイルを削除して再追加（重複防止）
            const oldStyle = container.querySelector('#vs-styles');
            if (oldStyle) oldStyle.remove();
            
            const style = document.createElement('style');
            style.id = 'vs-styles';
            style.textContent = `
                /* ===== PC用スタイル ===== */
                .vs-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    min-height: 600px;
                }
                .vs-header {
                    padding: 16px;
                    border-bottom: 1px solid #ddd;
                    background: #f9f9f9;
                }
                .vs-header h2 {
                    margin: 0 0 8px 0;
                    font-size: 1.2rem;
                }
                .vs-header p {
                    margin: 0;
                    font-size: 13px;
                    color: #666;
                }
                .vs-main {
                    display: flex;
                    flex: 1;
                    min-height: 500px;
                }
                .vs-list {
                    width: 280px;
                    border-right: 1px solid #ddd;
                    overflow-y: auto;
                    background: #fff;
                }
                .version-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .version-item:hover {
                    background: #f0f7ff;
                }
                .version-info {
                    flex: 1;
                }
                .version-desc {
                    font-size: 11px;
                    color: #0066cc;
                    margin-left: 6px;
                }
                .version-date {
                    font-size: 10px;
                    color: #999;
                    margin-top: 4px;
                }
                .preview-btn {
                    background: #0066cc;
                    color: white;
                    border: none;
                    padding: 6px 14px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 11px;
                }
                .preview-btn:hover {
                    background: #0055aa;
                }
                .vs-preview {
                    flex: 1;
                    background: #f5f5f5;
                    position: relative;
                }
                .vs-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #999;
                }
                .vs-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: white;
                }
                
                /* ===== スマホ用スタイル ===== */
                .vs-mobile-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .vs-list-mobile {
                    flex: 1;
                    overflow-y: auto;
                }
                .vs-mobile-container .version-item {
                    padding: 14px;
                }
                .vs-mobile-container .preview-btn {
                    padding: 8px 16px;
                    font-size: 13px;
                }
                
                /* スマホ：プレビュー全画面 */
                .vs-mobile-preview-full {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 100;
                    background: #fff;
                }
                .vs-preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: #0066cc;
                    color: white;
                    font-weight: bold;
                }
                .back-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    cursor: pointer;
                }
                .vs-preview-area {
                    flex: 1;
                    background: #f5f5f5;
                }
                
                /* ダークモード */
                body.dark-mode .vs-header {
                    background: #1e293b;
                    border-bottom-color: #334155;
                }
                body.dark-mode .vs-header p {
                    color: #94a3b8;
                }
                body.dark-mode .vs-list {
                    background: #0f172a;
                    border-right-color: #334155;
                }
                body.dark-mode .version-item {
                    border-bottom-color: #1e293b;
                }
                body.dark-mode .version-item:hover {
                    background: #1e293b;
                }
                body.dark-mode .version-desc {
                    color: #60a5fa;
                }
                body.dark-mode .version-date {
                    color: #64748b;
                }
                body.dark-mode .vs-preview {
                    background: #0f172a;
                }
                body.dark-mode .vs-mobile-preview-full {
                    background: #0f172a;
                }
                body.dark-mode .vs-preview-header {
                    background: #1e293b;
                }
            `;
            container.appendChild(style);
        },

        destroy: function() {
            if (this.currentIframe) {
                this.currentIframe.remove();
                this.currentIframe = null;
            }
        }
    };

    global.VersionSelector = VersionSelector;
})(window);
