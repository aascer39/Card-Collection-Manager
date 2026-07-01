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
