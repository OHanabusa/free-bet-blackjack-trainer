/**
 * メインアプリケーションの初期化
 */
document.addEventListener('DOMContentLoaded', () => {
    // Chart.jsが読み込まれているか確認
    if (typeof Chart === 'undefined') {
        console.error('Chart.jsが読み込まれていません。');
        // Chart.jsを動的に読み込む
        const chartScript = document.createElement('script');
        chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(chartScript);
        
        // Chart.jsの読み込み完了後に初期化を行う
        chartScript.onload = initializeApp;
    } else {
        initializeApp();
    }
});

/**
 * アプリケーションの初期化
 */
function initializeApp() {
    // ゲームインスタンスの作成
    const game = new Game();
    
    // カードカウンティングインスタンスの作成
    const cardCounting = new CardCounting();
    
    // 統計インスタンスの作成
    const gameStats = new GameStats();
    
    // UIインスタンスの作成
    const gameUI = new GameUI(game, cardCounting, gameStats);
    
    // 保存された統計情報の読み込み
    // IndexedDBを使用した非同期読み込み
    gameStats.loadStats()
        .then(stats => {
            console.log('統計情報をデータベースから読み込みました');
        })
        .catch(error => {
            console.log('統計情報が見つからないか、読み込みに失敗しました:', error.message);
            // デフォルトの統計情報を使用するので何もしない
        });
    
    // 自動保存の設定（30秒ごと）
    setInterval(() => {
        gameStats.saveStats();
    }, 30000);
    
    // ページを離れる前に統計情報を保存
    window.addEventListener('beforeunload', () => {
        gameStats.saveStats();
    });
    
    // キーボードショートカットの設定
    document.addEventListener('keydown', (event) => {
        // プレイヤーのターン中のみキーボードショートカットを有効化
        if (game.gameState !== 'playerTurn') return;
        
        switch (event.key.toLowerCase()) {
            case 'h': // ヒット
                gameUI.hit();
                break;
            case 's': // スタンド
                gameUI.stand();
                break;
            case 'd': // ダブル
                gameUI.double();
                break;
            case 'p': // スプリット
                gameUI.split();
                break;
        }
    });
    
    // ゲーム終了時のキーボードショートカット
    document.addEventListener('keydown', (event) => {
        if (game.gameState === 'gameOver' || game.gameState === 'betting') {
            if (event.key === ' ' || event.key === 'Enter') {
                // スペースキーまたはEnterキーで次のゲームを開始
                gameUI.dealCards();
            }
        }
    });
    
    // ベット入力フィールドのEnterキー処理
    document.getElementById('bet').addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && (game.gameState === 'gameOver' || game.gameState === 'betting')) {
            gameUI.dealCards();
        }
    });
    
    // カウンティング練習モードの設定
    const countingPracticeBtn = document.createElement('button');
    countingPracticeBtn.textContent = 'カウンティング練習';
    countingPracticeBtn.id = 'countingPracticeBtn';
    countingPracticeBtn.style.marginLeft = '10px';
    document.querySelector('.nav-buttons').appendChild(countingPracticeBtn);
    
    let countingPracticeMode = false;
    
    countingPracticeBtn.addEventListener('click', () => {
        countingPracticeMode = !countingPracticeMode;
        
        if (countingPracticeMode) {
            countingPracticeBtn.textContent = '通常モードに戻る';
            startCountingPractice();
        } else {
            countingPracticeBtn.textContent = 'カウンティング練習';
            stopCountingPractice();
        }
    });
    
    let practiceInterval;
    let practiceCards = [];
    let currentCardIndex = 0;
    
    /**
     * カウンティング練習モードを開始
     */
    function startCountingPractice() {
        // ゲーム画面を隠す
        document.querySelector('.game-container').style.display = 'none';
        
        // 練習モード用のUIを作成
        const practiceContainer = document.createElement('div');
        practiceContainer.id = 'practice-container';
        practiceContainer.className = 'practice-container';
        practiceContainer.innerHTML = `
            <h2>カウンティング練習モード</h2>
            <div class="practice-card-container">
                <div id="practice-card" class="card"></div>
            </div>
            <div class="practice-info">
                <div class="practice-count">
                    <span>現在のランニングカウント:</span>
                    <input type="number" id="practice-running-count" value="0">
                </div>
                <button id="check-count-btn">カウントをチェック</button>
                <div id="practice-result" class="practice-result"></div>
            </div>
            <div class="practice-controls">
                <button id="start-practice-btn">開始</button>
                <button id="pause-practice-btn">一時停止</button>
                <select id="practice-speed">
                    <option value="2000">遅い (2秒)</option>
                    <option value="1000" selected>普通 (1秒)</option>
                    <option value="500">速い (0.5秒)</option>
                    <option value="250">超速い (0.25秒)</option>
                </select>
            </div>
        `;
        
        document.querySelector('main').appendChild(practiceContainer);
        
        // 練習モードのイベントリスナーを設定
        document.getElementById('start-practice-btn').addEventListener('click', () => {
            startPracticeCards();
        });
        
        document.getElementById('pause-practice-btn').addEventListener('click', () => {
            pausePracticeCards();
        });
        
        document.getElementById('check-count-btn').addEventListener('click', () => {
            checkCount();
        });
    }
    
    /**
     * カウンティング練習モードを停止
     */
    function stopCountingPractice() {
        // 練習モードのUIを削除
        const practiceContainer = document.getElementById('practice-container');
        if (practiceContainer) {
            practiceContainer.remove();
        }
        
        // ゲーム画面を表示
        document.querySelector('.game-container').style.display = 'block';
        
        // タイマーをクリア
        clearInterval(practiceInterval);
    }
    
    /**
     * 練習用カードの表示を開始
     */
    function startPracticeCards() {
        // 既存のタイマーをクリア
        clearInterval(practiceInterval);
        
        // 新しいデッキを作成
        const deck = new Deck(1);
        practiceCards = [...deck.cards];
        currentCardIndex = 0;
        
        // カウントをリセット
        document.getElementById('practice-running-count').value = 0;
        document.getElementById('practice-result').textContent = '';
        
        // 最初のカードを表示
        showNextPracticeCard();
        
        // 選択されたスピードでカードを表示
        const speed = parseInt(document.getElementById('practice-speed').value);
        practiceInterval = setInterval(() => {
            showNextPracticeCard();
        }, speed);
    }
    
    /**
     * 練習用カードの表示を一時停止
     */
    function pausePracticeCards() {
        clearInterval(practiceInterval);
    }
    
    /**
     * 次の練習用カードを表示
     */
    function showNextPracticeCard() {
        if (currentCardIndex >= practiceCards.length) {
            // すべてのカードを表示し終えた場合
            pausePracticeCards();
            document.getElementById('practice-card').innerHTML = 'デッキ終了';
            return;
        }
        
        const card = practiceCards[currentCardIndex];
        const practiceCardElement = document.getElementById('practice-card');
        
        // カード要素を作成
        practiceCardElement.innerHTML = '';
        practiceCardElement.className = 'card';
        
        const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
        practiceCardElement.classList.add(isRed ? 'red' : 'black');
        
        // カードの値と絵柄
        const valueTop = document.createElement('div');
        valueTop.className = 'card-value card-value-top';
        valueTop.textContent = card.value;
        
        const valueBottom = document.createElement('div');
        valueBottom.className = 'card-value card-value-bottom';
        valueBottom.textContent = card.value;
        
        const suitCenter = document.createElement('div');
        suitCenter.className = 'card-suit card-suit-center';
        
        // 絵柄の設定
        if (card.suit === 'hearts') {
            suitCenter.innerHTML = '♥';
        } else if (card.suit === 'diamonds') {
            suitCenter.innerHTML = '♦';
        } else if (card.suit === 'clubs') {
            suitCenter.innerHTML = '♣';
        } else if (card.suit === 'spades') {
            suitCenter.innerHTML = '♠';
        }
        
        practiceCardElement.appendChild(valueTop);
        practiceCardElement.appendChild(suitCenter);
        practiceCardElement.appendChild(valueBottom);
        
        currentCardIndex++;
    }
    
    /**
     * 現在のカウントをチェック
     */
    function checkCount() {
        // 正しいカウントを計算
        let correctCount = 0;
        for (let i = 0; i < currentCardIndex; i++) {
            const card = practiceCards[i];
            if (['2', '3', '4', '5', '6'].includes(card.value)) {
                correctCount++;
            } else if (['10', 'J', 'Q', 'K', 'A'].includes(card.value)) {
                correctCount--;
            }
        }
        
        // ユーザーのカウントを取得
        const userCount = parseInt(document.getElementById('practice-running-count').value);
        
        // 結果を表示
        const resultElement = document.getElementById('practice-result');
        if (userCount === correctCount) {
            resultElement.textContent = '正解！正しいカウントは ' + correctCount + ' です。';
            resultElement.style.color = '#2ecc71';
        } else {
            resultElement.textContent = '不正解。正しいカウントは ' + correctCount + ' です。';
            resultElement.style.color = '#e74c3c';
        }
    }
    
    // ウェルカムメッセージ
    gameUI.showMessage('Free Bet ブラックジャック学習アプリへようこそ！「配る」ボタンをクリックしてゲームを開始してください。');
}
