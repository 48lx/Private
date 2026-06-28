"use client";

import { useState, useMemo, useRef } from "react";
import { GameEvent, EventType, EventOutcome } from "@/lib/event-types";
import { PlayerState } from "@/lib/player-state";
import { executeChoice, getAvailableChoices } from "@/lib/event-engine";
import { ALL_CARDS, REVELATION_CARDS } from "@/lib/cards";

const REGION_IMAGES: Record<string, string[]> = {
  demacia: [
    "/events/德玛西亚_01.png",
    "/events/德玛西亚_02.png",
    "/events/德玛西亚_03.png",
  ],
};

const TYPE_LABELS: Record<EventType, string> = {
  normal: "普通",
  side: "支线",
  clue: "线索",
  hero: "英雄",
  fun: "趣味",
};

const TYPE_COLORS: Record<EventType, string> = {
  normal: "#c0c0c0",
  side: "#ffd700",
  clue: "#ff6bff",
  hero: "#ff8c00",
  fun: "#00f0ff",
};

interface Props {
  event: GameEvent;
  playerState: PlayerState;
  onResult: (outcome: EventOutcome, choiceIndex: number) => Promise<boolean>; // returns true if attrs were applied
  onClose: () => void;
  attrs: { 力量: number; 智力: number; 敏捷: number; 魅力: number };
  tokens: number;
  fixedImage: string;
  cardCollection: { card_id: string; count: number }[];
}

