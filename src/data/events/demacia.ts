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
    desc: "一群巡逻兵在营地里偷偷赌博。看到你过来，他们赶紧把东西藏起来，然后假装在讨论战术。演技非常拙劣。",
    choices: [
      {
        label: "加入他们",
        check: { attrs: { 智力: 5 } },
        successRate: undefined, // 100%
        success: {
          tokens: 800,
          message: "你连胜三局。巡逻兵们输得只剩裤衩。",
        },
        failure: {
          tokens: -200,
          message: "你输光了随身零钱。",
        },
      },
      {
        label: "假装没看见",
        success: {
          addCards: ["twisted-gamble"],
          message: "巡逻兵们松了口气，觉得你够意思。其中一个偷偷塞给你一张卡片。",
        },
      },
      {
        label: "举报他们",
        success: {
          addCards: ["blue_赵子龙-最强室友"],
          addTags: ["告密者"],
          message: "巡逻兵们面如死灰，但队长对你大为赏识。",
        },
      },
    ],
  },

  // ─── 游骑兵的入职测试 ───
  {
    id: "demacia-ranger-test",
    region: "demacia",
    type: "fun",
    weight: 12,
    name: "游骑兵的入职测试",
    vitalityCost: 12,
    desc: "一位表情严肃的游骑兵队长拦住你，说最近人手不足，问你要不要临时顶班。工作内容是站在城门口，对每个进城的人喊「为了德玛西亚」。",
    choices: [
      {
        label: "接受，站岗一天",
        success: {
          tokens: 300,
          attrDelta: { 魅力: 1 },
          message: "你喊了一整天，嗓子哑了，但意外结识了几个有趣的人。",
        },
      },
      {
        label: "拒绝，表示自己只是来旅游的",
        success: {
          addCards: ["gold_拉克丝_灭国魔女"],
          message: "队长遗憾地摇头。后来你在探索途中发现了队长的尸体，手里握着一张黑暗气息十足的卡片。",
        },
      },
    ],
    // 特殊：拥有"告密者"标签时换一套选项
    altRequire: { tags: ["告密者"] },
    altChoices: [
      {
        label: "接受战利品",
        check: { attrs: { 力量: 8 } },
        success: {
          tokens: 1000,
          addCards: ["__random_blue__"],    // 占位：随机蓝卡
          removeTags: ["告密者"],
          message: "你战胜了前来找茬的士兵，并从他们身上夺得了更多的战利品。",
        },
        failure: {
          vitality: -1,
          tokens: -200,
          message: "战利品被他们私吞，还被搜刮了不少物资。",
        },
      },
      {
        label: "拒绝战利品，表示这都是你应该做的",
        success: {
          removeTags: ["告密者"],
          tokens: 500,
          attrDelta: { 魅力: 1 },
          message: "士兵们携礼登门拜访，表示已经深刻认识到了自己的错误。",
        },
      },
    ],
  },
];
