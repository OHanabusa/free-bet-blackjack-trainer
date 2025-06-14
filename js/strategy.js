/**
 * Free Bet ブラックジャックの基本戦略を管理するクラス
 */
class Strategy {
    constructor() {
        // 実際の賭け金での戦略テーブル
        this.realMoneyStrategy = {
            // ハードハンド（エースなし）の戦略
            hard: {
                // プレイヤーの合計値: [ディーラーのアップカード（2-A）に対する行動]
                // 'H': ヒット, 'S': スタンド, 'D': ダブル, 'P': スプリット
                5: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
                6: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
                7: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
                8: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
                9: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
                10: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
                11: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'],
                12: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                13: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                14: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                15: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                16: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                17: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                18: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                19: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                20: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                21: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S']
            },
            
            // ソフトハンド（エースあり）の戦略
            soft: {
                // プレイヤーの合計値: [ディーラーのアップカード（2-A）に対する行動]
                13: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-2
                14: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-3
                15: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-4
                16: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-5
                17: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-6
                18: ['S', 'D', 'D', 'D', 'D', 'S', 'S', 'S', 'S', 'H'], // A-7
                19: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A-8
                20: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A-9
                21: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S']  // A-10
            },
            
            // ペアの戦略
            pairs: {
                // ペアの値: [ディーラーのアップカード（2-A）に対する行動]
                '2': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
                '3': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
                '4': ['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
                '5': ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
                '6': ['P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
                '7': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
                '8': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                '9': ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'],
                '10': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                'A': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P']
            }
        };
        
        // フリーベットでの戦略テーブル
        this.freeBetStrategy = {
            // ハードハンド（エースなし）の戦略
            hard: {
                // プレイヤーの合計値: [ディーラーのアップカード（2-A）に対する行動]
                5: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
                6: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
                7: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
                8: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
                9: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'], // フリーダブルなので常にダブル
                10: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'], // フリーダブルなので常にダブル
                11: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'], // フリーダブルなので常にダブル
                12: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                13: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                14: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                15: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                16: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
                17: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                18: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                19: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                20: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                21: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S']
            },
            
            // ソフトハンド（エースあり）の戦略
            soft: {
                // プレイヤーの合計値: [ディーラーのアップカード（2-A）に対する行動]
                13: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-2
                14: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-3
                15: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-4
                16: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-5
                17: ['D', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A-6
                18: ['S', 'D', 'D', 'D', 'D', 'S', 'S', 'S', 'S', 'H'], // A-7
                19: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A-8
                20: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A-9
                21: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S']  // A-10
            },
            
            // ペアの戦略
            pairs: {
                // ペアの値: [ディーラーのアップカード（2-A）に対する行動]
                '2': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // フリースプリットなので常にスプリット
                '3': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // フリースプリットなので常にスプリット
                '4': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // フリースプリットなので常にスプリット
                '5': ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 5のペアは10なのでダブル
                '6': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // フリースプリットなので常にスプリット
                '7': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // フリースプリットなので常にスプリット
                '8': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // フリースプリットなので常にスプリット
                '9': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // フリースプリットなので常にスプリット
                '10': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 10のペアはフリースプリット対象外
                'A': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P']  // フリースプリットなので常にスプリット
            }
        };
    }

    /**
     * 基本戦略に基づいた行動を取得
     * @param {Hand} hand プレイヤーのハンド
     * @param {Card} dealerUpCard ディーラーのアップカード
     * @param {boolean} isFreeBet フリーベットかどうか
     * @returns {string} 推奨される行動（'H', 'S', 'D', 'P'）
     */
    getRecommendedAction(hand, dealerUpCard, isFreeBet = false) {
        const strategy = isFreeBet ? this.freeBetStrategy : this.realMoneyStrategy;
        const dealerIndex = this.getDealerIndex(dealerUpCard);
        
        // ペアの場合
        if (hand.isPair()) {
            let pairValue = hand.cards[0].value;
            
            // J, Q, Kは10として扱う
            if (['J', 'Q', 'K'].includes(pairValue)) {
                pairValue = '10';
            }
            
            // ペアの値が戦略テーブルに存在するか確認
            if (strategy.pairs[pairValue]) {
                let action = strategy.pairs[pairValue][dealerIndex];
                
                // カードが3枚以上ある場合、ダブルはヒットに変換
                if (hand.cards.length > 2 && action === 'D') {
                    action = 'H';
                }
                
                return action;
            } else {
                // デフォルトはヒット
                return 'H';
            }
        }
        
        // ソフトハンドの場合
        if (hand.isSoft()) {
            const total = hand.getTotal();
            if (total >= 13 && total <= 21) {
                let action = strategy.soft[total][dealerIndex];
                
                // カードが3枚以上ある場合、ダブルはヒットに変換
                if (hand.cards.length > 2 && action === 'D') {
                    action = 'H';
                }
                
                return action;
            }
        }
        
        // ハードハンドの場合
        const total = hand.getTotal();
        if (total >= 5 && total <= 21) {
            let action = strategy.hard[total][dealerIndex];
            
            // カードが3枚以上ある場合、ダブルはヒットに変換
            if (hand.cards.length > 2 && action === 'D') {
                action = 'H';
            }
            
            return action;
        }
        
        // デフォルトはヒット
        return 'H';
    }

    /**
     * ディーラーのアップカードのインデックスを取得
     * @param {Card} dealerUpCard ディーラーのアップカード
     * @returns {number} 戦略テーブルのインデックス（0-9）
     */
    getDealerIndex(dealerUpCard) {
        if (dealerUpCard.value === 'A') return 9;
        if (['10', 'J', 'Q', 'K'].includes(dealerUpCard.value)) return 8;
        return parseInt(dealerUpCard.value) - 2;
    }

    /**
     * 戦略テーブルをHTMLで生成
     * @param {string} tableType テーブルの種類（'realMoney', 'freeBet', 'pairs', 'soft'）
     * @returns {string} HTML文字列
     */
    generateStrategyTable(tableType) {
        let strategy;
        let rowHeaders;
        let isForPairs = false;
        let isForSoft = false;
        
        if (tableType === 'realMoney') {
            strategy = this.realMoneyStrategy;
            rowHeaders = Array.from({length: 17}, (_, i) => (i + 5).toString());
        } else if (tableType === 'freeBet') {
            strategy = this.freeBetStrategy;
            rowHeaders = Array.from({length: 17}, (_, i) => (i + 5).toString());
        } else if (tableType === 'pairs') {
            strategy = this.realMoneyStrategy.pairs;
            rowHeaders = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
            isForPairs = true;
        } else if (tableType === 'soft') {
            strategy = this.realMoneyStrategy;
            rowHeaders = ['13', '14', '15', '16', '17', '18', '19', '20', '21'];
            isForSoft = true;
        }
        
        const dealerCards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
        
        let html = '<table>';
        
        // ヘッダー行
        html += '<tr><th></th>';
        for (const card of dealerCards) {
            html += `<th>${card}</th>`;
        }
        html += '</tr>';
        
        // データ行
        for (const row of rowHeaders) {
            html += `<tr><th>${row}</th>`;
            
            for (let i = 0; i < dealerCards.length; i++) {
                let action;
                
                if (isForPairs) {
                    action = strategy[row][i];
                } else if (isForSoft) {
                    // ソフトハンドの表示
                    action = strategy.soft[row][i];
                } else if (tableType === 'realMoney') {
                    // ハードハンドの表示
                    action = strategy.hard[row][i];
                } else {
                    // フリーベットの場合
                    action = strategy.hard[row][i];
                }
                
                let className = '';
                if (action === 'H') className = 'hit';
                else if (action === 'S') className = 'stand';
                else if (action === 'D') className = 'double';
                else if (action === 'P') className = 'split';
                
                let actionText = '';
                if (action === 'H') actionText = 'H';
                else if (action === 'S') actionText = 'S';
                else if (action === 'D') actionText = 'D';
                else if (action === 'P') actionText = 'P';
                
                html += `<td class="${className}">${actionText}</td>`;
            }
            
            html += '</tr>';
        }
        
        html += '</table>';
        return html;
    }
}
