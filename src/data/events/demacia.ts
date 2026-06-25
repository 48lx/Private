// ═══ 德玛西亚事件 ═══
import { GameEvent } from "@/lib/event-types";

export const demaciaEvents: GameEvent[] = [
  // ─── 巡逻兵的赌局 ───
  {
    id: "demacia-gambling",
    region: "demacia",
    type: "fun",
    weight: 12,
    name: "巡逻兵的赌局",
    image: "/events/德玛西亚_01.png",
    desc: "一群巡逻兵在营地里偷偷赌博。看到你过来，他们赶紧把东西藏起来，然后假装在讨论战术。演技非常拙劣。",
    choices: [
      {
        label: "加入他们",
        check: { attrs: { 智力: 5 } },
        success: { tokens: 800, message: "你连胜三局。巡逻兵们输得只剩裤衩。" },
        failure: { tokens: -200, message: "你输光了随身零钱。" },
      },
      {
        label: "假装没看见",
        success: { addCards: ["twisted-gamble"], message: "巡逻兵们松了口气，觉得你够意思。其中一个偷偷塞给你一张卡片。" },
      },
      {
        label: "举报他们",
        success: { addCards: ["blue_赵子龙-最强室友"], addTags: ["告密者"], message: "巡逻兵们面如死灰，但队长对你大为赏识。" },
      },
    ],
  },

  // ─── 偶遇骑兵连 ───
  {
    id: "demacia-ranger-test",
    region: "demacia",
    type: "fun",
    weight: 12,
    name: "偶遇骑兵连",
    image: "/events/德玛西亚_02.png",
    vitalityCost: 1,
    desc: "一位表情严肃的游骑兵队长拦住你，说最近人手不足，问你要不要临时顶班。工作内容是站在城门口，对每个进城的人喊「为了德玛西亚」。",
    choices: [
      {
        label: "接受，站岗一天",
        success: { tokens: 300, attrDelta: { 魅力: 1 }, message: "你喊了一整天，嗓子哑了，但意外结识了几个有趣的人。" },
      },
      {
        label: "拒绝，表示自己只是来旅游的",
        success: { addCards: ["gold_拉克丝_灭国魔女"], message: "队长遗憾地摇头。后来你在探索途中发现了队长的尸体，手里握着一张黑暗气息十足的卡片。" },
      },
    ],
    altRequire: { tags: ["告密者"] },
    altChoices: [
      {
        label: "接受战利品",
        check: { attrs: { 力量: 8 } },
        success: { tokens: 1000, addCards: ["__random_blue__"], removeTags: ["告密者"], message: "你战胜了前来找茬的士兵，并从他们身上夺得了更多的战利品。" },
        failure: { vitality: -1, tokens: -200, message: "战利品被他们私吞，还被搜刮了不少物资。" },
      },
      {
        label: "拒绝战利品，表示这都是你应该做的",
        success: { removeTags: ["告密者"], tokens: 500, attrDelta: { 魅力: 1 }, message: "士兵们携礼登门拜访，表示已经深刻认识到了自己的错误。" },
      },
    ],
  },

  // ─── 禁魔石矿洞的倒霉矿工 ───
  {
    id: "demacia-miner",
    region: "demacia",
    type: "clue",
    weight: 6,
    name: "禁魔石矿洞的倒霉矿工",
    image: "/events/德玛西亚_03.png",
    desc: "一个满脸煤灰的矿工从矿洞里跑出来，哭着说他的鹤嘴锄掉进了禁魔石裂缝里。禁魔石吸魔，但吸不吸铁？他不知道，也不敢下去。",
    choices: [
      {
        label: "帮他捡回来",
        check: { attrs: { 敏捷: 7 } },
        success: {
          addItems: ["禁魔石之心表面纹路"],
          message: "你跳下裂缝，发现鹤嘴锄被一块散发着微光的石头压住了。你把石头一起带上来，矿工说这石头没用，送你了。",
        },
        failure: {
          tokens: 100,
          message: "你被石头绊倒，摔了一身泥。矿工感激你至少试了，给了你几枚硬币。",
        },
      },
      {
        label: "问他没有备用的锄头吗",
        success: {
          addItems: ["矿工护身符"],
          message: "矿工恍然大悟：「对哦我还有一把。」他高兴地送了你一个矿工护身符。",
        },
      },
    ],
  },

  // ─── 贵族少爷的决斗邀请 ───
  {
    id: "demacia-duel",
    region: "demacia",
    type: "fun",
    weight: 12,
    name: "贵族少爷的决斗邀请",
    image: "/events/德玛西亚_01.png",
    desc: "一个穿着浮夸的贵族少爷用白手套甩了你一脸，大声宣布你「多看了他未婚妻一眼」，要求与你决斗。围观群众开始嗑瓜子。",
    choices: [
      {
        label: "接受决斗",
        check: { attrs: { 力量: 6 } },
        success: { tokens: 250, addCards: ["__random_blue__"], message: "你一招就把他剑打飞。他坐在地上愣了三秒，然后兴奋地大喊「师傅！」非要拜你为师。你多了个烦人的跟班。" },
        failure: { vitality: -2, tokens: 20, message: "你被他一顿王八剑法打翻。围观群众嗑完了瓜子散了。但他很满意，给了你出场费。" },
      },
      {
        label: "展示「菲奥娜」英雄卡片",
        check: { hasCard: "champ-fiora" },
        success: { tokens: 300, message: "你亮出劳伦特家族的卡片，少爷立刻立正：「原来是家族的朋友！失敬！」他送上一份赔礼。" },
        consumeCard: true,
      },
    ],
  },

  // ─── 会说话的石像鬼 ───
  {
    id: "demacia-gargoyle",
    region: "demacia",
    type: "fun",
    weight: 10,
    name: "会说话的石像鬼",
    image: "/events/德玛西亚_02.png",
    desc: "城墙角落有一尊石像鬼，它居然会说话。但它只会说一句：「你鞋带开了。」反复说，从早说到晚。",
    choices: [
      {
        label: "低头看鞋",
        success: { vitality: 3, message: "你低头了。石像鬼发出了嘎嘎的笑声，像鸭子叫。你本想骂他无聊，结果看到他憨厚的模样，你也被蠢笑了。" },
      },
      {
        label: "骂它无聊",
        success: { tokens: 5, message: "石像鬼沉默了三秒，然后说：「你拉链开了。」你骂得更狠了。" },
      },
      {
        label: "尝试解除诅咒",
        hideCheck: { attrs: { 智力: 10 } },
        check: { attrs: { 智力: 14 } },
        success: {
          addItems: ["叽叽的口哨"],
          message: "你居然解开了！约德尔人恢复原形，感激涕零，说他叫「叽叽」，以后在班德尔城遇到他可以帮忙。",
        },
        failure: {
          vitality: -1,
          message: "你用尽毕生所学也无法解开诅咒。",
        },
      },
    ],
  },

  // ─── 黎明城堡的管风琴师 ───
  {
    id: "demacia-organist",
    region: "demacia",
    type: "clue",
    weight: 8,
    name: "黎明城堡的管风琴师",
    image: "/events/德玛西亚_03.png",
    desc: "黎明城堡的小教堂里，一位盲眼老琴师正在弹奏管风琴。他弹的曲子叫《沉默的守护者》，据说是为了纪念一个「不说话的大个子」。",
    choices: [
      {
        label: "静静聆听",
        success: {
          addClues: [{ region: "demacia", type: "E", data: "/加里奥/线索.wav" }],
          message: "琴声中有沉重脚步的节奏，还有翅膀扇动的风声。老琴师说：「守护者听得到这曲子，每次弹奏，我都能与他有所感应。」",
        },
      },
      {
        label: "和他聊聊",
        success: {
          addClues: [{ region: "demacia", type: "B", data: "禁魔石之心" }],
          message: "老琴师讲起他年轻时见过秘宝的威力，那是「大魔法战争」时期，秘宝像一颗心脏般唤醒了沉睡的加里奥。",
        },
      },
      {
        label: "点歌",
        check: { hasCardType: "gem", costTokens: 200, consumeCard: true },
        success: {
          vitality: 8,
          attrDelta: { 魅力: 1 },
          message: "你点了一首流行曲。老琴师用管风琴弹出了专辑里振奋人心的音律，所有人都听愣了。",
        },
      },
    ],
  },
];
