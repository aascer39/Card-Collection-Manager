import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../Card/Card';
import { useCardStore } from '../../store/cardStore';
import type { Card as CardType, CardGroup } from '../../types/card';
import styles from './CardGrid.module.css';

const SUIT_LABELS: Record<string, string> = {
  spade: '♠ 黑桃',
  heart: '♥ 红桃',
  club: '♣ 梅花',
  diamond: '♦ 方片',
  box: '📦 牌盒',
};

function groupBySuit(cards: CardType[]): CardGroup[] {
  const groups: Record<string, CardType[]> = {};

  for (const card of cards) {
    const key = card.suit;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  }

  return Object.entries(SUIT_LABELS)
    .filter(([key]) => groups[key])
    .map(([key, label]) => ({ label, cards: groups[key] }));
}

function groupByStatus(cards: CardType[]): CardGroup[] {
  const collected = cards.filter((c) => c.collected);
  const uncollected = cards.filter((c) => !c.collected);

  const result: CardGroup[] = [];
  if (collected.length > 0) {
    result.push({ label: '✅ 已收藏', cards: collected });
  }
  if (uncollected.length > 0) {
    result.push({ label: '⬜ 未收藏', cards: uncollected });
  }
  return result;
}

export function CardGrid() {
  const { cards, viewMode, selectedIds, toggleCollect, toggleSelect } = useCardStore();

  const groups = useMemo(
    () => (viewMode === 'suit' ? groupBySuit(cards) : groupByStatus(cards)),
    [cards, viewMode]
  );

  if (cards.length === 0) {
    return (
      <div className={styles.empty}>
        <p>没有找到卡牌。</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={styles.empty}>
        <p>没有符合当前筛选条件的卡牌。</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      <AnimatePresence mode="wait">
        {groups.map((group) => (
          <motion.div
            key={group.label}
            className={styles.group}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className={styles.groupLabel}>
              {group.label}
              <span className={styles.count}> ({group.cards.length})</span>
            </h2>
            <div className={styles.cards}>
              {group.cards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  isSelected={selectedIds.has(card.id)}
                  onToggleCollect={() => toggleCollect(card.id)}
                  onToggleSelect={() => toggleSelect(card.id)}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
