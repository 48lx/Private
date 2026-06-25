"use client";

import { useState, useEffect } from "react";
import { getGroupKey, getProgress, setProgress } from "@/lib/card-storage";
import { demaciaEvents } from "@/data/events/demacia";
import { GameEvent } from "@/lib/event-types";
import { ALL_CARDS } from "@/lib/cards";

export default function EventJournal() {
  const [isOpen, setIsOpen] = useState(false);
  const [seenEvents, setSeenEvents] = useState<Record<string, { lastChoice: number; lastSuccess: boolean; lastMsg: string }>>({});

  const load = async () => {
    const gk = getGroupKey();
    if (!gk) return;
    const raw = await getProgress(gk, "seen-events");
    setSeenEvents(raw ? JSON.parse(raw) : {});
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const resetAll = async () => {
    const gk = getGroupKey();
    if (!gk) return;
    if (!confirm("重置所有事件进度？\n这将清除今日触发记录和属性奖励标记，允许重新测试。")) return;
    const today = new Date().toISOString().split("T")[0];
    // 清除今日事件日志
    await setProgress(gk, `daily-events-${today}`, "");
    // 清除属性奖励标记
    const { data } = await (await import("@/lib/supabase")).supabase
      .from("user_progress").select("key").eq("group_key", gk).like("key", "ev-attr-%");
    if (data) for (const r of data) await setProgress(gk, r.key, "");
    // 清除已见事件
    await setProgress(gk, "seen-events", "{}");
    setSeenEvents({});
    alert("已重置！");
  };

  const allEvents = [...demaciaEvents];

  // 解析奖励文本
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

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)}
      className="fixed top-6 left-[136px] z-40 w-12 h-12 flex items-center justify-center transition-all"
      style={{ background: "rgba(13,13,36,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,215,0,0.3)" }}
      title="事件图鉴">
      <span className="font-mono text-lg">📜</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ background: "rgba(4,2,18,0.94)", backdropFilter: "blur(6px)" }}
      onClick={() => setIsOpen(false)}>
      <div className="flex flex-col" style={{ width: "min(800px, 94vw)", height: "min(85vh, 700px)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="font-heading text-lg tracking-[0.2em]" style={{ color: "#ffd700", textShadow: "0 0 12px rgba(255,215,0,0.4)" }}>📜 事件图鉴</h3>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs" style={{ color: "rgba(200,200,208,0.25)" }}>{allEvents.length} 个事件</span>
            <button onClick={resetAll} className="font-mono text-xs px-3 py-1 border" style={{ color: "#ff3355", borderColor: "rgba(255,51,85,0.3)" }}>🔄 重置进度</button>
            <button onClick={() => setIsOpen(false)} className="font-mono text-xl" style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: "thin" }}>
          {allEvents.map(ev => {
            const seen = seenEvents[ev.id];
            return (
              <div key={ev.id} className="p-4 border" style={{
                borderColor: seen ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)",
                background: seen ? "rgba(255,215,0,0.03)" : "rgba(255,255,255,0.01)",
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs px-1.5 py-0.5 border rounded" style={{ color: "#ffd700", borderColor: "rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.06)" }}>
                    {ev.type}
                  </span>
                  <span className="font-heading text-base" style={{ color: seen ? "#ffd700" : "rgba(200,200,208,0.4)" }}>
                    {seen ? "✦ " : "◇ "}{ev.name}
                  </span>
                  <span className="font-mono text-xs ml-auto" style={{ color: "rgba(200,200,208,0.25)" }}>权重 {ev.weight}</span>
                </div>
                <p className="font-mono text-xs mb-3" style={{ color: "rgba(200,200,208,0.35)" }}>{ev.desc}</p>
                {/* Options */}
                <div className="space-y-1.5 ml-2">
                  {ev.choices.map((c, i) => {
                    const isChosen = seen && seen.lastChoice === i;
                    return (
                      <div key={i} className="flex items-start gap-2 font-mono text-xs">
                        <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.2)" }}>
                          {isChosen ? "▶" : "·"}
                        </span>
                        <div className="flex-1">
                          <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.35)" }}>
                            {c.label}
                            {c.check?.attrs ? ` [${Object.entries(c.check.attrs).map(([k,v]) => `${k}≥${v}`).join(",")}]` : ""}
                          </span>
                          {isChosen && (
                            <div className="mt-0.5" style={{ color: "rgba(255,215,0,0.5)" }}>
                              {seen.lastSuccess ? "✅" : "❌"} {seen.lastMsg}
                              <div className="mt-0.5" style={{ color: "rgba(200,200,220,0.4)" }}>
                                🎁 {describeOutcome(seen.lastSuccess ? c.success : (c.failure || c.success))}
                              </div>
                            </div>
                          )}
                          {!isChosen && (
                            <div className="mt-0.5" style={{ color: "rgba(200,200,220,0.15)" }}>
                              🎁 {describeOutcome(c.success)}
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
                        const isChosen = seen && seen.lastChoice === i + 100;
                        return (
                          <div key={i} className="flex items-start gap-2 font-mono text-xs mt-1">
                            <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.2)" }}>{isChosen ? "▶" : "·"}</span>
                            <div className="flex-1">
                              <span style={{ color: isChosen ? "#ffd700" : "rgba(200,200,208,0.35)" }}>{c.label}</span>
                              {!isChosen && <div className="mt-0.5" style={{ color: "rgba(200,200,220,0.15)" }}>🎁 {describeOutcome(c.success)}</div>}
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
  );
}
