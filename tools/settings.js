// ========== 設定ツール ==========
(function(global) {
    const Settings = {
        render: function(containerSelector) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            container.innerHTML = `
                <div style="max-width:600px;margin:0 auto;padding:20px;">
                    <h2>⚙️ 設定</h2>
                    
                    <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:20px 0;">
                        <h3>🗑️ データ管理</h3>
                        <button id="clearAllCache" style="background:#dc3545;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin:5px;">
                            全キャッシュを削除
                        </button>
                        <button id="clearCheckerCache" style="background:#ffc107;color:#333;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin:5px;">
                            チェッカーデータのみ削除
                        </button>
                        <p style="font-size:12px;color:#666;margin-top:10px;">
                            ※ 削除すると復元できません。呪文でバックアップしておくことをおすすめします。
                        </p>
                    </div>

                    <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:20px 0;">
                        <h3>📦 ストレージ状況</h3>
                        <div id="storageInfo"></div>
                    </div>

                    <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:20px 0;">
                        <h3>ℹ️ このツールについて</h3>
                        <p>DQXツールセット - ユッフィー製作</p>
                        <p>バージョン: 2.0.0</p>
                    </div>
                </div>
            `;

            // ストレージ状況を表示
            function updateStorageInfo() {
                let total = 0;
                let count = 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('dqx_')) {
                        total += localStorage.getItem(key).length;
                        count++;
                    }
                }
                document.getElementById('storageInfo').innerHTML = `
                    <p>📊 DQX関連データ: ${count} 項目</p>
                    <p>💾 概算サイズ: ${Math.round(total / 1024)} KB</p>
                `;
            }

            // 全キャッシュ削除（DQX関連のみ）
            document.getElementById('clearAllCache').onclick = () => {
                if (confirm('すべてのDQXツールデータを削除します。よろしいですか？\n（呪文でバックアップしていない場合は復元できません）')) {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('dqx_')) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    updateStorageInfo();
                    alert(`✅ ${keysToRemove.length}個のデータを削除しました`);
                }
            };

            // チェッカーデータのみ削除
            document.getElementById('clearCheckerCache').onclick = () => {
                if (confirm('チェッカーのデータ（キャラクター、チェック状態、非表示設定）を削除します。よろしいですか？')) {
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && (key.startsWith('dqx_chars') || key.startsWith('dqx_check_') || key.startsWith('dqx_disabled_') || key.startsWith('dqx_hidden_'))) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    updateStorageInfo();
                    alert(`✅ ${keysToRemove.length}個のチェッカーデータを削除しました`);
                }
            };

            updateStorageInfo();
        },
        
        destroy: function() {
            // クリーンアップ処理（必要な場合）
        }
    };

    global.Settings = Settings;
})(window);
