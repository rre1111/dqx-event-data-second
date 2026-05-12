// ========== 傭兵ツール バージョンセレクタ（新タブ表示版） ==========
(function(global) {
    const VERSIONS = [
        {
            version: 'ver1.5.5',
            date: '2026-05-12',
            url: 'https://htmlpreview.github.io/?https://gist.githubusercontent.com/yuffy-1111/38c5738de4204952cc9b3365a93240d4/raw/04a708450969daf6927e03bd0a8ec5c1b9de8fa3/ver155_hb_edition.html',
            desc: 'はてなブログ版1.5.5'
        },
        {
            version: 'ver1.4.5',
            date: '2026-04-xx',
            url: 'https://htmlpreview.github.io/?https://gist.githubusercontent.com/yuffy-1111/5eddb25d14fb2af57a8ad2eedc979de3/raw/16aa21ec6b7d0829ead7e70a292830a8e2ca6839/ver145.html',
            desc: ''
        },
        {
            version: 'ver1.4.1',
            date: '2026-04-xx',
            url: 'https://htmlpreview.github.io/?https://gist.githubusercontent.com/yuffy-1111/bc042c561726813e1fd18f8cf0515ae6/raw/894fa7a3955ec17eee6d1b13e725a2c0f09f998c/ver141web(delete).html',
            desc: ''
        },
        {
            version: 'ver1.3.0',
            date: '2026-03-xx',
            url: 'https://htmlpreview.github.io/?https://gist.githubusercontent.com/yuffy-1111/ae466bdca9582b41332bd2e7e4d29a65/raw/a3acbd51a0a0e7dce5468d5fd4e60dcbfe2aa4f8/ver130.html',
            desc: ''
        },
        {
            version: 'ver1.2.6',
            date: '2026-03-xx',
            url: 'https://htmlpreview.github.io/?https://gist.githubusercontent.com/yuffy-1111/9fe76e96218225e6486481067c9b9664/raw/a6fc8191604a3a7d55ec253c1681e4b0510ee04a/ver126b.html',
            desc: 'Blue Edition'
        },
        {
            version: 'ver1.1.7',
            date: '2026-02-xx',
            url: 'https://htmlpreview.github.io/?https://gist.githubusercontent.com/yuffy-1111/332d9aab87f418311f8a961ad35b6bec/raw/bccc31c9d9ef17f6633db2927b752c2784b573c2/ver117.html',
            desc: ''
        }
    ];

    const VersionSelector = {
        render: function(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const versionRows = VERSIONS.map(v => `
                <div class="version-item" data-url="${v.url}" data-version="${v.version}">
                    <div class="version-info">
                        <strong>${v.version}</strong>
                        ${v.desc ? `<span class="version-desc">${v.desc}</span>` : ''}
                        <div class="version-date">${v.date}</div>
                    </div>
                    <button class="open-btn">📂 新規タブで開く</button>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="vs-container">
                    <div class="vs-header">
                        <h2>📜 傭兵ツール 過去バージョン</h2>
                        <p>各バージョンをクリックすると、新しいタブで開きます。</p>
                    </div>
                    <div class="vs-list">
                        ${versionRows}
                    </div>
                </div>
            `;

            // スタイル
            const style = document.createElement('style');
            style.textContent = `
                .vs-container {
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .vs-header {
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #0066cc;
                }
                .vs-header h2 {
                    margin: 0 0 8px 0;
                }
                .vs-header p {
                    margin: 0;
                    font-size: 13px;
                    color: #666;
                }
                .vs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .version-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: #f9f9f9;
                    border-radius: 12px;
                    border: 1px solid #e0e0e0;
                    transition: all 0.2s;
                }
                .version-item:hover {
                    background: #f0f7ff;
                    border-color: #0066cc;
                    transform: translateX(4px);
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
                    font-size: 11px;
                    color: #888;
                    margin-top: 4px;
                }
                .open-btn {
                    background: #0066cc;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 24px;
                    cursor: pointer;
                    font-size: 12px;
                    white-space: nowrap;
                }
                .open-btn:hover {
                    background: #0055aa;
                }
                /* ダークモード */
                body.dark-mode .vs-header p {
                    color: #94a3b8;
                }
                body.dark-mode .version-item {
                    background: #1e293b;
                    border-color: #334155;
                }
                body.dark-mode .version-item:hover {
                    background: #2d3a4e;
                    border-color: #60a5fa;
                }
                body.dark-mode .version-date {
                    color: #94a3b8;
                }
                /* スマホ対応 */
                @media (max-width: 600px) {
                    .version-item {
                        flex-direction: column;
                        gap: 12px;
                        text-align: center;
                    }
                    .open-btn {
                        width: 100%;
                    }
                }
            `;
            container.appendChild(style);

            // イベント設定
            document.querySelectorAll('.version-item').forEach(item => {
                const url = item.dataset.url;
                const btn = item.querySelector('.open-btn');

                const openInNewTab = () => {
                    window.open(url, '_blank');
                };

                btn.onclick = (e) => {
                    e.stopPropagation();
                    openInNewTab();
                };
                item.onclick = openInNewTab;
            });
        },

        destroy: function() {
            // クリーンアップ不要
        }
    };

    global.VersionSelector = VersionSelector;
})(window);
