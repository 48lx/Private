// ═══ 卡牌系统 ═══

export type Rarity = "white" | "blue" | "gold" | "ultimate";
export type CardType = "champion" | "gem" | "cyberpunk" | "skin";

export interface CardDef {
  id: string;           // 唯一ID e.g. "champ-aatrox"
  name: string;         // 显示名
  rarity: Rarity;
  type: CardType;
  imageUrl?: string;    // 卡面图
  upgradable?: boolean; // 可五合一升级（螳螂/剑魔/GEM/2077）
  upgradableGroup?: string; // 升级组标识
}

// 每张卡权重（终极2:金8:蓝30:白100）
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

// 合成链（卡ID映射）
export const MERGE_CHAIN: Record<string, string | null> = {
  // 螳螂
  "champ-khazix": "khazix-blue",       // 白→蓝
  "khazix-blue": "khazix-gold",         // 蓝→金
  "khazix-gold": "khazix-ultimate",     // 金→终极
  // 剑魔
  "champ-aatrox": "aatrox-blue",
  "aatrox-blue": "aatrox-gold",
  "aatrox-gold": "aatrox-ultimate",
  // 邓紫棋
  "gem-white": "gem-blue",
  "gem-blue": "gem-gold",
  "gem-gold": "gem-ultimate",
  // 2077
  "cp2077-white": "cp2077-blue",
  "cp2077-blue": "cp2077-gold",
  "cp2077-gold": "cp2077-ultimate",
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
  gem: "邓紫棋",
  cyberpunk2077: "V",
};

// ─── 构建完整卡池 ───

import { champions } from "./lol-data";

const CHAMP_IDS = champions.map(c => c.id);

// 普通英雄白卡
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

// 螳螂/剑魔的中间卡（蓝/金）
const KHAZIX_INTERMEDIATE: CardDef[] = [
  { id: "khazix-blue", name: "卡兹克·蓝", rarity: "blue", type: "champion", upgradable: true, upgradableGroup: "khazix" },
  { id: "khazix-gold", name: "卡兹克·金", rarity: "gold", type: "champion", upgradable: true, upgradableGroup: "khazix" },
];
const AATROX_INTERMEDIATE: CardDef[] = [
  { id: "aatrox-blue", name: "亚托克斯·蓝", rarity: "blue", type: "champion", upgradable: true, upgradableGroup: "aatrox" },
  { id: "aatrox-gold", name: "亚托克斯·金", rarity: "gold", type: "champion", upgradable: true, upgradableGroup: "aatrox" },
];

// 白卡：英雄 + 邓紫棋 + 2077角色
const SPECIAL_WHITES: CardDef[] = [
  {
    id: "gem-white", name: "邓紫棋", rarity: "white", type: "gem",
    upgradable: true, upgradableGroup: "gem",
  },
  {
    id: "cp2077-white", name: "V", rarity: "white", type: "cyberpunk",
    upgradable: true, upgradableGroup: "cyberpunk2077",
  },
  // 2077 剧情角色（普通白/蓝/金）
  { id: "cp2077-johnny-w", name: "强尼·银手", rarity: "white", type: "cyberpunk" },
  { id: "cp2077-panam-w", name: "帕南", rarity: "white", type: "cyberpunk" },
  { id: "cp2077-judy-w", name: "朱迪", rarity: "white", type: "cyberpunk" },
  { id: "cp2077-jackie-w", name: "杰克", rarity: "white", type: "cyberpunk" },
  { id: "cp2077-tbug-w", name: "T-Bug", rarity: "white", type: "cyberpunk" },
  { id: "cp2077-takemura-w", name: "竹村", rarity: "white", type: "cyberpunk" },
];

