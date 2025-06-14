/**
 * Free Bet ブラックジャックのゲームロジックを管理するクラス
 */
class Game {
    constructor() {
        this.deck = new Deck(6); // 6デッキを使用
        this.playerHands = [];
        this.dealerHand = new Hand();
        this.currentHandIndex = 0;
        this.bet = 10;
        this.balance = 1000;
        this.gameState = 'betting'; // betting, playerTurn, dealerTurn, gameOver
        this.strategy = new Strategy();
        
        // 統計情報の初期化
        this.stats = {
            totalHands: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            freeDoubles: 0,
            freeSplits: 0,
            dealer22s: 0,
            blackjacks: 0,
            balanceHistory: [1000]
        };
    }
    
    /**
     * 統計情報を設定
     * @param {Object} stats 統計情報
     */
    setStats(stats) {
        if (stats) {
            this.stats = { ...stats };
            // 残高履歴が空の場合は初期化
            if (!this.stats.balanceHistory || this.stats.balanceHistory.length === 0) {
                this.stats.balanceHistory = [this.balance];
            }
            // 残高を最新の値に設定
            this.balance = this.stats.balanceHistory[this.stats.balanceHistory.length - 1];
        }
    }

    /**
     * ゲームを初期化
     * @param {number} bet ベット額
     */
    initGame(bet) {
        this.bet = bet;
        if (this.deck.getRemainingCards() < 50) {
            this.deck.reset();
        }
        this.playerHands = [new Hand(bet, false)];
        this.dealerHand = new Hand();
        this.currentHandIndex = 0;
        this.gameState = 'betting';
    }

    /**
     * ゲームを開始（カードを配る）
     */
    startGame() {
        if (this.gameState !== 'betting') return;
        
        // プレイヤーに2枚配る
        this.playerHands[0].addCard(this.deck.dealCard());
        this.playerHands[0].addCard(this.deck.dealCard());
        
        // ディーラーに2枚配る（1枚は裏向き）
        this.dealerHand.addCard(this.deck.dealCard());
        this.dealerHand.addCard(this.deck.dealCard(false));
        
        this.gameState = 'playerTurn';
        
        // プレイヤーがブラックジャックの場合
        if (this.playerHands[0].isBlackjack) {
            this.stats.blackjacks++;
            this.dealerTurn();
        }
    }

    /**
     * ヒットする
     */
    hit() {
        if (this.gameState !== 'playerTurn') return;
        
        const currentHand = this.playerHands[this.currentHandIndex];
        const card = this.deck.dealCard();
        currentHand.addCard(card);
        
        // バーストした場合は次のハンドに移る
        if (currentHand.isBusted) {
            this.nextHand();
        }
    }

    /**
     * プレイヤーがスタンドする
     */
    stand() {
        if (this.gameState !== 'playerTurn') return;
        
        const currentHand = this.playerHands[this.currentHandIndex];
        currentHand.isStood = true;
        
        this.nextHand();
    }

    /**
     * プレイヤーがダブルダウンする
     * @param {boolean} isFreeDouble フリーダブルかどうか
     */
    double(isFreeDouble = false) {
        if (this.gameState !== 'playerTurn') return;
        
        const currentHand = this.playerHands[this.currentHandIndex];
        
        if (!currentHand.canDouble()) return;
        
        if (isFreeDouble) {
            currentHand.isFreeDoubled = true;
            this.stats.freeDoubles++;
        } else {
            // 通常のダブルダウンの場合、ベットを倍にする
            if (this.balance < currentHand.bet) return; // 残高不足
            this.balance -= currentHand.bet;
            currentHand.bet *= 2;
            currentHand.isDoubled = true;
        }
        
        // カードを1枚だけ追加
        const card = this.deck.dealCard();
        currentHand.addCard(card);
        currentHand.isStood = true;
        
        this.nextHand();
    }

    /**
     * プレイヤーがスプリットする
     * @param {boolean} isFreeSplit フリースプリットかどうか
     */
    split(isFreeSplit = false) {
        if (this.gameState !== 'playerTurn') return;
        
        const currentHand = this.playerHands[this.currentHandIndex];
        
        if (!currentHand.canSplit()) return;
        
        // 新しいハンドを作成
        const newHand = new Hand(currentHand.bet, isFreeSplit);
        
        // カードを分ける
        const card = currentHand.cards.pop();
        newHand.addCard(card);
        
        // 両方のハンドにカードを追加
        const card1 = this.deck.dealCard();
        const card2 = this.deck.dealCard();
        
        currentHand.addCard(card1);
        newHand.addCard(card2);
        
        // ハンドをスプリット状態にする
        currentHand.isSplit = true;
        newHand.isSplit = true;
        
        // 新しいハンドを追加
        this.playerHands.splice(this.currentHandIndex + 1, 0, newHand);
        
        if (isFreeSplit) {
            this.stats.freeSplits++;
        } else {
            // 通常のスプリットの場合、追加のベットが必要
            if (this.balance < currentHand.bet) return; // 残高不足
            this.balance -= currentHand.bet;
        }
    }

