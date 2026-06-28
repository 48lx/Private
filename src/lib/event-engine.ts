// ═══ 事件引擎 ═══
"use client";

import { GameEvent, EventChoice, EventOutcome, EventRequire, DailyLog } from "./event-types";
import { PlayerState } from "./player-state";
import { ALL_CARDS, REVELATION_CARDS } from "./cards";

// ─── 事件选取 ───

export function pickEvent(
  region: string,
  events: GameEvent[],
  playerState: PlayerState,
  dailyLog: DailyLog | null,
): GameEvent | null {
  const today = new Date().toISOString().split("T")[0];
  const triggered = dailyLog?.date === today ? dailyLog.triggeredEvents : [];

  const available = events.filter(e => {
    if (e.region !== region) return false;
    // 跳过今天已触发的
    if (triggered.includes(e.id)) return false;
    // 检查前置条件
    if (!checkRequire(e.require, playerState)) return false;
    return true;
  });

  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const e of available) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return available[available.length - 1];
}

// ─── 前置条件判定 ───

export function checkRequire(req: EventRequire | undefined, state: PlayerState): boolean {
  if (!req) return true;
  if (req.tags && !req.tags.every(t => state.tags.includes(t))) return false;
  if (req.notTags && req.notTags.some(t => state.tags.includes(t))) return false;
  if (req.items && !req.items.every(i => state.items.some(s => s.itemId === i && s.qty > 0))) return false;
  if (req.attr) {
    for (const k of Object.keys(req.attr) as (keyof typeof req.attr)[]) {
      if ((state.attrs[k] || 0) < (req.attr[k] || 0)) return false;
    }
  }
  return true;
}

// ─── 选项执行 ───

export interface ChoiceResult {
  choiceIndex: number;
  success: boolean;
  outcome: EventOutcome;
}

/** 执行一个选项，返回结果。不修改任何状态，由调用方处理。 */
export function executeChoice(
  choice: EventChoice,
  choiceIndex: number,
  playerState: PlayerState,
): ChoiceResult {
  // 判定
  let success = true;
  if (choice.check) {
    const c = choice.check;
    // 属性判定
    if (c.attrs) {
      for (const k of Object.keys(c.attrs) as (keyof typeof c.attrs)[]) {
        if ((playerState.attrs[k] || 0) < (c.attrs[k] || 0)) {
          success = false;
          break;
        }
      }
    }
    // 标签判定
    if (success && c.hasTag && !playerState.tags.includes(c.hasTag)) success = false;
    // 道具判定
    if (success && c.hasItem && !playerState.items.some(i => i.itemId === c.hasItem && i.qty > 0)) success = false;
    // 成功率掷骰
    if (success && choice.successRate !== undefined && choice.successRate < 100) {
      success = Math.random() * 100 < choice.successRate;
    }
  }

  const outcome = success ? choice.success : (choice.failure || choice.success);
  return { choiceIndex, success, outcome };
}

// ─── 获取适用选项 ───

/** 根据玩家状态获取选项（属性不达标不隐藏，仅标记检定类型） */
export function getAvailableChoices(
  event: GameEvent,
  playerState: PlayerState,
  cardSlot?: string | null,
): { choice: EventChoice; disabled: boolean; reason: string; checkLabel: string }[] {
  let choices = event.choices;
  if (event.altChoices && event.altRequire && checkRequire(event.altRequire, playerState)) {
    choices = event.altChoices;
  }

  return choices.filter(c => {
    // hideCheck: 不满足则完全隐藏
    if (c.hideCheck) {
      const hc = c.hideCheck;
      if (hc.attrs) {
        for (const k of Object.keys(hc.attrs) as (keyof typeof hc.attrs)[]) {
          if ((playerState.attrs[k] || 0) < (hc.attrs[k] || 0)) return false;
        }
      }
      if (hc.hasTag && !playerState.tags.includes(hc.hasTag)) return false;
      if (hc.hasItem && !playerState.items.some(i => i.itemId === hc.hasItem && i.qty > 0)) return false;
    }
    return true;
  }).map((c) => {
    const check = c.check;
    if (!check) return { choice: c, disabled: false, reason: "", checkLabel: "" };

    const hardReasons: string[] = [];
    if (check.hasTag && !playerState.tags.includes(check.hasTag)) {
      hardReasons.push(`需要标签:${check.hasTag}`);
    }
    if (check.hasItem && !playerState.items.some(i => i.itemId === check.hasItem && i.qty > 0)) {
      hardReasons.push(`需要道具:${check.hasItem}`);
    }
    if (check.hasCard) {
      const required = check.hasCard === "__revelation__" ? REVELATION_CARDS : [check.hasCard];
      if (!cardSlot || !required.includes(cardSlot)) {
        hardReasons.push(check.hasCard === "__revelation__" ? "需要启示录专辑卡" : `需要卡牌:${check.hasCard}`);
      }
    }
    if (check.hasCardType && cardSlot) {
      // 检查卡槽中的卡类型是否匹配
      const slotCard = ALL_CARDS?.find(c => c.id === cardSlot);
      if (!slotCard || slotCard.type !== check.hasCardType) {
        hardReasons.push(`需要${check.hasCardType}类型卡牌`);
      }
    }

    // 属性检定：不隐藏，只显示检定类型
    let checkLabel = "";
    if (check.attrs) {
      const names: Record<string, string> = { 力量: "力", 智力: "智", 敏捷: "敏", 魅力: "魅" };
      checkLabel = "检定：" + Object.keys(check.attrs).map(k => names[k] || k).join(" ");
    }

    return {
      choice: c,
      disabled: hardReasons.length > 0,
      reason: hardReasons.join(", "),
      checkLabel,
    };
  });
}
