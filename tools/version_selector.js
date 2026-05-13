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

        render: function(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                this.renderMobile(container);
            } else {
                this.renderPc(container);
            }
        },

        renderMobile: function(container) {
            const versionRows = VERSIONS.map(v => `
                <div class="version-item" data-url="${v.url}" data-version="${v.version}">
                    <div class="version-info">
                        <strong>${v.version}</strong>
                        ${v.desc ? `<span class="version-desc">${v.desc}</span>` : ''}
                        <div class="version-date">${v.date}</div>
                    </div>
                    <button class="preview-btn">選択</button>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="vs-mobile">
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

            // イベント設定
            document.querySelectorAll('.version-item').forEach(item => {
                const btn = item.querySelector('.preview-btn');
                const url = item.dataset.url;
                const version = item.dataset.version;

                const showPreview = () => {
                    // プレビュー全画面表示に切り替え
                    container.innerHTML = `
                        <div class="vs-preview-full">
                            <div class="vs-preview-header">
                                <span>${version}</span>
                                <button class="back-btn">← 戻る</button>
                            </div>
                            <div class="vs-preview-area"></div>
                        </div>
                    `;

                    // iframe表示
                    const previewArea = document.querySelector('.vs-preview-area');
                    if (this.currentIframe) this.currentIframe.remove();
                    const iframe = document.createElement('iframe');
                    iframe.src = url;
                    iframe.style.cssText = 'width:100%;height:100%;border:none;background:white;';
                    previewArea.appendChild(iframe);
                    this.currentIframe = iframe;

                    // 戻るボタン
                    document.querySelector('.back-btn').onclick = () => {
                        this.renderMobile(container);
                    };

                    this.addStyles(container);
                };

                btn.onclick = (e) => {
                    e.stopPropagation();
                    showPreview();
                };
                item.onclick = showPreview;
            });
        },

        renderPc: function(container) {
            const versionRows = VERSIONS.map(v => `
                <div class="version-item" data-url="${v.url}" data-version="${v.version}">
                    <div class="version-info">
                        <strong>${v.version}</strong>
                        ${v.desc ? `<span class="version-desc">${v.desc}</span>` : ''}
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
                        <div class="vs-preview-area">
                            <div class="vs-placeholder">左からバージョンを選んでください</div>
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
                    const previewArea = document.querySelector('.vs-preview-area');
                    if (this.currentIframe) this.currentIframe.remove();
                    const iframe = document.createElement('iframe');
                    iframe.src = url;
                    iframe.style.cssText = 'width:100%;height:100%;border:none;background:white;';
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
            const oldStyle = document.getElementById('vs-styles');
            if (oldStyle) oldStyle.remove();

            const style = document.createElement('style');
            style.id = 'vs-styles';
            style.textContent = `
                /* PC用 */
                .vs-pc {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    min-height: 500px;
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
                }
                .vs-list {
                    width: 260px;
                    border-right: 1px solid #ddd;
                    overflow-y: auto;
                }
                .version-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                    cursor: pointer;
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
                }
                .vs-preview-area {
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
                
                /* スマホ用 */
                .vs-mobile {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .vs-mobile .vs-list {
                    width: 100%;
                    border-right: none;
                    flex: 1;
                }
                .vs-preview-full {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: white;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                }
                .vs-preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: #0066cc;
                    color: white;
                }
                .back-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    cursor: pointer;
                }
                .vs-preview-full .vs-preview-area {
                    flex: 1;
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
                body.dark-mode .vs-preview-area {
                    background: #0f172a;
                }
                body.dark-mode .vs-preview-full {
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
