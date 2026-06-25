// ═══ 卡牌系统 ═══
// 数据来源：card-map.json → cards-generated.ts

export type Rarity = "white" | "blue" | "gold" | "ultimate" | "special";
export type CardType = "champion" | "gem" | "cyberpunk" | "skin";

export interface CardDef {
  id: string;
  name: string;
  rarity: Rarity;
  type: CardType;
  imageUrl?: string;
  imageFile?: string;   // public/cards/ 下的文件名
  upgradable?: boolean;
  upgradableGroup?: string;
  hidden?: boolean;      // 隐藏卡：未拥有时名称/卡面均显示"隐藏卡"
}

// 每张卡权重（终极:16 金:60 蓝:240 白:360 特殊:0不参与普通抽卡）
export const CARD_WEIGHT_BY_RARITY: Record<Rarity, number> = {
  ultimate: 16,
  gold: 60,
  blue: 240,
  white: 360,
  special: 0,
};

export const RARITY_LABELS: Record<Rarity | "special", string> = {
  white: "白卡",
  special: "特殊",
  blue: "蓝卡",
  gold: "金卡",
  ultimate: "终极",
};

export const RARITY_COLORS: Record<Rarity | "all" | "special", string> = {
  all: "#ffd700",
  special: "#ff6bff",
  white: "#c0c0c0",
  blue: "#4da8da",
  gold: "#ffd700",
  ultimate: "#ff6bff",
};

// 概率表
export const RATE_TABLE = [
  { rarity: "white" as Rarity, rate: "~80%", desc: "全英雄+特殊角色" },
  { rarity: "blue" as Rarity, rate: "~16%", desc: "皮肤+特殊角色" },
  { rarity: "gold" as Rarity, rate: "~4%", desc: "至臻皮肤+特殊角色" },
  { rarity: "ultimate" as Rarity, rate: "~0.2%", desc: "螳螂/剑魔/GEM/2077" },
  { rarity: "special" as Rarity, rate: "保底", desc: "十连必得1张 / 百连10张" },
];

// 四张可升级终极卡组
export const UPGRADE_GROUPS = ["khazix", "aatrox", "gem", "cyberpunk2077"];

// ─── 合成目标映射 ───
// group → fromRarity → toCardId（4张同稀有度 → 1张下一稀有度的指定卡）
export const MERGE_TARGETS: Record<string, Record<string, string>> = {
  khazix: {
    white: "blue_卡兹克_虚空掠夺者",
    blue: "gold_卡兹克_霸天异形",
    gold: "max_卡兹克_刹那银光",
  },
  aatrox: {
    white: "blue_亚托克斯_暗裔剑魔",
    blue: "gold_亚托克斯_霸天剑魔",
    gold: "max_亚托克斯_涤罪之翼",
  },
  gem: {
    white: "blue_邓紫棋_金鱼嘴",
    blue: "gold_邓紫棋_金鱼嘴",
    gold: "max_邓紫棋_金鱼嘴",
  },
  cyberpunk2077: {
    white: "blue_2077_V",
    blue: "gold_2077_V",
    gold: "max_2077_V",
  },
};

// 合成链（卡ID → 下一级卡ID）——只有四条升级线上的特定卡
export const MERGE_CHAIN: Record<string, string | null> = {
  // 卡兹克：虚空掠夺者 → 霸天异形 → 刹那银光
  "champ-khazix": "blue_卡兹克_虚空掠夺者",
  "blue_卡兹克_虚空掠夺者": "gold_卡兹克_霸天异形",
  "gold_卡兹克_霸天异形": "max_卡兹克_刹那银光",
  // 剑魔：暗裔剑魔 → 霸天剑魔 → 涤罪之翼
  "champ-aatrox": "blue_亚托克斯_暗裔剑魔",
  "blue_亚托克斯_暗裔剑魔": "gold_亚托克斯_霸天剑魔",
  "gold_亚托克斯_霸天剑魔": "max_亚托克斯_涤罪之翼",
  // 金鱼嘴：三张金鱼嘴
  "gem-white": "blue_邓紫棋_金鱼嘴",
  "blue_邓紫棋_金鱼嘴": "gold_邓紫棋_金鱼嘴",
  "gold_邓紫棋_金鱼嘴": "max_邓紫棋_金鱼嘴",
  // 2077：V → V → V
  "cp2077-white": "blue_2077_V",
  "blue_2077_V": "gold_2077_V",
  "gold_2077_V": "max_2077_V",
};

// 视频映射（合成时播放）
export const MERGE_VIDEOS: Record<string, string> = {
  khazix: "/videos/khazix-merge.mp4",
  aatrox: "/videos/aatrox-merge.mp4",
  gem: "/videos/gem-merge.mp4",
  cyberpunk2077: "/videos/cp2077-merge.mp4",
};

// 升级组中文名
export const UPGRADE_NAMES: Record<string, string> = {
  khazix: "卡兹克",
  aatrox: "亚托克斯",
  gem: "金鱼嘴",
  cyberpunk2077: "V",
};

// ─── 分解价值 ───
export function decomposeValue(cardId: string): number {
  if (cardId.startsWith("mimic-") || cardId === "twisted-gamble" || cardId === "lonely-pull") return 100;
  if (cardId.startsWith("max_") || cardId.includes("ultimate")) return 1000;
  if (cardId.startsWith("gold_") || cardId.includes("-gold")) return 200;
  if (cardId.startsWith("blue_") || cardId.includes("-blue")) return 50;
  return 10;
}

// ─── 构建完整卡池 ───

import { champions } from "./lol-data";
import { CUSTOM_CARDS } from "./cards-generated";