    /**
     * 次のハンドに移動
     */
    nextHand() {
        this.currentHandIndex++;
        
        // すべてのハンドをプレイし終えた場合
        if (this.currentHandIndex >= this.playerHands.length) {
            this.dealerTurn();
        }
    }
    
    /**
     * ディーラーのターン
     * UI側でアニメーションを使用しない場合はこちらを使用
     */
    dealerTurn() {
        // ディーラーのターンの準備
        this.prepareDealerTurn();
        
        // ディーラーが引く予定のカード情報を取得
        const cardInfos = this.prepareDealerTurn();
        
        // 全てのカードを引く
        for (let i = 0; i < cardInfos.length; i++) {
            this.dealerDrawCard();
        }
        
        // 結果評価
        this.evaluateGame();
    }

    /**
     * ディーラーのターンの準備
     * @returns {Array} ディーラーが引くカードの情報配列
     */
    prepareDealerTurn() {
        this.gameState = 'dealerTurn';
        
        // ディーラーの裏向きのカードを表にする
        this.dealerHand.cards.forEach(card => {
            if (!card.isFaceUp) {
                card.isFaceUp = true;
            }
        });
        
        // すべてのプレイヤーハンドがバストしている場合はディーラーはカードを引かない
        const allHandsBusted = this.playerHands.every(hand => hand.isBusted);
        
        // ディーラーが引くカードの情報を配列に格納
        const cardInfos = [];
        
        if (!allHandsBusted) {
            // ディーラーの現在の手札をコピーしてシミュレーション
            const simulatedHand = new Hand();
            this.dealerHand.cards.forEach(card => {
                const cardCopy = { ...card };
                simulatedHand.addCard(cardCopy);
            });
            
            // ディーラーは17以上になるまでヒット（ソフト17でもヒット）
            while (simulatedHand.getTotal() < 17) {
                // 次のカードの情報を取得（実際には引かない）
                const nextCardIndex = this.deck.nextCardIndex();
                const nextCard = this.deck.cards[nextCardIndex];
                
                // カード情報を追加
                cardInfos.push({
                    suit: nextCard.suit,
                    value: nextCard.value,
                    numericValue: nextCard.numericValue
                });
                
                // シミュレーション用の手札にカードを追加
                const cardCopy = { ...nextCard, isFaceUp: true };
                simulatedHand.addCard(cardCopy);
            }
        }
        
        // カード情報の配列を返す
        return cardInfos;
    }
    
    /**
     * ディーラーにカードを1枚追加
     * @returns {Card} 追加したカード
     */
    dealerDrawCard() {
        const card = this.deck.dealCard();
        this.dealerHand.addCard(card);
        return card;
    }
    
