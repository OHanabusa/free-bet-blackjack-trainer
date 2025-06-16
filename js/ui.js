/**
 * ユーザーインターフェースを管理するクラス
 */
class GameUI {
    constructor(game, cardCounting, gameStats) {
        this.game = game;
        this.cardCounting = cardCounting;
        this.gameStats = gameStats;
        this.trainingMode = false; // トレーニングモードのフラグ
        this.isSplitting = false; // スプリット処理中かどうかのフラグ
        this.initUI();
    }

    /**
     * UIの初期化
     */
    initUI() {
        // ボタン要素の取得
        this.dealBtn = document.getElementById('dealBtn');
        this.hitBtn = document.getElementById('hitBtn');
        this.standBtn = document.getElementById('standBtn');
        this.doubleBtn = document.getElementById('doubleBtn');
        this.splitBtn = document.getElementById('splitBtn');
        
        // 情報表示要素の取得
        this.dealerCountElement = document.getElementById('dealer-count');
        this.playerCountElement = document.getElementById('player-count');
        this.dealerCardsElement = document.getElementById('dealer-cards');
        this.playerCardsElement = document.getElementById('player-cards');
        this.playerHandsContainer = document.getElementById('player-hands-container');
        this.messageElement = document.getElementById('message');
        this.balanceElement = document.getElementById('balance');
        this.betInput = document.getElementById('bet');
        this.remainingCardsElement = document.getElementById('remaining-cards');
        this.runningCountElement = document.getElementById('running-count');
        this.trueCountElement = document.getElementById('true-count');
        this.actionFeedbackElement = document.getElementById('action-feedback');
        
        // 賭け金調整ボタン
        this.doubleBetBtn = document.getElementById('doubleBetBtn');
        this.halveBetBtn = document.getElementById('halveBetBtn');
        
        // ナビゲーションボタンの取得
        this.rulesBtn = document.getElementById('rulesBtn');
        this.strategyBtn = document.getElementById('strategyBtn');
        this.countingBtn = document.getElementById('countingBtn');
        this.statsBtn = document.getElementById('statsBtn');
        
        // モーダル要素の取得
        this.rulesModal = document.getElementById('rulesModal');
        this.strategyModal = document.getElementById('strategyModal');
        this.countingModal = document.getElementById('countingModal');
        this.statsModal = document.getElementById('statsModal');
        this.explanationModal = document.getElementById('explanationModal');
        
        // 解説ポップアップの要素取得
        this.explanationSituationText = document.getElementById('explanation-situation-text');
        this.explanationRecommendedAction = document.getElementById('explanation-recommended-action');
        this.explanationYourAction = document.getElementById('explanation-your-action');
        this.explanationText = document.getElementById('explanation-text');
        this.explanationContinueBtn = document.getElementById('explanation-continue-btn');
        this.explanationRecommendedBtn = document.getElementById('explanation-recommended-btn');
        
        // 閉じるボタンの取得
        const closeButtons = document.querySelectorAll('.close');
        
        // ボタンのイベントリスナーを設定
        this.dealBtn.addEventListener('click', () => this.dealCards());
        this.hitBtn.addEventListener('click', () => this.hit());
        this.standBtn.addEventListener('click', () => this.stand());
        this.doubleBtn.addEventListener('click', () => this.double());
        this.splitBtn.addEventListener('click', () => this.split());
        
        // 賞け金調整ボタンのイベントリスナー
        this.doubleBetBtn.addEventListener('click', () => this.doubleBet());
        this.halveBetBtn.addEventListener('click', () => this.halveBet());
        
        // ナビゲーションボタンのイベントリスナーを設定
        this.rulesBtn.addEventListener('click', () => this.openModal(this.rulesModal));
        this.strategyBtn.addEventListener('click', () => this.openModal(this.strategyModal));
        this.countingBtn.addEventListener('click', () => this.openModal(this.countingModal));
        this.statsBtn.addEventListener('click', () => this.openModal(this.statsModal));
        
        // 解説ポップアップのボタンのイベントリスナー
        this.explanationContinueBtn.addEventListener('click', () => {
            this.closeAllModals();
        });
        
        // 推奨アクションを選ぶボタンのイベントリスナー
        this.explanationRecommendedBtn.addEventListener('click', () => {
            this.closeAllModals();
            
            // 保存された推奨アクションに基づいて処理を実行
            if (this.currentRecommendedAction) {
                switch (this.currentRecommendedAction) {
                    case 'H':
                        this.game.hit();
                        break;
                    case 'S':
                        this.game.stand();
                        break;
                    case 'D':
                        this.game.double();
                        break;
                    case 'P':
                        this.game.split();
                        break;
                }
                
                // UIを更新
                this.updateUI();
            }
        });
        
        // 閉じるボタンのイベントリスナーを設定
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeAllModals());
        });
        
        // トレーニングモード切り替えボタンを追加
        const trainingModeBtn = document.createElement('button');
        trainingModeBtn.textContent = 'トレーニングモード';
        trainingModeBtn.id = 'trainingModeBtn';
        trainingModeBtn.style.marginLeft = '10px';
        document.querySelector('.nav-buttons').appendChild(trainingModeBtn);
        
        trainingModeBtn.addEventListener('click', () => {
            this.trainingMode = !this.trainingMode;
            trainingModeBtn.textContent = this.trainingMode ? '通常モードに戻る' : 'トレーニングモード';
            this.showMessage(this.trainingMode ? 
                'トレーニングモードが有効になりました。間違った選択をすると解説が表示されます。' : 
                '通常モードに戻りました。');
        });
        
        // 戦略テーブルの生成
        this.initStrategyTables();
        
        // 統計リセットボタンのイベントリスナーを設定
        document.getElementById('resetStatsBtn').addEventListener('click', () => {
            if (confirm('統計情報をリセットしますか？')) {
                this.game.resetStats();
                this.gameStats.resetStats(this.game.balance);
            }
        });
        
        // モーダル外クリックで閉じる
        window.addEventListener('click', (event) => {
            if (event.target === this.rulesModal) this.closeAllModals();
            if (event.target === this.strategyModal) this.closeAllModals();
            if (event.target === this.countingModal) this.closeAllModals();
            if (event.target === this.statsModal) this.closeAllModals();
        });
        
        // キーボードイベントリスナーの設定
        document.addEventListener('keydown', (event) => {
            // モーダルが開いている場合はキー操作を無視
            if (this.isAnyModalOpen()) {
                return;
            }
            
            // ゲーム状態に応じたキー操作
            if (this.game.gameState === 'betting') {
                // 賞け金調整
                if (event.key.toLowerCase() === 'x') {
                    // Xキーで賞け金2倍
                    this.doubleBet();
                    event.preventDefault();
                } else if (event.key.toLowerCase() === 'z') {
                    // Zキーで賞け金半分
                    this.halveBet();
                    event.preventDefault();
                } else if (event.key === 'ArrowRight') {
                    // 10単位で賭け金を増やす
                    const currentBet = parseInt(this.betInput.value) || 10;
                    this.betInput.value = Math.min(currentBet * 2, this.game.balance);
                    event.preventDefault();
                } else if (event.key === 'ArrowLeft') {
                    // 10単位で賭け金を減らす
                    const currentBet = parseInt(this.betInput.value) || 10;
                    this.betInput.value = Math.max(currentBet / 2, 10);
                    event.preventDefault();
                } else if (event.key === 'Enter' || event.key.toLowerCase() === 'y') {
                    // Enterキーでディール開始
                    this.dealCards();
                    event.preventDefault();
                }
            } else if (this.game.gameState === 'playerTurn') {
                // プレイヤーのターン中のキー操作
                const currentHand = this.game.playerHands[this.game.currentHandIndex];
                
                switch (event.key.toLowerCase()) {
                    case 'u': // ヒット
                        this.hit();
                        event.preventDefault();
                        break;
                    case 'i': // スタンド
                        this.stand();
                        event.preventDefault();
                        break;
                    case 'o': // ダブル
                        if (currentHand.canDouble()) {
                            this.double();
                            event.preventDefault();
                        }
                        break;
                    case 'p': // スプリット
                        if (currentHand.canSplit()) {
                            this.split();
                            event.preventDefault();
                        }
                        break;
                }
            } else if (this.game.gameState === 'gameOver') {

                // ゲーム終了時のキー操作
                if (event.key === 'Enter' || event.key.toLowerCase() === 'y') {
                    // Enterキーで次のゲームを開始
                    this.resetTable();
                    event.preventDefault();
                }
            }
            // 解説ポップアップは外クリックで閉じない
        });
        
        // 初期状態の設定
        this.updateUI();
    }

    /**
     * 戦略テーブルの初期化
     */
    initStrategyTables() {
        const strategy = new Strategy();
        // フリーベットでの戦略テーブル
        document.getElementById('free-bet-strategy').innerHTML = strategy.generateStrategyTable('freeBet');
        
        // ソフトハンドの戦略テーブル
        document.getElementById('soft-strategy').innerHTML = strategy.generateStrategyTable('soft');
        
        // ペアの戦略テーブル
        document.getElementById('pairs-strategy').innerHTML = strategy.generateStrategyTable('pairs');
        
        // 実際の賭け金での戦略テーブル
        document.getElementById('real-money-strategy').innerHTML = strategy.generateStrategyTable('realMoney');
    }

    /**
     * モーダルを開く
     * @param {HTMLElement} modal 開くモーダル要素
     */
    openModal(modal) {
        this.closeAllModals();
        modal.style.display = 'block';
    }

    /**
     * 全てのモーダルを閉じる
     */
    closeAllModals() {
        this.rulesModal.style.display = 'none';
        this.strategyModal.style.display = 'none';
        this.countingModal.style.display = 'none';
        this.statsModal.style.display = 'none';
        this.explanationModal.style.display = 'none';
    }
    
    /**
     * いずれかのモーダルが開いているか確認
     * @returns {boolean} モーダルが開いていればtrue
     */
    isAnyModalOpen() {
        return this.rulesModal.style.display === 'block' ||
               this.strategyModal.style.display === 'block' ||
               this.countingModal.style.display === 'block' ||
               this.statsModal.style.display === 'block' ||
               this.explanationModal.style.display === 'block';
    }
    
    /**
     * 基本戦略の解説ポップアップを表示
     * @param {string} yourAction ユーザーの選択したアクション
     * @param {string} recommendedAction 推奨アクション
     */
    showExplanation(yourAction, recommendedAction) {
        // 推奨アクションと現在のアクションを保存
        this.currentYourAction = yourAction;
        this.currentRecommendedAction = recommendedAction;
        if (!this.trainingMode) return; // トレーニングモードが無効なら何もしない
        
        const currentHand = this.game.playerHands[this.game.currentHandIndex];
        const dealerUpCard = this.game.dealerHand.cards[0];
        
        // 状況のテキストを生成
        let situationText = '';
        
        if (currentHand.isPair()) {
            situationText = `ペア: ${currentHand.cards[0].value} vs ディーラー: ${dealerUpCard.value}`;
        } else if (currentHand.isSoft()) {
            situationText = `ソフトハンド: ${currentHand.getTotal()} vs ディーラー: ${dealerUpCard.value}`;
        } else {
            situationText = `ハードハンド: ${currentHand.getTotal()} vs ディーラー: ${dealerUpCard.value}`;
        }
        
        // アクションのテキスト変換
        const actionText = {
            'H': 'ヒット',
            'S': 'スタンド',
            'D': 'ダブル',
            'P': 'スプリット'
        };
        
        // 解説テキストを生成
        let explanationText = '';
        
        if (currentHand.isPair()) {
            if (recommendedAction === 'P') {
                explanationText = `ペアの${currentHand.cards[0].value}はスプリットするべきです。スプリットすることで、ディーラーに対してより有利な状況を作り出せます。`;
                
                if (currentHand.isFreeSplitEligible()) {
                    explanationText += ` さらに、これはフリースプリットの対象であり、追加の費用なしでスプリットできます。`;
                }
            } else if (recommendedAction === 'H') {
                explanationText = `ペアの${currentHand.cards[0].value}はスプリットするよりもヒットした方が期待値が高くなります。`;
            } else if (recommendedAction === 'S') {
                explanationText = `ペアの${currentHand.cards[0].value}はスプリットするよりもスタンドした方が期待値が高くなります。`;
            } else if (recommendedAction === 'D') {
                explanationText = `ペアの${currentHand.cards[0].value}はスプリットするよりもダブルダウンした方が期待値が高くなります。`;
                
                if (currentHand.isFreeDoubleEligible()) {
                    explanationText += ` さらに、これはフリーダブルの対象であり、追加の費用なしでダブルダウンできます。`;
                }
            }
        } else if (currentHand.isSoft()) {
            if (recommendedAction === 'H') {
                explanationText = `ソフト${currentHand.getTotal()}はヒットするべきです。エースがあるのでバストの心配なくカードを引けます。`;
            } else if (recommendedAction === 'S') {
                explanationText = `ソフト${currentHand.getTotal()}はスタンドするべきです。この手札は十分強く、ヒットすることで手札を改善する可能性は低いです。`;
            } else if (recommendedAction === 'D') {
                explanationText = `ソフト${currentHand.getTotal()}はダブルダウンするべきです。エースがあるのでバストの心配なく費用を倍にしてカードを引けます。`;
                
                if (currentHand.isFreeDoubleEligible()) {
                    explanationText += ` さらに、これはフリーダブルの対象であり、追加の費用なしでダブルダウンできます。`;
                }
            }
        } else {
            // ハードハンド
            if (recommendedAction === 'H') {
                explanationText = `ハード${currentHand.getTotal()}はヒットするべきです。現在の手札ではディーラーに負ける可能性が高いため、リスクを取っても手札を改善する必要があります。`;
            } else if (recommendedAction === 'S') {
                explanationText = `ハード${currentHand.getTotal()}はスタンドするべきです。ヒットするとバストの可能性が高くなります。`;
            } else if (recommendedAction === 'D') {
                explanationText = `ハード${currentHand.getTotal()}はダブルダウンするべきです。この手札はディーラーに対して有利な状況であり、費用を倍にしてカードを引く価値があります。`;
                
                if (currentHand.isFreeDoubleEligible()) {
                    explanationText += ` さらに、これはフリーダブルの対象であり、追加の費用なしでダブルダウンできます。`;
                }
            }
        }
        
        // Free Bet ブラックジャックの特徴についての追加解説
        explanationText += `\n\nFree Bet ブラックジャックでは、ディーラーが22でバストした場合はプッシュ（引き分け）となるため、通常のブラックジャックよりもより積極的な戦略が有効です。`;
        
        // 解説ポップアップの要素を更新
        this.explanationSituationText.textContent = situationText;
        this.explanationRecommendedAction.textContent = actionText[recommendedAction] || recommendedAction;
        this.explanationYourAction.textContent = actionText[yourAction] || yourAction;
        this.explanationText.textContent = explanationText;
        
        // ポップアップを表示
        this.explanationModal.style.display = 'block';
    }

    /**
     * カードを配る
     */
    dealCards() {
        const bet = parseInt(this.betInput.value);
        
        // ベット額のバリデーション
        if (isNaN(bet) || bet < 5) {
            this.showMessage('最小ベット額は5です。');
            return;
        }
        
        if (bet > this.game.balance) {
            this.showMessage('残高が不足しています。');
            return;
        }
        
        // ゲームの初期化
        this.game.initGame(bet);
        
        // GameStatsから統計情報をゲームに設定
        // これにより、ゲーム開始時に統計情報がリセットされない
        this.game.setStats(this.gameStats.stats);
        
        // ベット額を差し引く
        this.game.balance -= bet;
        
        // ゲーム開始
        this.game.startGame();
        
        // カードカウンティングの処理
        // シャッフル時はカウンティングをリセット
        // 残りデッキ数が3未満になったらカウンティングをリセット
        if (this.game.deck.getRemainingCards() < 52 * 3) {
            this.cardCounting.reset();
            // カウンティング表示もリセット
            this.runningCountElement.textContent = 0;
            this.trueCountElement.textContent = 0;
        }
        
        // UI更新
        this.updateUI();
    }

    /**
     * ヒットする
     */
    hit() {
        // 推奨アクションを取得
        const recommendedAction = this.game.getRecommendedAction();
        
        // アクションの正誤を表示
        this.showActionFeedback('H', recommendedAction);
        
        // 推奨アクションと異なる場合、解説ポップアップを表示して処理を中断
        if (this.trainingMode && recommendedAction !== 'H') {
            this.showExplanation('H', recommendedAction);
            // ユーザーの選択を待つため、ここで処理を中断
            return;
        }
        
        // 推奨アクションと同じか、トレーニングモードでない場合はそのまま実行
        this.game.hit();
        
        // カードカウンティングはゲーム終了時にまとめて行う
        
        this.updateUI();
    }

    /**
     * スタンドする
     */
    stand() {
        // 推奨アクションを取得
        const recommendedAction = this.game.getRecommendedAction();
        
        // アクションの正誤を表示
        this.showActionFeedback('S', recommendedAction);
        
        // 推奨アクションと異なる場合、解説ポップアップを表示して処理を中断
        if (this.trainingMode && recommendedAction !== 'S') {
            this.showExplanation('S', recommendedAction);
            // ユーザーの選択を待つため、ここで処理を中断
            return;
        }
        
        // 推奨アクションと同じか、トレーニングモードでない場合はそのまま実行
        this.game.stand();
        
        // カードカウンティングはゲーム終了時にまとめて行う
        
        this.updateUI();
    }
    
    /**
     * ダブルダウンする
     */
    double() {
        // 推奨アクションを取得
        const recommendedAction = this.game.getRecommendedAction();
        
        // アクションの正誤を表示
        this.showActionFeedback('D', recommendedAction);
        
        // 推奨アクションと異なる場合、解説ポップアップを表示して処理を中断
        if (this.trainingMode && recommendedAction !== 'D') {
            this.showExplanation('D', recommendedAction);
            // ユーザーの選択を待つため、ここで処理を中断
            return;
        }
        
        const currentHand = this.game.playerHands[this.game.currentHandIndex];
        
        if (currentHand.isFreeDoubleEligible()) {
            // フリーダブルの場合
            this.game.double(true);
            this.showMessage('フリーダブル！追加の購け金なしでダブルダウンしました。');
        } else {
            // 通常のダブルダウン
            if (this.game.balance < currentHand.bet) {
                this.showMessage('残高が不足しています。');
                return;
            }
            
            this.game.double(false);
        }
        
        // カードカウンティングはゲーム終了時にまとめて行う
        
        this.updateUI();
    }
    
    /**
     * スプリットする
     */
    split() {
        // スプリット処理が連続して実行されないようにロックする
        if (this.isSplitting) {
            return;
        }
        
        // スプリット処理中フラグをセット
        this.isSplitting = true;
        
        // 推奨アクションを取得
        const recommendedAction = this.game.getRecommendedAction();
        
        // アクションの正誤を表示
        this.showActionFeedback('P', recommendedAction);
        
        // 推奨アクションと異なる場合、解説ポップアップを表示して処理を中断
        if (this.trainingMode && recommendedAction !== 'P') {
            this.showExplanation('P', recommendedAction);
            // ユーザーの選択を待つため、ここで処理を中断
            this.isSplitting = false;
            return;
        }
        
        const currentHand = this.game.playerHands[this.game.currentHandIndex];
        
        if (currentHand.isFreeSplitEligible()) {
            // フリースプリットの場合
            this.game.split(true);
            this.showMessage('フリースプリット！追加の賞け金なしでスプリットしました。');
        } else {
            // 通常のスプリット
            if (this.game.balance < currentHand.bet) {
                this.showMessage('残高が不足しています。');
                this.isSplitting = false;
                return;
            }
            
            this.game.split(false);
        }
        
        // カードカウンティングはゲーム終了時にまとめて行う
        
        this.updateUI();
        
        // スプリット処理完了後、ロックを解除
        setTimeout(() => {
            this.isSplitting = false;
        }, 500);
    }

    /**
     * UIを更新
     */
    updateUI() {
        // ゲーム状態に応じたボタンの有効/無効化
        this.updateButtons();
        
        // プレイヤーのターンが終了し、ディーラーのターンに移行した場合
        if (this.game.gameState === 'dealerTurn') {
            // ディーラーのカードをアニメーション付きで表示
            this.animateDealerCards();
            return; // アニメーション中は他の更新を行わない
        }
        
        // ゲーム終了時の処理
        if (this.game.gameState === 'gameOver') {
            // カードカウンティングをまとめて行う
            this.updateAllCardCounting();
            
            // ゲームの統計情報をGameStatsに保存
            this.gameStats.updateStats(this.game.stats);
            
            // 統計情報をデータベースに保存
            this.gameStats.saveStats();
        }
        
        // カード表示の更新
        this.updateCardDisplay();
        
        // 情報表示の更新
        this.updateInfoDisplay();
        
        // 推奨アクションの表示
        this.showRecommendedAction();
    }
    
    /**
     * 賞け金を2倍にする
     */
    doubleBet() {
        if (this.game.gameState !== 'betting') return;
        
        const currentBet = parseInt(this.betInput.value) || 10;
        const newBet = Math.min(currentBet * 2, this.game.balance);
        this.betInput.value = newBet;
    }
    
    /**
     * 賞け金を半分にする
     */
    halveBet() {
        if (this.game.gameState !== 'betting') return;
        
        const currentBet = parseInt(this.betInput.value) || 10;
        const newBet = Math.max(Math.floor(currentBet / 2), 10);
        this.betInput.value = newBet;
    }
    
    /**
     * ディーラーのカードをアニメーション付きで表示
     */
    animateDealerCards() {
        // まずディーラーの裏向きカードを表向きにする
        this.game.gameState = 'dealerTurn';
        
        // ディーラーが引く必要があるカードを事前に計算
        const cardsToDrawCount = this.calculateDealerCardsToDrawCount();
        
        // ディーラーの裏向きカードを表にする
        this.game.dealerHand.cards.forEach(card => {
            if (!card.isFaceUp) {
                card.isFaceUp = true;
            }
        });
        
        // カード表示を更新
        this.updateCardDisplay();
        
        // プレイヤーが全てバストしているか確認
        const allHandsBusted = this.game.playerHands.every(hand => hand.isBusted);
        
        // ディーラーが引く必要がない場合
        if (allHandsBusted || this.game.dealerHand.getTotal() >= 17) {
            // 結果評価へ
            this.game.evaluateGame();
            this.updateUI();
            return;
        }
        
        // カードを引くタイミングを管理する配列
        let dealerDrawTimings = [];
        
        // 各カードのタイミングを設定（1秒間隔）
        for (let i = 0; i < cardsToDrawCount; i++) {
            dealerDrawTimings.push(1000 * (i + 1)); // 1秒、2秒、3秒...
        }
        
        // 各タイミングでカードを引く
        dealerDrawTimings.forEach((timing, index) => {
            setTimeout(() => {
                // ディーラーに新しいカードを1枚追加
                const card = this.game.dealerDrawCard();
                
                // カード表示を更新
                this.updateCardDisplay();
                
                // ディーラーの現在の合計を表示
                this.dealerCountElement.textContent = this.game.dealerHand.getTotal();
                
                // 最後のカードの場合は結果評価へ
                if (index === dealerDrawTimings.length - 1) {
                    setTimeout(() => {
                        this.game.evaluateGame();
                        this.updateUI();
                    }, 500); // 最後のカードが表示されてから少し間を置いて結果表示
                }
            }, timing);
        });
    }
    
    /**
     * ディーラーが引く必要があるカードの枚数を計算
     * @returns {number} 引く必要があるカードの枚数
     */
    calculateDealerCardsToDrawCount() {
        // ディーラーの現在の手札をシミュレーション用にコピー
        const simulatedHand = new Hand();
        for (const card of this.game.dealerHand.cards) {
            const cardCopy = { ...card };
            simulatedHand.addCard(cardCopy);
        }
        
        // ディーラーが引く必要があるカードの枚数
        let cardsToDrawCount = 0;
        
        // デッキのカードをコピーしてシミュレーション用に使用
        const deckCopy = this.game.deck.cards.slice();
        let deckIndex = deckCopy.length - 1;

        // ディーラーは17以上になるまでヒット
        while (simulatedHand.getTotal() < 17) {
            if (deckIndex < 0) {
                const tempDeck = new Deck(this.game.deck.numDecks);
                deckCopy.push(...tempDeck.cards);
                deckIndex = deckCopy.length - 1;
            }

            const nextCard = deckCopy[deckIndex--];

            // シミュレーション用の手札にカードを追加
            const cardCopy = { ...nextCard, isFaceUp: true };
            simulatedHand.addCard(cardCopy);

            // 引くカードの枚数を増やす
            cardsToDrawCount++;
        }
        
        return cardsToDrawCount;
    }

    /**
     * ボタンの状態を更新
     */
    updateButtons() {
        const gameState = this.game.gameState;
        
        // 配るボタン
        this.dealBtn.disabled = gameState !== 'betting' && gameState !== 'gameOver';
        
        if (gameState === 'playerTurn' && this.game.currentHandIndex < this.game.playerHands.length) {
            const currentHand = this.game.playerHands[this.game.currentHandIndex];
            
            // ヒットボタン
            this.hitBtn.disabled = false;
            
            // スタンドボタン
            this.standBtn.disabled = false;
            
            // ダブルボタン
            this.doubleBtn.disabled = !currentHand.canDouble();
            
            // フリーダブル対象の場合はボタンの表示を変更
            if (currentHand.isFreeDoubleEligible()) {
                this.doubleBtn.textContent = 'フリーダブル';
                this.doubleBtn.classList.add('free-bet-button');
            } else {
                this.doubleBtn.textContent = 'ダブル';
                this.doubleBtn.classList.remove('free-bet-button');
            }
            
            // スプリットボタン
            this.splitBtn.disabled = !currentHand.canSplit();
            
            // フリースプリット対象の場合はボタンの表示を変更
            if (currentHand.isFreeSplitEligible()) {
                this.splitBtn.textContent = 'フリースプリット';
                this.splitBtn.classList.add('free-bet-button');
            } else {
                this.splitBtn.textContent = 'スプリット';
                this.splitBtn.classList.remove('free-bet-button');
            }
        } else {
            // プレイヤーのターンでない場合はすべて無効化
            this.hitBtn.disabled = true;
            this.standBtn.disabled = true;
            this.doubleBtn.disabled = true;
            this.splitBtn.disabled = true;
        }
    }

    /**
     * カード表示を更新
     */
    updateCardDisplay() {
        // ディーラーのカード表示
        this.dealerCardsElement.innerHTML = '';
        
        // ソフトハンドの場合は両方の合計値を表示
        if (this.game.dealerHand.isSoft() && this.game.dealerHand.getTotal() <= 21) {
            // エースを1として扱った場合の合計値を計算
            const hardTotal = this.game.dealerHand.getTotal() - 10;
            this.dealerCountElement.textContent = `(${hardTotal}/${this.game.dealerHand.getTotal()})`;
        } else {
            this.dealerCountElement.textContent = `(${this.game.dealerHand.getTotal()})`;
        }
        
        for (const card of this.game.dealerHand.cards) {
            this.dealerCardsElement.appendChild(this.createCardElement(card));
        }
        
        // 複数ハンドの場合
        if (this.game.playerHands.length > 1) {
            this.playerCardsElement.style.display = 'none';
            this.playerHandsContainer.style.display = 'flex';
            this.playerHandsContainer.innerHTML = '';
            
            for (let i = 0; i < this.game.playerHands.length; i++) {
                const hand = this.game.playerHands[i];
                const handElement = document.createElement('div');
                handElement.className = 'player-hand';
                
                if (i === this.game.currentHandIndex && this.game.gameState === 'playerTurn') {
                    handElement.classList.add('active-hand');
                    
                    // アクティブハンドのインジケーターを追加
                    const indicator = document.createElement('div');
                    indicator.className = 'hand-indicator';
                    indicator.textContent = 'ACTIVE';
                    handElement.appendChild(indicator);
                }
                
                const handTitle = document.createElement('h3');
                
                // ソフトハンドの場合は両方の合計値を表示
                if (hand.isSoft() && hand.getTotal() <= 21) {
                    // エースを1として扱った場合の合計値を計算
                    const hardTotal = hand.getTotal() - 10;
                    handTitle.textContent = `ハンド ${i + 1} (${hardTotal}/${hand.getTotal()})`;
                } else {
                    handTitle.textContent = `ハンド ${i + 1} (${hand.getTotal()})`;
                }
                
                if (hand.isBlackjack) handTitle.textContent += ' - ブラックジャック！';
                if (hand.isBusted) handTitle.textContent += ' - バスト！';
                
                handElement.appendChild(handTitle);
                
                const handCards = document.createElement('div');
                handCards.className = 'hand-cards';
                
                for (const card of hand.cards) {
                    handCards.appendChild(this.createCardElement(card));
                }
                
                handElement.appendChild(handCards);
                
                // ゲーム終了時に結果を表示
                if (this.game.gameState === 'gameOver') {
                    const resultElement = document.createElement('div');
                    resultElement.className = 'hand-result';
                    resultElement.style.fontSize = '2em';
                    
                    if (hand.result === 'win') {
                        resultElement.textContent = `Win: +${hand.winnings}`;
                        resultElement.style.color = '#2ecc71';
                    } else if (hand.result === 'blackjack') {
                        resultElement.textContent = `BJ: +${hand.winnings}`;
                        resultElement.style.color = '#f39c12';
                    } else if (hand.result === 'loss') {
                        resultElement.textContent = `Lose: ${hand.winnings}`;
                        resultElement.style.color = '#e74c3c';
                    } else {
                        resultElement.textContent = 'Push';
                        resultElement.style.color = '#3498db';
                    }
                    
                    handElement.appendChild(resultElement);
                    
                    // 勝敗と選択肢の評価のフィードバックを表示
                    // 最後のハンドの場合にのみフィードバックを表示
                    if (i === this.game.playerHands.length - 1) {
                        this.showGameResultFeedback(hand);
                    }
                }
                
                this.playerHandsContainer.appendChild(handElement);
            }
        } else {
            // 単一ハンドの場合
            this.playerCardsElement.style.display = 'flex';
            this.playerHandsContainer.style.display = 'none';
            this.playerCardsElement.innerHTML = '';
            
            if (this.game.playerHands.length > 0) {
                const hand = this.game.playerHands[0];
                
                // ソフトハンドの場合は両方の合計値を表示
                if (hand.isSoft() && hand.getTotal() <= 21) {
                    // エースを1として扱った場合の合計値を計算
                    const hardTotal = hand.getTotal() - 10;
                    this.playerCountElement.textContent = `(${hardTotal}/${hand.getTotal()})`;
                } else {
                    this.playerCountElement.textContent = `(${hand.getTotal()})`;
                }
                
                if (hand.isBlackjack) this.playerCountElement.textContent += ' -BJ!';
                if (hand.isBusted) this.playerCountElement.textContent += ' -Bust!';
                
                for (const card of hand.cards) {
                    this.playerCardsElement.appendChild(this.createCardElement(card));
                }
                
                // ゲーム終了時に結果を表示
                if (this.game.gameState === 'gameOver') {
                    const resultElement = document.createElement('div');
                    resultElement.className = 'hand-result';
                    resultElement.style.fontSize = '5em';
                    
                    if (hand.result === 'win') {
                        resultElement.textContent = `Win: +${hand.winnings}`;
                        resultElement.style.color = '#2ecc71';
                    } else if (hand.result === 'blackjack') {
                        resultElement.textContent = `BJ: +${hand.winnings}`;
                        resultElement.style.color = '#f39c12';
                    } else if (hand.result === 'loss') {
                        resultElement.textContent = `Lose: ${hand.winnings}`;
                        resultElement.style.color = '#e74c3c';
                    } else {
                        resultElement.textContent = 'Push';
                        resultElement.style.color = '#3498db';
                    }
                    
                    this.playerCardsElement.appendChild(resultElement);
                    
                    // 勝敗と選択肢の評価のフィードバックを表示
                    this.showGameResultFeedback(hand);
                }
            }
        }
    }

    /**
     * カード要素を作成
     * @param {Object} card カードオブジェクト
     * @returns {HTMLElement} カード要素
     */
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        if (!card.isFaceUp) {
            // 裏向きのカード
            cardElement.classList.add('card-back');
            cardElement.style.backgroundColor = '#2c3e50';
            return cardElement;
        }
        
        // 表向きのカード
        const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
        cardElement.classList.add(isRed ? 'red' : 'black');
        
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
        
        cardElement.appendChild(valueTop);
        cardElement.appendChild(suitCenter);
        cardElement.appendChild(valueBottom);
        
        return cardElement;
    }

    /**
     * 情報表示を更新
     */
    updateInfoDisplay() {
        // 残高表示
        this.balanceElement.textContent = this.game.balance;
        
        // 残りカード数表示
        this.remainingCardsElement.textContent = this.game.deck.getRemainingCards();
        
        // カードカウンティング表示はゲーム終了時のみ更新する
        // ゲーム終了時以外は表示のみを行い、値の更新は行わない
        // 表示の更新はここでは行わず、updateAllCardCountingメソッドで行う
    }

    /**
     * ゲーム終了時に全てのカードのカウンティングをまとめて行う
     */
    updateAllCardCounting() {
        // カウンティングを行う前に、カウント済みフラグをリセット
        // ディーラーのカードをカウント
        for (const card of this.game.dealerHand.cards) {
            if (card.isFaceUp && !card.counted) {
                this.cardCounting.updateCount(card);
                card.counted = true;
            }
        }
        
        // プレイヤーのカードをカウント
        for (const hand of this.game.playerHands) {
            for (const card of hand.cards) {
                if (card.isFaceUp && !card.counted) {
                    this.cardCounting.updateCount(card);
                    card.counted = true;
                }
            }
        }
        
        // カウンティング表示の更新
        // 循環参照を避けるために、直接表示を更新
        this.runningCountElement.textContent = this.cardCounting.runningCount;
        
        const remainingDecks = this.game.deck.getRemainingDecks();
        const trueCount = this.cardCounting.getTrueCount(remainingDecks);
        this.trueCountElement.textContent = trueCount;
    }

    /**
     * 推奨アクションを表示
     */
    showRecommendedAction() {
        if (this.game.gameState !== 'playerTurn') {
            this.messageElement.textContent = '';
            return;
        }
        
        const action = this.game.getRecommendedAction();
        let message = '推奨アクション: ';
        
        switch (action) {
            case 'H':
                message += 'ヒット (H)';
                break;
            case 'S':
                message += 'スタンド (S)';
                break;
            case 'D':
                message += 'ダブル (D)';
                break;
            case 'P':
                message += 'スプリット (P)';
                break;
            default:
                message = '';
        }
        
        this.messageElement.textContent = message;
    }

    /**
     * メッセージを表示
     * @param {string} message 表示するメッセージ
     * @param {number} duration 表示時間（ミリ秒）
     */
    showMessage(message, duration = 3000) {
        this.messageElement.textContent = message;
        
        // 指定時間後にメッセージをクリア
        setTimeout(() => {
            if (this.messageElement.textContent === message) {
                this.messageElement.textContent = '';
                this.showRecommendedAction();
            }
        }, duration);
    }
    
    /**
     * アクションの正誤を表示
     * @param {string} userAction ユーザーが選択したアクション
     * @param {string} recommendedAction 推奨アクション
     */
    showActionFeedback(userAction, recommendedAction) {
        // アクションの表示名を設定
        const actionNames = {
            'H': 'Hit',
            'S': 'Stand',
            'D': 'Double',
            'P': 'Split'
        };
        
        // ユーザーのアクションと推奨アクションが一致しているか確認
        // フリーダブルやフリースプリットの場合は特別処理
        let isCorrect = false;
        
        // 現在のハンドを取得
        const currentHand = this.game.playerHands[this.game.currentHandIndex];
        
        // フリーダブル対象の場合、ダブルを選択したのは正しい
        if (userAction === 'D' && currentHand && currentHand.isFreeDoubleEligible()) {
            isCorrect = true;
        }
        // フリースプリット対象の場合、スプリットを選択したのは正しい
        else if (userAction === 'P' && currentHand && currentHand.isFreeSplitEligible()) {
            isCorrect = true;
        }
        // それ以外は通常の比較
        else {
            isCorrect = userAction === recommendedAction;
        }
        
        // フィードバックメッセージを生成
        let feedbackMessage = '';
        
        if (isCorrect) {
            feedbackMessage = `Correct! ${actionNames[userAction]} is the recommended action.`;
            this.actionFeedbackElement.className = 'action-feedback correct-action';
        } else {
            feedbackMessage = `Incorrect. You chose ${actionNames[userAction]}, but ${actionNames[recommendedAction]} is recommended.`;
            this.actionFeedbackElement.className = 'action-feedback incorrect-action';
        }
        
        // フィードバックを表示
        this.actionFeedbackElement.textContent = feedbackMessage;
        
        // 3秒後にフィードバックをクリア
        setTimeout(() => {
            this.actionFeedbackElement.textContent = '';
            this.actionFeedbackElement.className = 'action-feedback';
        }, 3000);
    }

    /**
     * テーブルをリセットして次のゲームの準備をする
     */
    resetTable() {
        // プレイヤーのカードとディーラーのカードをクリア
        this.playerCardsElement.innerHTML = '';
        this.dealerCardsElement.innerHTML = '';
        this.playerHandsContainer.innerHTML = '';
        
        // ゲームの状態をベッティングに設定
        this.game.gameState = 'betting';
        
        // UIを更新
        this.updateUI();
        
        // メッセージを表示
        this.showMessage('賭け金を設定して「配る」ボタンをクリックしてください。');
    }
    
    /**
     * 勝敗と選択肢の評価のフィードバックを表示
     * @param {Hand} hand プレイヤーのハンド
     */
    showGameResultFeedback(hand) {
        // ディーラーのカードとプレイヤーのハンドの状況を取得
        const dealerUpCard = this.game.dealerHand.cards[0].value;
        const dealerTotal = this.game.dealerHand.getTotal();
        const playerTotal = hand.getTotal();
        
        // 勝敗結果に基づいたフィードバックメッセージを生成
        let feedbackMessage = '';
        
        // 勝敗結果の表示
        if (hand.result === 'win') {
            feedbackMessage = `おめでとうございます！ 勝ちました！ `;
        } else if (hand.result === 'blackjack') {
            feedbackMessage = `素晴らしい！ ブラックジャックで勝ちました！ `;
        } else if (hand.result === 'loss') {
            if (hand.isBusted) {
                feedbackMessage = `残念、バストしてしまいました。 `;
            } else {
                feedbackMessage = `残念、ディーラーの${dealerTotal}に対して負けました。 `;
            }
        } else { // push
            feedbackMessage = `引き分けです。 プレイヤー: ${playerTotal} vs ディーラー: ${dealerTotal} `;
        }
        
        // 選択肢の評価を追加
        const recommendedAction = this.game.strategy.getRecommendedAction(hand, dealerUpCard, hand.isFreeBet);
        let actionFeedback = '';
        
        if (hand.isDoubled || hand.isFreeDoubled) {
            if (recommendedAction === 'D') {
                actionFeedback = 'ダブルダウンは正しい選択でした。';
            } else {
                actionFeedback = `ダブルダウンよりも${recommendedAction === 'H' ? 'ヒット' : 'スタンド'}の方が良かったかもしれません。`;
            }
        } else if (hand.isSplit) {
            if (recommendedAction === 'P') {
                actionFeedback = 'スプリットは正しい選択でした。';
            } else {
                actionFeedback = `スプリットよりも${recommendedAction === 'H' ? 'ヒット' : 'スタンド'}の方が良かったかもしれません。`;
            }
        }
        
        // フィードバックを表示
        if (actionFeedback) {
            feedbackMessage += actionFeedback;
        }
        
        // メッセージを表示（5秒間）
        this.showMessage(feedbackMessage, 5000);
    }
}
