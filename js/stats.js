/**
 * ゲーム統計を管理するクラス
 */
class GameStats {
    constructor() {
        this.stats = {
            totalHands: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            freeDoubles: 0,
            freeSplits: 0,
            freeSplitBothWins: 0,
            dealer22s: 0,
            blackjacks: 0,
            balanceHistory: [1000]
        };
        
        // IndexedDBの初期化
        this.initDatabase().then(() => {
            // まずIndexedDBからロードを試みる
            return this.loadStats().catch(error => {
                console.log('IndexedDBにデータが存在しません。新規データを作成します。');
                // フォールバックとしてlocalStorageからロード
                if (!this.loadStatsFromLocalStorage()) {
                    // デフォルトの統計情報を使用
                    this.updateUI();
                    this.updateChart();
                    this.saveStats(); // 新しい統計情報を保存
                }
                return this.stats;
            });
        }).catch(error => {
            console.error('IndexedDBの初期化に失敗しました:', error);
            // IndexedDBが使用できない場合はlocalStorageからロード
            if (!this.loadStatsFromLocalStorage()) {
                // デフォルトの統計情報を使用
                this.updateUI();
                this.updateChart();
            }
        });
        
        // DOMが完全にロードされた後にボタンを設定
        this.setupButtons();
    }
    
