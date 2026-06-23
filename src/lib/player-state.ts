"use client";

import { getProgress, setProgress } from "./card-storage";

// ═══ 属性 ═══
export interface PlayerAttrs {
  力量: number;
  智力: number;
  敏捷: number;
  魅力: number;
}

const DEFAULT_ATTRS: PlayerAttrs = { 力量: 3, 智力: 3, 敏捷: 3, 魅力: 3 };

const KEY_ATTRS = "player-attrs";
const KEY_TAGS  = "player-tags";
const KEY_ITEMS = "player-items";

// ─── 属性读写 ───
export async function getAttrs(groupKey: string): Promise<PlayerAttrs> {
  const raw = await getProgress(groupKey, KEY_ATTRS);
  if (!raw) { await setAttrs(groupKey, DEFAULT_ATTRS); return { ...DEFAULT_ATTRS }; }
  try { return { ...DEFAULT_ATTRS, ...JSON.parse(raw) }; } catch { return { ...DEFAULT_ATTRS }; }
}

export async function setAttrs(groupKey: string, attrs: PlayerAttrs) {
  await setProgress(groupKey, KEY_ATTRS, JSON.stringify(attrs));
}

export async function adjustAttrs(groupKey: string, delta: Partial<PlayerAttrs>) {
  const current = await getAttrs(groupKey);
  for (const k of Object.keys(delta) as (keyof PlayerAttrs)[]) {
    current[k] = Math.max(0, current[k] + (delta[k] || 0));
  }
  await setAttrs(groupKey, current);
}

// ─── 标签读写 ───
export async function getTags(groupKey: string): Promise<string[]> {
  const raw = await getProgress(groupKey, KEY_TAGS);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function setTags(groupKey: string, tags: string[]) {
  await setProgress(groupKey, KEY_TAGS, JSON.stringify(tags));
}

export async function hasTag(groupKey: string, tag: string): Promise<boolean> {
  const tags = await getTags(groupKey);
  return tags.includes(tag);
}

export async function addTag(groupKey: string, tag: string) {
  const tags = await getTags(groupKey);
  if (!tags.includes(tag)) { tags.push(tag); await setTags(groupKey, tags); }
}

export async function removeTag(groupKey: string, tag: string) {
  const tags = await getTags(groupKey);
  const idx = tags.indexOf(tag);
  if (idx >= 0) { tags.splice(idx, 1); await setTags(groupKey, tags); }
}

// ─── 背包读写 ───
export interface InventoryItem {
  itemId: string;
  qty: number;
}

export async function getItems(groupKey: string): Promise<InventoryItem[]> {
  const raw = await getProgress(groupKey, KEY_ITEMS);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function setItems(groupKey: string, items: InventoryItem[]) {
  await setProgress(groupKey, KEY_ITEMS, JSON.stringify(items));
}

export async function addItem(groupKey: string, itemId: string, qty: number = 1) {
  const items = await getItems(groupKey);
  const existing = items.find(i => i.itemId === itemId);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ itemId, qty });
  }
  await setItems(groupKey, items);
}

export async function removeItem(groupKey: string, itemId: string, qty: number = 1): Promise<boolean> {
  const items = await getItems(groupKey);
  const existing = items.find(i => i.itemId === itemId);
  if (!existing || existing.qty < qty) return false;
  existing.qty -= qty;
  if (existing.qty <= 0) {
    await setItems(groupKey, items.filter(i => i.itemId !== itemId));
  } else {
    await setItems(groupKey, items);
  }
  return true;
}

export async function hasItem(groupKey: string, itemId: string): Promise<boolean> {
  const items = await getItems(groupKey);
  return items.some(i => i.itemId === itemId && i.qty > 0);
}

export async function getItemQty(groupKey: string, itemId: string): Promise<number> {
  const items = await getItems(groupKey);
  return items.find(i => i.itemId === itemId)?.qty || 0;
}

// ─── 批量快照（一次请求获取全部状态）───
export interface PlayerState {
  attrs: PlayerAttrs;
  tags: string[];
  items: InventoryItem[];
}

export async function getPlayerState(groupKey: string): Promise<PlayerState> {
  const [attrs, tags, items] = await Promise.all([
    getAttrs(groupKey),
    getTags(groupKey),
    getItems(groupKey),
  ]);
  return { attrs, tags, items };
}