// 蓝卡
const BLUE_CARDS: CardDef[] = [
  { id: "gem-blue", name: "邓紫棋·蓝", rarity: "blue", type: "gem", upgradable: true, upgradableGroup: "gem" },
  { id: "cp2077-blue", name: "V·蓝", rarity: "blue", type: "cyberpunk", upgradable: true, upgradableGroup: "cyberpunk2077" },
  { id: "cp2077-johnny-b", name: "强尼·银手·蓝", rarity: "blue", type: "cyberpunk" },
  { id: "cp2077-panam-b", name: "帕南·蓝", rarity: "blue", type: "cyberpunk" },
  { id: "cp2077-judy-b", name: "朱迪·蓝", rarity: "blue", type: "cyberpunk" },
  // 部分英雄皮肤（用通用占位）
  ...CHAMP_IDS.filter((_, i) => i % 3 === 0).map(id => ({
    id: `skin-${id}`, name: `${champions.find(c => c.id === id)?.name}·皮肤`, rarity: "blue" as Rarity, type: "skin" as CardType,
  })),
];

// 金卡
const GOLD_CARDS: CardDef[] = [
  { id: "gem-gold", name: "邓紫棋·金", rarity: "gold", type: "gem", upgradable: true, upgradableGroup: "gem" },
  { id: "cp2077-gold", name: "V·金", rarity: "gold", type: "cyberpunk", upgradable: true, upgradableGroup: "cyberpunk2077" },
  { id: "cp2077-johnny-g", name: "强尼·银手·金", rarity: "gold", type: "cyberpunk" },
  { id: "cp2077-panam-g", name: "帕南·金", rarity: "gold", type: "cyberpunk" },
  // 至臻皮肤占位
  ...CHAMP_IDS.filter((_, i) => i % 8 === 0).map(id => ({
    id: `prestige-${id}`, name: `${champions.find(c => c.id === id)?.name}·至臻`, rarity: "gold" as Rarity, type: "skin" as CardType,
  })),
];

// 特殊功能卡
const SPECIAL_CARDS: CardDef[] = [
  // 妮蔻之助（四稀有度）
  { id: "mimic-white", name: "妮蔻之助", rarity: "white", type: "gem" },
  { id: "mimic-blue", name: "妮蔻之助·蓝", rarity: "blue", type: "gem" },
  { id: "mimic-gold", name: "妮蔻之助·金", rarity: "gold", type: "gem" },
  { id: "mimic-ultimate", name: "妮蔻之助·终极", rarity: "ultimate", type: "gem" },
  // 崔斯特的赌约
  { id: "twisted-gamble", name: "崔斯特的赌约", rarity: "blue", type: "gem" },
  // 孤立无援
  { id: "lonely-pull", name: "孤立无援", rarity: "blue", type: "gem" },
];

// 终极卡（4张）
const ULTIMATE_CARDS: CardDef[] = [
  { id: "khazix-ultimate", name: "卡兹克·终极", rarity: "ultimate", type: "champion", upgradable: true, upgradableGroup: "khazix" },
  { id: "aatrox-ultimate", name: "剑魔·终极", rarity: "ultimate", type: "champion", upgradable: true, upgradableGroup: "aatrox" },
  { id: "gem-ultimate", name: "邓紫棋·终极", rarity: "ultimate", type: "gem", upgradable: true, upgradableGroup: "gem" },
  { id: "cp2077-ultimate", name: "V·终极", rarity: "ultimate", type: "cyberpunk", upgradable: true, upgradableGroup: "cyberpunk2077" },
];

import { ACHIEVEMENT_CARDS } from "./achievements";

export const ALL_CARDS: CardDef[] = [
  ...buildChampionWhites(),
  ...SPECIAL_WHITES,
  ...KHAZIX_INTERMEDIATE,
  ...AATROX_INTERMEDIATE,
  ...BLUE_CARDS,
  ...GOLD_CARDS,
  ...ACHIEVEMENT_CARDS,
  ...SPECIAL_CARDS,
  ...ULTIMATE_CARDS,
];

// ─── 抽卡引擎（按每张卡权重）───
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
