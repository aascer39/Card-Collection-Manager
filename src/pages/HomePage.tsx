import { useEffect } from 'react';
import { useCardStore } from '../store/cardStore';
import { Toolbar } from '../components/Toolbar/Toolbar';
import { CardGrid } from '../components/CardGrid/CardGrid';
import styles from './HomePage.module.css';

export function HomePage() {
  const { fetchCards, isLoading, error } = useCardStore();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  if (error) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>{'🃏'} 卡牌收藏管理器</h1>
        </header>
        <div className={styles.errorState}>
          <p className={styles.errorText}>加载卡牌出错：{error}</p>
          <button className={styles.retryBtn} onClick={fetchCards} type="button">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{'🃏'} 卡牌收藏管理器</h1>
      </header>
      <Toolbar />
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>正在加载卡牌...</p>
          </div>
        ) : (
          <CardGrid />
        )}
      </main>
    </div>
  );
}
