// ═══ 事件引擎 ═══
"use client";

import { GameEvent, EventChoice, EventOutcome, EventRequire, DailyLog } from "./event-types";
import { PlayerState } from "./player-state";
import { ALL_CARDS, REVELATION_CARDS } from "./cards";

// 禁魔石共鸣反应 — 魔法相关卡牌
export const MAGIC_CARDS = ["gold_拉克丝_灭国魔女", "max_邓紫棋_启示录", "gold_拉克丝_善意虚影"];
// 龙族相关卡牌
export const DRAGON_CARDS = ["champ-aurelionsol", "champ-shyvana", "champ-smolder"];
// 拉克丝相关卡牌
export const LUX_CARDS = ["champ-lux", "gold_拉克丝_善意虚影"];

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

  // 战地日记残页：德玛西亚趣味事件权重-1
  const hasDiary = playerState.items.some(i => i.itemId === "战地日记残页" && i.qty > 0);
  const totalWeight = available.reduce((sum, e) => sum + (hasDiary && e.region === "demacia" && e.type === "fun" ? Math.max(0, e.weight - 1) : e.weight), 0);
  let r = Math.random() * totalWeight;
  for (const e of available) {
    r -= (hasDiary && e.region === "demacia" && e.type === "fun" ? Math.max(0, e.weight - 1) : e.weight);
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
  forceFail?: boolean,
): ChoiceResult {
  // 纸醉金迷：每日首次探索检定必定失败
  if (forceFail && choice.check) {
    const outcome = choice.failure || choice.success;
    return { choiceIndex, success: false, outcome };
  }
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
      let required: string[];
      if (check.hasCard === "__revelation__") required = REVELATION_CARDS;
      else if (check.hasCard === "__magic__") required = MAGIC_CARDS;
      else if (check.hasCard === "__lux__") required = LUX_CARDS;
      else if (check.hasCard === "__dragon__") required = DRAGON_CARDS;
      else required = [check.hasCard];
      if (!cardSlot || !required.includes(cardSlot)) {
        hardReasons.push(
          check.hasCard === "__revelation__" ? "需要启示录专辑卡"
          : check.hasCard === "__magic__" ? "需要魔法卡牌(灭国魔女/启示录/善意虚影)"
          : check.hasCard === "__dragon__" ? "需要龙族卡牌(索尔/希瓦娜/斯莫德)"
          : check.hasCard === "__lux__" ? "需要拉克丝卡牌(光辉女郎/善意虚影)"
          : `需要卡牌:${check.hasCard}`
        );
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
