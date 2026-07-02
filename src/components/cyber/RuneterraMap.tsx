"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getProgress, setProgress, addTokens, spendTokens, addCardsBulk, getTokens, getCollection } from "@/lib/card-storage";
import { getAttrs, getTags, getItems, adjustAttrs, addTag, removeTag, addItem, removeItem, PlayerAttrs, PlayerState } from "@/lib/player-state";
import { pickEvent } from "@/lib/event-engine";
import { GameEvent, DailyLog } from "@/lib/event-types";
import { ALL_CARDS } from "@/lib/cards";
import { demaciaEvents } from "@/data/events/demacia";
import InventoryPanel from "./InventoryPanel";
import EventPanel from "./EventPanel";
import dynamic from "next/dynamic";
const EventJournal = dynamic(() => import("./EventJournal"), { ssr: false });

interface Region {
  id: string; name: string;
  x: number; y: number; w: number; h: number;
  color: string;
  locked?: boolean;
}

const REGIONS: Region[] = [
  { id: "freljord",   name: "弗雷尔卓德", x: 8,    y: 2,    w: 29.9, h: 22,   color: "#7ec8e3" },
  { id: "demacia",    name: "德玛西亚",   x: 7.7,  y: 28.6, w: 19,   h: 19,   color: "#c9a96e" },
  { id: "noxus",      name: "诺克萨斯",   x: 29.8, y: 24.7, w: 19.5, h: 29.4, color: "#c0392b" },
  { id: "piltover",   name: "皮尔特沃夫", x: 50.2, y: 31.8, w: 13.1, h: 16.7, color: "#f4d03f" },
  { id: "zaun",       name: "祖安",       x: 51.9, y: 49.1, w: 9,    h: 10.2, color: "#27ae60" },
  { id: "ionia",      name: "艾欧尼亚",   x: 65.2, y: 10.3, w: 22,   h: 38,   color: "#e67e22" },
  { id: "bilgewater", name: "比尔吉沃特", x: 71.7, y: 53.1, w: 14.9, h: 26.4, color: "#2980b9" },
  { id: "ixtal",      name: "以绪塔尔",   x: 57.3, y: 59.7, w: 14.1, h: 18,   color: "#1abc9c" },
  { id: "shurima",    name: "恕瑞玛",     x: 33.8, y: 65.5, w: 24,   h: 22,   color: "#f39c12" },
  { id: "shadow",     name: "暗影岛",     x: 86.9, y: 71.6, w: 8.3,  h: 11.2, color: "#2c3e50", locked: true },
  { id: "targon",     name: "巨神峰",     x: 27.3, y: 75.6, w: 5.9,  h: 6.6,  color: "#b8860b", locked: true },
];

// 相邻关系
const ADJACENCY: Record<string, string[]> = {
  freljord:   ["demacia"],
  demacia:    ["freljord", "noxus"],
  noxus:      ["piltover", "freljord", "demacia", "shurima"],
  ionia:      ["piltover", "bilgewater"],
  piltover:   ["zaun", "noxus", "ionia", "bilgewater"],
  zaun:       ["piltover", "bilgewater", "ixtal", "shurima"],
  ixtal:      ["zaun", "shurima", "bilgewater"],
  bilgewater: ["ionia", "piltover", "zaun", "ixtal", "shadow"],
  shadow:     ["bilgewater", "ixtal"],
  shurima:    ["ixtal", "targon", "zaun", "noxus"],
  targon:     ["shurima"],
};

const START_REGION = "demacia";
const EXPLORE_COST = 2;
const BASE_MOVE_COST = 1;

interface Props {
  groupKey: string;
  onClose: () => void;
  onRegionClick: (region: Region) => void;
}

