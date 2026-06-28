# N.E.X.U.S. v0.4.54 — 项目总览

## 项目定位
LOL + 赛博朋克2077 卡牌收集/事件探索Web游戏，Next.js 16 (Turbopack) + Supabase 后端。

## 技术栈
- **前端**: Next.js 16.2.7 (Turbopack), React, TypeScript, Tailwind CSS, GSAP
- **后端**: Supabase (user_progress, user_cards, user_groups 表)
- **版本**: v0.4.79 (HudBar.tsx 底栏显示)

---

## 模块地图

### 1. 卡牌系统 (`src/lib/cards.ts`)
- **稀有度**: white / blue / gold / ultimate / special
- **类型**: champion / gem / cyberpunk / skin
- **权重**: 白360 蓝240 金60 终极16 特殊0(保底)
- **卡池数据源**: `card-map.json` → `cards-generated.ts` (95张)
- **四条升级线**: 卡兹克(虚空掠夺者→霸天异形→刹那银光) / 剑魔(暗裔剑魔→霸天剑魔→涤罪之翼) / 金鱼嘴(三张) / 2077(V→V→V)
- **特殊卡(9张)**: 妮蔻之助白/蓝/金, 崔斯特的赌约, 孤立无援, 意外之财, 合成守护符(旧秋), 秋(回满活力), 老维的欠条
- **保底**: 十连最后1张特殊卡 / 百连最后10张 (妮蔻之助·金仅崔斯特赌约+签到获取)
- **打折**: 十连950 百连9000
- **合成**: 四合一，白→蓝100%, 蓝→金50%, 金→终极20%
- **卡片存储**: `card-map.json` → `cards-generated.ts` → `ALL_CARDS`
- **UI**: CardPanel.tsx (图鉴+抽卡), 特殊卡帮助弹窗, 卡槽系统

### 2. 猜英雄 (`src/components/hero-guess/`, `src/lib/lol-data.ts`)
- 172英雄，7维对比：性别/种族/分路/地区/年份/攻击/消耗
- 标准模式 + 污渍模式
- 种族/地区支持 `/` 多值部分匹配
- 年份错误显示 ↑↓ 箭头
- 纳尔攻击=双形态

### 3. 成就系统 (`src/lib/achievements.ts`, `achievement-checker.ts`)
- 17个成就（受难曲/不想回家/只有我和你的地方/.../HELL·红·黄/篮球/新大陆）
- 隐藏成就：篮球(勒布朗+文班→凯尔科尔沃)

### 4. 地图探索 (`src/components/cyber/RuneterraMap.tsx`)
- 悬浮球入口（每日双猜英解锁）
- 10区域+2锁定（暗影岛/巨神峰）
- 活力系统：每日补到上限(默认8)，大胃王绶带+2
- 跨区移动：BFS最短路径 + confirm
- 地区总览：风景图背景 + 5线索槽 + 欢迎语
- 事件引擎：按权重随机，每日不重复，branches多分支
- 道具系统：矿工护身符(跨区免消耗) / 大胃王绶带(+上限) / 叽叽的口哨

### 5. 事件系统 (`src/lib/event-types.ts`, `event-engine.ts`, `src/data/events/demacia.ts`)
- **11个德玛西亚事件**:
  1. 巡逻兵的赌局 (fun, w12) — 智≥7
  2. 偶遇骑兵连 (fun, w12, v1) — 告密者分支
  3. 禁魔石矿工 (clue, w6) — 敏≥9 / 护身符
  4. 贵族少爷决斗 (fun, w12) — 力≥8 / 菲奥娜卡
  5. 会说话的石像鬼 (fun, w10) — 智<13隐藏/智≥18解咒
  6. 管风琴师 (clue, w8) — B/E线索 / 启示录卡
  7. 美食节 I (side, w8) — 试吃/大胃王比赛(力≥17)/吐槽
  8. 美食节 II (side, w8, require:被赶出来的人) — 忏悔/嘲讽
  9. 美食节 III (side, w8, require:大胃王绶带) — 挑战良子(力≥27)
  10. 美食节 IV (side, w8, require:终极大胃王) — HE结局
  11. __待续__
- **事件属性门槛**(+25%后): 详见事件数据
- **引擎**: pickEvent(权重随机+每日过滤), getAvailableChoices(含hideCheck/altChoices), executeChoice(属性判定+成功率)
- **产出**: tokens/vitality/attrDelta/addTags/addItems/addClues/addCards/__random_attr__(随机属性+1)
- **重复道具**: 自动分解500代币
- **属性奖励**: 按选项追踪仅首次生效(ev-attr-{eventId}-{choiceIdx})

### 6. 背包/标签/属性 (`src/lib/player-state.ts`)
- 属性: 力量/智力/敏捷/魅力 默认3
- 标签: string[], 如"告密者""菲奥娜的迷弟""被赶出来的人""大胃王绶带""终极大胃王——德玛西亚"
- 道具: {itemId, qty}[], 悬停显示说明
- UI: InventoryPanel (道具/秘宝/标签三个tab)

### 7. 事件图鉴 (`src/components/cyber/EventJournal.tsx`)
- 地图内按钮(dynamic import ssr:false)，全屏弹窗
- 左侧地区导航 / 顶部类型过滤
- 仅显示已解锁事件
- 已选选项显示✅/❌+结果+奖励(成功/失败各保留最新一条)
- 未选选项仅显示文字不显示奖励
- 单事件重置(仅清当日触发记录，保留图鉴历史)

### 8. 其他模块
- **NBA隐藏卡**: 文班亚马/勒布朗詹姆斯/凯尔科尔沃 (灌篮高手二合一)
- **2077模块**: 预留
- **背景融入**: 四张德玛西亚风景图(01/02/03事件,04总览)
- **提莫转场**: 已删除
- **IdentityCore**: 驱动核心保留

---

## 关键文件路径
```
src/lib/cards.ts              # 卡牌系统核心
src/lib/cards-generated.ts    # card-map.json 自动生成
src/lib/card-storage.ts       # Supabase CRUD
src/lib/player-state.ts       # 属性/标签/背包
src/lib/event-types.ts        # 事件类型定义
src/lib/event-engine.ts       # 事件选取+判定引擎
src/lib/achievements.ts       # 成就定义
src/lib/achievement-checker.ts # 成就触发检测
src/lib/lol-data.ts           # LOL英雄数据库
src/data/events/demacia.ts    # 德玛西亚事件数据
src/components/cyber/RuneterraMap.tsx  # 地图+事件流
src/components/cyber/EventPanel.tsx    # 事件弹窗UI
src/components/cyber/EventJournal.tsx  # 事件图鉴
src/components/cyber/InventoryPanel.tsx # 背包面板
src/components/cyber/FloatingOrb.tsx   # 悬浮球
src/components/cards/CardPanel.tsx     # 卡牌图鉴+抽卡
public/cards/                 # 卡面图片
public/events/                # 地区风景图
public/加里奥/                 # 加里奥音频
```

## 版本规则
小更新 +0.01: v0.4.78 → v0.4.79
大里程碑: 德玛西亚全事件完成 → v0.5.0
