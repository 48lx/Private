// ═══ 事件系统类型定义 ═══

import { PlayerAttrs } from "./player-state";

// ─── 事件分类 ───
export type EventType = "normal" | "side" | "clue" | "hero" | "fun";

// ─── 线索五类型 ───
export type ClueType = "A" | "B" | "C" | "D" | "E";

/** 线索奖励 */
export interface ClueReward {
  region: string;    // 所属地区
  type: ClueType;    // A=完整图 B=完整名 C=原画截图 D=种族信息 E=音频
  data: string;      // 线索内容（图片URL / 文字 / 音频URL）
}

// ─── 选项 ───

/** 选项的条件判定 */
export interface EventCheck {
  attrs?: Partial<PlayerAttrs>;   // 属性门槛，如 { 力量: 10 }
  hasTag?: string;                // 必须拥有的标签
  hasItem?: string;               // 必须拥有的道具
  hasCard?: string;               // 卡槽中必须放入的卡牌ID
  hasCardType?: string;            // 卡槽中放入的卡牌类型（如 "gem"）
  costTokens?: number;            // 消耗代币
  consumeItem?: string;           // 消耗的道具
  consumeCard?: boolean;          // 是否消耗卡槽中的卡
}

/** 选项的结果 */
export interface EventOutcome {
  // 基础奖励
  message?: string;           // 结果描述（直接显示给玩家）
  tokens?: number;
  vitality?: number;
  attrDelta?: Partial<PlayerAttrs>;
  // 标签
  addTags?: string[];
  removeTags?: string[];
  // 道具
  addItems?: string[];
  // 线索
  addClues?: ClueReward[];
  // 卡牌
  addCards?: string[];            // 获得卡牌ID
  removeCards?: string[];         // 失去卡牌ID
  // 阶段推进（英雄事件用）
  unlockStage?: string;
  // 特殊
  redirectTo?: string;            // 跳转到另一个事件
}

// ─── 选项 ───

export interface EventChoice {
  label: string;                   // 选项文字
  check?: EventCheck;              // 可选的判定条件
  successRate?: number;            // 成功率 0-100，默认 100
  success: EventOutcome;           // 成功结果
  failure?: EventOutcome;          // 失败结果
  repeatable?: boolean;            // 是否可重复选择（默认 false）
  consumeCard?: boolean;           // 选择后是否消耗卡槽中的卡
  hideCheck?: Partial<EventCheck>; // 不满足时完全隐藏该选项
}

// ─── 事件 ───

/** 前置条件（此事件是否可选） */
export interface EventRequire {
  tags?: string[];          // 必须拥有的标签
  notTags?: string[];       // 不能拥有的标签
  items?: string[];         // 必须拥有的道具
  cards?: string[];         // 必须拥有的卡牌
  attr?: Partial<PlayerAttrs>; // 最低属性要求
}

export interface GameEvent {
  id: string;
  region: string;           // 所属地区ID
  type: EventType;          // 事件类型
  weight: number;           // 随机权重
  name: string;             // 事件名
  desc: string;             // 事件描述（正文）
  summary?: string;         // 简短摘要（面板顶栏显示）
  image?: string;           // 自定义背景图（空则用地区默认图）
  vitalityCost?: number;    // 触发事件消耗活力（默认0）
  require?: EventRequire;   // 前置条件
  choices: EventChoice[];   // 选项列表

  // 英雄事件专用
  heroId?: string;          // 英雄ID
  heroStage?: 1 | 2 | 3;   // 阶段

  altChoices?: EventChoice[];
  altRequire?: EventRequire;
}

// ─── 事件面板 UI 模型 ───

/** 地区总览（进入地区后、开始探索前） */
export interface RegionOverview {
  regionId: string;
  regionName: string;
  regionImage: string;         // 地区风景图
  clues: (ClueReward | null)[]; // 5个线索槽，null=未获得
  explored: boolean;            // 是否已经探索过
  dailyEventId: string | null;  // 今日已触发的事件ID（探索后填充）
}

/** 事件面板（选中选项/执行中） */
export interface EventPanel {
  event: GameEvent;
  image: string;               // 实际使用的背景图
  cardSlot: string | null;     // 卡槽中放入的卡牌ID，null=空
  selectedChoice: number | null; // 当前选中的选项索引，null=未选
  result: EventResult | null;  // 执行结果
}

/** 选项执行后的反馈 */
export interface EventResult {
  choiceIndex: number;
  success: boolean;
  outcome: EventOutcome;
  message: string;             // 结果描述文字
}

// ─── 英雄阶段 ───

/** 英雄事件进度（按玩家存储） */
export interface HeroProgress {
  heroId: string;
  stage: 1 | 2 | 3;            // 当前阶段
  secretAsked: boolean;        // 秘宝线索已问过？
  guardianAsked: boolean;      // 守护者线索已问过？
}

// ─── 每日记录 ───

/** 当日探索日志（防止同一天重复触发同一事件） */
export interface DailyLog {
  date: string;                 // YYYY-MM-DD
  triggeredEvents: string[];    // 今天已触发的事件ID
  vitalityUsed: number;         // 今天已消耗的活力
}

// ─── 秘宝 ───

/** 地区秘宝定义 */
export interface RegionTreasure {
  region: string;               // 地区ID
  name: string;                 // 秘宝完整名称（线索B揭示）
  image: string;                // 秘宝完整图片（线索A揭示）
  guardianHero: string;         // 守护者英雄ID
  guardianImage: string;        // 守护者原画截图（线索C揭示）
  guardianSpecies: string;      // 守护者种族信息（线索D揭示）
  guardianAudio: string;        // 守护者台词音频URL（线索E揭示）
}
