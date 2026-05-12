// ========== 傭兵ツール バージョンセレクタ (HTML版) ==========
(function(global) {
    // ★ あなたのGistのRaw URLをリストアップしました
    const VERSIONS = [
        {
            version: 'v1.5.5',
            date: '2026-05-12',
            url: 'https://gist.githubusercontent.com/yuffy-1111/38c5738de4204952cc9b3365a93240d4/raw/04a708450969daf6927e03bd0a8ec5c1b9de8fa3/ver155_hb_edition.html',
            desc: 'はてなブログ版'
        },
        {
            version: 'v1.4.5',
            date: '2026-04-xx',
            url: 'https://gist.githubusercontent.com/yuffy-1111/5eddb25d14fb2af57a8ad2eedc979de3/raw/16aa21ec6b7d0829ead7e70a292830a8e2ca6839/ver145.html',
            desc: ''
        },
        {
            version: 'v1.4.1',
            date: '2026-04-xx',
            url: 'https://gist.githubusercontent.com/yuffy-1111/bc042c561726813e1fd18f8cf0515ae6/raw/894fa7a3955ec17eee6d1b13e725a2c0f09f998c/ver141web(delete).html',
            desc: 'ウェブフック版'
        },
        {
            version: 'v1.3.0',
            date: '2026-03-xx',
            url: 'https://gist.githubusercontent.com/yuffy-1111/ae466bdca9582b41332bd2e7e4d29a65/raw/a3acbd51a0a0e7dce5468d5fd4e60dcbfe2aa4f8/ver130.html',
            desc: ''
        },
        {
            version: 'v1.2.6',
            date: '2026-03-xx',
            url: 'https://gist.githubusercontent.com/yuffy-1111/9fe76e96218225e6486481067c9b9664/raw/a6fc8191604a3a7d55ec253c1681e4b0510ee04a/ver126b.html',
            desc: 'Blue Edition'
        },
        {
            version: 'v1.1.7',
            date: '2026-02-xx',
            url: 'https://gist.githubusercontent.com/yuffy-1111/332d9aab87f418311f8a961ad35b6bec/raw/bccc31c9d9ef17f6633db2927b752c2784b573c2/ver117.html',
            desc: ''
        }
    ];

    const VersionSelector = {
        currentIframe: null,

        render: function(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            // バージョンリストのHTMLを生成
            const versionRows = VERSIONS.map(v => `
                <div class="version-item" data-url="${v.url}" data-version="${v.version}">
                    <div class="version-info">
                        <strong>${v.version}</strong>
                        ${v.desc ? `<span class="version-desc">${v.desc}</span>` : ''}
                        <div class="version-date">${v.date}</div>
                    </div>
                    <button class="load-btn">▶ 起動</button>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="vs-container">
                    <div class="vs-header">
                        <h2>📜 傭兵ツール 過去バージョン</h2>
                        <p>過去のバージョンを選ぶと、右側のフレームで表示されます。</p>
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

            // スタイルを追加
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
                    width: 260px;
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
                    margin-left: 8px;
                }
                .version-date {
                    font-size: 10px;
                    color: #999;
                    margin-top: 4px;
                }
                .load-btn {
                    background: #0066cc;
                    color: white;
                    border: none;
                    padding: 6px 14px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .load-btn:hover {
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
                body.dark-mode .version-date {
                    color: #64748b;
                }
                body.dark-mode .vs-preview {
                    background: #0f172a;
                }
            `;
            container.appendChild(style);

            // イベント設定
            document.querySelectorAll('.version-item').forEach(item => {
                const btn = item.querySelector('.load-btn');
                const url = item.dataset.url;
                const version = item.dataset.version;

                const loadVersion = () => {
                    const previewArea = document.querySelector('.vs-preview');
                    if (this.currentIframe) {
                        this.currentIframe.remove();
                    }
                    const iframe = document.createElement('iframe');
                    iframe.src = url;
                    iframe.className = 'vs-iframe';
                    previewArea.innerHTML = '';
                    previewArea.appendChild(iframe);
                    this.currentIframe = iframe;
                };

                btn.onclick = (e) => {
                    e.stopPropagation();
                    loadVersion();
                };
                item.onclick = loadVersion;
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
