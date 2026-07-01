"use client";

import { useState, useEffect, useMemo } from "react";
import { getGroupKey, getProgress, setProgress } from "@/lib/card-storage";
import { demaciaEvents } from "@/data/events/demacia";
import { ALL_CARDS } from "@/lib/cards";
import { getPlayerState } from "@/lib/player-state";

const ALL_ITEMS = [
  { id: "矿工护身符", name: "矿工护身符", icon: "⛏️", region: "德玛西亚", event: "禁魔石矿洞的倒霉矿工", effect: "跨区移动时自动消耗，抵消本次活力消耗" },
  { id: "禁魔石之心表面纹路", name: "禁魔石之心表面纹路", icon: "💎", region: "德玛西亚", event: "禁魔石矿洞的倒霉矿工", effect: "秘宝线索" },
  { id: "叽叽的口哨", name: "叽叽的口哨", icon: "🪈", region: "德玛西亚", event: "会说话的石像鬼", effect: "事件专用道具" },
  { id: "大胃王绶带", name: "大胃王绶带", icon: "🎗️", region: "德玛西亚", event: "美食节·大胃王比赛", effect: "活力上限+2" },
  { id: "大胃王挑战邀请函", name: "大胃王挑战邀请函", icon: "✉️", region: "德玛西亚", event: "美食节IV", effect: "事件专用道具" },
  { id: "白玫瑰", name: "白玫瑰", icon: "🌹", region: "德玛西亚", event: "不想当兵的男孩", effect: "事件专用道具" },
  { id: "沉重的铠甲", name: "沉重的铠甲", icon: "🛡️", region: "德玛西亚", event: "倒霉骑士的铠甲", effect: "活力上限+2，移动消耗+1" },
  { id: "骑士的护腕", name: "骑士的护腕", icon: "🧤", region: "德玛西亚", event: "倒霉骑士的铠甲", effect: "敏捷+1" },
  { id: "魔力泉水石", name: "魔力泉水石", icon: "💧", region: "德玛西亚", event: "泉水边的许愿少女", effect: "事件专用道具" },
  { id: "鸡蛋", name: "鸡蛋", icon: "🥚", region: "德玛西亚", event: "训龙骑士的「龙」", effect: "主动使用：活力+4" },
  { id: "诺克萨斯的旧盾", name: "诺克萨斯的旧盾", icon: "⚔️", region: "德玛西亚", event: "不愿安息的盾牌", effect: "解锁波比英雄事件" },
  { id: "战地日记残页", name: "战地日记残页", icon: "📜", region: "德玛西亚", event: "不愿安息的盾牌", effect: "德玛西亚趣味事件权重-1" },
  { id: "约德尔变形糖", name: "约德尔变形糖", icon: "🍬", region: "班德尔城", event: "提莫队长的蘑菇快递II", effect: "下一次跨区移动免活力且触发班德尔城事件" },
  { id: "蘑菇披萨", name: "蘑菇披萨", icon: "🍕", region: "班德尔城", event: "迷路的班德尔城外卖员", effect: "主动使用：活力+5" },
  { id: "消音垫", name: "消音垫", icon: "🔇", region: "班德尔城", event: "班德尔城噪音投诉处理员", effect: "下一次探索免活力重roll事件" },
];

interface SeenEntry {
  name: string; weight: number;
  choices: { index: number; success: boolean; msg: string }[];
}

interface Props { groupKey: string; }

