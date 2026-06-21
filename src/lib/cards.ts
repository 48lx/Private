// ═══ 卡牌系统 ═══
// 数据来源：card-map.json → cards-generated.ts

export type Rarity = "white" | "blue" | "gold" | "ultimate";
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
}

// 每张卡权重（终极:15 金:100 蓝:300 白:700）
export const CARD_WEIGHT_BY_RARITY: Record<Rarity, number> = {
  ultimate: 15,
  gold: 100,
  blue: 300,
  white: 700,
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
  { rarity: "white" as Rarity, rate: "70%", desc: "全英雄+特殊角色" },
  { rarity: "blue" as Rarity, rate: "20%", desc: "皮肤+特殊角色" },
  { rarity: "gold" as Rarity, rate: "8%", desc: "至臻皮肤+特殊角色" },
  { rarity: "ultimate" as Rarity, rate: "2%", desc: "螳螂/剑魔/GEM/2077" },
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

// 特殊功能卡（妮蔻之助 / 崔斯特的赌约 / 孤立无援）
const SPECIAL_CARDS: CardDef[] = [
  { id: "mimic-white", name: "妮蔻之助", rarity: "white", type: "gem" },
  { id: "mimic-blue", name: "妮蔻之助·蓝", rarity: "blue", type: "gem" },
  { id: "mimic-gold", name: "妮蔻之助·金", rarity: "gold", type: "gem" },
  { id: "mimic-ultimate", name: "妮蔻之助·终极", rarity: "ultimate", type: "gem" },
  { id: "twisted-gamble", name: "崔斯特的赌约", rarity: "blue", type: "gem" },
  { id: "lonely-pull", name: "孤立无援", rarity: "blue", type: "gem" },
];

// ─── 全卡池 ───
export const ALL_CARDS: CardDef[] = [
  ...buildChampionWhites(),       // 173 英雄白卡
  ...SPECIAL_WHITES,              // 升级线白卡起点（gem-white / cp2077-white）
  ...SPECIAL_CARDS,               // 功能卡（妮蔻之助 / 崔斯特 / 孤立无援）
  ...CUSTOM_CARDS,                // 91 张 card-map.json 蓝/金/终极卡（含全部皮肤/角色/GEM/成就卡）
];

// ─── 抽卡引擎 ───
export function drawCard(): CardDef {
  const totalWeight = ALL_CARDS.reduce((sum, c) => sum + CARD_WEIGHT_BY_RARITY[c.rarity], 0);
  let r = Math.random() * totalWeight;
  for (const card of ALL_CARDS) {
    r -= CARD_WEIGHT_BY_RARITY[card.rarity];
    if (r <= 0) return card;
  }
  return ALL_CARDS[ALL_CARDS.length - 1];
}

export function drawMulti(count: number): CardDef[] {
  const results: CardDef[] = [];
  let hasNonWhite = false;
  for (let i = 0; i < count; i++) {
    const c = drawCard();
    if (c.rarity !== "white") hasNonWhite = true;
    results.push(c);
  }
  if (count >= 10 && !hasNonWhite) {
    // 保底蓝+：从非白卡中抽
    const nonWhite = ALL_CARDS.filter(c => c.rarity !== "white");
    const totalW = nonWhite.reduce((s, c) => s + CARD_WEIGHT_BY_RARITY[c.rarity], 0);
    let r = Math.random() * totalW;
    for (const c of nonWhite) {
      r -= CARD_WEIGHT_BY_RARITY[c.rarity];
      if (r <= 0) { results[results.length - 1] = c; break; }
    }
  }
  return results;
}
