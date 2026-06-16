"use client";

import { setProgress, getProgress, getTokens } from "./card-storage";
import { addCard, addTokens } from "./card-storage";
import { ACHIEVEMENTS } from "./achievements";
import { ALL_CARDS, CardDef } from "./cards";
import { champions } from "./lol-data";

// ─── 已解锁缓存（瞬时读）───
const unlockedCache = new Set<string>();

// ─── 成就触发统一入口 ───
export async function tryUnlock(groupKey: string, achKey: string): Promise<{ success: boolean; achName?: string; achReward?: string } | null> {
  if (!groupKey) { console.log("❌ no groupKey for", achKey); return null; }
  if (unlockedCache.has(achKey)) return null; // 缓存命中

  const already = await getProgress(groupKey, `ach-${achKey}`);
  if (already === "1") { unlockedCache.add(achKey); return null; }

  // 标记解锁
  await setProgress(groupKey, `ach-${achKey}`, "1");
  unlockedCache.add(achKey);

  // 发放奖励
  const ach = ACHIEVEMENTS.find(a => a.key === achKey);
  if (!ach) return null;

  if (ach.reward.type === "card" && ach.reward.cardId) {
    await addCard(groupKey, ach.reward.cardId, 1);
  } else if (ach.reward.type === "tokens") {
    await addTokens(groupKey, ach.reward.amount || 0);
  }

  return { success: true, achName: ach.name, achReward: ach.reward.cardId };
}

// 同步已解锁列表到缓存
export async function syncUnlocked(groupKey: string) {
  for (const ach of ACHIEVEMENTS) {
    const v = await getProgress(groupKey, `ach-${ach.key}`);
    if (v === "1") unlockedCache.add(ach.key);
  }
}

// ─── 各成就触发点 ───

// 1. 受难曲 — 合成首次失败
let mergeFailedOnce = false;
export async function checkMergeFailed(groupKey: string): Promise<any> {
  if (mergeFailedOnce) return;
  mergeFailedOnce = true;
  return await tryUnlock(groupKey, "passion");
}

// 2. 不想回家 — 18:00-19:00 登录
export async function checkTimeLogin(groupKey: string) {
  const h = new Date().getHours();
  if (h >= 18 && h < 19) {
    return await tryUnlock(groupKey, "dont-go-home");
  }
}

// 3. 只有我和你的地方 — 首次登录暗号
let firstLoginDone = false;
export async function checkFirstLogin(groupKey: string): Promise<any> {
  if (firstLoginDone) return;
  firstLoginDone = true;
  return await tryUnlock(groupKey, "only-you-and-me");
}

// 4. 冰河时代 — 集齐所有弗雷尔卓德英雄白卡
export async function checkFreljordComplete(groupKey: string, collection: { card_id: string; count: number }[]) {
  const freljordIds = champions.filter(c => c.region === "弗雷尔卓德").map(c => `champ-${c.id}`);
  const hasAll = freljordIds.every(id => collection.some(c => c.card_id === id && c.count > 0));
  if (hasAll) return await tryUnlock(groupKey, "ice-age");
}

// 5. FIND YOU — 创建 K/DA 分类
export async function checkKdaCategory(groupKey: string, categoryName: string) {
  if (categoryName === "K/DA" || categoryName === "KDA" || categoryName === "k/da") {
    return await tryUnlock(groupKey, "find-you");
  }
}

// 6. GLORIA — 获得任意 GEM 卡
let gemCardOnce = false;
export async function checkGemCard(groupKey: string, cardId: string) {
  if (gemCardOnce) return;
  const card = ALL_CARDS.find(c => c.id === cardId);
  if (card?.type === "gem") {
    gemCardOnce = true;
    return await tryUnlock(groupKey, "gloria");
  }
}

// 7. 让世界暂停一分钟 — 首次上传照片
let photoUploadedOnce = false;
export async function checkFirstPhoto(groupKey: string) {
  if (photoUploadedOnce) return;
  photoUploadedOnce = true;
  return await tryUnlock(groupKey, "pause-the-world");
}

// 8. 离心力 — 单日猜错15次
export async function checkWrongGuesses(groupKey: string) {
  const today = new Date().toISOString().split("T")[0];
  const val = await getProgress(groupKey, "wrong-guesses-day");
  const data = val ? JSON.parse(val) : { date: today, count: 0 };
  if (data.date !== today) { data.date = today; data.count = 0; }
  data.count++;
  await setProgress(groupKey, "wrong-guesses-day", JSON.stringify(data));
  if (data.count >= 15) return await tryUnlock(groupKey, "centrifugal");
}

// 9. 天空没有极限 — 分类数≥5
export async function checkCategoryCount(groupKey: string, count: number) {
  if (count >= 5) return await tryUnlock(groupKey, "sky-no-limit");
}

// 10. 启示录 — 集齐所有 GEM 卡
export async function checkRevelation(groupKey: string, collection: { card_id: string; count: number }[]) {
  const gemIds = ALL_CARDS.filter(c => c.type === "gem").map(c => c.id);
  const hasAll = gemIds.every(id => collection.some(c => c.card_id === id && c.count > 0));
  if (hasAll) return await tryUnlock(groupKey, "revelation");
}
