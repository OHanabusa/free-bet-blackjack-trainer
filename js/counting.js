/**
 * カードカウンティングを管理するクラス
 */
class CardCounting {
    constructor() {
        this.runningCount = 0;
        this.initialDeckCount = 6; // 初期デッキ数
        this.cardsDealt = 0;
    }

    /**
     * カウンティングをリセット
     */
    reset() {
        this.runningCount = 0;
        this.cardsDealt = 0;
    }

    /**
     * カードが配られた時にカウントを更新
     * @param {Object} card 配られたカード
     */
    updateCount(card) {
        if (!card.isFaceUp) return;
        
        // 既にカウント済みのカードはスキップ
        if (card.counted) return;
        
        this.cardsDealt++;
        
        // ハイ・ロー法によるカウント
        if (['2', '3', '4', '5', '6'].includes(card.value)) {
            this.runningCount++;
        } else if (['10', 'J', 'Q', 'K', 'A'].includes(card.value)) {
            this.runningCount--;
        }
        
        // カウント済みとマーク
        card.counted = true;
    }

    /**
     * 複数のカードが配られた時にカウントを更新
     * @param {Array} cards 配られたカードの配列
     */
    updateCountForCards(cards) {
        for (const card of cards) {
            this.updateCount(card);
        }
    }

    /**
     * トゥルーカウントを計算
     * @param {number} remainingDecks 残りのデッキ数
     * @returns {number} トゥルーカウント
     */
    getTrueCount(remainingDecks) {
        if (remainingDecks <= 0) return 0;
        return Math.round((this.runningCount / remainingDecks) * 10) / 10;
    }

    /**
     * 推奨ベット額を計算
     * @param {number} trueCount トゥルーカウント
     * @param {number} minBet 最小ベット額
     * @param {number} maxBet 最大ベット額
     * @returns {number} 推奨ベット額
     */
    getRecommendedBet(trueCount, minBet, maxBet) {
        let multiplier = 1;
        
        if (trueCount <= 0) {
            multiplier = 1;
        } else if (trueCount === 1) {
            multiplier = 2;
        } else if (trueCount === 2) {
            multiplier = 4;
        } else if (trueCount >= 3) {
            multiplier = 8;
        }
        
        const recommendedBet = minBet * multiplier;
        return Math.min(recommendedBet, maxBet);
    }

    /**
     * カウンティングの効果を評価
     * @param {number} trueCount トゥルーカウント
     * @returns {string} カウンティングの状況の説明
     */
    evaluateCountingSituation(trueCount) {
        if (trueCount <= -3) {
            return 'ディーラーに有利な状況です。最小ベットにしましょう。';
        } else if (trueCount <= 0) {
            return 'やや不利な状況です。最小ベットを維持しましょう。';
        } else if (trueCount === 1) {
            return 'やや有利な状況です。ベットを少し増やしましょう。';
        } else if (trueCount === 2) {
            return '有利な状況です。ベットを増やしましょう。';
        } else {
            return '非常に有利な状況です。最大ベットにしましょう。';
        }
    }
}
