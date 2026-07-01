import { memo } from 'react';
import { motion } from 'framer-motion';
import { useCardStore } from '../../store/cardStore';
import type { Card as CardType } from '../../types/card';
import styles from './Card.module.css';

interface CardProps {
  card: CardType;
  isSelected: boolean;
  onToggleCollect: () => void;
  onToggleSelect: () => void;
}

const SUIT_SYMBOLS: Record<string, string> = {
  spade: '♠',
  heart: '♥',
  club: '♣',
  diamond: '♦',
  box: '📦',
};

const SUIT_COLORS: Record<string, string> = {
  spade: '#222',
  heart: '#e74c3c',
  club: '#222',
  diamond: '#e74c3c',
  box: '#8e44ad',
};

export const Card = memo(function Card({
  card,
  isSelected,
  onToggleCollect,
  onToggleSelect,
}: CardProps) {
  const suitSymbol = SUIT_SYMBOLS[card.suit] || '';
  const suitColor = SUIT_COLORS[card.suit] || '#222';

  const hasSelection = useCardStore((s) => s.selectedIds.size > 0);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggleSelect();
  };

  const handleClick = (e: React.MouseEvent) => {
    // Ctrl/Shift+click always toggles selection
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault();
      onToggleSelect();
      return;
    }
    // If there are already selected cards, clicking toggles selection
    if (hasSelection) {
      onToggleSelect();
      return;
    }
    // Normal click = toggle collection
    onToggleCollect();
  };

  return (
    <motion.div
      className={`${styles.card} ${card.collected ? styles.collected : styles.uncollected} ${isSelected ? styles.selected : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      role="button"
      tabIndex={0}
      aria-label={`${card.name}${card.collected ? '，已收藏' : '，未收藏'}${isSelected ? '，已选中' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleCollect();
        }
      }}
    >
      <span className={styles.rank} style={{ color: suitColor }}>
        {card.rank}
      </span>
      <span className={styles.suit} style={{ color: suitColor }}>
        {suitSymbol}
      </span>
      <span className={styles.name}>{card.name}</span>
      {isSelected && (
        <motion.div
          className={styles.selectionBadge}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          {'✓'}
        </motion.div>
      )}
    </motion.div>
  );
});