export default function EventJournal({ groupKey }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [seenEvents, setSeenEvents] = useState<Record<string, SeenEntry>>({});
  const [tab, setTab] = useState<"events" | "items">("events");
  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<typeof ALL_ITEMS[0] | null>(null);

  const load = async () => {
    if (!groupKey) return;
    // 事件
    const raw = await getProgress(groupKey, "seen-events");
    if (!raw) { setSeenEvents({}); }
    else {
      const parsed = JSON.parse(raw);
      for (const k of Object.keys(parsed)) {
        if (parsed[k].lastChoice !== undefined && !parsed[k].choices) {
          parsed[k].choices = [{ index: parsed[k].lastChoice, msg: parsed[k].lastMsg || "" }];
        }
      }
      setSeenEvents(parsed);
    }
    // 物品（排除属性果实）
    const state = await getPlayerState(groupKey);
    const fruitSet = new Set(["力量+1","智力+1","敏捷+1","魅力+1","力量-1","智力-1","敏捷-1","魅力-1"]);
    setOwnedItemIds(new Set(state.items.filter(i => i.qty > 0 && !fruitSet.has(i.itemId)).map(i => i.itemId)));
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen, groupKey]);
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-event-journal", handler);
    return () => window.removeEventListener("open-event-journal", handler);
  }, []);

  const resetEvent = async (eventId: string) => {
    if (!groupKey) return;
    const today = new Date().toISOString().split("T")[0];
    const raw = await getProgress(groupKey, `daily-events-${today}`);
    if (raw) {
      const log = JSON.parse(raw);
      log.triggeredEvents = log.triggeredEvents.filter((id: string) => id !== eventId);
      await setProgress(groupKey, `daily-events-${today}`, JSON.stringify(log));
    }
  };

  const describeOutcome = (o: any): string => {
    const parts: string[] = [];
    if (o.tokens) parts.push(`金币${o.tokens > 0 ? "+" : ""}${o.tokens}`);
    if (o.vitality) parts.push(o.vitality >= 999 ? "活力回满" : `活力${o.vitality > 0 ? "+" : ""}${o.vitality}`);
    if (o.attrDelta) {
      const hasPos = Object.values(o.attrDelta).some((v: any) => Number(v) > 0);
      for (const [k, v] of Object.entries(o.attrDelta)) parts.push(`${k}${Number(v) > 0 ? "+" : ""}${v}${hasPos ? "（仅一次）" : ""}`);
    }
    if (o.addTags?.length) parts.push(`标签:${o.addTags.join(",")}`);
    if (o.removeTags?.length) parts.push(`移除:${o.removeTags.join(",")}`);
    if (o.addItems?.length) {
      const names = o.addItems.map((id: string) => id === "__random_attr__" ? "随机属性+1" : id);
      parts.push(`道具:${names.join(",")}`);
    }
    if (o.addCards?.length) {
      const names = o.addCards.map((id: string) => ALL_CARDS.find(c => c.id === id)?.name || id);
      parts.push(`卡牌:${names.join(",")}`);
    }
    return parts.join(" · ") || "无奖励";
  };

  const allEvents = [...demaciaEvents];
  const regions = [...new Set([...allEvents.map(e => e.region), "bandle"])];
  const eventTypes = ["all", "fun", "clue", "side", "hero"] as const;

  const [filterRegion, setFilterRegion] = useState<string>("demacia");
  const [filterType, setFilterType] = useState<string>("all");

  const visibleEvents = allEvents.filter(ev => {
    if (!seenEvents[ev.id]) return false;
    if (filterRegion === "bandle" ? !ev.id.startsWith("bandle-") : filterRegion && ev.region !== filterRegion) return false;
    if (filterType !== "all" && ev.type !== filterType && !(filterType === "clue" && ev.id === "bandle-poppy")) return false;
    return true;
  });

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className="font-mono text-xs px-2 py-1 border transition-all hover:border-opacity-60"
        style={{ color: "rgba(200,200,208,0.3)", borderColor: "rgba(255,215,0,0.1)", background: "rgba(255,215,0,0.02)" }}
        title="事件图鉴">📜 图鉴</button>

      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center"
          style={{ background: "rgba(4,2,18,0.94)", backdropFilter: "blur(6px)" }}
          onClick={() => setIsOpen(false)}>
          <div className="flex" style={{ width: "min(900px, 94vw)", height: "min(85vh, 700px)" }}
            onClick={e => e.stopPropagation()}>

            <div className="shrink-0 flex flex-col border-r" style={{ width: "120px", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="font-mono text-xs" style={{ color: "rgba(200,200,208,0.25)" }}>地区</span>
              </div>
              <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: "thin" }}>
                {regions.map(r => {
                  const name = r === "demacia" ? "德玛西亚" : r === "bandle" ? "班德尔城" : r;
                  const count = allEvents.filter(e => (r === "bandle" ? e.id.startsWith("bandle-") : e.region === r) && seenEvents[e.id]).length;
                  return (
                    <button key={r} onClick={() => setFilterRegion(r)}
                      className="w-full text-left font-mono text-xs px-3 py-2 transition-colors"
                      style={{
                        color: filterRegion === r ? "#ffd700" : "rgba(200,200,208,0.35)",
                        background: filterRegion === r ? "rgba(255,215,0,0.06)" : "transparent",
                        borderLeft: filterRegion === r ? "2px solid #ffd700" : "2px solid transparent",
                      }}>{name} <span style={{ color: "rgba(200,200,208,0.15)", fontSize: 9 }}>{count}</span></button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTab("events")} className="font-heading text-base tracking-[0.1em]"
                      style={{ color: tab === "events" ? "#ffd700" : "rgba(200,200,208,0.25)" }}>📜 事件</button>
                    <button onClick={() => setTab("items")} className="font-heading text-base tracking-[0.1em]"
                      style={{ color: tab === "items" ? "#ffd700" : "rgba(200,200,208,0.25)" }}>📦 物品</button>
                    <span className="font-mono text-xs" style={{ color: "rgba(200,200,208,0.2)" }}>
                      {tab === "events"
                        ? `${allEvents.filter(e => (filterRegion === "bandle" ? e.id.startsWith("bandle-") : e.region === filterRegion) && (filterType === "all" || e.type === filterType || (filterType === "clue" && e.id === "bandle-poppy")) && seenEvents[e.id]).length}/${allEvents.filter(e => (filterRegion === "bandle" ? e.id.startsWith("bandle-") : e.region === filterRegion) && (filterType === "all" || e.type === filterType || (filterType === "clue" && e.id === "bandle-poppy"))).length}`
                        : `${ownedItemIds.size}/${ALL_ITEMS.length}`}
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="font-mono text-lg" style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
              </div>

              {tab === "events" && <>
                <div className="flex border-b px-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {eventTypes.map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className="font-mono text-xs px-3 py-2 transition-colors"
                    style={{
                      color: filterType === t ? "#ffd700" : "rgba(200,200,208,0.25)",
                      borderBottom: filterType === t ? "2px solid #ffd700" : "2px solid transparent",
                    }}>{t === "all" ? "全部" : t === "fun" ? "趣味" : t === "clue" ? "线索" : t === "side" ? "支线" : "英雄"}</button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: "thin" }}>
              {visibleEvents.length === 0 ? (
                <p className="font-mono text-sm text-center py-20" style={{ color: "rgba(200,200,220,0.12)" }}>暂无已解锁事件</p>
              ) : visibleEvents.map(ev => {
                const seen = seenEvents[ev.id];
                return (
                  <div key={ev.id} className="p-4 border" style={{ borderColor: "rgba(255,215,0,0.2)", background: "rgba(255,215,0,0.03)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs px-1.5 py-0.5 border rounded" style={{ color: "#ffd700", borderColor: "rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.06)" }}>{ev.type}</span>
                      <span className="font-heading text-base" style={{ color: "#ffd700" }}>✦ {ev.name}</span>
                      <span className="font-mono text-xs ml-auto" style={{ color: "rgba(200,200,208,0.25)" }}>权重 {ev.weight}</span>
                      <button onClick={() => resetEvent(ev.id)}
                        className="font-mono text-[10px] px-1.5 py-0.5 border"
                        style={{ color: "rgba(255,51,85,0.4)", borderColor: "rgba(255,51,85,0.15)" }}>🔄</button>
                    </div>
                    <p className="font-mono text-xs mb-3" style={{ color: "rgba(200,200,208,0.35)" }}>{ev.desc}</p>
                    <div className="space-y-2 ml-2">
                      {ev.choices.map((c, i) => {
                        const hits = (seen.choices || []).filter((ch: any) => ch.index === i);
                        const isChosen = hits.length > 0;
                        return (
                          <div key={i} className="flex items-start gap-2 font-mono text-xs">
                            <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.2)" }}>{isChosen ? "▶" : "·"}</span>
                            <div className="flex-1">
                              <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.35)" }}>
                                {c.label}{c.check?.attrs ? ` [${Object.entries(c.check.attrs).map(([k,v]) => `${k}≥${v}`).join(",")}]` : ""}{((c.success.attrDelta && Object.values(c.success.attrDelta).some((v:any)=>Number(v)>0)) || (c.failure?.attrDelta && Object.values(c.failure.attrDelta).some((v:any)=>Number(v)>0))) ? <span style={{color:"rgba(255,200,100,0.45)",fontSize:10,marginLeft:4}}>仅一次</span> : null}
                              </span>
                              {hits.map((h, hi) => (
                                <div key={hi} className="mt-0.5">
                                  <span style={{ color: h.success ? "rgba(0,255,136,0.5)" : "rgba(255,51,85,0.5)" }}>{h.success ? "✅" : "❌"} {h.msg}</span>
                                  <div className="mt-0.5" style={{ color: "rgba(200,200,220,0.4)" }}>🎁 {describeOutcome(h.success ? c.success : (c.failure || c.success))}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {ev.altChoices && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                          <span className="font-mono text-[10px]" style={{ color: "rgba(200,200,208,0.2)" }}>特殊分支（{ev.altRequire?.tags?.join(", ") || ""}）</span>
                          {ev.altChoices.map((c, i) => {
                            const hits = (seen.choices || []).filter((ch: any) => ch.index === i + 100);
                            return (
                              <div key={i} className="flex items-start gap-2 font-mono text-xs mt-1">
                                <span style={{ color: hits.length > 0 ? "#ffd700" : "rgba(200,200,208,0.2)" }}>{hits.length > 0 ? "▶" : "·"}</span>
                                <div className="flex-1">
                                  <span style={{ color: hits.length > 0 ? "#ffd700" : "rgba(200,200,208,0.35)" }}>{c.label}{((c.success.attrDelta && Object.values(c.success.attrDelta).some((v:any)=>Number(v)>0)) || (c.failure?.attrDelta && Object.values(c.failure.attrDelta).some((v:any)=>Number(v)>0))) ? <span style={{color:"rgba(255,200,100,0.45)",fontSize:10,marginLeft:4}}>仅一次</span> : null}</span>
                                  {hits.map((h, hi) => (
                                    <div key={hi} className="mt-0.5">
                                      <span style={{ color: h.success ? "rgba(0,255,136,0.5)" : "rgba(255,51,85,0.5)" }}>{h.success ? "✅" : "❌"} {h.msg}</span>
                                      <div className="mt-0.5" style={{ color: "rgba(200,200,220,0.4)" }}>🎁 {describeOutcome(h.success ? c.success : (c.failure || c.success))}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
              </>}

              {/* 物品图鉴 */}
              {tab === "items" && (
                <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
                  <div className="grid grid-cols-4 gap-3">
                    {ALL_ITEMS.map(item => {
                      const owned = ownedItemIds.has(item.id);
                      return (
                        <div key={item.id} className="p-3 border rounded text-center transition-all cursor-pointer hover:scale-110"
                          style={{
                            borderColor: owned ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)",
                            background: owned ? "rgba(255,215,0,0.04)" : "rgba(0,0,0,0.15)",
                            opacity: owned ? 1 : 0.4,
                          }}
                          onClick={() => setSelectedItem(item)}
                          title="点击查看详情">
                          <div className="text-2xl mb-1.5" style={{ filter: owned ? "none" : "grayscale(0.8)" }}>{item.icon}</div>
                          <div className="font-mono text-xs" style={{ color: owned ? "rgba(255,215,0,0.8)" : "rgba(200,200,208,0.3)" }}>
                            {item.name}
                          </div>
                          <div className="font-mono text-[10px] mt-1 leading-tight"
                            style={{ color: owned ? "rgba(200,200,208,0.35)" : "rgba(200,200,208,0.18)" }}>
                            {owned ? item.effect : `${item.region}地区获取`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 物品详情弹窗 */}
          {selectedItem && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
              onClick={() => setSelectedItem(null)}>
              <div className="flex flex-col items-center p-6 border rounded-lg max-w-xs w-[80vw]"
                style={{ borderColor: "rgba(255,215,0,0.2)", background: "rgba(10,5,20,0.95)" }}
                onClick={e => e.stopPropagation()}>
                <div className="text-6xl mb-4">{selectedItem.icon}</div>
                <div className="font-mono text-lg mb-2" style={{ color: "#ffd700" }}>{selectedItem.name}</div>
                <div className="font-mono text-sm text-center leading-relaxed" style={{ color: "rgba(200,200,208,0.6)" }}>
                  {ownedItemIds.has(selectedItem.id) ? selectedItem.effect : `${selectedItem.region}地区 · ${selectedItem.event}`}
                </div>
                <button onClick={() => setSelectedItem(null)}
                  className="font-mono text-sm mt-4 px-6 py-2 border rounded"
                  style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(200,200,208,0.4)" }}>
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
