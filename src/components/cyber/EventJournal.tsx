"use client";

import { useState, useEffect } from "react";
import { getGroupKey, getProgress, setProgress } from "@/lib/card-storage";
import { demaciaEvents } from "@/data/events/demacia";
import { ALL_CARDS } from "@/lib/cards";

interface SeenEntry {
  name: string; weight: number;
  choices: { index: number; msg: string }[];
}

interface Props { groupKey: string; }

export default function EventJournal({ groupKey }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [seenEvents, setSeenEvents] = useState<Record<string, SeenEntry>>({});

  const load = async () => {
    if (!groupKey) return;
    const raw = await getProgress(groupKey, "seen-events");
    setSeenEvents(raw ? JSON.parse(raw) : {});
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen, groupKey]);

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
    if (o.tokens) parts.push(`代币${o.tokens > 0 ? "+" : ""}${o.tokens}`);
    if (o.vitality) parts.push(`活力${o.vitality > 0 ? "+" : ""}${o.vitality}`);
    if (o.attrDelta) for (const [k, v] of Object.entries(o.attrDelta)) parts.push(`${k}${Number(v) > 0 ? "+" : ""}${v}`);
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
  const regions = [...new Set(allEvents.map(e => e.region))];
  const eventTypes = ["all", "fun", "clue", "normal", "side", "hero"] as const;

  const [filterRegion, setFilterRegion] = useState<string>("demacia");
  const [filterType, setFilterType] = useState<string>("all");

  const visibleEvents = allEvents.filter(ev => {
    if (!seenEvents[ev.id]) return false;
    if (filterRegion && ev.region !== filterRegion) return false;
    if (filterType !== "all" && ev.type !== filterType) return false;
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
                  const name = r === "demacia" ? "德玛西亚" : r;
                  const count = allEvents.filter(e => e.region === r && seenEvents[e.id]).length;
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
                  <h3 className="font-heading text-base tracking-[0.1em]" style={{ color: "#ffd700" }}>📜 事件图鉴</h3>
                  <span className="font-mono text-xs" style={{ color: "rgba(200,200,208,0.2)" }}>{visibleEvents.length} 个</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="font-mono text-lg" style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
              </div>

              <div className="flex border-b px-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {eventTypes.map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className="font-mono text-xs px-3 py-2 transition-colors"
                    style={{
                      color: filterType === t ? "#ffd700" : "rgba(200,200,208,0.25)",
                      borderBottom: filterType === t ? "2px solid #ffd700" : "2px solid transparent",
                    }}>{t === "all" ? "全部" : t === "fun" ? "趣味" : t === "clue" ? "线索" : t === "normal" ? "普通" : t === "side" ? "支线" : "英雄"}</button>
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
                        const hits = seen.choices.filter(ch => ch.index === i);
                        const isChosen = hits.length > 0;
                        return (
                          <div key={i} className="flex items-start gap-2 font-mono text-xs">
                            <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.2)" }}>{isChosen ? "▶" : "·"}</span>
                            <div className="flex-1">
                              <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.35)" }}>
                                {c.label}{c.check?.attrs ? ` [${Object.entries(c.check.attrs).map(([k,v]) => `${k}≥${v}`).join(",")}]` : ""}
                              </span>
                              {hits.map((h, hi) => (
                                <div key={hi} className="mt-0.5">
                                  <span style={{ color: "rgba(255,215,0,0.5)" }}>{h.msg}</span>
                                  <div className="mt-0.5" style={{ color: "rgba(200,200,220,0.4)" }}>🎁 {describeOutcome(c.success)}</div>
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
                            const hits = seen.choices.filter(ch => ch.index === i + 100);
                            return (
                              <div key={i} className="flex items-start gap-2 font-mono text-xs mt-1">
                                <span style={{ color: hits.length > 0 ? "#ffd700" : "rgba(200,200,208,0.2)" }}>{hits.length > 0 ? "▶" : "·"}</span>
                                <div className="flex-1">
                                  <span style={{ color: hits.length > 0 ? "#ffd700" : "rgba(200,200,208,0.35)" }}>{c.label}</span>
                                  {hits.map((h, hi) => (
                                    <div key={hi} className="mt-0.5" style={{ color: "rgba(200,200,220,0.4)" }}>🎁 {describeOutcome(c.success)}</div>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
