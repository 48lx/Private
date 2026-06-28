"use client";

import { supabase } from "./supabase";

const GROUP_KEY = "card-group";

// ─── 暗号管理 ───
export function getGroupKey(): string | null {
  try { return localStorage.getItem(GROUP_KEY); } catch { return null; }
}

export function setGroupKey(key: string) {
  try { localStorage.setItem(GROUP_KEY, key); } catch {}
}

// 确保 group 存在
async function ensureGroup(groupKey: string) {
  // 仅当 group 不存在时插入，不覆盖已有 tokens
  const { data } = await supabase.from("user_groups").select("group_key").eq("group_key", groupKey).maybeSingle();
  if (!data) {
    await supabase.from("user_groups").insert({ group_key: groupKey, tokens: 1000 });
  }
}

// ─── 代币 ───
export async function getTokens(groupKey: string): Promise<number> {
  await ensureGroup(groupKey);
  const { data } = await supabase.from("user_groups").select("tokens").eq("group_key", groupKey).maybeSingle();
  return data?.tokens ?? 1000;
}

export async function addTokens(groupKey: string, amount: number) {
  await ensureGroup(groupKey);
  const current = await getTokens(groupKey);
  await supabase.from("user_groups").update({ tokens: current + amount }).eq("group_key", groupKey);
}

export async function spendTokens(groupKey: string, amount: number): Promise<boolean> {
  const current = await getTokens(groupKey);
  if (current < amount) return false;
  await supabase.from("user_groups").update({ tokens: current - amount }).eq("group_key", groupKey);
  return true;
}

// ─── 卡牌收藏 ───
export async function getCollection(groupKey: string): Promise<{ card_id: string; count: number }[]> {
  await ensureGroup(groupKey);
  const { data } = await supabase.from("user_cards").select("card_id,count").eq("group_key", groupKey);
  return (data || []) as { card_id: string; count: number }[];
}

export async function addCard(groupKey: string, cardId: string, amount: number = 1) {
  await ensureGroup(groupKey);
  const { data: existing } = await supabase.from("user_cards").select("*").eq("group_key", groupKey).eq("card_id", cardId).maybeSingle();
  if (existing) {
    await supabase.from("user_cards").update({ count: existing.count + amount }).eq("group_key", groupKey).eq("card_id", cardId);
  } else {
    await supabase.from("user_cards").insert({ group_key: groupKey, card_id: cardId, count: amount });
  }
}

// 批量添加卡牌（大幅提速）
export async function addCardsBulk(groupKey: string, cardIds: string[]) {
  await ensureGroup(groupKey);
  // 统计合并
  const counts: Record<string, number> = {};
  for (const id of cardIds) { counts[id] = (counts[id] || 0) + 1; }

  // 批量查现有
  const uniqueIds = Object.keys(counts);
  const { data: existing } = await supabase.from("user_cards")
    .select("card_id,count").eq("group_key", groupKey).in("card_id", uniqueIds);

  const existingMap = new Map((existing || []).map((e: any) => [e.card_id, e.count]));

  // 分批更新/插入
  const updates: { card_id: string; count: number }[] = [];
  const inserts: { group_key: string; card_id: string; count: number }[] = [];

  for (const [cardId, addCount] of Object.entries(counts)) {
    const old = existingMap.get(cardId);
    if (old !== undefined) {
      updates.push({ card_id: cardId, count: old + addCount });
    } else {
      inserts.push({ group_key: groupKey, card_id: cardId, count: addCount });
    }
  }

  // 并发执行
  await Promise.all([
    ...updates.map(u => supabase.from("user_cards").update({ count: u.count }).eq("group_key", groupKey).eq("card_id", u.card_id)),
    ...inserts.map(i => supabase.from("user_cards").insert(i)),
  ]);
}

export async function removeCard(groupKey: string, cardId: string, amount: number = 1) {
  const { data: existing } = await supabase.from("user_cards").select("*").eq("group_key", groupKey).eq("card_id", cardId).maybeSingle();
  if (!existing) return;
  if (existing.count <= amount) {
    await supabase.from("user_cards").delete().eq("group_key", groupKey).eq("card_id", cardId);
  } else {
    await supabase.from("user_cards").update({ count: existing.count - amount }).eq("group_key", groupKey).eq("card_id", cardId);
  }
}

// ─── 进度存储 ───
export async function getProgress(groupKey: string, key: string): Promise<string> {
  const { data } = await supabase.from("user_progress").select("value").eq("group_key", groupKey).eq("key", key).maybeSingle();
  return data?.value || "";
}

export async function setProgress(groupKey: string, key: string, value: string) {
  await supabase.from("user_progress").upsert({ group_key: groupKey, key, value, updated_at: new Date().toISOString() }, { onConflict: "group_key,key" });
}

// ─── 分解 ───
export async function decomposeCard(groupKey: string, cardId: string, count: number, refundTokens: number) {
  await removeCard(groupKey, cardId, count);
  await addTokens(groupKey, refundTokens);
}

// ─── 签到系统 ───
export async function checkDailyCheckin(groupKey: string): Promise<string | null> {
  const today = new Date().toISOString().split("T")[0];
  const key = `daily-checkin-${today}`;
  const already = await getProgress(groupKey, key);
  if (already === "1") return null;
  await setProgress(groupKey, key, "1");
  // +2000 代币
  await addTokens(groupKey, 2000);
  // 随机给一张特殊卡
  const specialPool = ["mimic-white","mimic-white","mimic-blue","mimic-blue","mimic-gold","twisted-gamble","lonely-pull"];
  const cardId = specialPool[Math.floor(Math.random() * specialPool.length)];
  await addCard(groupKey, cardId, 1);
  return cardId;
}

// ─── 合成：4合1，概率失败 ───
// 白→蓝: 100% 成功
// 蓝→金: 50% 失败
// 金→终极: 80% 失败
// 失败保留1张，扣除3张
export const MERGE_RATES: Record<string, number> = {
  "white->blue": 100,
  "blue->gold": 50,
  "gold->ultimate": 20,
};

export interface MergeResult {
  success: boolean;
  fromCardId: string;
  toCardId?: string;
  lost: number;
}

export async function mergeCards4to1(
  groupKey: string,
  fromCardId: string,
  toCardId: string,
  rateKey: string,
): Promise<MergeResult> {
  const { data: existing } = await supabase.from("user_cards").select("count").eq("group_key", groupKey).eq("card_id", fromCardId).maybeSingle();
  if (!existing || existing.count < 4) return { success: false, fromCardId, lost: 0 };

  const successRate = MERGE_RATES[rateKey] || 100;
  const roll = Math.random() * 100;
  const success = roll < successRate;

  if (success) {
    // 扣4张源卡
    if (existing.count <= 4) {
      await supabase.from("user_cards").delete().eq("group_key", groupKey).eq("card_id", fromCardId);
    } else {
      await supabase.from("user_cards").update({ count: existing.count - 4 }).eq("group_key", groupKey).eq("card_id", fromCardId);
    }
    // 给1张目标卡
    await addCard(groupKey, toCardId, 1);
    return { success: true, fromCardId, toCardId, lost: 0 };
  } else {
    // 失败：扣3张，保留1张
    if (existing.count <= 3) {
      await supabase.from("user_cards").delete().eq("group_key", groupKey).eq("card_id", fromCardId);
    } else {
      await supabase.from("user_cards").update({ count: existing.count - 3 }).eq("group_key", groupKey).eq("card_id", fromCardId);
    }
    return { success: false, fromCardId, lost: 3 };
  }
}
