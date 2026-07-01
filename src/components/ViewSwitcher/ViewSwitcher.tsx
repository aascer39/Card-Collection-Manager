import { useCardStore } from '../../store/cardStore';
import type { ViewMode } from '../../types/card';
import styles from './ViewSwitcher.module.css';

const modes: { key: ViewMode; label: string }[] = [
  { key: 'suit', label: '♠ 按花色' },
  { key: 'status', label: '✅ 按状态' },
];

export function ViewSwitcher() {
  const { viewMode, setViewMode } = useCardStore();

  return (
    <div className={styles.switcher} role="tablist" aria-label="视图模式">
      {modes.map((mode) => (
        <button
          key={mode.key}
          role="tab"
          aria-selected={viewMode === mode.key}
          className={`${styles.btn} ${viewMode === mode.key ? styles.active : ''}`}
          onClick={() => setViewMode(mode.key)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