// 普通英雄白卡（173张）
function buildChampionWhites(): CardDef[] {
  return champions.map(c => ({
    id: `champ-${c.id}`,
    name: c.name,
    rarity: "white" as Rarity,
    type: "champion" as CardType,
    imageUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${c.id.charAt(0).toUpperCase() + c.id.slice(1)}_0.jpg`,
    upgradable: UPGRADE_GROUPS.includes(c.id),
    upgradableGroup: UPGRADE_GROUPS.includes(c.id) ? c.id : undefined,
  }));
}

// 四条升级线的白卡起点
const SPECIAL_WHITES: CardDef[] = [
  {
    id: "gem-white", name: "金鱼嘴", rarity: "white", type: "gem",
    upgradable: true, upgradableGroup: "gem",
  },
  {
    id: "cp2077-white", name: "V", rarity: "white", type: "cyberpunk",
    upgradable: true, upgradableGroup: "cyberpunk2077",
  },
];

// 特殊功能卡（全量，用于图鉴展示）
const SPECIAL_CARDS: CardDef[] = [
  { id: "mimic-white", name: "妮蔻之助", rarity: "special", type: "gem" },
  { id: "mimic-blue", name: "妮蔻之助·蓝", rarity: "special", type: "gem" },
  { id: "mimic-gold", name: "妮蔻之助·金", rarity: "special", type: "gem" },   // ⚠️ 不可抽取！仅崔斯特赌约/每日签到获取
  { id: "twisted-gamble", name: "崔斯特的赌约", rarity: "special", type: "gem" },
  { id: "lonely-pull", name: "孤立无援", rarity: "special", type: "gem" },
  { id: "windfall", name: "意外之财", rarity: "special", type: "gem" },
  { id: "autumn", name: "秋", rarity: "special", type: "gem" },
  { id: "oldwei-iou", name: "老维的欠条", rarity: "special", type: "gem" },
];

// 保底池（排除妮蔻之助·金，它仅通过崔斯特赌约/每日签到获取）
const PITY_POOL = SPECIAL_CARDS.filter(c => c.id !== "mimic-gold");

// 特殊卡各自颜色（区分优劣，不用统一紫）
export const SPECIAL_CARD_COLORS: Record<string, string> = {
  "mimic-white": "#c0c0c0",
  "mimic-blue": "#4da8da",
  "mimic-gold": "#ffd700",
  "twisted-gamble": "#ffd700",
  "lonely-pull": "#ffd700",
  "windfall": "#4da8da",
  "autumn": "#ffd700",
  "oldwei-iou": "#4da8da",
};

// ─── 全卡池（含特殊卡，用于图鉴展示）───
export const ALL_CARDS: CardDef[] = [
  ...buildChampionWhites(),       // 173 英雄白卡
  ...SPECIAL_WHITES,              // 升级线白卡起点（gem-white / cp2077-white）
  ...SPECIAL_CARDS,               // 功能卡（5张，仅保底获取）
  ...CUSTOM_CARDS,                // 91 张 card-map.json 蓝/金/终极卡
];

// 普通抽卡池（排除特殊卡和隐藏卡）
const DRAW_POOL = ALL_CARDS.filter(c => c.rarity !== "special" && !c.hidden);

// 灌篮高手·二合一（2张灌篮高手 → 随机NBA球星卡）
export const DUNK_MERGE_POOL = ["max_NBA_文班亚马", "max_NBA_勒布朗詹姆斯"];

// 启示录专辑卡组（用于事件卡槽过滤）
export const REVELATION_CARDS = [
  "blue_邓紫棋_Find You", "blue_邓紫棋_Gloria", "blue_邓紫棋_Hell 白", "blue_邓紫棋_Hell 黑",
  "blue_邓紫棋_你不是第一个离开的人", "blue_邓紫棋_冰河时代", "blue_邓紫棋_受难曲",
  "blue_邓紫棋_只有我和你的地方", "blue_邓紫棋_少年与海", "blue_邓紫棋_老人与海",
  "blue_邓紫棋_让世界暂停一分钟", "blue_邓紫棋_金鱼嘴",
  "gold_邓紫棋_不想回家", "gold_邓紫棋_夜的尽头", "gold_邓紫棋_天空没有极限",
  "gold_邓紫棋_离心力", "gold_邓紫棋_金鱼嘴",
  "max_邓紫棋_启示录", "max_邓紫棋_金鱼嘴",
];

// ─── 抽卡引擎 ───
export function drawCard(): CardDef {
  const totalWeight = DRAW_POOL.reduce((sum, c) => sum + CARD_WEIGHT_BY_RARITY[c.rarity], 0);
  let r = Math.random() * totalWeight;
  for (const card of DRAW_POOL) {
    r -= CARD_WEIGHT_BY_RARITY[card.rarity];
    if (r <= 0) return card;
  }
  return DRAW_POOL[DRAW_POOL.length - 1];
}

export function drawMulti(count: number): CardDef[] {
  const results: CardDef[] = [];
  for (let i = 0; i < count; i++) {
    results.push(drawCard());
  }
  if (count >= 10) {
    // 十连保底：最后1张替换为随机特殊卡（7种等概率，不含妮蔻之助·金）
    results[results.length - 1] = PITY_POOL[Math.floor(Math.random() * PITY_POOL.length)];
  }
  if (count >= 100) {
    // 百连：最后10张全部替换为随机特殊卡
    for (let i = results.length - 10; i < results.length; i++) {
      results[i] = PITY_POOL[Math.floor(Math.random() * PITY_POOL.length)];
    }
  }
  return results;
}
