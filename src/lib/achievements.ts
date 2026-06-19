// ═══ 成就系统 ═══

export interface Achievement {
  key: string;
  name: string;
  desc: string;
  trigger: string;          // 触发条件描述
  reward: { type: "card" | "tokens"; cardId?: string; amount?: number };
  hidden: boolean;          // 隐藏成就（解锁前不显示触发条件与奖励）
  status: "testing" | "live"; // 未测试 / 已上线
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: "passion",
    name: "受难曲",
    desc: "卡片合成首次失败",
    trigger: "卡片合成首次失败",
    reward: { type: "card", cardId: "gem-passion" },
    hidden: false,
    status: "live",
  },
  {
    key: "dont-go-home",
    name: "不想回家",
    desc: "于18:00-19:00进入网站",
    trigger: "每日18:00-19:00时间段打开网页",
    reward: { type: "card", cardId: "gem-dontgohome" },
    hidden: true,
    status: "testing",
  },
  {
    key: "only-you-and-me",
    name: "只有我和你的地方",
    desc: "首次登录暗号",
    trigger: "首次输入暗号绑定卡牌存档",
    reward: { type: "card", cardId: "gem-onlyyou" },
    hidden: false,
    status: "live",
  },
  {
    key: "boy-and-sea",
    name: "少年与海",
    desc: "待定·2077联动",
    trigger: "待定·2077模块",
    reward: { type: "card", cardId: "gem-boysea" },
    hidden: false,
    status: "testing",
  },
  {
    key: "old-man-and-sea",
    name: "老人与海",
    desc: "待定·2077联动",
    trigger: "待定·2077模块",
    reward: { type: "card", cardId: "gem-oldmansea" },
    hidden: false,
    status: "testing",
  },
  {
    key: "ice-age",
    name: "冰河时代",
    desc: "解锁所有弗雷尔卓德英雄白卡",
    trigger: "集齐所有弗雷尔卓德地区英雄的白卡",
    reward: { type: "card", cardId: "gem-iceage" },
    hidden: false,
    status: "testing",
  },
  {
    key: "find-you",
    name: "FIND YOU",
    desc: "创建一个名为《K/DA》的时空奇旅相册",
    trigger: "COA纪念册中创建分类名为K/DA",
    reward: { type: "card", cardId: "gem-findyou" },
    hidden: false,
    status: "live",
  },
  {
    key: "gloria",
    name: "GLORIA",
    desc: "解锁一张任意稀有度邓紫棋卡片",
    trigger: "获得任意gem类型卡片（白/蓝/金/终极均可）",
    reward: { type: "card", cardId: "gem-gloria" },
    hidden: false,
    status: "live",
  },
  {
    key: "pause-the-world",
    name: "让世界暂停一分钟",
    desc: "首次上传照片至定格时光",
    trigger: "首次在时间定格中上传照片",
    reward: { type: "card", cardId: "gem-pauseworld" },
    hidden: false,
    status: "testing",
  },
  {
    key: "end-of-night",
    name: "夜的尽头",
    desc: "2077相关待定",
    trigger: "待定·2077模块",
    reward: { type: "card", cardId: "gem-endofnight" },
    hidden: true,
    status: "testing",
  },
  {
    key: "centrifugal",
    name: "离心力",
    desc: "污渍+标准一天内总计猜错15次",
    trigger: "同一日内标准+污渍模式累计猜错15次",
    reward: { type: "card", cardId: "gem-centrifugal" },
    hidden: false,
    status: "live",
  },
  {
    key: "sky-no-limit",
    name: "天空没有极限",
    desc: "创建5个（含驿站）奇旅相册",
    trigger: "时空奇旅分类数≥5",
    reward: { type: "card", cardId: "gem-skynolimit" },
    hidden: false,
    status: "live",
  },
  {
    key: "revelation",
    name: "启示录",
    desc: "解锁所有启示录专辑歌曲卡片",
    trigger: "集齐所有gem类型卡片（启示录专辑曲目）",
    reward: { type: "card", cardId: "gem-revelation" },
    hidden: false,
    status: "testing",
  },
  {
    key: "not-first-leave",
    name: "你不是第一个离开的人",
    desc: "距离上次登录超过24小时",
    trigger: "再次登录时距上次超过24小时",
    reward: { type: "card", cardId: "gem-notfirstleave" },
    hidden: false,
    status: "live",
  },
  {
    key: "hell-1",
    name: "HELL·1",
    desc: "首次使用崔斯特的赌约赌中红牌",
    trigger: "崔斯特的赌约抽中红牌(-200币)",
    reward: { type: "card", cardId: "gem-hell-bai" },
    hidden: false,
    status: "live",
  },
  {
    key: "hell-2",
    name: "HELL·2",
    desc: "首次使用崔斯特的赌约赌中金牌",
    trigger: "崔斯特的赌约抽中金牌",
    reward: { type: "card", cardId: "gem-hell-hei" },
    hidden: false,
    status: "live",
  },
];

// ─── 成就相关卡片 ───
import { CardDef, Rarity } from "./cards";

export const ACHIEVEMENT_CARDS: CardDef[] = [
  { id: "gem-passion", name: "受难曲", rarity: "blue", type: "gem" },
  { id: "gem-dontgohome", name: "不想回家", rarity: "gold", type: "gem" },
  { id: "gem-onlyyou", name: "只有我和你的地方", rarity: "blue", type: "gem" },
  { id: "gem-boysea", name: "少年与海", rarity: "blue", type: "gem" },
  { id: "gem-oldmansea", name: "老人与海", rarity: "blue", type: "gem" },
  { id: "gem-iceage", name: "冰河时代", rarity: "blue", type: "gem" },
  { id: "gem-findyou", name: "FIND YOU", rarity: "blue", type: "gem" },
  { id: "gem-gloria", name: "GLORIA", rarity: "blue", type: "gem" },
  { id: "gem-pauseworld", name: "让世界暂停一分钟", rarity: "blue", type: "gem" },
  { id: "gem-endofnight", name: "夜的尽头", rarity: "gold", type: "gem" },
  { id: "gem-centrifugal", name: "离心力", rarity: "gold", type: "gem" },
  { id: "gem-skynolimit", name: "天空没有极限", rarity: "gold", type: "gem" },
  { id: "gem-revelation", name: "启示录", rarity: "ultimate", type: "gem" },
  { id: "gem-notfirstleave", name: "你不是第一个离开的人", rarity: "blue", type: "gem" },
  { id: "gem-hell-bai", name: "HELL·白", rarity: "blue", type: "gem" },
  { id: "gem-hell-hei", name: "HELL·黑", rarity: "blue", type: "gem" },
];
