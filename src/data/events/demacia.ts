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
        check: { attrs: { 智力: 7 } },
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
        check: { attrs: { 力量: 10 } },
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
        check: { attrs: { 敏捷: 9 } },
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
        check: { attrs: { 力量: 8 } },
        success: { tokens: 250, addCards: ["__random_blue__"], message: "你一招就把他剑打飞。他坐在地上愣了三秒，然后兴奋地大喊「师傅！」非要拜你为师。你多了个烦人的跟班。" },
        failure: { vitality: -2, tokens: 20, message: "你被他一顿王八剑法打翻。围观群众嗑完了瓜子散了。但他很满意，给了你出场费。" },
      },
      {
        label: "展示「菲奥娜」英雄卡片",
        check: { hasCard: "champ-fiora" },
        success: { tokens: 300, message: "你亮出劳伦特家族的卡片，少爷立刻立正：「原来是家族的朋友！失敬！」他送上一份赔礼。" },
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
        hideCheck: { attrs: { 智力: 13 } },
        check: { attrs: { 智力: 18 } },
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
        check: { hasCard: "__revelation__", costTokens: 200 },
        success: {
          vitality: 8,
          attrDelta: { 魅力: 1 },
          message: "你点了一首流行曲。老琴师用管风琴弹出了专辑里振奋人心的音律，所有人都听愣了。",
        },
      },
    ],
  },

  // ─── 德玛西亚美食节 I ───
  {
    id: "demacia-food-fest",
    region: "demacia",
    type: "side",
    weight: 8,
    name: "德玛西亚美食节",
    image: "/events/德玛西亚_01.png",
    require: { notTags: ["被赶出来的人", "大胃王绶带"] },
    desc: "德玛西亚正在举办一年一度的美食节。摊位上摆满了各种「德玛西亚特色美食」，但看起来都是不同形态的面包。硬面包汤、面包沙拉、面包蛋糕……",
    choices: [
      {
        label: "免费试吃（出示「利刃充饥」免活力消耗）",
        check: { hasCard: "blue_刀妹_利刃充饥" },
        success: { addItems: ["__random_attr__"], message: "你吃了十二种面包制品。味道还行，但咬得腮帮子疼。" },
      },
      {
        label: "免费试吃",
        success: { vitality: -8, addItems: ["__random_attr__"], message: "你吃了十二种面包制品。味道还行，但咬得腮帮子疼。" },
      },
      {
        label: "参加大胃王比赛",
        check: { attrs: { 力量: 17 } },
        success: { tokens: 500, addItems: ["大胃王绶带"], addTags: ["大胃王绶带"], message: "你打败了卫冕冠军——一个巨魔。" },
        failure: { attrDelta: { 力量: -1 }, tokens: 100, message: "你吃到第六个面包就倒了。巨魔拍了拍你的背，差点把你拍骨折。" },
      },
      {
        label: "吐槽「这不都是面包吗」",
        success: { attrDelta: { 魅力: -1 }, addTags: ["被赶出来的人"], message: "摊主们沉默了一瞬，然后异口同声：「这是传统！」你被赶出了美食节。" },
      },
    ],
  },
  // ─── 德玛西亚美食节 II（被赶出来的人）───
  {
    id: "demacia-food-fest-2",
    region: "demacia",
    type: "side",
    weight: 6,
    name: "德玛西亚美食节 II",
    image: "/events/德玛西亚_01.png",
    require: { tags: ["被赶出来的人"] },
    desc: "你又一次看到了这个你曾经不屑一顾的美食节，看着大家热情洋溢的氛围，这一次你打算……",
    choices: [
      {
        label: "诶嘿，真香！",
        check: { costTokens: 2000 },
        success: { removeTags: ["被赶出来的人"], message: "你付了2000金币的「忏悔费」，摊主们原谅了你。" },
      },
      {
        label: "嘲讽「你们都是面包人吗」",
        success: { attrDelta: { 魅力: -2 }, vitality: -1, message: "摊主们不想破坏欢乐的节日氛围，并没有人愿意搭理你。" },
      },
    ],
  },
  // ─── 德玛西亚美食节 III（大胃王绶带）───
  {
    id: "demacia-food-fest-3",
    region: "demacia",
    type: "side",
    weight: 6,
    name: "德玛西亚美食节 III",
    image: "/events/德玛西亚_01.png",
    require: { tags: ["大胃王绶带"], notTags: ["终极大胃王——德玛西亚"] },
    desc: "现场的参与者看着你的绶带议论纷纷，这时一位壮汉走了上来，说他叫良子，是德玛西亚美食节的三连霸。",
    choices: [
      {
        label: "你笑笑表示今天没有备赛，只是来试吃的",
        success: { addItems: ["__random_attr__"], message: "你吃了十二种面包制品。身为大胃王的你，腮帮子更能经受考验了。" },
      },
      {
        label: "你就是良子？我就是来挑战你的",
        check: { attrs: { 力量: 27 } },
        success: { tokens: 1000, addTags: ["终极大胃王——德玛西亚"], message: "你打败了德玛西亚大胃王良子！" },
        failure: { vitality: -4, message: "你吃到第10个面包，却发现良子早已一扫而空，已经在向新来的高手发起挑战邀请。" },
      },
    ],
  },
  // ─── 德玛西亚美食节 IV（终极大胃王）───
  {
    id: "demacia-food-fest-4",
    region: "demacia",
    type: "side",
    weight: 4,
    name: "德玛西亚美食节 IV",
    image: "/events/德玛西亚_01.png",
    require: { tags: ["终极大胃王——德玛西亚"] },
    desc: "忙碌的摊主与参赛者看到你来了，纷纷停下手上的工作，投来崇拜的目光，不少摊主都热情的邀请你去试吃他们的面包。",
    choices: [
      {
        label: "接受摊主们的好意",
        success: { vitality: 8, tokens: 500, addItems: ["__random_attr__", "__random_attr__"], message: "你接受了摊主们的好意，预祝大赛越办越好，并狂炫面包。" },
      },
      {
        label: "寻找有无隐藏的强者挑战",
        success: { addItems: ["大胃王挑战邀请函"], vitality: -2, message: "你看到一个人影从人群中遛过，追了上去却只看到一张纸条。" },
      },
    ],
  },

  // ─── 不想当兵的男孩 ───
  {
    id: "demacia-boy-florist",
    region: "demacia",
    type: "fun",
    weight: 9,
    name: "不想当兵的男孩",
    image: "/events/德玛西亚_02.png",
    desc: "一个少年躲在草垛后面，愁眉苦脸。他明天就要入伍了，但他不想当兵，他只想当一个花匠。",
    choices: [
      {
        label: "鼓励他当兵",
        success: { tokens: 600, message: "你跟他讲了一堆荣誉、责任之类的大道理。他勉强点点头。获得600金币（来自他家人的感谢），但少年眼中失去了光。" },
      },
      {
        label: "鼓励他当花匠",
        check: { attrs: { 魅力: 13 } },
        success: { addItems: ["白玫瑰"], message: "你说人生是自己的，追寻梦想也需要勇气。他眼睛亮了，跑去跟他爹大吵一架，他爹虽然不愿意接受，但少年偷偷塞给你一朵他种的白玫瑰。" },
        failure: { message: "你说了一堆大道理，但他一句都没肯听进去，少年最终还是成为了「光荣」的德玛西亚战士，你只祈祷他不会在战斗中不明不白地「亮起来」。" },
      },
      {
        label: "展示「光辉女郎·拉克丝」卡片",
        check: { hasCard: "__lux__" },
        success: { addCards: ["__random_gold__"], message: "你亮出拉克丝的卡片，还没来得及说话，少年便兴奋地说：「我见过她！她来我们村巡察时，还摸过我的花！」他突然觉得，也许当了兵就能再见到她。他高高兴兴地去入伍了，还送你一张他珍藏的卡片。但你的本意并非如此——你看着手里的卡片，突然一惊：呀！完蛋了，我本想拿的是灭国魔女·拉克丝的卡片。算了，孩子这么高兴，就随他去吧。" },
      },
    ],
  },

  // ─── 禁魔石共鸣反应 ───
  {
    id: "demacia-petricite-resonance",
    region: "demacia",
    type: "clue",
    weight: 5,
    name: "禁魔石共鸣反应",
    image: "/events/德玛西亚_03.png",
    desc: "你经过一处禁魔石矿脉裸露的地表，身上携带的卡片突然开始微微发光——尤其是那些与魔法有关的卡。空气中弥漫着一种沉闷的压迫感。",
    choices: [
      {
        label: "拿出你最强的魔法卡片试探",
        check: { hasCard: "__magic__", consumeCard: true },
        success: {
          addClues: [{ region: "demacia", type: "A", data: "/加里奥/kling_20260627_作品_生图中的心脏在原地缓_4134_0_透明.webm" }],
          vitality: -4,
          message: "你将卡片靠近矿脉。卡片的光越来越亮，矿脉突然发出一声低沉的轰鸣，一道冲击波把你掀翻在地。你爬起来后，发现卡片上多了一道裂纹，而矿脉深处隐约露出了一块石板的边缘。",
        },
      },
      {
        label: "收起所有魔法物品，静静观察",
        check: { attrs: { 智力: 18 } },
        success: {
          addClues: [{ region: "demacia", type: "C", data: "/加里奥/守护者截图.png" }],
          message: "你发现矿脉的共鸣频率和某个更大的源头相连。你顺着共鸣方向望去，发现远处山顶有一尊石像的轮廓在暮色中若隐若现。",
        },
        failure: { vitality: -2, message: "你什么都感应不到，只觉得耳鸣。" },
      },
      {
        label: "赶紧离开",
        success: { tokens: 100, message: "你不想惹麻烦，快步离开。走出去很远，你才松了口气。逃跑途中，你还在地上捡到了100块钱。" },
      },
    ],
  },
  // ─── 小酒馆的诗歌之夜 ───
  {
    id: "demacia-tavern-poetry",
    region: "demacia",
    type: "fun",
    weight: 11,
    name: "小酒馆的诗歌之夜",
    image: "/events/德玛西亚_02.png",
    desc: "小酒馆今晚举办诗歌比赛，主题是「赞美德玛西亚」。酒馆里挤满了人，一个吟游诗人站在桌子上，弹着鲁特琴。他唱了一首关于盖伦和卡特琳娜的禁忌爱情诗，全场起哄。",
    choices: [
      {
        label: "上台表演（魅力≥9）",
        check: { attrs: { 魅力: 9 } },
        success: { attrDelta: { 魅力: 1 }, tokens: -1, message: "你即兴创作了一首关于德玛西亚面包的无厘头打油诗，全场爆笑。吟游诗人表示要拜你为师。" },
        failure: { attrDelta: { 魅力: -1 }, message: "你忘词了，在台上站了一分钟，支支吾吾说不出一句完整的台词，最终在一片嘘声中羞愧下台。" },
      },
      {
        label: "来一场昆特牌吗",
        check: { costTokens: 50 },
        success: { tokens: -50, addCards: ["twisted-gamble"], message: "你径直走向酒馆吧台，跳过一切对话，迅速向老板发起了昆特牌邀请。" },
      },
      {
        label: "在角落喝酒，美美的欣赏诗歌",
        check: { costTokens: 2000 },
        success: { tokens: -2000, addTags: ["纸醉金迷"], message: "你什么都没做，只喝了一杯淡啤酒。但角落里有个陌生人对你说：「你不喜欢热闹？」就这样，你与这位新朋友开启了一场畅谈，共同度过了愉快的夜晚。隔天起来，你还是无法忘怀昨天的经历，却只看见一张纸条「多谢款待」。" },
      },
    ],
  },
  // ─── 被替换的军旗 ───
  {
    id: "demacia-flag-prank",
    region: "demacia",
    type: "fun",
    weight: 9,
    name: "被替换的军旗",
    image: "/events/德玛西亚_03.png",
    desc: "你路过军营，发现旗杆上本该悬挂的德玛西亚军旗，被人换成了一条画着大笑表情的粉色裤衩。一群士兵正围着旗杆抓耳挠腮，看到你，他们眼神一亮。",
    choices: [
      {
        label: "帮忙把裤衩弄下来（敏≥12）",
        check: { attrs: { 敏捷: 12 } },
        success: { tokens: 800, attrDelta: { 敏捷: 1 }, message: "你像猴子一样爬上旗杆，在士兵们的欢呼声中取下了裤衩。队长为了感谢你保全了军营的颜面，给了你一笔封口费。" },
        failure: { vitality: -2, attrDelta: { 魅力: -1 }, message: "你爬到一半滑了下来，还扯坏了那条裤衩。结果裤衩的主人——一个愤怒的约德尔人冲了出来，说这是他的艺术创作。场面一度非常混乱。" },
      },
      {
        label: "指出这是来自敌人典型的挑衅，建议全营戒备",
        success: { tokens: 500, addTags: ["告密者"], message: "队长觉得你非常有战略眼光，命令全军搜查。结果没找到敌人，反而搜出了好几个士兵私藏的违禁品，队长脸都黑了。你得到了队长的奖赏，却在德玛西亚越发的不受待见。" },
      },
    ],
  },
  // ─── 倒霉骑士的铠甲 ───
  {
    id: "demacia-knight-armor",
    region: "demacia",
    type: "fun",
    weight: 9,
    name: "倒霉骑士的铠甲",
    image: "/events/德玛西亚_01.png",
    desc: "一个年轻的骑士坐在路边，他的铠甲擦得锃亮，但人却愁眉苦脸。原来是他的铠甲生了锈，背后的卡扣卡死了，他自己脱不下来。",
    choices: [
      {
        label: "帮忙把铠甲弄开（敏≥11）",
        check: { attrs: { 敏捷: 11 } },
        success: { addItems: ["沉重的铠甲"], message: "你找到卡死的关节，喷了点油，轻松解开。骑士重获自由，感激涕零，并说这套铠甲与自己八字不合，硬要塞给你。" },
        failure: { tokens: -600, message: "你用力过猛，把铠甲的一个肩甲掰断了。骑士虽然没有怪你，但看着损坏的传家宝欲哭无泪。你为了补偿，给了他一些修理费。" },
      },
      {
        label: "建议他干脆穿着铠甲去河里把铠甲泡开",
        success: { vitality: -2, attrDelta: { 魅力: -1 }, message: "骑士觉得这是个好主意，扑通一声跳进河里。然后他沉下去了。你费了好大劲才把他捞上来，他吐了几口水，说以后再也不会相信你了。" },
      },
      {
        label: "拿出「灭国魔女·拉克丝」卡片，说用魔法轰开",
        check: { hasCard: "gold_拉克丝_灭国魔女" },
        success: { addItems: ["骑士的护腕"], attrDelta: { 敏捷: 1 }, message: "骑士看到卡片，吓得从地上弹射起步，铠甲卡扣直接崩开。他一路尖叫着「黑暗魔法！救命！」跑得无影无踪，连一个护腕掉了都没发现。" },
      },
    ],
  },
  // ─── 泉水边的许愿少女 ───
  {
    id: "demacia-wish-fountain",
    region: "demacia",
    type: "fun",
    weight: 7,
    name: "泉水边的许愿少女",
    image: "/events/德玛西亚_02.png",
    desc: "你在黎明城堡的公共泉水边，看到一个女孩正向水里投掷硬币，嘴里念念有词。她看到你，问你要不要也许个愿，据说这泉水连通着班德尔城的奇异泉水，能带来好运。",
    choices: [
      {
        label: "投一枚硬币许愿（-100金币）",
        check: { costTokens: 100 },
        success: { tokens: -100, message: "你许了个愿，把硬币丢进水里。硬币沉底后，泉水咕嘟咕嘟冒了几个泡，是的，它只是咕噜咕噜的冒了几个泡。" },
      },
      {
        label: "告诉她这是封建迷信",
        success: { attrDelta: { 魅力: -1 }, message: "女孩被你一本正经的样子气哭了，说你把她的愿望都毁了。周围的群众对你指指点点。" },
      },
      {
        label: "仔细观察泉水的流向（智≥18）",
        check: { attrs: { 智力: 18 } },
        success: { addItems: ["魔力泉水石"], message: "你发现泉水下有一条极细的魔法回路，一直通往班德尔城的方向。你用工具捞起了一小块作为回路的媒介。" },
        failure: { vitality: -2, tokens: 1000, message: "你看得太入神，一头栽进了许愿池里。虽然没受伤，但浑身湿透，还捞上来一堆别人许愿用的硬币。" },
      },
    ],
  },
];
