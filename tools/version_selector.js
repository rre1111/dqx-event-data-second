// ========== 傭兵ツール バージョンセレクタ（確実動作版・ローカル参照） ==========
(function(global) {
    const VERSIONS = [
        { version: 'v1.5.5', date: '2026-05-12', url: './old_tools/ver155.html', desc: 'はてなブログ版' },
        { version: 'v1.4.5', date: '2026-04-xx', url: './old_tools/ver145.html', desc: '' },
        { version: 'v1.4.1', date: '2026-04-xx', url: './old_tools/ver141.html', desc: 'ウェブフック版' },
        { version: 'v1.3.0', date: '2026-03-xx', url: './old_tools/ver130.html', desc: '' },
        { version: 'v1.2.6', date: '2026-03-xx', url: './old_tools/ver126.html', desc: 'Blue Edition' },
        { version: 'v1.1.7', date: '2026-02-xx', url: './old_tools/ver117.html', desc: '' }
    ];

    // ★ destroy を空関数で先に定義
    const destroy = function() {};

    const render = function(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const versionRows = VERSIONS.map(v => `
            <div class="version-item" data-url="${v.url}">
                <div class="version-info">
                    <strong>${v.version}</strong>
                    ${v.desc ? `<span class="version-desc">${v.desc}</span>` : ''}
                    <div class="version-date">${v.date}</div>
                </div>
                <button class="open-btn">📂 開く</button>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="vs-container">
                <div class="vs-header">
                    <h2>📜 傭兵ツール 過去バージョン</h2>
                    <p>各バージョンをクリックすると新しいタブで開きます</p>
                </div>
                <div class="vs-list">
                    ${versionRows}
                </div>
            </div>
        `;

        // スタイル追加（一度だけ）
        if (!document.getElementById('vs-style-fixed')) {
            const style = document.createElement('style');
            style.id = 'vs-style-fixed';
            style.textContent = `
                .vs-container { max-width: 700px; margin: 0 auto; padding: 20px; }
                .vs-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #0066cc; }
                .vs-header h2 { margin: 0 0 8px 0; }
                .vs-header p { margin: 0; font-size: 13px; color: #666; }
                .vs-list { display: flex; flex-direction: column; gap: 8px; }
                .version-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #f9f9f9; border-radius: 12px; border: 1px solid #e0e0e0; cursor: pointer; transition: all 0.2s; }
                .version-item:hover { background: #f0f7ff; border-color: #0066cc; transform: translateX(4px); }
                .version-info { flex: 1; }
                .version-desc { font-size: 11px; color: #0066cc; margin-left: 8px; }
                .version-date { font-size: 11px; color: #888; margin-top: 4px; }
                .open-btn { background: #0066cc; color: white; border: none; padding: 8px 20px; border-radius: 24px; cursor: pointer; font-size: 13px; }
                .open-btn:hover { background: #0052a3; }
                body.dark-mode .vs-header p { color: #94a3b8; }
                body.dark-mode .version-item { background: #1e293b; border-color: #334155; }
                body.dark-mode .version-item:hover { background: #2d3a4e; border-color: #60a5fa; }
                body.dark-mode .version-date { color: #94a3b8; }
                @media (max-width: 600px) {
                    .version-item { flex-direction: column; gap: 12px; text-align: center; }
                    .open-btn { width: 100%; }
                }
            `;
            document.head.appendChild(style);
        }

        // イベント設定
        document.querySelectorAll('.version-item').forEach(item => {
            const url = item.dataset.url;
            const btn = item.querySelector('.open-btn');
            const openTab = () => window.open(url, '_blank');
            btn.onclick = (e) => { e.stopPropagation(); openTab(); };
            item.onclick = openTab;
        });
    };

    global.VersionSelector = { render, destroy };
})(window);
