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
