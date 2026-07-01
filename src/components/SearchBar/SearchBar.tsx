import { useState, useEffect, useRef } from 'react';
import { useCardStore } from '../../store/cardStore';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const { searchKeyword, setSearchKeyword, searchCards, fetchCards } = useCardStore();
  const [localValue, setLocalValue] = useState(searchKeyword);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the debounce on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setSearchKeyword(localValue);
      if (localValue.trim()) {
        searchCards(localValue);
      } else {
        fetchCards();
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // We intentionally only react to localValue changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue]);

  const handleClear = () => {
    setLocalValue('');
    setSearchKeyword('');
    fetchCards();
    inputRef.current?.focus();
  };

  return (
    <div className={styles.searchBar}>
      <span className={styles.icon} aria-hidden="true">{'🔍'}</span>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="搜索名称、花色或点数..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        aria-label="搜索卡牌"
      />
      {localValue && (
        <button
          className={styles.clear}
          onClick={handleClear}
          aria-label="清除搜索"
          type="button"
        >
          {'✕'}
        </button>
      )}
    </div>
  );
}