    /**
     * ボタンのセットアップ
     */
    setupButtons() {
        // DOMがロードされているか確認
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupButtonsInternal());
        } else {
            this.setupButtonsInternal();
        }
    }
    
    /**
     * ボタンのセットアップの内部処理
     */
    setupButtonsInternal() {
        // リセットボタンのイベントリスナー
        const resetStatsBtn = document.getElementById('resetStatsBtn');
        if (resetStatsBtn) {
            resetStatsBtn.addEventListener('click', () => {
                if (confirm('統計情報をリセットしますか？')) {
                    this.resetStats();
                }
            });
        }
        
        // ボタンを追加する場所を取得
        const statsModalBody = document.querySelector('#statsModal .modal-body');
        if (!statsModalBody) {
            console.error('統計モーダルが見つかりません');
            return;
        }
        
        // ボタンコンテナを作成
        const statsButtons = document.createElement('div');
        statsButtons.id = 'stats-buttons';
        statsButtons.className = 'stats-buttons';
        statsButtons.style.marginTop = '10px';
        statsButtons.style.display = 'flex';
        statsButtons.style.gap = '10px';
        
        // エクスポートボタンの追加
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-stats-btn';
        exportBtn.className = 'btn';
        exportBtn.textContent = '統計をエクスポート';
        exportBtn.addEventListener('click', () => {
            this.exportStats();
        });
        statsButtons.appendChild(exportBtn);
        
        // インポートボタンの追加
        const importBtn = document.createElement('button');
        importBtn.id = 'import-stats-btn';
        importBtn.className = 'btn';
        importBtn.textContent = '統計をインポート';
        importBtn.addEventListener('click', () => {
            this.importStats();
        });
        statsButtons.appendChild(importBtn);
        
        // ボタンコンテナをモーダルに追加
        statsModalBody.appendChild(statsButtons);
    }

    /**
     * 統計情報を更新
     * @param {Object} gameStats ゲームの統計情報
     */
    updateStats(gameStats) {
        this.stats = { ...gameStats };
        this.updateUI();
        this.updateChart();
    }

    /**
     * 統計情報をリセット
     * @param {number} currentBalance 現在の残高
     */
    resetStats(currentBalance) {
        this.stats = {
            totalHands: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            freeDoubles: 0,
            freeSplits: 0,
            dealer22s: 0,
            blackjacks: 0,
            balanceHistory: [currentBalance]
        };
        this.updateUI();
        this.updateChart();
    }

    /**
     * 統計情報のUIを更新
     */
    updateUI() {
        // 総合成績の更新
        document.getElementById('total-hands').textContent = this.stats.totalHands;
        document.getElementById('total-wins').textContent = this.stats.wins;
        document.getElementById('total-losses').textContent = this.stats.losses;
        document.getElementById('total-pushes').textContent = this.stats.pushes;
        
        // 勝率の計算と更新
        const winPercentage = this.stats.totalHands > 0 
            ? Math.round((this.stats.wins / this.stats.totalHands) * 100) 
            : 0;
        document.getElementById('win-percentage').textContent = `${winPercentage}%`;
        document.getElementById('win-rate').textContent = `${winPercentage}%`;
        
        // 収支の計算と更新
        const initialBalance = this.stats.balanceHistory[0] || 1000;
        const currentBalance = this.stats.balanceHistory[this.stats.balanceHistory.length - 1] || 1000;
        const profitLoss = currentBalance - initialBalance;
        document.getElementById('profit-loss').textContent = profitLoss > 0 ? `+${profitLoss}` : profitLoss;
        
        // 特殊プレイの更新
        document.getElementById('free-doubles').textContent = this.stats.freeDoubles;
        document.getElementById('free-splits').textContent = this.stats.freeSplits;
        document.getElementById('dealer-22s').textContent = this.stats.dealer22s;
        document.getElementById('blackjacks').textContent = this.stats.blackjacks;
    }

    /**
     * 残高推移グラフを更新
     */
    updateChart() {
        // Chart.jsが読み込まれているか確認
        if (typeof Chart === 'undefined') {
            console.error('Chart.jsが読み込まれていません。グラフは表示されません。');
            return;
        }
        
        const balanceChart = document.getElementById('balance-chart');
        if (!balanceChart) {
            console.error('グラフ要素が見つかりません。');
            return;
        }
        
        const ctx = balanceChart.getContext('2d');
        if (!ctx) {
            console.error('Canvasコンテキストを取得できません。');
            return;
        }
        
        // 既存のチャートがあれば破棄
        if (this.chart) {
            this.chart.destroy();
        }
        
        // ラベルの作成（ハンド数）
        const labels = Array.from({ length: this.stats.balanceHistory.length }, (_, i) => i);
        
        // チャートの作成
        try {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '残高推移',
                        data: this.stats.balanceHistory,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: '残高'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'ハンド数'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: function(tooltipItems) {
                                    return `ハンド: ${tooltipItems[0].label}`;
                                },
                                label: function(context) {
                                    return `残高: ${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('チャートの作成中にエラーが発生しました:', error);
        }
    }

    /**
     * IndexedDBを初期化
     * @returns {Promise} データベースの初期化が完了したら解決されるPromise
     */
    initDatabase() {
        // 既に初期化されている場合は即座に解決されるPromiseを返す
        if (this.db) {
            return Promise.resolve(this.db);
        }
        
        // 初期化中の場合は既存の初期化Promiseを返す
        if (this.dbInitPromise) {
            return this.dbInitPromise;
        }
        
        // 新しく初期化する場合
        this.dbInitPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open('FreeBetBlackjackDB', 1);
            
            request.onerror = (event) => {
                console.error('データベースのオープンに失敗しました:', event.target.error);
                this.dbInitPromise = null;
                reject(event.target.error);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // オブジェクトストアが存在しない場合は作成
                if (!db.objectStoreNames.contains('stats')) {
                    db.createObjectStore('stats', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
        });
        
        return this.dbInitPromise;
    }

    /**
     * IndexedDBに統計情報を保存
     * @returns {Promise} 保存が完了したら解決されるPromise
     */
    saveStats() {
        // データベースが初期化されていない場合は初期化する
        return this.initDatabase().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['stats'], 'readwrite');
                const store = transaction.objectStore('stats');
                
                const statsData = {
                    id: 'gameStats',
                    stats: this.stats
                };
                
                const request = store.put(statsData);
                
                request.onerror = (event) => {
                    console.error('統計情報の保存に失敗しました:', event.target.error);
                    reject(event.target.error);
                };
                
                request.onsuccess = () => {
                    // バックアップとしてlocalStorageにも保存
                    localStorage.setItem('freeBetBlackjackStats', JSON.stringify(this.stats));
                    resolve();
                };
            });
        }).catch(error => {
            console.error('統計情報の保存に失敗しました:', error);
            // バックアップとしてlocalStorageには保存する
            localStorage.setItem('freeBetBlackjackStats', JSON.stringify(this.stats));
            return Promise.reject(error);
        });
    }
    
    /**
     * 統計情報をロード
     * @returns {Promise} ロードが完了したら解決されるPromise
     */
    loadStats() {
        // データベースが初期化されていない場合は初期化する
        return this.initDatabase().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['stats'], 'readonly');
                const objectStore = transaction.objectStore('stats');
                const request = objectStore.get('gameStats');
                
                request.onerror = (event) => {
                    console.error('統計情報の取得に失敗しました:', event.target.error);
                    reject(event.target.error);
                };
                
                request.onsuccess = (event) => {
                    const result = event.target.result;
                    if (result && result.stats) {
                        this.stats = result.stats;
                        this.updateUI();
                        this.updateChart();
                        resolve(this.stats);
                    } else {
                        // データが存在しない場合はファイルからロードを試みる
                        reject(new Error('No data in IndexedDB'));
                    }
                };
            });
        });
    }
    
    /**
     * ローカルストレージから統計情報を読み込み（バックアップ）
     * @returns {boolean} 読み込みに成功したかどうか
     */
    loadStatsFromLocalStorage() {
        const savedStats = localStorage.getItem('freeBetBlackjackStats');
        if (savedStats) {
            try {
                this.stats = JSON.parse(savedStats);
                this.updateUI();
                this.updateChart();
                return true;
            } catch (error) {
                console.error('ローカルストレージからのデータの解析に失敗しました:', error);
                return false;
            }
        }
        return false;
    }
    
    /**
     * 統計情報をファイルに保存
     */
    saveStatsToFile() {
        const statsJson = JSON.stringify(this.stats, null, 2);
        const blob = new Blob([statsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // ダウンロードリンクを作成してクリック
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'blackjack_stats.json';
        document.body.appendChild(a);
        a.click();
        
        // リソースの解放
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    /**
     * 統計情報をファイルからロード
     * @returns {Promise} ロードが完了したら解決されるPromise
     */
    loadStatsFromFile() {
        return new Promise((resolve, reject) => {
            // ファイル入力要素を作成
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) {
                    document.body.removeChild(fileInput);
                    reject(new Error('No file selected'));
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.stats = data;
                        this.updateUI();
                        this.updateChart();
                        this.saveStats(); // IndexedDBにも保存
                        document.body.removeChild(fileInput);
                        resolve(this.stats);
                    } catch (error) {
                        console.error('ファイルの解析に失敗しました:', error);
                        document.body.removeChild(fileInput);
                        reject(error);
                    }
                };
                
                reader.onerror = (error) => {
                    console.error('ファイルの読み込みに失敗しました:', error);
                    document.body.removeChild(fileInput);
                    reject(error);
                };
                
                reader.readAsText(file);
            };
            
            fileInput.click();
        });
    }
    
    /**
     * 統計情報をエクスポート
     */
    exportStats() {
        this.saveStatsToFile();
    }
    
    /**
     * 統計情報をインポート
     */
    importStats() {
        this.loadStatsFromFile()
            .then(() => {
                alert('統計情報のインポートに成功しました。');
            })
            .catch(error => {
                alert(`統計情報のインポートに失敗しました: ${error.message}`);
            });
    }
    
    /**
     * 統計情報をリセットし、データベースも消去
     * @param {number} currentBalance 現在の残高
     */
    resetStats(currentBalance) {
        this.stats = {
            totalHands: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            freeDoubles: 0,
            freeSplits: 0,
            freeSplitBothWins: 0,
            dealer22s: 0,
            blackjacks: 0,
            balanceHistory: [currentBalance]
        };
        
        // データベースから統計情報を削除
        if (this.db) {
            const transaction = this.db.transaction(['stats'], 'readwrite');
            const store = transaction.objectStore('stats');
            const request = store.delete('gameStats');
            
            request.onerror = (event) => {
                console.error('統計情報の削除に失敗しました:', event.target.error);
            };
        }
        
        // ローカルストレージからも削除
        localStorage.removeItem('freeBetBlackjackStats');
        
        this.updateUI();
        this.updateChart();
    }
}