export default function EventPanel({ event, playerState, onResult, onClose, attrs, tokens, fixedImage, cardCollection }: Props) {
  const [result, setResult] = useState<{ choiceIndex: number; success: boolean; message: string; attrApplied: boolean } | null>(null);
  const [cardSlot, setCardSlot] = useState<string | null>(null);
  const outcomeApplied = useRef(false);

  const bgImage = fixedImage;

  const choices = useMemo(() => getAvailableChoices(event, playerState, cardSlot), [event, playerState, cardSlot]);

  const buildRewardText = (o: EventOutcome): string => {
    const parts: string[] = [];
    if (o.tokens) parts.push(`代币 ${o.tokens > 0 ? "+" : ""}${o.tokens}`);
    if (o.vitality) parts.push(`活力 ${o.vitality > 0 ? "+" : ""}${o.vitality}`);
    if (o.attrDelta) {
      for (const [k, v] of Object.entries(o.attrDelta)) {
        if (v) parts.push(`${k} ${v > 0 ? "+" : ""}${v}`);
      }
    }
    if (o.addTags?.length) parts.push(`标签: ${o.addTags.join(", ")}`);
    if (o.removeTags?.length) parts.push(`失去标签: ${o.removeTags.join(", ")}`);
    if (o.addItems?.length) {
      const names = o.addItems.map((id: string) => id === "__random_attr__" ? "随机属性+1" : id);
      parts.push(`道具: ${names.join(", ")}`);
    }
    if (o.addCards?.length) {
      const names = o.addCards.map(id => {
        if (id === "__random_blue__") return "随机蓝卡";
        return ALL_CARDS.find(c => c.id === id)?.name || id;
      });
      parts.push(`卡牌: ${names.join(", ")}`);
    }
    return parts.join(" · ");
  };

  const handleChoice = async (index: number) => {
    if (outcomeApplied.current) return;
    const c = choices[index]?.choice;
    if (!c) return;
    const r = executeChoice(c, index, playerState);
    // 解析占位符卡片
    if (r.outcome.addCards) {
      r.outcome.addCards = r.outcome.addCards.map(id => {
        if (id === "__random_blue__") {
          const blues = ALL_CARDS.filter(card => card.rarity === "blue" && !card.id.startsWith("mimic-"));
          return blues[Math.floor(Math.random() * blues.length)]?.id || id;
        }
        return id;
      });
    }
    outcomeApplied.current = true;
    const attrApplied = await onResult(r.outcome, index);
    setResult({
      choiceIndex: index,
      success: r.success,
      message: r.outcome.message || (r.success ? "成功！" : "失败…"),
      attrApplied,
    });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center"
      style={{ background: "rgba(4,2,18,0.94)", backdropFilter: "blur(6px)" }}>
      <div className="flex border overflow-hidden" style={{
        width: "min(900px, 94vw)", height: "min(600px, 82vh)",
        borderColor: "rgba(180,160,255,0.15)", borderRadius: 8,
        background: "rgba(8,4,24,0.98)",
        boxShadow: "0 0 60px rgba(120,40,220,0.2)",
      }} onClick={e => e.stopPropagation()}>

        {/* LEFT: Image */}
        <div className="shrink-0 relative" style={{ width: "38%" }}>
          {bgImage ? (
            <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: "radial-gradient(ellipse at center, rgba(120,40,220,0.15), rgba(4,2,18,0.8))" }}>
              <span className="font-mono text-sm" style={{ color: "rgba(200,200,208,0.2)" }}>{event.region}</span>
            </div>
          )}
          {/* Image overlay gradient */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(90deg, transparent 60%, rgba(8,4,24,0.95) 100%)",
            pointerEvents: "none",
          }} />
        </div>

        {/* RIGHT: Content */}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>

          {/* Header */}
          <div className="mb-4">
            {/* Attrs + Tokens bar */}
            <div className="flex items-center gap-3 mb-2 font-mono text-xs">
              {(["力量","智力","敏捷","魅力"] as const).map(k => {
                const colors: Record<string, string> = { 力量: "#ff6666", 智力: "#6699ff", 敏捷: "#66ff66", 魅力: "#ff88ff" };
                const labels: Record<string, string> = { 力量: "力", 智力: "智", 敏捷: "敏", 魅力: "魅" };
                return <span key={k}><span style={{ color: "rgba(200,200,208,0.3)" }}>{labels[k]}</span> <span style={{ color: colors[k] }}>{attrs[k]}</span></span>;
              })}
              <span style={{ color: "rgba(200,200,208,0.15)" }}>|</span>
              <span><span style={{ color: "rgba(200,200,208,0.3)" }}>🪙</span> <span style={{ color: "#ffd700" }}>{tokens}</span></span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs px-2 py-0.5 border rounded"
                style={{ color: TYPE_COLORS[event.type], borderColor: TYPE_COLORS[event.type] + "44", background: TYPE_COLORS[event.type] + "11" }}>
                {TYPE_LABELS[event.type]}
              </span>
            </div>
            <h3 className="font-heading text-xl mb-2 tracking-[0.05em]" style={{ color: "#ffd700" }}>
              {event.name}
            </h3>
            <p className="font-mono text-sm leading-relaxed" style={{ color: "rgba(200,200,208,0.7)" }}>
              {event.desc}
            </p>
          </div>

          {/* Card slot — 只显示事件需要的卡 */}
          {(() => {
            const neededCards = event.choices
              .filter(c => c.check?.hasCard)
              .map(c => c.check!.hasCard!);
            const neededTypes = event.choices
              .filter(c => c.check?.hasCardType)
              .map(c => c.check!.hasCardType!);
            const altNeeded = (event.altChoices || [])
              .filter(c => c.check?.hasCard)
              .map(c => c.check!.hasCard!);
            let allNeeded = [...new Set([...neededCards, ...altNeeded])];
            // 解析占位符卡组
            allNeeded = allNeeded.flatMap(id => id === "__revelation__" ? REVELATION_CARDS : [id]);
            const hasTypeFilter = neededTypes.length > 0;
            if (allNeeded.length === 0 && !hasTypeFilter) return null;
            return (
              <div className="mb-4 p-2 border border-dashed flex items-center justify-center cursor-pointer hover:border-opacity-40 transition-all"
                style={{ borderColor: cardSlot ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)", borderRadius: 6, minHeight: 48 }}
                onClick={() => {
                  // 循环选择可用卡片
                  let owned = allNeeded.filter(id => cardCollection.some(c => c.card_id === id && c.count > 0));
                  if (hasTypeFilter) {
                    owned = cardCollection
                      .filter(c => c.count > 0 && ALL_CARDS.find(x => x.id === c.card_id)?.type === neededTypes[0])
                      .map(c => c.card_id);
                  }
                  if (owned.length === 0) return;
                  const currentIdx = owned.indexOf(cardSlot || "");
                  const next = owned[(currentIdx + 1) % owned.length];
                  setCardSlot(next === cardSlot ? null : next);
                }}>
                {cardSlot ? (
                  <span className="font-mono text-sm" style={{ color: "#ffd700" }}>
                    🃏 {ALL_CARDS.find(c => c.id === cardSlot)?.name || cardSlot}
                  </span>
                ) : (
                  <span className="font-mono text-sm" style={{ color: "rgba(200,200,208,0.25)" }}>
                    + {allNeeded.length === 1 ? (ALL_CARDS.find(c => c.id === allNeeded[0])?.name || allNeeded[0]) : "启示录专辑卡"}（点击选择）
                  </span>
                )}
              </div>
            );
          })()}

          {/* Choices / Result */}
          <div className="flex-1 flex flex-col justify-end" style={{ gap: "0.75rem", paddingBottom: "1.25rem" }}>
            {result ? (() => {
              const raw = choices[result.choiceIndex]?.choice
                ? (result.success ? choices[result.choiceIndex].choice.success : (choices[result.choiceIndex].choice.failure || choices[result.choiceIndex].choice.success))
                : {};
              // 若属性未实际应用，从显示中移除
              const displayOutcome = result.attrApplied ? raw : { ...raw, attrDelta: undefined };
              const rewardText = buildRewardText(displayOutcome);
              return (
              <div className="p-4 border rounded" style={{
                borderColor: result.success ? "rgba(0,255,136,0.25)" : "rgba(255,51,85,0.25)",
                background: result.success ? "rgba(0,255,136,0.06)" : "rgba(255,51,85,0.06)",
              }}>
                <p className="font-mono text-sm text-center" style={{
                  color: result.success ? "#00ff88" : "#ff3355",
                }}>
                  {result.success ? "✦ " : "✗ "}{result.message}
                </p>
                {rewardText && (
                  <p className="font-mono text-xs text-center mt-2" style={{ color: "rgba(255,215,0,0.6)" }}>
                    🎁 {rewardText}
                  </p>
                )}
                <button onClick={onClose} className="font-mono text-sm mt-3 mx-auto block px-6 py-2 border transition-all hover:scale-105"
                  style={{ borderColor: "rgba(180,160,255,0.2)", color: "#ffd700", background: "rgba(120,40,220,0.06)" }}>
                  继续探索
                </button>
              </div>
            )})() : (
              choices.map((c, i) => (
                <button key={i}
                  onClick={() => !c.disabled && handleChoice(i)}
                  disabled={c.disabled}
                  className="font-mono text-sm p-3 border rounded text-left transition-all disabled:opacity-15 enabled:hover:scale-[1.02] enabled:hover:border-opacity-60"
                  style={{
                    borderColor: c.disabled ? "rgba(255,255,255,0.04)" : "rgba(180,160,255,0.15)",
                    background: c.disabled ? "transparent" : "rgba(180,160,255,0.03)",
                    color: c.disabled ? "rgba(200,200,208,0.2)" : "rgba(200,200,208,0.8)",
                    cursor: c.disabled ? "not-allowed" : "pointer",
                  }}>
                  {c.choice.label}
                  {c.disabled && c.reason && (
                    <span className="block text-xs mt-1" style={{ color: "rgba(255,51,85,0.4)" }}>需要 {c.reason}</span>
                  )}
                  {c.checkLabel && (
                    <span className="block text-xs mt-1" style={{ color: "rgba(255,215,0,0.4)" }}>{c.checkLabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
