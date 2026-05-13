// ========== 傭兵ツール バージョンセレクタ（リポジトリ内ファイル版） ==========
(function(global) {
    // バージョン一覧（./old_tools/ 以下のファイルを参照）
    const VERSIONS = [
        {
            version: 'v1.5.5',
            date: '2026-05-12',
            url: './old_tools/ver155.html',
            desc: 'はてなブログ版',
        },
        {
            version: 'v1.4.5',
            date: '2026-04-xx',
            url: './old_tools/ver145.html',
            desc: ''
        },
        {
            version: 'v1.4.1',
            date: '2026-04-xx',
            url: './old_tools/ver141.html',
            desc: 'ウェブフック版'
        },
        {
            version: 'v1.3.0',
            date: '2026-03-xx',
            url: './old_tools/ver130.html',
            desc: ''
        },
        {
            version: 'v1.2.6',
            date: '2026-03-xx',
            url: './old_tools/ver126.html',
            desc: 'Blue Edition'
        },
        {
            version: 'v1.1.7',
            date: '2026-02-xx',
            url: './old_tools/ver117.html',
            desc: ''
        }
    ];

    const VersionSelector = {
        currentIframe: null,
        activeVersion: null,

        render: function(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const versionRows = VERSIONS.map(v => `
                <div class="version-item" data-version="${v.version}" data-url="${v.url}">
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
                            <div class="vs-placeholder">
                                📱 左のリストからバージョンを選んでください
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // スタイル
            const style = document.createElement('style');
            style.textContent = `
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
                .version-item.active {
                    background: #e0edff;
                }
                .version-info {
                    flex: 1;
                }
                .current-badge {
                    display: inline-block;
                    background: #0066cc;
                    color: white;
                    font-size: 9px;
                    padding: 2px 6px;
                    border-radius: 12px;
                    margin-left: 6px;
                    vertical-align: middle;
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
                    overflow: hidden;
                }
                .vs-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #999;
                    font-size: 14px;
                }
                .vs-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: white;
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
                body.dark-mode .version-item.active {
                    background: #2d3a4e;
                }
                body.dark-mode .version-desc {
                    color: #60a5fa;
                }
                body.dark-mode .version-date {
                    color: #64748b;
                }
                body.dark-mode .preview-btn {
                    background: #3b82f6;
                }
                body.dark-mode .preview-btn:hover {
                    background: #2563eb;
                }
                body.dark-mode .vs-preview {
                    background: #0f172a;
                }
                body.dark-mode .vs-placeholder {
                    color: #64748b;
                }
                /* スマホ対応 */
                @media (max-width: 768px) {
                    .vs-main {
                        flex-direction: column;
                    }
                    .vs-list {
                        width: 100%;
                        max-height: 300px;
                        border-right: none;
                        border-bottom: 1px solid #ddd;
                    }
                    .vs-preview {
                        min-height: 400px;
                    }
                }
            `;
            container.appendChild(style);

            // プレビュー表示関数
            const showPreview = (versionItem) => {
                const url = versionItem.dataset.url;
                const version = versionItem.dataset.version;
                const previewArea = document.querySelector('.vs-preview');
                
                // アクティブ表示を更新
                document.querySelectorAll('.version-item').forEach(item => {
                    item.classList.remove('active');
                });
                versionItem.classList.add('active');
                
                // 以前のiframeを削除
                if (this.currentIframe) {
                    this.currentIframe.remove();
                }
                
                // 新しいiframeを作成
                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.className = 'vs-iframe';
                iframe.title = `傭兵ツール ${version}`;
                
                previewArea.innerHTML = '';
                previewArea.appendChild(iframe);
                this.currentIframe = iframe;
                this.activeVersion = version;
            };

            // イベント設定
            document.querySelectorAll('.version-item').forEach(item => {
                const previewBtn = item.querySelector('.preview-btn');
                
                previewBtn.onclick = (e) => {
                    e.stopPropagation();
                    showPreview(item);
                };
                
                item.onclick = () => {
                    showPreview(item);
                };
            });
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
