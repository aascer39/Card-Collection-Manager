import { useState } from 'react';
import { useCardStore } from '../../store/cardStore';
import { ViewSwitcher } from '../ViewSwitcher/ViewSwitcher';
import { SearchBar } from '../SearchBar/SearchBar';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const {
    selectedIds,
    selectAll,
    invertSelection,
    clearSelection,
    batchMarkCollected,
    batchMarkUncollected,
    resetCollection,
  } = useCardStore();

  const [showResetModal, setShowResetModal] = useState(false);
  const count = selectedIds.size;

  return (
    <div className={styles.toolbar}>
      <div className={styles.topRow}>
        <ViewSwitcher />
        <SearchBar />
      </div>

      <div className={styles.actions}>
        <div className={styles.selectGroup}>
          <button onClick={selectAll} className={styles.btn} type="button">
            全选
          </button>
          <button onClick={invertSelection} className={styles.btn} type="button">
            反选
          </button>
          {count > 0 && (
            <button onClick={clearSelection} className={styles.btn} type="button">
              清除 ({count})
            </button>
          )}
        </div>

        {count > 0 && (
          <div className={styles.batchGroup}>
            <button
              onClick={batchMarkCollected}
              className={`${styles.btn} ${styles.collectBtn}`}
              type="button"
            >
              {'✓'} 标记已收藏 ({count})
            </button>
            <button
              onClick={batchMarkUncollected}
              className={`${styles.btn} ${styles.uncollectBtn}`}
              type="button"
            >
              {'✗'} 标记未收藏 ({count})
            </button>
          </div>
        )}

        <button
          onClick={() => setShowResetModal(true)}
          className={`${styles.btn} ${styles.dangerBtn}`}
          type="button"
        >
          重置全部
        </button>
      </div>

      {showResetModal && (
        <ConfirmModal
          title="重置所有收藏？"
          message="这将把所有卡牌标记为未收藏，此操作不可撤销。"
          confirmLabel="确定重置"
          danger
          onConfirm={async () => {
            await resetCollection();
            setShowResetModal(false);
          }}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </div>
  );
}
