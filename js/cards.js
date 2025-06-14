/**
 * カードデッキの管理を行うクラス
 */
class Deck {
    constructor(numDecks = 6) {
        this.numDecks = numDecks;
        this.cards = [];
        this.reset();
    }

    /**
     * デッキをリセットして新しいカードを作成
     */
    reset() {
        this.cards = [];
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        // 指定されたデッキ数分のカードを作成
        for (let d = 0; d < this.numDecks; d++) {
            for (const suit of suits) {
                for (const value of values) {
                    this.cards.push({
                        suit,
                        value,
                        numericValue: this.getCardValue(value),
                        isFaceUp: true,
                        counted: false // カウント済みかどうかを追跡
                    });
                }
            }
        }
        
        this.shuffle();
    }

    /**
     * カードの数値を取得
     * @param {string} value カードの値
     * @returns {number} カードの数値
     */
    getCardValue(value) {
        if (value === 'A') return 11;
        if (['J', 'Q', 'K'].includes(value)) return 10;
        return parseInt(value);
    }

    /**
     * デッキをシャッフル
     */
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    /**
     * 次に引くカードのインデックスを取得（実際には引かない）
     * @returns {number} 次のカードのインデックス
     */
    nextCardIndex() {
        if (this.cards.length === 0) {
            this.reset();
        }
        return this.cards.length - 1;
    }
    
    /**
     * カードを1枚引く
     * @param {boolean} isFaceUp カードが表向きかどうか
     * @returns {Object} カードオブジェクト
     */
    dealCard(isFaceUp = true) {
        if (this.cards.length === 0) {
            this.reset();
        }
        const card = this.cards.pop();
        card.isFaceUp = isFaceUp;
        card.isNew = true;    // 新しく配られたカードとしてマーク
        card.counted = false; // カウント状態をリセット
        return card;
    }

    /**
     * 残りのカード枚数を取得
     * @returns {number} 残りのカード枚数
     */
    getRemainingCards() {
        return this.cards.length;
    }

    /**
     * 残りのデッキ数を取得（概算）
     * @returns {number} 残りのデッキ数
     */
    getRemainingDecks() {
        return Math.max(1, Math.round(this.cards.length / 52));
    }
}

/**
 * ハンドの管理を行うクラス
 */
class Hand {
    constructor(bet = 0, isFreeBet = false) {
        this.cards = [];
        this.bet = bet;
        this.isFreeBet = isFreeBet;
        this.isBlackjack = false;
        this.isBusted = false;
        this.isDoubled = false;
        this.isFreeDoubled = false;
        this.isSplit = false;
        this.isStood = false;
    }

    /**
     * カードを追加
     * @param {Object} card カードオブジェクト
     */
    addCard(card) {
        this.cards.push(card);
        this.updateStatus();
    }

    /**
     * ハンドの状態を更新
     */
    updateStatus() {
        const total = this.getTotal();
        
        // バスト判定
        if (total > 21) {
            this.isBusted = true;
        }
        
        // ブラックジャック判定
        if (this.cards.length === 2 && total === 21) {
            this.isBlackjack = true;
        }
    }

    /**
     * ハンドの合計値を取得
     * @returns {number} ハンドの合計値
     */
    getTotal() {
        let total = 0;
        let aces = 0;
        
        for (const card of this.cards) {
            if (card.isFaceUp) {
                total += card.numericValue;
                if (card.value === 'A') {
                    aces++;
                }
            }
        }
        
        // エースの処理（必要に応じて1として扱う）
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        
        return total;
    }

    /**
     * ハンドがソフトハンドかどうかを判定
     * ソフトハンドとは、エースを11として数えた場合と1として数えた場合で合計値が異なるハンド
     * @returns {boolean} ソフトハンドならtrue
     */
    isSoft() {
        // エースがない場合はソフトハンドではない
        if (!this.cards.some(card => card.isFaceUp && card.value === 'A')) {
            return false;
        }
        
        // エースを1として数えた場合の合計値を計算
        let hardTotal = 0;
        for (const card of this.cards) {
            if (card.isFaceUp) {
                // エースは常に1として数える
                hardTotal += (card.value === 'A') ? 1 : card.numericValue;
            }
        }
        
        // 実際の合計値を取得
        const actualTotal = this.getTotal();
        
        // 実際の合計値とエースを1として数えた場合の合計値が異なる場合はソフトハンド
        return hardTotal !== actualTotal && actualTotal <= 21;
    }

    /**
     * ハンドがペアかどうかを判定
     * @returns {boolean} ペアならtrue
     */
    isPair() {
        return this.cards.length === 2 && 
               this.cards[0].value === this.cards[1].value;
    }

    /**
     * スプリット可能かどうかを判定
     * @returns {boolean} スプリット可能ならtrue
     */
    canSplit() {
        return this.isPair() && !this.isStood && !this.isBusted && !this.isDoubled;
    }

    /**
     * ダブルダウン可能かどうかを判定
     * @returns {boolean} ダブルダウン可能ならtrue
     */
    canDouble() {
        return this.cards.length === 2 && !this.isStood && !this.isBusted;
    }

    /**
     * フリーダブル対象かどうかを判定
     * @returns {boolean} フリーダブル対象ならtrue
     */
    isFreeDoubleEligible() {
        if (this.cards.length !== 2 || this.isStood || this.isBusted) {
            return false;
        }
        
        const total = this.getTotal();
        return total === 9 || total === 10 || total === 11;
    }

    /**
     * フリースプリット対象かどうかを判定
     * @returns {boolean} フリースプリット対象ならtrue
     */
    isFreeSplitEligible() {
        if (!this.canSplit()) {
            return false;
        }
        
        // 10のペアはフリースプリット対象外
        return !['10', 'J', 'Q', 'K'].includes(this.cards[0].value);
    }
}