export default function RuneterraMap({ groupKey, onClose, onRegionClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [vitality, setVitality] = useState(0);
  const [maxVitality, setMaxVitality] = useState(8);
  const [currentRegion, setCurrentRegion] = useState(START_REGION);
  const [toast, setToast] = useState<string | null>(null);
  const [attrs, setAttrs] = useState<PlayerAttrs>({ 力量: 3, 智力: 3, 敏捷: 3, 魅力: 3 });
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [eventImage, setEventImage] = useState("");
  const [tokenBalance, setTokenBalance] = useState(0);
  const [showOverview, setShowOverview] = useState(false);
  const [overviewRegion, setOverviewRegion] = useState("");
  const [overviewExplored, setOverviewExplored] = useState(false);
  const [overviewImage, setOverviewImage] = useState("");
  const [overviewClues, setOverviewClues] = useState<(string | null)[]>(Array(5).fill(null));
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [paperDrunkActive, setPaperDrunkActive] = useState(false);
  const exploringRef = useRef(false);
  const [hasReroll, setHasReroll] = useState(false);
  const [showAttrInfo, setShowAttrInfo] = useState(false);
  const [cardCollection, setCardCollection] = useState<{ card_id: string; count: number }[]>([]);

  const ALL_EVENTS = [...demaciaEvents];

  const applyOutcome = async (outcome: import("@/lib/event-types").EventOutcome, choiceIndex: number, choiceSuccess: boolean): Promise<boolean> => {
    if (!groupKey) return false;

    // Phase 1: 收集所有写操作 + attr 检查
    const writes: Promise<any>[] = [];
    const today = new Date().toISOString().split("T")[0];
    let tokenDelta = outcome.tokens || 0;
    let attrApplied = false;

    // 道具重复检查（本地判断，不用网络）
    const allAddItems = [...(outcome.addItems || []), ...(outcome.clueItems || [])];
    const clueSet = new Set(outcome.clueItems || []);
    const stackableSet = new Set(["约德尔变形糖", "蘑菇披萨", "鸡蛋"]); // 食品类可叠加
    for (let itemId of allAddItems) {
      if (itemId === "__random_attr__") {
        const attr = ["力量","智力","敏捷","魅力"][Math.floor(Math.random() * 4)] as keyof PlayerAttrs;
        writes.push(adjustAttrs(groupKey, { [attr]: 1 }));
        continue;
      }
      const existing = playerState?.items?.find(i => i.itemId === itemId);
      if (existing && existing.qty > 0) {
        if (stackableSet.has(itemId)) {
          // 可叠加道具，直接加数量
          writes.push(addItem(groupKey, itemId));
        } else {
          const amount = clueSet.has(itemId) ? 500 : 300;
          tokenDelta += amount;
          showToast(`已拥有「${itemId}」，自动分解为${amount}金币`);
        }
      } else {
        writes.push(addItem(groupKey, itemId));
      }
    }

    // 金币（合并后一次写入）
    if (tokenDelta > 0) writes.push(addTokens(groupKey, tokenDelta));
    else if (tokenDelta < 0) writes.push(spendTokens(groupKey, -tokenDelta));

    // 活力（999=补满到上限，不低于当前值）
    if (outcome.vitality) {
      let v: number;
      if (outcome.vitality >= 999) {
        v = Math.max(vitality, maxVitality);
      } else {
        v = Math.max(0, vitality + outcome.vitality);
      }
      writes.push(setProgress(groupKey, "map-vitality", JSON.stringify({ v, max: maxVitality, date: today })));
      setVitality(v);
    }
    // 失去道具（消费/移除）
    const consumedItem = outcome.removeItems?.[0] || "";
    if (consumedItem) {
      writes.push(removeItem(groupKey, consumedItem, 1));
    }
    // 永久图鉴：记录所有曾获得过的道具
    if (outcome.addItems?.length || outcome.clueItems?.length) {
      const newIds = [...(outcome.addItems || []), ...(outcome.clueItems || [])].filter(id => id !== "__random_attr__");
      if (newIds.length > 0) {
        const seenKey = "seen-items";
        const seenRaw = await getProgress(groupKey, seenKey);
        const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];
        for (const id of newIds) { if (!seen.includes(id)) seen.push(id); }
        writes.push(setProgress(groupKey, seenKey, JSON.stringify(seen)));
      }
    }

    // 属性（正收益仅首次，负收益可重复）
    if (outcome.attrDelta) {
      const hasPositive = Object.values(outcome.attrDelta).some(v => (v || 0) > 0);
      if (hasPositive) {
        const attrKey = `ev-attr-${currentEvent?.id || "unknown"}-${choiceIndex}`;
        const already = await getProgress(groupKey, attrKey);
        if (already !== "1") {
          writes.push(adjustAttrs(groupKey, outcome.attrDelta));
          writes.push(setProgress(groupKey, attrKey, "1"));
          attrApplied = true;
        }
      } else {
        // 纯负面：始终生效
        writes.push(adjustAttrs(groupKey, outcome.attrDelta));
        attrApplied = true;
      }
    }

    // 线索（更新数据；首次或数据变化给500金币）
    if (outcome.addClues) for (const cl of outcome.addClues) {
      const clueKey = `clue-${cl.region}-${cl.type}`;
      const existing = await getProgress(groupKey, clueKey);
      if (existing && existing !== cl.data) {
        // 数据更新（如文本修正），直接覆盖
        writes.push(setProgress(groupKey, clueKey, cl.data));
      } else if (existing) {
        tokenDelta += 500;
        showToast(`已拥有线索，自动分解为500金币`);
      } else {
        writes.push(setProgress(groupKey, clueKey, cl.data));
      }
    }
    // 标签（重复获取→300金币）
    if (outcome.addTags) {
      for (const t of outcome.addTags) {
        if (playerState?.tags?.includes(t)) {
          tokenDelta += 300;
          showToast(`已拥有标签「${t}」，自动分解为300金币`);
        } else {
          writes.push(addTag(groupKey, t));
        }
      }
    }
    if (outcome.removeTags) for (const t of outcome.removeTags) writes.push(removeTag(groupKey, t));

    // 失去卡牌
    if (outcome.removeCards?.length) {
      const { removeCardsBulk } = await import("@/lib/card-storage");
      writes.push(removeCardsBulk(groupKey, outcome.removeCards));
    }
    // 卡牌
    if (outcome.addCards?.length) {
      const resolved = outcome.addCards.map(id => {
        if (id === "__random_blue__") {
          const blues = ALL_CARDS.filter(c => c.rarity === "blue" && !c.id.startsWith("mimic-"));
          return blues[Math.floor(Math.random() * blues.length)]?.id || id;
        }
        if (id === "__random_gold__") {
          const golds = ALL_CARDS.filter(c => c.rarity === "gold" && !c.id.startsWith("mimic-"));
          return golds[Math.floor(Math.random() * golds.length)]?.id || id;
        }
        return id;
      });
      writes.push(addCardsBulk(groupKey, resolved));
      try { window.dispatchEvent(new Event("card-reload")); } catch {}
    }

    // Phase 2: 并行执行所有写操作
    if (writes.length > 0) await Promise.all(writes);

    // 记录事件结果（兼容旧格式）
    if (currentEvent) {
      try {
        const seenKey = `seen-events`;
        const seenRaw = await getProgress(groupKey, seenKey);
        const seen: Record<string, any> = seenRaw ? JSON.parse(seenRaw) : {};
        if (seen[currentEvent.id]) {
          // 兼容旧格式：没有choices数组则转换
          if (!seen[currentEvent.id].choices) {
            seen[currentEvent.id].choices = [];
            if (seen[currentEvent.id].lastChoice !== undefined) {
              seen[currentEvent.id].choices.push({ index: seen[currentEvent.id].lastChoice, msg: seen[currentEvent.id].lastMsg || "" });
            }
          }
          // 同选项同结果只保留最新一条（成功/失败各最多一条）
          seen[currentEvent.id].choices = seen[currentEvent.id].choices.filter(
            (c: any) => !(c.index === choiceIndex && c.success === choiceSuccess)
          );
          seen[currentEvent.id].choices.push({ index: choiceIndex, success: choiceSuccess, msg: outcome.message || "" });
        }
        writes.push(setProgress(groupKey, seenKey, JSON.stringify(seen)));
      } catch {}
    }

    // Phase 3: 并行读取所有最新状态
    const [a, tags, items, t, coll, vRaw] = await Promise.all([
      getAttrs(groupKey),
      getTags(groupKey),
      getItems(groupKey),
      getTokens(groupKey),
      getCollection(groupKey),
      getProgress(groupKey, "map-vitality"),
    ]);

    // Phase 4: 更新 React state
    setAttrs(a);
    setTokenBalance(t);
    setCardCollection(coll);
    if (vRaw) { const vd = JSON.parse(vRaw); setVitality(vd.v); const strBonus2 = Math.floor((a.力量 || 0) / 10); const bonusMax2 = (items.some(i => i.itemId === "大胃王绶带" && i.qty > 0) ? 2 : 0) + (items.some(i => i.itemId === "沉重的铠甲" && i.qty > 0) ? 2 : 0) + strBonus2; setMaxVitality(Math.max(vd.max || 8, 8 + bonusMax2)); }
    setPlayerState({ attrs: a, tags, items });
    return attrApplied;
  };

  const moveCost = useMemo(() => BASE_MOVE_COST + (playerState?.items?.some(i => i.itemId === "沉重的铠甲" && i.qty > 0) ? 1 : 0), [playerState]);
  const adjacentSet = useMemo(() => {
    return new Set(ADJACENCY[currentRegion] || []);
  }, [currentRegion]);

  // 加载活力与当前位置
  useEffect(() => {
    if (!groupKey) return;
    (async () => {
      // 属性
      const a = await getAttrs(groupKey);
      const tags = await getTags(groupKey);
      const items = await getItems(groupKey);
      setAttrs(a);
      setPlayerState({ attrs: a, tags, items });
      const t = await getTokens(groupKey);
      setTokenBalance(t);
      const coll = await getCollection(groupKey);
      setCardCollection(coll);
      // 活力
      const today = new Date().toISOString().split("T")[0];
      const vRaw = await getProgress(groupKey, "map-vitality");
      let vData: { v: number; max: number; date: string };
      if (vRaw) {
        vData = JSON.parse(vRaw);
        if (vData.date !== today) {
          const maxV = vData.max || 8;
          vData = { v: Math.max(maxV, vData.v), max: maxV, date: today };
        }
      } else {
        const extraMax2 = items.some(i => i.itemId === "大胃王绶带" && i.qty > 0) ? 2 : 0;
        vData = { v: 8 + extraMax2, max: 8 + extraMax2, date: today };
      }
      setVitality(vData.v);
      // max 自修复：≥8 + 道具加成（大胃王绶带+2, 沉重铠甲+2），不重复叠加
      { const strBonus = Math.floor((attrs.力量 || 0) / 10); const bonusMax = (items.some(i => i.itemId === "大胃王绶带" && i.qty > 0) ? 2 : 0) + (items.some(i => i.itemId === "沉重的铠甲" && i.qty > 0) ? 2 : 0) + strBonus; const correctMax = Math.max(vData.max || 8, 8 + bonusMax); setMaxVitality(correctMax); if (correctMax !== (vData.max || 8)) { vData.max = correctMax; await setProgress(groupKey, "map-vitality", JSON.stringify(vData)); } }
      // 位置
      const region = await getProgress(groupKey, "map-region");
      if (region && REGIONS.some(r => r.id === region)) setCurrentRegion(region);
      // 持久化初始化
      await setProgress(groupKey, "map-vitality", JSON.stringify(vData));
      if (!region) await setProgress(groupKey, "map-region", START_REGION);
    })();
  }, [groupKey]);

  // 监听秋的活力回满事件
  useEffect(() => {
    const onRefill = async (e: Event) => {
      const gk = (e as CustomEvent).detail?.groupKey;
      if (gk !== groupKey) return;
      const today = new Date().toISOString().split("T")[0];
      await setProgress(groupKey, "map-vitality", JSON.stringify({ v: maxVitality, max: maxVitality, date: today }));
      setVitality(maxVitality);
      // 通知card panel刷新
      try { window.dispatchEvent(new Event("card-reload")); } catch {}
    };
    window.addEventListener("vitality-refill", onRefill);
    return () => window.removeEventListener("vitality-refill", onRefill);
  }, [groupKey, maxVitality]);

  const saveVitality = async (v: number) => {
    const today = new Date().toISOString().split("T")[0];
    await setProgress(groupKey, "map-vitality", JSON.stringify({ v, max: maxVitality, date: today }));
    setVitality(v);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // BFS 最短路径
  const findShortestPath = (from: string, to: string): string[] | null => {
    if (from === to) return [];
    const visited = new Set<string>();
    const queue: { node: string; path: string[] }[] = [{ node: from, path: [] }];
    visited.add(from);
    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      for (const next of (ADJACENCY[node] || [])) {
        if (next === to) return [...path, next];
        if (!visited.has(next)) {
          visited.add(next);
          queue.push({ node: next, path: [...path, next] });
        }
      }
    }
    return null; // 无路径（不应该发生）
  };

  const handleRegionClick = async (region: Region) => {
    if (region.locked) {
      showToast("暂未开放");
      return;
    }

    const rid = region.id;

    // 当前区域：探索 → 先显示地区总览
    if (rid === currentRegion) {
      if (vitality < EXPLORE_COST) { showToast(`活力不足（需${EXPLORE_COST}点）`); return; }
      setOverviewRegion(rid);
      setOverviewExplored(false);
      setOverviewImage("/events/德玛西亚_04.png");
      // 加载该地区已获得的线索
      const clueTypes = ["A","B","C","D","E"];
      const clues: (string | null)[] = await Promise.all(
        clueTypes.map(t => getProgress(groupKey, `clue-${rid}-${t}`))
      );
      setOverviewClues(clues.map(c => c || null));
      setShowOverview(true);
      return;
    }

    // 相邻区域：移动
    if (adjacentSet.has(rid)) {
      // 矿工护身符：抵消本次移动消耗
      const hasCharm = playerState?.items?.some(i => i.itemId === "矿工护身符" && i.qty > 0);
      const hasSugar = await getProgress(groupKey, "sugar-active") === "1";
      // 敏捷：敏捷×1%概率免疫活力消耗（至多60%）
      const agi = playerState?.attrs?.敏捷 || 0;
      const agiDodge = !hasCharm && !hasSugar && Math.random() < Math.min(agi * 0.01, 0.6);
      const cost = (hasCharm || hasSugar || agiDodge) ? 0 : moveCost;
      if (vitality < cost) { showToast(`活力不足（需${cost}点）`); return; }
      if (hasCharm) {
        await removeItem(groupKey, "矿工护身符", 1);
        setPlayerState(prev => prev ? {
          ...prev,
          items: prev.items.map(i => i.itemId === "矿工护身符" ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0)
        } : prev);
        showToast(`🍀 矿工护身符抵消了移动消耗！`);
      }
      if (hasSugar) {
        await setProgress(groupKey, "sugar-active", "");
        showToast("🍬 约德尔变形糖：免活力移动！");
      }
      if (agiDodge) showToast(`💨 敏捷身法：免活力移动！（${agi}敏）`);
      await setProgress(groupKey, "map-region", rid);
      setCurrentRegion(rid);
      // 标记地区移动（魅力金币用）
      await setProgress(groupKey, "just-moved", "1");
      if (!hasCharm && !hasSugar && !agiDodge) await saveVitality(vitality - cost);
      if (!hasCharm && !hasSugar && !agiDodge) showToast(`🚶 前往 ${region.name}（-${cost}活力）`);
      // 变形糖：触发当地班德尔事件
      if (hasSugar) {
        const bandleHere = ALL_EVENTS.filter(e => e.id.startsWith("bandle-") && e.region === rid);
        if (bandleHere.length > 0) {
          const totalW2 = bandleHere.reduce((s,e) => s + e.weight, 0);
          let r2 = Math.random() * totalW2;
          let picked = bandleHere[0];
          for (const e of bandleHere) { r2 -= e.weight; if (r2 <= 0) { picked = e; break; } }
          setEventImage(picked.image || "/events/德玛西亚_01.png");
          setCurrentEvent(picked);
          setHasReroll(false);
          return;
        }
      }
      setOverviewRegion(rid);
      setOverviewExplored(false);
      setOverviewImage("/events/德玛西亚_04.png");
      setShowOverview(true);
      return;
    }

    // 不相邻 → 计算最快路径
    const path = findShortestPath(currentRegion, rid);
    if (!path) { showToast(`无法到达${region.name}`); return; }
    const hasSugarBFS = await getProgress(groupKey, "sugar-active") === "1";
    const agiBFS = playerState?.attrs?.敏捷 || 0;
    const agiDodgeBFS = !hasSugarBFS && Math.random() < Math.min(agiBFS * 0.01, 0.6);
    const totalCost = (hasSugarBFS || agiDodgeBFS) ? 0 : path.length * moveCost;
    const curName = REGIONS.find(r => r.id === currentRegion)?.name || currentRegion;
    const regionNames = path.map(id => REGIONS.find(r => r.id === id)?.name || id).join(" → ");
    if (!hasSugarBFS && !agiDodgeBFS && !confirm(`前往 ${region.name}\n路径：${curName} → ${regionNames}\n消耗 ${totalCost} 活力（${path.length} 次移动）`)) return;
    if (vitality < totalCost) { showToast(`活力不足（需${totalCost}点）`); return; }
    await setProgress(groupKey, "map-region", rid);
    setCurrentRegion(rid);
    await setProgress(groupKey, "just-moved", "1");
    if (!hasSugarBFS && !agiDodgeBFS) await saveVitality(vitality - totalCost);
    if (agiDodgeBFS) showToast(`💨 敏捷身法：免活力移动！（${agiBFS}敏）`);
    if (hasSugarBFS) {
      await setProgress(groupKey, "sugar-active", "");
      showToast("🍬 约德尔变形糖：免活力移动！");
      const bandleHere = ALL_EVENTS.filter(e => e.id.startsWith("bandle-") && e.region === rid);
      if (bandleHere.length > 0) {
        const picked = bandleHere[Math.floor(Math.random() * bandleHere.length)];
        setEventImage(picked.image || "/events/德玛西亚_01.png");
        setCurrentEvent(picked);
        setHasReroll(false);
        return;
      }
    }
    showToast(`🚶 前往 ${region.name}（-${totalCost}活力）`);
    setOverviewRegion(rid);
    setOverviewExplored(false);
    setOverviewImage("/events/德玛西亚_04.png");
    setShowOverview(true);
  };

  const isAdjacent = (id: string) => adjacentSet.has(id) || id === currentRegion;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center"
      style={{ background: "rgba(3,2,14,0.96)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="flex flex-col items-center"
        style={{ width: "min(1000px, 96vw)", height: "min(780px, 92vh)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between w-full mb-2 px-2">
          <div className="flex items-center gap-4">
            <h3 className="font-heading text-lg tracking-[0.2em]"
              style={{ color: "#ffd700", textShadow: "0 0 12px rgba(255,215,0,0.4)" }}>
              🗺️ 符文大陆
            </h3>
            {/* Vitality bar */}
            <div className="flex items-center gap-2 font-mono text-sm">
              <span style={{ color: "#00ff88" }}>⚡</span>
              <span style={{ color: vitality > 2 ? "#00ff88" : "#ff3355" }}>{vitality}</span>
              <span style={{ color: "rgba(200,200,208,0.3)", fontSize: 10 }}>/{maxVitality}</span>
            </div>
            {/* Divider */}
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
            {/* Attrs */}
            <div className="flex items-center gap-3 font-mono text-xs">
              {(["力量","智力","敏捷","魅力"] as (keyof PlayerAttrs)[]).map(k => {
                const colors: Record<string, string> = { 力量: "#ff6666", 智力: "#6699ff", 敏捷: "#66ff66", 魅力: "#ff88ff" };
                const labels: Record<string, string> = { 力量: "力", 智力: "智", 敏捷: "敏", 魅力: "魅" };
                return (
                  <span key={k} className="flex items-center gap-0.5">
                    <span style={{ color: "rgba(200,200,208,0.3)" }}>{labels[k]}</span>
                    <span style={{ color: colors[k] }}>{attrs[k]}</span>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs" style={{ color: "rgba(200,200,208,0.3)" }}>
              📍 {REGIONS.find(r => r.id === currentRegion)?.name || ""}
            </span>
            <button onClick={() => setShowAttrInfo(true)} className="font-mono text-xs px-2 py-1 border opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: "rgba(200,200,208,0.4)", borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>📊 属性</button>
            <InventoryPanel />
            {groupKey && <EventJournal groupKey={groupKey} />}
            <button onClick={onClose} className="font-mono text-xl hover:scale-110 transition-transform"
              style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 w-full relative overflow-hidden"
          style={{ border: "1px solid rgba(180,160,200,0.15)", borderRadius: "6px", background: "rgba(10,15,25,0.8)" }}>
          {!imgFailed && (
            <img src="/符文大陆原版地图.png" alt="符文大陆"
              className="absolute inset-0 w-full h-full object-cover opacity-75"
              loading="eager"
              onError={() => setImgFailed(true)} />
          )}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(3,2,14,0.6) 100%)", pointerEvents: "none" }} />
          {imgFailed && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <p className="font-mono text-sm" style={{ color: "rgba(200,200,220,0.12)" }}>将符文大陆地图放入 public/符文大陆原版地图.png</p>
            </div>
          )}

          {/* Current location marker */}
          {REGIONS.filter(r => r.id === currentRegion).map(r => (
            <div key="current" className="absolute pointer-events-none"
              style={{
                left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%`,
                border: "2px solid rgba(0,255,136,0.5)",
                background: "rgba(0,255,136,0.06)",
                boxShadow: "inset 0 0 30px rgba(0,255,136,0.15), 0 0 20px rgba(0,255,136,0.1)",
                borderRadius: "4px", zIndex: 5,
              }}
            />
          ))}

          {REGIONS.map(region => {
            const isHovered = hovered === region.id;
            const isCurrent = region.id === currentRegion;
            const canReach = isAdjacent(region.id);

            return (
              <div key={region.id}
                className="absolute transition-all duration-200"
                style={{
                  left: `${region.x}%`, top: `${region.y}%`,
                  width: `${region.w}%`, height: `${region.h}%`,
                  border: isCurrent ? "2px solid rgba(0,255,136,0.5)"
                    : isHovered ? `2px solid ${region.color}88`
                    : "1px solid transparent",
                  background: isCurrent ? "rgba(0,255,136,0.06)"
                    : isHovered ? `${region.color}12`
                    : "transparent",
                  boxShadow: isCurrent ? "inset 0 0 30px rgba(0,255,136,0.15)"
                    : isHovered ? `inset 0 0 50px ${region.color}20`
                    : "none",
                  borderRadius: "4px",
                  filter: region.locked ? "grayscale(0.7)" : canReach ? "none" : "brightness(0.5)",
                  zIndex: isHovered ? 10 : 1,
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onMouseEnter={() => setHovered(region.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleRegionClick(region)}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: isHovered || isCurrent ? 1 : 0, transition: "opacity 0.3s" }}>
                  <div className="text-center">
                    <span className="font-heading block font-bold"
                      style={{
                        fontSize: "22px",
                        color: region.locked ? "rgba(150,150,160,0.35)"
                          : isCurrent ? "#00ff88"
                          : region.color,
                        textShadow: isHovered && !region.locked && !isCurrent
                          ? `0 0 18px ${region.color}cc, 0 0 36px ${region.color}66`
                          : isCurrent ? "0 0 12px rgba(0,255,136,0.6)" : "none",
                        letterSpacing: "0.08em",
                      }}>
                      {region.name}
                    </span>
                    {region.locked && (
                      <span className="font-mono block mt-1" style={{ fontSize: 10, color: "rgba(200,200,200,0.3)" }}>
                        暂未开放
                      </span>
                    )}
                    {isHovered && !region.locked && !isCurrent && !canReach && (
                      <span className="font-mono block mt-1" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
                        无法直接到达
                      </span>
                    )}
                    {isCurrent && (
                      <div className="mx-auto mt-1 flex items-center gap-1 justify-center">
                        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#00ff88", boxShadow: "0 0 8px #00ff88", animation: "pulse-glow 1.5s ease-in-out infinite" }} />
                        <span className="font-mono" style={{ fontSize: 8, color: "rgba(0,255,136,0.4)" }}>当前位置</span>
                      </div>
                    )}
                    {isHovered && canReach && !isCurrent && !region.locked && (
                      <span className="font-mono block mt-1" style={{ fontSize: 9, color: region.color + "88" }}>
                        {region.id === currentRegion ? `探索 -${EXPLORE_COST}⚡` : `前往 -${moveCost}⚡`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Cost legend */}
          <div className="absolute bottom-3 left-3 font-mono text-xs flex gap-4"
            style={{ color: "rgba(200,200,208,0.2)", background: "rgba(5,5,16,0.7)", padding: "4px 8px", borderRadius: 3 }}>
            <span>🔍 探索 -{EXPLORE_COST}⚡</span>
            <span>🚶 移动 -{BASE_MOVE_COST}⚡</span>
          </div>
        </div>

        {/* Region Overview */}
        {showOverview && !currentEvent && (() => {
          const regionName = REGIONS.find(r => r.id === overviewRegion)?.name || overviewRegion;
          return (
            <div className="fixed inset-0 z-[130] flex items-center justify-center"
              style={{ background: "rgba(4,2,18,0.94)", backdropFilter: "blur(6px)" }}>
              <div className="relative overflow-hidden" style={{
                width: "min(900px, 94vw)", height: "min(600px, 82vh)",
                border: "1px solid rgba(180,160,255,0.15)", borderRadius: 8,
                boxShadow: "0 0 60px rgba(120,40,220,0.2)",
              }}>
                {overviewImage && (
                  <img src={overviewImage} alt="" className="absolute inset-0 w-full h-full"
                    style={{ objectFit: "cover", objectPosition: "50% 0%", filter: "brightness(0.35) contrast(0.65)" }} />
                )}
                {/* Content centered over background */}
                <div className="relative z-10 flex flex-col items-center h-full p-6">
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    <InventoryPanel />
                    <button onClick={() => setShowOverview(false)}
                      className="font-mono text-xl hover:scale-110"
                      style={{ color: "rgba(255,255,255,0.5)" }}>✕</button>
                  </div>

                  {/* TOP: 5 clue slots */}
                  <div className="grid grid-cols-5 gap-3 w-full" style={{ maxWidth: "520px", paddingTop: "6px" }}>
                    {[
                      { type: "A", label: "秘宝图片" },
                      { type: "B", label: "秘宝名称" },
                      { type: "C", label: "守护者图片" },
                      { type: "D", label: "守护者信息" },
                      { type: "E", label: "守护者声音" },
                    ].map(({ type, label }, i) => {
                      const clue = overviewClues[i];
                      const hasClue = !!clue;
                      return (
                      <div key={type} className="text-center">
                        <span className="font-mono block mb-1.5" style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{label}</span>
                        <div className="aspect-square border flex items-center justify-center"
                          style={{
                            borderColor: hasClue ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.2)",
                            borderRadius: 4,
                            background: hasClue ? "rgba(255,215,0,0.1)" : "rgba(0,0,0,0.2)",
                          }}>
                          {hasClue ? (
                            type === "E" ? (
                              <button onClick={(e) => { e.stopPropagation(); const a = new Audio(clue!); a.play().catch(() => {}); }}
                                style={{ fontSize: "18px", cursor: "pointer", background: "none", border: "none" }}>🔊</button>
                            ) : type === "A" || type === "C" ? (
                              (clue!.endsWith(".webm") || clue!.endsWith(".mp4")) ? (
                                <video src={clue!} className="w-full h-full object-cover cursor-pointer"
                                  style={{ borderRadius: 2, mixBlendMode: "screen" }}
                                  muted loop autoPlay playsInline
                                  onClick={(e) => { e.stopPropagation(); setLightboxImage(clue!); }}
                                />
                              ) : (
                                <img src={clue!} alt={label} className="w-full h-full object-cover cursor-pointer"
                                  style={{ borderRadius: 2 }}
                                  onClick={(e) => { e.stopPropagation(); setLightboxImage(clue!); }}
                                />
                              )
                            ) : type === "B" || type === "D" ? (
                              <span style={{ fontSize: "11px", color: "#ffd700", fontWeight: "bold", padding: "2px" }}>{clue}</span>
                            ) : (
                              <span style={{ fontSize: "20px", color: "#ffd700" }}>✓</span>
                            )
                          ) : (
                            <span style={{ fontSize: "30px", color: "rgba(255,255,255,0.5)", fontWeight: 200 }}>+</span>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>

                  {/* MIDDLE: Welcome text */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-heading tracking-[0.15em]"
                        style={{ fontSize: "2.2rem", color: "#ffd700", textShadow: "0 0 24px rgba(255,215,0,0.5), 0 0 40px rgba(0,0,0,0.7)", lineHeight: 1.3 }}>
                        欢迎来到
                      </p>
                      <p className="font-heading tracking-[0.1em]"
                        style={{ fontSize: "3.8rem", color: "#ffd700", textShadow: "0 0 36px rgba(255,215,0,0.6), 0 0 60px rgba(0,0,0,0.7)", lineHeight: 1.3, fontWeight: 900 }}>
                        {regionName}
                      </p>
                    </div>
                  </div>

                  {/* 附魔口哨套按钮 */}
                  {overviewRegion === "demacia" && playerState?.items?.some(i => i.itemId === "附魔口哨套" && i.qty > 0) && (
                    <div className="w-full mb-2" style={{ maxWidth: "520px" }}>
                      <button onClick={async () => {
                        const today = new Date().toISOString().split("T")[0];
                        const used = await getProgress(groupKey, `whistle-${today}`);
                        if (used === "1") { showToast("今日已使用过附魔口哨套"); return; }
                        await setProgress(groupKey, `whistle-${today}`, "1");
                        const bandleEvents = ALL_EVENTS.filter(e => {
                          if (!e.id.startsWith("bandle-")) return false;
                          if (!e.require) return true;
                          if (e.require.tags && !e.require.tags.every(t => playerState!.tags.includes(t))) return false;
                          if (e.require.notTags && e.require.notTags.some(t => playerState!.tags.includes(t))) return false;
                          if (e.require.items && !e.require.items.every(i => playerState!.items.some(s => s.itemId === i && s.qty > 0))) return false;
                          return true;
                        });
                        if (bandleEvents.length > 0) {
                          const totalW = bandleEvents.reduce((s, e) => s + e.weight, 0);
                          let r = Math.random() * totalW;
                          let picked = bandleEvents[0];
                          for (const e of bandleEvents) { r -= e.weight; if (r <= 0) { picked = e; break; } }
                          setEventImage(picked.image || "/events/德玛西亚_01.png");
                          setCurrentEvent(picked);
                          setPaperDrunkActive(false);
                        }
                      }}
                        className="font-mono text-sm w-full py-2 border transition-all hover:scale-[1.02]"
                        style={{ borderColor: "rgba(200,100,255,0.3)", background: "rgba(200,100,255,0.05)", color: "#c864ff" }}>
                        🎵 吹响口哨（每日限一次）
                      </button>
                    </div>
                  )}
                  {/* BOTTOM: Explore button */}
                  <div className="w-full" style={{ maxWidth: "520px", paddingBottom: "6px" }}>
                    <button onClick={async () => {
                        if (exploringRef.current) return;
                        exploringRef.current = true;
                        try {
                        if (vitality < EXPLORE_COST) { showToast(`活力不足`); return; }
                        // 消音垫：免费重roll
                        const freeReroll = await getProgress(groupKey, "free-reroll");
                        // 中毒：下次探索活力+1且检定必败，然后失去标签
                        let poisonActive = false;
                        if (playerState?.tags?.includes("中毒")) {
                          poisonActive = true;
                          showToast("☠️ 中毒：本次探索检定必败且活力消耗+1！");
                          // 消耗中毒标签
                          try { const { removeTag } = await import("@/lib/player-state"); await removeTag(groupKey, "中毒"); } catch {}
                          setPlayerState(prev => prev ? { ...prev, tags: prev.tags.filter(t => t !== "中毒") } : prev);
                        }
                        // 纸醉金迷：每日首次探索免活力，检定必败
                        let firstExplore = false;
                        if (playerState?.tags?.includes("纸醉金迷")) {
                          const today2 = new Date().toISOString().split("T")[0];
                          const raw = await getProgress(groupKey, `daily-events-${today2}`);
                          const dailyLog: DailyLog = raw ? JSON.parse(raw) : { date: today2, triggeredEvents: [], vitalityUsed: 0 };
                          if (dailyLog.triggeredEvents.length === 0) {
                            firstExplore = true;
                            showToast("🍷 纸醉金迷：首次探索免活力，但检定必败");
                          }
                        }
                        if (!firstExplore) {
                          const cost = EXPLORE_COST + (poisonActive ? 1 : 0);
                          if (vitality < cost) { showToast(`活力不足（需${cost}点）`); return; }
                          await saveVitality(vitality - cost);
                        }
                        setHasReroll(freeReroll === "1");
                        setPaperDrunkActive(firstExplore || poisonActive);
                        if (overviewRegion === "demacia" && playerState) {
                          const today2 = new Date().toISOString().split("T")[0];
                          const raw = await getProgress(groupKey, `daily-events-${today2}`);
                          const dailyLog: DailyLog = raw ? JSON.parse(raw) : { date: today2, triggeredEvents: [], vitalityUsed: 0 };
                          const picked = pickEvent(overviewRegion, ALL_EVENTS, playerState, dailyLog);
                          if (picked) {
                            // 魅力：地区移动后首次事件获得20×魅力金币
                            const justMoved = await getProgress(groupKey, "just-moved");
                            if (justMoved === "1") {
                              await setProgress(groupKey, "just-moved", "");
                              const charmBonus = 20 * (playerState.attrs.魅力 || 0);
                              if (charmBonus > 0) {
                                const { addTokens } = await import("@/lib/card-storage");
                                await addTokens(groupKey, charmBonus);
                                showToast(`✨ 魅力加成：+${charmBonus}金币`);
                              }
                            }
                            dailyLog.triggeredEvents.push(picked.id);
                            await setProgress(groupKey, `daily-events-${today2}`, JSON.stringify(dailyLog));
                            // 记录事件到日志
                            const seenKey = `seen-events`;
                            const seenRaw = await getProgress(groupKey, seenKey);
                            const seen: Record<string, any> = seenRaw ? JSON.parse(seenRaw) : {};
                            if (!seen[picked.id]) seen[picked.id] = { name: picked.name, weight: picked.weight, choices: [] };
                            await setProgress(groupKey, seenKey, JSON.stringify(seen));
                            setEventImage(picked.image || "/events/德玛西亚_01.png");
                            setCurrentEvent(picked);
                            return;
                          }
                        }
                        showToast("该地区暂无可用事件");
                        } finally { exploringRef.current = false; }
                      }}
                        className="font-mono text-base w-full py-3 border transition-all hover:scale-[1.02]"
                        style={{ borderColor: "rgba(255,215,0,0.3)", color: "#ffd700", background: "rgba(0,0,0,0.35)" }}>
                        {vitality >= EXPLORE_COST ? `${overviewExplored ? "继续" : "开始"}探索（⚡${vitality}/${maxVitality}）` : `活力不足（⚡${vitality}/${maxVitality}）`}
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          );
        })()}

        {/* Event Panel */}
        {currentEvent && playerState && (
          <EventPanel
            event={currentEvent}
            playerState={playerState}
            attrs={attrs}
            tokens={tokenBalance}
            fixedImage={eventImage}
            cardCollection={cardCollection}
            forceFail={paperDrunkActive}
            hasReroll={hasReroll}
            vitality={vitality}
            maxVitality={maxVitality}
            onRedirect={async (eventId) => {
              const target = ALL_EVENTS.find(e => e.id === eventId);
              if (target) {
                // 记录到图鉴和每日日志
                const today2 = new Date().toISOString().split("T")[0];
                const seenKey = "seen-events";
                const seenRaw = await getProgress(groupKey, seenKey);
                const seen: Record<string, any> = seenRaw ? JSON.parse(seenRaw) : {};
                if (!seen[target.id]) seen[target.id] = { name: target.name, weight: target.weight, choices: [] };
                await setProgress(groupKey, seenKey, JSON.stringify(seen));
                // 加入当日触发列表
                const raw = await getProgress(groupKey, `daily-events-${today2}`);
                const dailyLog: DailyLog = raw ? JSON.parse(raw) : { date: today2, triggeredEvents: [], vitalityUsed: 0 };
                dailyLog.triggeredEvents.push(target.id);
                await setProgress(groupKey, `daily-events-${today2}`, JSON.stringify(dailyLog));
                setEventImage(target.image || "/events/德玛西亚_01.png");
                setCurrentEvent(target);
                setPaperDrunkActive(false);
              }
            }}
            onResult={async (outcome, choiceIndex, success) => {
              return await applyOutcome(outcome, choiceIndex, success);
            }}
            onClose={() => {
              setCurrentEvent(null);
              setOverviewExplored(true);
              setHasReroll(false);
            }}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[130] pointer-events-none animate-bounce"
            style={{
              padding: "8px 18px", background: "rgba(13,13,36,0.95)",
              border: "1px solid rgba(255,215,0,0.3)", color: "#ffd700",
              fontFamily: "monospace", fontSize: 13, borderRadius: 4,
              textShadow: "0 0 8px rgba(255,215,0,0.3)",
            }}>
            {toast}
          </div>
        )}

        {/* Lightbox for clue images/videos */}
        {lightboxImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(4px)" }}
            onClick={() => setLightboxImage(null)}>
            {(lightboxImage.endsWith(".webm") || lightboxImage.endsWith(".mp4")) ? (
              <video src={lightboxImage} controls autoPlay loop
                className="max-w-[90vw] max-h-[90vh] object-contain border"
                style={{ borderColor: "rgba(255,215,0,0.2)", borderRadius: 4 }}
                onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={lightboxImage} alt="线索图片"
                className="max-w-[90vw] max-h-[90vh] object-contain border"
                style={{ borderColor: "rgba(255,215,0,0.2)", borderRadius: 4 }} />
            )}
            <button onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 font-mono text-2xl hover:scale-110"
              style={{ color: "rgba(255,255,255,0.5)" }}>✕</button>
          </div>
        )}

        {/* 属性加成说明弹窗 */}
        {showAttrInfo && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setShowAttrInfo(false)}>
            <div className="p-6 border rounded max-w-sm w-[90vw]" onClick={e => e.stopPropagation()}
              style={{ borderColor: "rgba(255,215,0,0.2)", background: "rgba(10,5,20,0.95)" }}>
              <h3 className="font-heading text-lg mb-4 tracking-[0.1em]" style={{ color: "#ffd700" }}>📊 属性加成</h3>
              {(["力量","智力","敏捷","魅力"] as const).map(k => {
                const v = attrs[k];
                const colors: Record<string,string> = { 力量: "#ff6666", 智力: "#6699ff", 敏捷: "#66ff66", 魅力: "#ff88ff" };
                const desc: Record<string,string> = {
                  力量: `每10点活力上限+1 · 当前+${Math.floor(v/10)}上限（基础8→${8+Math.floor(v/10)}）`,
                  智力: `每10点线索事件权重+1 · 当前权重+${Math.floor(v/10)}`,
                  敏捷: `每点1%概率免移动消耗（至多60%）· 当前${Math.min(v,60)}%`,
                  魅力: `移后首次事件获20×魅力金币 · 当前+${v*20}金币`,
                };
                return (
                  <div key={k} className="mb-3 p-3 border rounded" style={{ borderColor: colors[k]+"22", background: colors[k]+"08" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm" style={{ color: colors[k] }}>{k}</span>
                      <span className="font-mono text-lg" style={{ color: colors[k] }}>{v}</span>
                    </div>
                    <p className="font-mono text-xs leading-relaxed" style={{ color: "rgba(200,200,208,0.5)" }}>{desc[k]}</p>
                  </div>
                );
              })}
              <button onClick={() => setShowAttrInfo(false)} className="font-mono text-sm w-full py-2 border rounded mt-2"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(200,200,208,0.4)" }}>关闭</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
