"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { getGroupKey, getProgress, setProgress } from "@/lib/card-storage";
import { getPlayerState, PlayerAttrs, InventoryItem, adjustAttrs, removeItem } from "@/lib/player-state";

type Tab = "items" | "clues" | "tags";

export default function InventoryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("items");
  const [attrs, setAttrs] = useState<PlayerAttrs>({ 力量: 0, 智力: 0, 敏捷: 0, 魅力: 0 });
  const [tags, setTags] = useState<string[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const gk = getGroupKey();
    if (!gk) return;
    const state = await getPlayerState(gk);
    setAttrs(state.attrs);
    setTags(state.tags);
    setItems(state.items);
  };

  const ITEM_DESC: Record<string, string> = {
    "矿工护身符": "跨地区移动时自动消耗，抵消本次移动的活力消耗（一次性）",
    "禁魔石之心表面纹路": "秘宝线索——也许拿着它，能询问到更多的线索",
    "大胃王绶带": "活力上限+2",
    "叽叽的口哨": "事件专用道具",
    "沉重的铠甲": "活力上限+2，地区移动消耗+1",
    "骑士的护腕": "敏捷+1",
    "魔力泉水石": "事件专用道具",
    "大胃王挑战邀请函": "事件专用道具",
    "白玫瑰": "事件专用道具",
    "鸡蛋": "主动使用：活力+4",
    "诺克萨斯的旧盾": "事件专用道具（解锁波比英雄事件）",
    "战地日记残页": "提升在德玛西亚遇到高质量事件的概率",
    "约德尔变形糖": "使用后变成约德尔人，下一次跨地区移动免活力且触发班德尔城事件",
    "蘑菇披萨": "主动使用：活力+5",
    "消音垫": "使用后下一次探索获得额外选项「无视」，免活力重roll一次探索",
    "附魔口哨套": "在德玛西亚探索页使用，触发随机班德尔事件（每日限一次）",
  };

  const getItemDesc = (itemId: string): string => {
    if (ITEM_DESC[itemId]) return ITEM_DESC[itemId];
    const match = itemId.match(/^(力量|智力|敏捷|魅力)([+-]1)$/);
    if (match) return `${match[1]} ${match[2] === "+1" ? "永久+1" : "永久-1"}（点击使用）`;
    return "暂无说明";
  };

  const useItem = async (itemId: string) => {
    const gk = getGroupKey();
    if (!gk) return;
    const match = itemId.match(/^(力量|智力|敏捷|魅力)([+-]1)$/);
    if (match) {
      const attr = match[1] as keyof PlayerAttrs;
      const delta = parseInt(match[2]);
      const ok = await removeItem(gk, itemId, 1);
      if (!ok) return;
      await adjustAttrs(gk, { [attr]: delta });
      await load();
      return;
    }
    // 消音垫：下一次探索免活力重roll
    if (itemId === "消音垫") {
      const ok = await removeItem(gk, itemId, 1);
      if (!ok) return;
      await setProgress(gk, "free-reroll", "1");
      alert("消音垫已使用！下一次探索获得免费重roll机会。");
      await load();
      return;
    }
    // 蘑菇披萨：主动使用+5活力
    if (itemId === "蘑菇披萨") {
      const today = new Date().toISOString().split("T")[0];
      const vRaw = await getProgress(gk, "map-vitality");
      if (vRaw) {
        const vd = JSON.parse(vRaw);
        if ((vd.v || 0) >= (vd.max || 8)) { alert("活力已满，无法使用蘑菇披萨"); return; }
        const ok = await removeItem(gk, itemId, 1);
        if (!ok) return;
        const newV = Math.min(vd.max || 8, (vd.v || 0) + 5);
        await setProgress(gk, "map-vitality", JSON.stringify({ v: newV, max: vd.max || 8, date: today }));
      }
      await load();
      return;
    }
    // 约德尔变形糖：下一次跨区移动免活力+触发班德尔事件
    if (itemId === "约德尔变形糖") {
      const ok = await removeItem(gk, itemId, 1);
      if (!ok) return;
      await setProgress(gk, "sugar-active", "1");
      alert("约德尔变形糖已使用！下一次跨地区移动免活力，并触发当地班德尔事件。");
      await load();
      return;
    }
    // 鸡蛋：主动使用+4活力（不超过上限）
    if (itemId === "鸡蛋") {
      const today = new Date().toISOString().split("T")[0];
      const vRaw = await getProgress(gk, "map-vitality");
      if (vRaw) {
        const vd = JSON.parse(vRaw);
        if ((vd.v || 0) >= (vd.max || 8)) {
          alert("活力已满，无法使用鸡蛋");
          return;
        }
        const ok = await removeItem(gk, itemId, 1);
        if (!ok) return;
        const newV = Math.min(vd.max || 8, (vd.v || 0) + 4);
        await setProgress(gk, "map-vitality", JSON.stringify({ v: newV, max: vd.max || 8, date: today }));
      }
      await load();
      return;
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    load();
  }, [isOpen]);

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) return;
    if (isOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.25, display: "flex" });
      gsap.fromTo(panelRef.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" });
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: () => { if (overlayRef.current) overlayRef.current.style.display = "none"; } });
    }
  }, [isOpen]);

  const clueItems = items.filter(i => i.itemId.startsWith("clue-"));
  const normalItems = items.filter(i => !i.itemId.startsWith("clue-"));

  const attrColors: Record<keyof PlayerAttrs, string> = { 力量: "#ff4444", 智力: "#4488ff", 敏捷: "#44ff44", 魅力: "#ff88ff" };

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className="fixed top-6 left-20 z-40 w-12 h-12 flex items-center justify-center transition-all duration-300 group"
        style={{ background: "rgba(13,13,36,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,200,255,0.3)" }}
        title="背包">
        <span className="font-mono text-lg text-cyber-text-dim group-hover:text-cyan-400 transition-colors">🎒</span>
      </button>

      <div ref={overlayRef} className="fixed inset-0 z-[75] items-center justify-end"
        style={{ display: "none", background: "rgba(5,5,16,0.6)" }}
        onClick={e => { if (e.target === overlayRef.current) setIsOpen(false); }}>
        <div ref={panelRef} className="h-full flex flex-col"
          style={{ width: "420px", background: "rgba(8,4,24,0.98)", borderLeft: "1px solid rgba(0,200,255,0.12)", backdropFilter: "blur(12px)", overflow: "hidden" }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(0,200,255,0.1)", background: "rgba(0,200,255,0.03)" }}>
            <h3 className="font-heading text-sm tracking-[0.2em]" style={{ color: "#00f0ff", textShadow: "0 0 8px rgba(0,240,255,0.3)" }}>🎒 背包</h3>
            <button onClick={() => setIsOpen(false)} className="font-mono text-lg" style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
          </div>

          {/* Attrs */}
          <div className="flex gap-3 px-4 py-2.5 border-b" style={{ borderColor: "rgba(0,200,255,0.06)" }}>
            {(Object.keys(attrs) as (keyof PlayerAttrs)[]).map(k => (
              <div key={k} className="flex items-center gap-1 font-mono text-xs">
                <span style={{ color: attrColors[k] }}>{k[0]}</span>
                <span style={{ color: "rgba(200,200,208,0.6)" }}>{attrs[k]}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "rgba(0,200,255,0.06)" }}>
            {([
              { key: "items" as Tab, label: "道具", icon: "📦" },
              { key: "clues" as Tab, label: "秘宝", icon: "🔮" },
              { key: "tags" as Tab, label: "标签", icon: "🏷️" },
                          ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 py-2.5 font-mono text-xs transition-colors"
                style={{ color: tab === t.key ? "#00f0ff" : "rgba(200,200,208,0.25)", borderBottom: tab === t.key ? "2px solid #00f0ff" : "2px solid transparent" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
            {tab === "items" && (
              normalItems.length === 0
                ? <p className="font-mono text-sm text-center py-12" style={{ color: "rgba(200,200,220,0.15)" }}>空空如也</p>
                : <div className="space-y-2">
                  {normalItems.map(item => (
                    <div key={item.itemId} className="flex items-center justify-between p-3 border cursor-pointer hover:border-opacity-60 transition-all group"
                      style={{ borderColor: "rgba(0,200,255,0.08)", background: "rgba(0,200,255,0.02)" }}
                      onClick={() => useItem(item.itemId)}
                      title={getItemDesc(item.itemId)}>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm" style={{ color: "rgba(200,200,208,0.7)" }}>{item.itemId}</span>
                        <span className="font-mono text-[10px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "rgba(200,200,220,0.3)" }}>{getItemDesc(item.itemId)}</span>
                      </div>
                      <span className="font-mono text-xs" style={{ color: "#00f0ff" }}>×{item.qty}</span>
                    </div>
                  ))}
                </div>
            )}

            {tab === "clues" && (
              clueItems.length === 0
                ? <p className="font-mono text-sm text-center py-12" style={{ color: "rgba(200,200,220,0.15)" }}>暂无秘宝线索</p>
                : <div className="space-y-2">
                  {clueItems.map(clue => (
                    <div key={clue.itemId} className="p-3 border" style={{ borderColor: "rgba(255,215,0,0.12)", background: "rgba(255,215,0,0.03)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs" style={{ color: "#ffd700" }}>{clue.itemId}</span>
                        <span className="font-mono text-xs" style={{ color: "rgba(255,215,0,0.4)" }}>×{clue.qty}</span>
                      </div>
                    </div>
                  ))}
                </div>
            )}

            {tab === "tags" && (
              tags.length === 0
                ? <p className="font-mono text-sm text-center py-12" style={{ color: "rgba(200,200,220,0.15)" }}>暂无标签</p>
                : <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="font-mono text-xs px-3 py-1.5 border" style={{ color: "rgba(200,200,220,0.6)", borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", borderRadius: 3 }}>
                      {tag}
                    </span>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