    /**
     * ゲーム結果を評価
     */
    evaluateGame() {
        this.gameState = 'gameOver';
        this.stats.totalHands++;
        
        const dealerTotal = this.dealerHand.getTotal();
        const dealerBusted = this.dealerHand.isBusted;
        const dealer22 = dealerBusted && dealerTotal === 22;
        
        if (dealer22) {
            this.stats.dealer22s++;
        }
        
        let totalWinnings = 0;
        
        // フリースプリットの結果を追跡するための変数
        let freeSplitHands = [];
        let freeSplitWins = 0;
        
        // フリースプリットのハンドを特定
        for (const hand of this.playerHands) {
            if (hand.isFreeBet && hand.isSplit) {
                freeSplitHands.push(hand);
            }
        }
        
        for (const hand of this.playerHands) {
            const playerTotal = hand.getTotal();
            const playerBusted = hand.isBusted;
            let result = '';
            let winnings = 0;
            
            // プレイヤーがバストした場合
            if (playerBusted) {
                result = 'loss';
                winnings = 0; // 既にゲーム開始時に賭け金を差し引いているので、ここでは0とする
                this.stats.losses++;
            } 
            // ディーラーが22でバストした場合はプッシュ
            else if (dealer22) {
                result = 'push';
                winnings = hand.bet; // 引き分けの場合は掛け金をそのまま戻す
                this.stats.pushes++;
            }
            // ディーラーがバストした場合（22以外）
            else if (dealerBusted) {
                result = 'win';
                
                if (hand.isBlackjack) {
                    // ブラックジャックは3:2の配当（元の賭け金 + 1.5倍の配当）
                    winnings = hand.bet * 2.5;
                } else if (hand.isDoubled) {
                    // ダブルダウンした場合（元の賭け金は既に2倍になっているので、その2倍の配当）
                    winnings = hand.bet * 2;
                } else if (hand.isFreeDoubled) {
                    // フリーダブルの場合（元の賭け金 + 2倍の配当）
                    winnings = hand.bet * 3;
                } else {
                    // 通常の勝ち（元の賭け金 + 配当）
                    winnings = hand.bet * 2;
                }
                
                this.stats.wins++;
            }
            // プレイヤーとディーラーの合計値を比較
            else {
                if (hand.isBlackjack && !this.dealerHand.isBlackjack) {
                    // プレイヤーのみブラックジャック（元の賭け金 + 1.5倍の配当）
                    result = 'blackjack';
                    winnings = hand.bet * 2.5;
                    this.stats.wins++;
                } else if (!hand.isBlackjack && this.dealerHand.isBlackjack) {
                    // ディーラーのみブラックジャック
                    result = 'loss';
                    winnings = 0; // 既にゲーム開始時に賭け金を差し引いているので、ここでは0とする
                    this.stats.losses++;
                } else if (hand.isBlackjack && this.dealerHand.isBlackjack) {
                    // 両方ブラックジャック
                    result = 'push';
                    winnings = hand.bet; // 引き分けの場合は掛け金をそのまま戻す
                    this.stats.pushes++;
                } else if (playerTotal > dealerTotal) {
                    // プレイヤーの方が高い
                    result = 'win';
                    
                    if (hand.isDoubled) {
                        // ダブルダウンした場合（元の賭け金は既に2倍になっているので、その2倍の配当）
                        winnings = hand.bet * 2;
                    } else if (hand.isFreeDoubled) {
                        // フリーダブルの場合（元の賭け金 + 2倍の配当）
                        winnings = hand.bet * 3;
                    } else {
                        // 通常の勝ち（元の賭け金 + 配当）
                        winnings = hand.bet * 2;
                    }
                    
                    this.stats.wins++;
                } else if (playerTotal < dealerTotal) {
                    // ディーラーの方が高い
                    result = 'loss';
                    winnings = 0; // 既にゲーム開始時に賭け金を差し引いているので、ここでは0とする
                    this.stats.losses++;
                } else {
                    // 引き分け
                    result = 'push';
                    winnings = hand.bet; // 引き分けの場合は掛け金をそのまま戻す
                    this.stats.pushes++;
                }
            }
            
            // フリーベットの場合の特別処理
            if (hand.isFreeBet) {
                if (result === 'loss') {
                    // フリーベットの場合、負けても賭け金は失わない
                    winnings = 0;
                } else if (hand.isSplit && (result === 'win' || result === 'blackjack')) {
                    // フリースプリットの場合、勝ったら掛け金 + 配当
                    winnings = hand.bet * 2;
                    freeSplitWins++;
                }
            }
            
            hand.result = result;
            hand.winnings = winnings;
            totalWinnings += winnings;
        }
        
        // フリースプリットの両方のハンドが勝った場合の特別処理
        if (freeSplitHands.length === 2 && freeSplitWins === 2) {
            // 両方勝った場合は掛け金が3倍になるように調整
            const originalBet = freeSplitHands[0].bet;
            // 既に各ハンドで掛け金の2倍が返ってきているので、合計で掛け金の3倍になるように調整
            const bonusWinnings = originalBet * 3 - (originalBet * 2 * 2);
            totalWinnings += bonusWinnings;
            
            // 統計情報に記録
            this.stats.freeSplitBothWins++;
        }
        
        // 残高を更新
        this.balance += totalWinnings;
        
        // 残高履歴を更新
        this.stats.balanceHistory.push(this.balance);
        
        return totalWinnings;
    }

    /**
     * 現在のハンドに対する推奨アクションを取得
     * @returns {string} 推奨アクション
     */
    getRecommendedAction() {
        if (this.gameState !== 'playerTurn' || this.currentHandIndex >= this.playerHands.length) {
            return '';
        }
        
        const currentHand = this.playerHands[this.currentHandIndex];
        const dealerUpCard = this.dealerHand.cards[0];
        const isFreeBet = currentHand.isFreeBet;
        
        // フリーダブル対象の場合は常にダブル
        if (currentHand.isFreeDoubleEligible()) {
            return 'D';
        }
        
        // フリースプリット対象の場合は常にスプリット
        if (currentHand.isFreeSplitEligible()) {
            return 'P';
        }
        
        return this.strategy.getRecommendedAction(currentHand, dealerUpCard, isFreeBet);
    }

    /**
     * 統計情報をリセット
     */
    resetStats() {
        this.stats = {
            totalHands: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            freeDoubles: 0,
            freeSplits: 0,
            dealer22s: 0,
            blackjacks: 0,
            balanceHistory: [this.balance]
        };
    }
}
