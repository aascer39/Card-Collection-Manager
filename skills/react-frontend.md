# React Frontend GUI — Card Collection Manager

## Purpose

Generate a production-quality React + TypeScript frontend for a Tauri + Rust + SQLite desktop card collection application. The frontend manages 52 playing cards + boxes with collection status, search, multi-select, batch operations, and multiple view modes.

## Scope

### Use when:
- Building the frontend UI layer of a Tauri desktop app
- Managing card/collection state with Zustand
- Implementing card grids with suit-group or collection-status views
- Adding search, multi-select, batch operations
- Communicating with Rust backend via Tauri `invoke` API

### DO NOT use when:
- Building a server-side rendered or Next.js app (this is a Tauri desktop app)
- Using an ORM or direct SQL in frontend
- Managing state via Redux or Context (use Zustand)
- Direct DOM manipulation or jQuery

## Rules

### MUST:
- Use React functional components ONLY — no class components
- Use TypeScript for all files (`.tsx` / `.ts`)
- Use Zustand for all global state management
- Use Tauri `@tauri-apps/api` invoke for ALL backend communication
- Keep UI and API logic strictly separated (services layer)
- Use Framer Motion for animations
- Implement debounced search (300ms)
- Support two view modes: suit-group view and collection-status view
- Use CSS modules or Tailwind for styling (NOT inline styles for layout)
- Handle loading, empty, and error states for every data-fetching component

### MUST NOT:
- Directly manipulate the DOM (no `document.querySelector`, `getElementById`, etc.)
- Embed SQL or database logic in frontend code
- Mix Tauri invoke calls directly inside UI component rendering
- Use class-based React components
- Use any ORM library
- Hardcode card data — always fetch from backend

## Implementation Steps

### Step 1: Project Structure

Create the following directory structure inside `src/`:

```
src/
├── components/
│   ├── Card/
│   │   ├── Card.tsx
│   │   └── Card.module.css
│   ├── CardGrid/
│   │   ├── CardGrid.tsx
│   │   └── CardGrid.module.css
│   ├── Toolbar/
│   │   ├── Toolbar.tsx
│   │   └── Toolbar.module.css
│   ├── SearchBar/
│   │   ├── SearchBar.tsx
│   │   └── SearchBar.module.css
│   ├── ViewSwitcher/
│   │   ├── ViewSwitcher.tsx
│   │   └── ViewSwitcher.module.css
│   └── ConfirmModal/
│       ├── ConfirmModal.tsx
│       └── ConfirmModal.module.css
├── store/
│   └── cardStore.ts
├── services/
│   └── api.ts
├── types/
│   └── card.ts
├── pages/
│   └── HomePage.tsx
├── App.tsx
└── main.tsx
```

### Step 2: Types Definition (`src/types/card.ts`)

```typescript
export type Suit = 'spade' | 'heart' | 'club' | 'diamond' | 'box';

export type ViewMode = 'suit' | 'status';

export interface Card {
  id: number;
  name: string;
  suit: Suit;
  rank: string;
  collected: boolean;
}

export interface CardGroup {
  label: string;
  cards: Card[];
}

export type BatchAction = 'collect' | 'uncollect' | 'reset';
```

### Step 3: API Service Layer (`src/services/api.ts`)

Create a clean abstraction over Tauri invoke:

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Card } from '../types/card';

export async function getCards(): Promise<Card[]> {
  return invoke<Card[]>('get_cards');
}

export async function searchCards(keyword: string): Promise<Card[]> {
  return invoke<Card[]>('search_cards', { keyword });
}

export async function toggleCollect(cardId: number): Promise<Card> {
  return invoke<Card>('toggle_collect', { cardId });
}

export async function batchUpdate(ids: number[], collected: boolean): Promise<void> {
  return invoke<void>('batch_update', { ids, collected });
}

export async function resetCollection(): Promise<void> {
  return invoke<void>('reset_collection');
}
```

### Step 4: Zustand Store (`src/store/cardStore.ts`)

```typescript
import { create } from 'zustand';
import type { Card, ViewMode } from '../types/card';
import * as api from '../services/api';

