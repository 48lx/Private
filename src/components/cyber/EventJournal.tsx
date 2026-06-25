"use client";

import { useState, useEffect } from "react";
import { getGroupKey, getProgress, setProgress } from "@/lib/card-storage";
import { demaciaEvents } from "@/data/events/demacia";
import { ALL_CARDS } from "@/lib/cards";

interface SeenEntry {
  name: string; weight: number;
  lastChoice: number; lastMsg: string;
}

interface Props {
  groupKey: string;
}

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
    // 从今日日志移除
    const raw = await getProgress(groupKey, `daily-events-${today}`);
    if (raw) {
      const log = JSON.parse(raw);
      log.triggeredEvents = log.triggeredEvents.filter((id: string) => id !== eventId);
      await setProgress(groupKey, `daily-events-${today}`, JSON.stringify(log));
    }
    // 清除该事件所有属性标记
    for (let i = 0; i < 10; i++) {
      await setProgress(groupKey, `ev-attr-${eventId}-${i}`, "");
    }
    // 清除已见
    const updated = { ...seenEvents };
    delete updated[eventId];
    await setProgress(groupKey, "seen-events", JSON.stringify(updated));
    setSeenEvents(updated);
  };

  const describeOutcome = (o: any): string => {
    const parts: string[] = [];
    if (o.tokens) parts.push(`代币${o.tokens > 0 ? "+" : ""}${o.tokens}`);
    if (o.vitality) parts.push(`活力${o.vitality > 0 ? "+" : ""}${o.vitality}`);
    if (o.attrDelta) for (const [k, v] of Object.entries(o.attrDelta)) parts.push(`${k}${Number(v) > 0 ? "+" : ""}${v}`);
    if (o.addTags?.length) parts.push(`标签:${o.addTags.join(",")}`);
    if (o.removeTags?.length) parts.push(`移除:${o.removeTags.join(",")}`);
    if (o.addItems?.length) parts.push(`道具:${o.addItems.join(",")}`);
    if (o.addCards?.length) {
      const names = o.addCards.map((id: string) => ALL_CARDS.find(c => c.id === id)?.name || id);
      parts.push(`卡牌:${names.join(",")}`);
    }
    return parts.join(" · ") || "无奖励";
  };

  const allEvents = [...demaciaEvents];
  const visibleEvents = allEvents.filter(ev => seenEvents[ev.id]);

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className="font-mono text-xs px-2 py-1 border transition-all hover:border-opacity-60"
        style={{ color: "rgba(200,200,208,0.3)", borderColor: "rgba(255,215,0,0.1)", background: "rgba(255,215,0,0.02)" }}
        title="事件图鉴">
        📜 图鉴
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center"
          style={{ background: "rgba(4,2,18,0.94)", backdropFilter: "blur(6px)" }}
          onClick={() => setIsOpen(false)}>
          <div className="flex flex-col" style={{ width: "min(800px, 94vw)", height: "min(85vh, 700px)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="font-heading text-lg tracking-[0.2em]" style={{ color: "#ffd700", textShadow: "0 0 12px rgba(255,215,0,0.4)" }}>
                📜 事件图鉴
                <span className="font-mono text-xs ml-3" style={{ color: "rgba(200,200,208,0.25)" }}>{visibleEvents.length} 个已解锁</span>
              </h3>
              <button onClick={() => setIsOpen(false)} className="font-mono text-xl" style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: "thin" }}>
              {visibleEvents.length === 0 ? (
                <p className="font-mono text-sm text-center py-20" style={{ color: "rgba(200,200,220,0.12)" }}>暂无已解锁事件，去地图中探索吧</p>
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
                    <div className="space-y-1.5 ml-2">
                      {ev.choices.map((c, i) => {
                        const isChosen = seen.lastChoice === i;
                        return (
                          <div key={i} className="flex items-start gap-2 font-mono text-xs">
                            <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.2)" }}>{isChosen ? "▶" : "·"}</span>
                            <div className="flex-1">
                              <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.35)" }}>
                                {c.label}
                                {c.check?.attrs ? ` [${Object.entries(c.check.attrs).map(([k,v]) => `${k}≥${v}`).join(",")}]` : ""}
                              </span>
                              {isChosen && (
                                <div className="mt-0.5">
                                  <span style={{ color: "rgba(255,215,0,0.5)" }}>{seen.lastMsg}</span>
                                  <div className="mt-0.5" style={{ color: "rgba(200,200,220,0.4)" }}>
                                    🎁 {describeOutcome(c.success)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {ev.altChoices && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                          <span className="font-mono text-[10px]" style={{ color: "rgba(200,200,208,0.2)" }}>特殊分支（{ev.altRequire?.tags?.join(", ") || ""}）</span>
                          {ev.altChoices.map((c, i) => {
                            const isChosen = seen.lastChoice === i + 100;
                            return (
                              <div key={i} className="flex items-start gap-2 font-mono text-xs mt-1">
                                <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.2)" }}>{isChosen ? "▶" : "·"}</span>
                                <div className="flex-1">
                                  <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.35)" }}>{c.label}</span>
                                  {isChosen && <div className="mt-0.5" style={{ color: "rgba(200,200,220,0.4)" }}>🎁 {describeOutcome(c.success)}</div>}
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
      )}
    </>
  );
}
