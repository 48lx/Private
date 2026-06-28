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
  if (!groupKey) return null;
  if (unlockedCache.has(achKey)) return null;

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

  // 所有成就统一发放10000代币
  if (ach.reward.tokens) {
    await addTokens(groupKey, ach.reward.tokens);
  }

  // 派发全局事件触发弹窗
  try {
    window.dispatchEvent(new CustomEvent("achievement-unlocked", {
      detail: { name: ach.name, cardId: ach.reward.cardId, tokens: ach.reward.tokens || 0 }
    }));
  } catch {}

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
export async function checkMergeFailed(groupKey: string): Promise<any> {
  const already = await getProgress(groupKey, "ach-passion");
  if (already === "1") return null;
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
export async function checkFirstLogin(groupKey: string): Promise<any> {
  const already = await getProgress(groupKey, "ach-only-you-and-me");
  if (already === "1") return null; // 已解锁
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
export async function checkGemCard(groupKey: string, cardId: string) {
  const already = await getProgress(groupKey, "ach-gloria");
  if (already === "1") return null;
  const card = ALL_CARDS.find(c => c.id === cardId);
  if (card?.type === "gem") return await tryUnlock(groupKey, "gloria");
  return null;
}

// 7. 让世界暂停一分钟 — 首次上传照片
export async function checkFirstPhoto(groupKey: string) {
  const already = await getProgress(groupKey, "ach-pause-the-world");
  if (already === "1") return null;
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
  const gemIds = ALL_CARDS.filter(c => c.type === "gem" && c.rarity !== "white" && c.rarity !== "special" && !c.id.includes("金鱼嘴") && !c.id.includes("启示录")).map(c => c.id);
  const hasAll = gemIds.every(id => collection.some(c => c.card_id === id && c.count > 0));
  if (hasAll) return await tryUnlock(groupKey, "revelation");
  return null;
}

// 11. 你不是第一个离开的人 — 距上次登录超24h
export async function checkReturnAfterAbsence(groupKey: string) {
  const lastVisit = await getProgress(groupKey, "last-visit-time");
  const now = Date.now();
  await setProgress(groupKey, "last-visit-time", String(now));
  if (lastVisit && now - parseInt(lastVisit) > 86400000) {
    return await tryUnlock(groupKey, "not-first-leave");
  }
  return null;
}

// 12. HELL·红 — 赌约抽中红牌
export async function checkHellRed(groupKey: string) {
  return await tryUnlock(groupKey, "hell-1");
}

// 13. HELL·黄 — 赌约抽中金牌
export async function checkHellGold(groupKey: string) {
  return await tryUnlock(groupKey, "hell-2");
}

// 14. 篮球可不是一个人的游戏 — 拥有勒布朗詹姆斯+文班亚马
export async function checkBasketball(groupKey: string, collection: { card_id: string; count: number }[]) {
  const hasLebron = collection.some(c => c.card_id === "max_NBA_勒布朗詹姆斯" && c.count > 0);
  const hasWemby = collection.some(c => c.card_id === "max_NBA_文班亚马" && c.count > 0);
  if (hasLebron && hasWemby) return await tryUnlock(groupKey, "basketball");
  return null;
}