interface CardState {
  cards: Card[];
  viewMode: ViewMode;
  selectedIds: Set<number>;
  searchKeyword: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCards: () => Promise<void>;
  searchCards: (keyword: string) => Promise<void>;
  toggleCollect: (cardId: number) => Promise<void>;
  toggleSelect: (cardId: number) => void;
  selectAll: () => void;
  invertSelection: () => void;
  clearSelection: () => void;
  batchMarkCollected: () => Promise<void>;
  batchMarkUncollected: () => Promise<void>;
  resetCollection: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setSearchKeyword: (keyword: string) => void;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  viewMode: 'suit',
  selectedIds: new Set<number>(),
  searchKeyword: '',
  isLoading: false,
  error: null,

  fetchCards: async () => {
    set({ isLoading: true, error: null });
    try {
      const cards = await api.getCards();
      set({ cards, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  searchCards: async (keyword: string) => {
    set({ isLoading: true, error: null });
    try {
      const cards = keyword.trim()
        ? await api.searchCards(keyword.trim())
        : await api.getCards();
      set({ cards, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  toggleCollect: async (cardId: number) => {
    try {
      const updated = await api.toggleCollect(cardId);
      set((state) => ({
        cards: state.cards.map((c) => (c.id === cardId ? updated : c)),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  toggleSelect: (cardId: number) => {
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return { selectedIds: next };
    });
  },

  selectAll: () => {
    set((state) => ({
      selectedIds: new Set(state.cards.map((c) => c.id)),
    }));
  },

  invertSelection: () => {
    set((state) => {
      const allIds = new Set(state.cards.map((c) => c.id));
      const next = new Set<number>();
      for (const id of allIds) {
        if (!state.selectedIds.has(id)) next.add(id);
      }
      return { selectedIds: next };
    });
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  batchMarkCollected: async () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    try {
      await api.batchUpdate(Array.from(selectedIds), true);
      set((state) => ({
        cards: state.cards.map((c) =>
          state.selectedIds.has(c.id) ? { ...c, collected: true } : c
        ),
        selectedIds: new Set(),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  batchMarkUncollected: async () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    try {
      await api.batchUpdate(Array.from(selectedIds), false);
      set((state) => ({
        cards: state.cards.map((c) =>
          state.selectedIds.has(c.id) ? { ...c, collected: false } : c
        ),
        selectedIds: new Set(),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  resetCollection: async () => {
    try {
      await api.resetCollection();
      set((state) => ({
        cards: state.cards.map((c) => ({ ...c, collected: false })),
        selectedIds: new Set(),
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),
}));
```

### Step 5: Components

#### Card component (`src/components/Card/Card.tsx`)

```tsx
import { motion } from 'framer-motion';
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

export function Card({ card, isSelected, onToggleCollect, onToggleSelect }: CardProps) {
  const suitSymbol = SUIT_SYMBOLS[card.suit] || '';
  const suitColor = SUIT_COLORS[card.suit] || '#222';

  return (
    <motion.div
      className={`${styles.card} ${card.collected ? styles.collected : styles.uncollected} ${isSelected ? styles.selected : ''}`}
      onClick={onToggleCollect}
      onContextMenu={(e) => { e.preventDefault(); onToggleSelect(); }}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <span className={styles.rank} style={{ color: suitColor }}>{card.rank}</span>
      <span className={styles.suit} style={{ color: suitColor }}>{suitSymbol}</span>
      <span className={styles.name}>{card.name}</span>
      {isSelected && (
        <motion.div
          className={styles.selectionBadge}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
}
```

#### CardGrid component (`src/components/CardGrid/CardGrid.tsx`)

Supports both view modes. Groups cards by suit or by collection status.

```tsx
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../Card/Card';
import { useCardStore } from '../../store/cardStore';
import type { Card as CardType, CardGroup } from '../../types/card';
import styles from './CardGrid.module.css';

const SUIT_LABELS: Record<string, string> = {
  spade: '♠ Spades',
  heart: '♥ Hearts',
  club: '♣ Clubs',
  diamond: '♦ Diamonds',
  box: '📦 Boxes',
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
  return [
    { label: '✅ Collected', cards: collected },
    { label: '⬜ Not Collected', cards: uncollected },
  ];
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
        <p>No cards found.</p>
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
            <h2 className={styles.groupLabel}>{group.label} ({group.cards.length})</h2>
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
```

#### SearchBar component (`src/components/SearchBar/SearchBar.tsx`)

300ms debounce on input with real-time filtering.

```tsx
import { useState, useEffect, useRef } from 'react';
import { useCardStore } from '../../store/cardStore';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const { searchKeyword, setSearchKeyword, searchCards, fetchCards } = useCardStore();
  const [localValue, setLocalValue] = useState(searchKeyword);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchKeyword(localValue);
      searchCards(localValue);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [localValue, searchCards, setSearchKeyword]);

  const handleClear = () => {
    setLocalValue('');
    setSearchKeyword('');
    fetchCards();
  };

  return (
    <div className={styles.searchBar}>
      <span className={styles.icon}>🔍</span>
      <input
        type="text"
        className={styles.input}
        placeholder="Search by name, suit, or rank..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
      {localValue && (
        <button className={styles.clear} onClick={handleClear} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}
```

#### Toolbar component (`src/components/Toolbar/Toolbar.tsx`)

Batch actions, selection controls, view switching.

```tsx
import { useCardStore } from '../../store/cardStore';
import { ViewSwitcher } from '../ViewSwitcher/ViewSwitcher';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import styles from './Toolbar.module.css';
import { useState } from 'react';

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
      <ViewSwitcher />
      <SearchBar />

      <div className={styles.actions}>
        <button onClick={selectAll} className={styles.btn}>Select All</button>
        <button onClick={invertSelection} className={styles.btn}>Invert</button>
        {count > 0 && <span className={styles.count}>{count} selected</span>}
        {count > 0 && (
          <>
            <button onClick={clearSelection} className={styles.btn}>Clear</button>
            <button onClick={batchMarkCollected} className={`${styles.btn} ${styles.collect}`}>
              ✓ Mark Collected
            </button>
            <button onClick={batchMarkUncollected} className={`${styles.btn} ${styles.uncollect}`}>
              ✗ Mark Uncollected
            </button>
          </>
        )}
        <button onClick={() => setShowResetModal(true)} className={`${styles.btn} ${styles.danger}`}>
          Reset All
        </button>
      </div>

      {showResetModal && (
        <ConfirmModal
          title="Reset All Collections?"
          message="This will mark ALL cards as uncollected. This action cannot be undone."
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
```

#### ConfirmModal component (`src/components/ConfirmModal/ConfirmModal.tsx`)

Reusable confirmation dialog for destructive actions.

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
          <div className={styles.actions}>
            <button onClick={onCancel} className={styles.cancelBtn}>{cancelLabel}</button>
            <button
              onClick={onConfirm}
              className={`${styles.confirmBtn} ${danger ? styles.dangerBtn : ''}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

#### ViewSwitcher component (`src/components/ViewSwitcher/ViewSwitcher.tsx`)

Toggle between suit-group and status-group views.

```tsx
import { useCardStore } from '../../store/cardStore';
import type { ViewMode } from '../../types/card';
import styles from './ViewSwitcher.module.css';

export function ViewSwitcher() {
  const { viewMode, setViewMode } = useCardStore();

  const modes: { key: ViewMode; label: string }[] = [
    { key: 'suit', label: 'By Suit' },
    { key: 'status', label: 'By Status' },
  ];

  return (
    <div className={styles.switcher}>
      {modes.map((mode) => (
        <button
          key={mode.key}
          className={`${styles.btn} ${viewMode === mode.key ? styles.active : ''}`}
          onClick={() => setViewMode(mode.key)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
```

### Step 6: HomePage Layout (`src/pages/HomePage.tsx`)

```tsx
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
      <div className={styles.error}>
        <p>Error loading cards: {error}</p>
        <button onClick={fetchCards}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>🃏 Card Collection Manager</h1>
      </header>
      <Toolbar />
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading cards...</p>
          </div>
        ) : (
          <CardGrid />
        )}
      </main>
    </div>
  );
}
```

### Step 7: App Entry Points

**`src/App.tsx`:**
```tsx
import { HomePage } from './pages/HomePage';

export default function App() {
  return <HomePage />;
}
```

**`src/main.tsx`:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Code Patterns

### Pattern 1: Debounced Search Hook

```typescript
function useDebouncedSearch(ms = 300) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // trigger search
    }, ms);
    return () => clearTimeout(timerRef.current);
  }, [value, ms]);

  return { value, setValue };
}
```

### Pattern 2: Keyboard multi-select (Shift/Ctrl)

```typescript
function handleClick(e: React.MouseEvent, cardId: number) {
  if (e.ctrlKey || e.metaKey) {
    // toggle single card in selection
    toggleSelect(cardId);
  } else if (e.shiftKey && lastClickedId !== null) {
    // select range from lastClickedId to cardId
    selectRange(lastClickedId, cardId);
  } else {
    // single selection only
    clearSelection();
    toggleSelect(cardId);
  }
  setLastClickedId(cardId);
}
```

### Pattern 3: Tauri invoke error boundary

```typescript
async function safeInvoke<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: string }> {
  try {
    const data = await fn();
    return { data };
  } catch (e) {
    return { error: String(e) };
  }
}
```

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Empty card list | Show "No cards found" empty state with retry option |
| Search with no results | Display "No cards match your search" message |
| Network/backend error | Show error banner with retry button, preserve existing cards in state |
| Double-click rapid toggle | Debounce not needed — Tauri invoke is sequential; use Zustand optimistic update with rollback |
| All cards selected then batch action | Batch API call handles empty ID list gracefully |
| View switch while loading | Each view recalculates groups from cached `cards` state — no extra fetch needed |
| Keyboard multi-select on first click | If `lastClickedId` is null, Shift+click selects only the clicked card |
| Reset while cards are selected | ConfirmModal warns, and store clears selection after reset |
| Window resize / responsive | Card grid uses CSS Grid with `auto-fill` and `minmax` — no JS resize listeners |
| Rapid search typing (many keystrokes) | 300ms debounce cancels previous timer on each keystroke; only latest fires |
| Special characters in search | Pass raw string via invoke — Rust handles SQL LIKE escaping |
| Empty search after previous search | When input is cleared, fall back to `fetchCards()` to show all cards |

## Output Format Rules

When this skill is invoked:

1. **Always create files in the correct subdirectories** under `src/`
2. **Always use TypeScript** — no plain JavaScript files
3. **Always import from `@tauri-apps/api/core`** for invoke, never from `@tauri-apps/api/tauri`
4. **Always separate concerns** — API calls in `services/api.ts`, state in `store/cardStore.ts`, UI in `components/`
5. **Always handle loading/error/empty states** for every component that fetches data
6. **Always use Framer Motion** `motion.div` for any animated element
7. **Always use CSS modules** (`.module.css`) for component styling
8. **Do NOT generate backend code** — only frontend React/TypeScript files

## Example

### Example usage: Generate the full frontend

```
Invoke this skill to generate the complete React frontend for the card collection manager.

The skill will create:
1. `src/types/card.ts` — TypeScript type definitions
2. `src/services/api.ts` — Tauri invoke wrappers
3. `src/store/cardStore.ts` — Zustand state management
4. `src/components/Card/Card.tsx` + CSS module — individual card
5. `src/components/CardGrid/CardGrid.tsx` + CSS module — grouped grid
6. `src/components/SearchBar/SearchBar.tsx` + CSS module — search with debounce
7. `src/components/Toolbar/Toolbar.tsx` + CSS module — action toolbar
8. `src/components/ViewSwitcher/ViewSwitcher.tsx` + CSS module — view toggle
9. `src/components/ConfirmModal/ConfirmModal.tsx` + CSS module — confirmation dialog
10. `src/pages/HomePage.tsx` + CSS module — main page layout
11. `src/App.tsx` — root component
12. `src/main.tsx` — entry point
```

### Example response from Claude Code:

```
✅ Created src/types/card.ts
✅ Created src/services/api.ts
✅ Created src/store/cardStore.ts
✅ Created src/components/Card/Card.tsx
✅ Created src/components/Card/Card.module.css
✅ Created src/components/CardGrid/CardGrid.tsx
✅ Created src/components/CardGrid/CardGrid.module.css
✅ Created src/components/SearchBar/SearchBar.tsx
✅ Created src/components/SearchBar/SearchBar.module.css
✅ Created src/components/Toolbar/Toolbar.tsx
✅ Created src/components/Toolbar/Toolbar.module.css
✅ Created src/components/ViewSwitcher/ViewSwitcher.tsx
✅ Created src/components/ViewSwitcher/ViewSwitcher.module.css
✅ Created src/components/ConfirmModal/ConfirmModal.tsx
✅ Created src/components/ConfirmModal/ConfirmModal.module.css
✅ Created src/pages/HomePage.tsx
✅ Created src/pages/HomePage.module.css
✅ Created src/App.tsx
✅ Created src/main.tsx

Frontend structure generated. Run `npm install && npm run dev` to start.
```
