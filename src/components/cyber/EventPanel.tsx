"use client";

import { useState, useMemo, useRef } from "react";
import { GameEvent, EventType, EventOutcome } from "@/lib/event-types";
import { PlayerState } from "@/lib/player-state";
import { executeChoice, getAvailableChoices, MAGIC_CARDS, LUX_CARDS, DRAGON_CARDS } from "@/lib/event-engine";
import { ALL_CARDS, REVELATION_CARDS } from "@/lib/cards";
import InventoryPanel from "./InventoryPanel";
import { demaciaEvents } from "@/data/events/demacia";
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
  onResult: (outcome: EventOutcome, choiceIndex: number, success: boolean) => Promise<boolean>;
  onClose: () => void;
  attrs: { 力量: number; 智力: number; 敏捷: number; 魅力: number };
  tokens: number;
  fixedImage: string;
  cardCollection: { card_id: string; count: number }[];
  forceFail?: boolean;
  hasReroll?: boolean;
  vitality?: number;
  maxVitality?: number;
  onRedirect?: (eventId: string) => void;
}

export default function EventPanel({ event, playerState, onResult, onClose, attrs, tokens, fixedImage, cardCollection, forceFail, hasReroll, vitality, maxVitality, onRedirect }: Props) {
  const [result, setResult] = useState<{ choiceIndex: number; success: boolean; message: string; attrApplied: boolean; outcome: EventOutcome } | null>(null);
  const [cardSlot, setCardSlot] = useState<string | null>(null);
  const outcomeApplied = useRef(false);

  const bgImage = fixedImage;

  const choices = useMemo(() => getAvailableChoices(event, playerState, cardSlot), [event, playerState, cardSlot]);

  const buildRewardText = (o: EventOutcome): string => {
    const parts: string[] = [];
    if (o.tokens) parts.push(`金币 ${o.tokens > 0 ? "+" : ""}${o.tokens}`);
    if (o.vitality) parts.push(o.vitality >= 999 ? "活力回满" : `活力 ${o.vitality > 0 ? "+" : ""}${o.vitality}`);
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
    const r = executeChoice(c, index, playerState, forceFail);
    // 动态金币：-1 = 魅力×50
    if (r.outcome.tokens === -1) {
      const computed = attrs.魅力 * 50;
      r.outcome.tokens = computed;
      r.outcome.message = (r.outcome.message || "") + `（魅力${attrs.魅力}×50=+${computed}金币）`;
    }
    if (r.outcome.tokens === -2) {
      const rando = Math.floor(Math.random() * 1001);
      r.outcome.tokens = rando;
      r.outcome.message = (r.outcome.message || "") + `（获得了${rando}金币）`;
    }
    // 解析占位符卡片
    if (r.outcome.addCards) {
      r.outcome.addCards = r.outcome.addCards.map(id => {
        if (id === "__random_blue__") {
          const blues = ALL_CARDS.filter(card => card.rarity === "blue" && !card.id.startsWith("mimic-"));
          return blues[Math.floor(Math.random() * blues.length)]?.id || id;
        }
        if (id === "__random_gold__") {
          const golds = ALL_CARDS.filter(card => card.rarity === "gold" && !card.id.startsWith("mimic-"));
          return golds[Math.floor(Math.random() * golds.length)]?.id || id;
        }
        return id;
      });
    }
    // 消耗卡槽中的卡
    if (c.check?.consumeCard && cardSlot) {
      r.outcome.removeCards = [...(r.outcome.removeCards || []), cardSlot];
    }
    // 消耗道具
    if (c.check?.consumeItem) {
      r.outcome.removeItems = [...(r.outcome.removeItems || []), c.check.consumeItem];
    }
    // altChoices 索引偏移100，与图鉴记录对齐
    const isAlt = event.altRequire && event.altChoices && choices[0] === event.altChoices[0];
    const recordIndex = isAlt ? index + 100 : index;
    outcomeApplied.current = true;
    const attrApplied = await onResult(r.outcome, recordIndex, r.success);
    // 跳转到其他事件
    if (r.outcome.redirectTo && onRedirect) {
      // 重置防重复点击锁，让新事件可操作
      outcomeApplied.current = false;
      if (r.outcome.redirectTo === "__random_bandle__") {
        // 按玩家状态过滤可用的班德尔事件
        const bandleEvents = demaciaEvents.filter(e => {
          if (!e.id.startsWith("bandle-")) return false;
          if (!e.require) return true;
          if (e.require.tags && !e.require.tags.every((t: string) => playerState.tags.includes(t))) return false;
          if (e.require.notTags && e.require.notTags.some((t: string) => playerState.tags.includes(t))) return false;
          if (e.require.items && !e.require.items.every((i: string) => playerState.items.some(s => s.itemId === i && s.qty > 0))) return false;
          return true;
        });
        if (bandleEvents.length > 0) {
          const picked = bandleEvents[Math.floor(Math.random() * bandleEvents.length)];
          onRedirect(picked.id);
          return;
        }
      }
      onRedirect(r.outcome.redirectTo);
      return;
    }
    setResult({
      choiceIndex: index,
      success: r.success,
      message: r.outcome.message || (r.success ? "成功！" : "失败…"),
      attrApplied,
      outcome: r.outcome,
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
              {vitality !== undefined && (
                <><span style={{ color: "rgba(200,200,208,0.15)" }}>|</span>
                <span><span style={{ color: "rgba(200,200,208,0.3)" }}>⚡</span> <span style={{ color: "#00ff88" }}>{vitality}{maxVitality !== undefined ? `/${maxVitality}` : ""}</span></span></>
              )}
              <span style={{ color: "rgba(200,200,208,0.15)" }}>|</span>
              <span><span style={{ color: "rgba(200,200,208,0.3)" }}>🪙</span> <span style={{ color: "#ffd700" }}>{tokens}</span></span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs px-2 py-0.5 border rounded"
                style={{ color: TYPE_COLORS[event.type], borderColor: TYPE_COLORS[event.type] + "44", background: TYPE_COLORS[event.type] + "11" }}>
                {TYPE_LABELS[event.type]}
              </span>
              <InventoryPanel />
              <button onClick={() => { try { window.dispatchEvent(new Event("open-event-journal")); } catch {} }}
                className="font-mono text-xs px-2 py-0.5 border rounded opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: "rgba(200,200,208,0.5)", borderColor: "rgba(200,200,208,0.12)" }}>
                📋 图鉴
              </button>
            </div>
            <h3 className="font-heading text-xl mb-2 tracking-[0.05em]" style={{ color: "#ffd700" }}>
              {event.name}
            </h3>
            <p className="font-mono text-sm leading-relaxed" style={{ color: "rgba(200,200,208,0.7)" }}>
              {event.desc}
            </p>
            {forceFail && (
              <div className="mt-2 p-2 border rounded text-center font-mono text-xs"
                style={{ borderColor: "rgba(255,180,100,0.25)", background: "rgba(255,150,50,0.06)", color: "#ffb464" }}>
                🍷 纸醉金迷 · 本次事件不消耗活力，但属性判定必定失败
              </div>
            )}
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
            let rawNeeded = [...new Set([...neededCards, ...altNeeded])];
            // 占位符标签映射
            const PLACEHOLDER_LABELS: Record<string, string> = {
              "__revelation__": "启示录专辑卡",
              "__magic__": "魔法卡牌(灭国魔女/启示录/善意虚影)",
              "__dragon__": "龙族卡牌(索尔/希瓦娜/斯莫德)",
              "__lux__": "拉克丝卡牌(光辉女郎/善意虚影)",
            };
            let allNeeded: string[] = [];
            let placeholderLabel: string | null = null;
            for (const id of rawNeeded) {
              if (id === "__revelation__") { allNeeded.push(...REVELATION_CARDS); placeholderLabel = placeholderLabel || PLACEHOLDER_LABELS[id]; }
              else if (id === "__magic__") { allNeeded.push(...MAGIC_CARDS); placeholderLabel = placeholderLabel || PLACEHOLDER_LABELS[id]; }
              else if (id === "__lux__") { allNeeded.push(...LUX_CARDS); placeholderLabel = placeholderLabel || PLACEHOLDER_LABELS[id]; }
              else if (id === "__dragon__") { allNeeded.push(...DRAGON_CARDS); placeholderLabel = placeholderLabel || PLACEHOLDER_LABELS[id]; }
              else { allNeeded.push(id); }
            }
            allNeeded = [...new Set(allNeeded)];
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
                    + {allNeeded.length === 1 ? (ALL_CARDS.find(c => c.id === allNeeded[0])?.name || allNeeded[0]) : (placeholderLabel || "卡牌")}（点击选择）
                  </span>
                )}
              </div>
            );
          })()}

          {/* Choices / Result */}
          <div className="flex-1 flex flex-col justify-end" style={{ gap: "0.75rem", paddingBottom: "1.25rem" }}>
            {/* 消音垫：无视本次事件 */}
            {hasReroll && !result && (
              <button onClick={async () => {
                const gk = (await import("@/lib/card-storage")).getGroupKey();
                if (gk) await (await import("@/lib/card-storage")).setProgress(gk, "free-reroll", "");
                onClose();
              }}
                className="font-mono text-sm p-3 border rounded text-center transition-all hover:scale-[1.02]"
                style={{ borderColor: "rgba(100,200,255,0.3)", background: "rgba(100,200,255,0.05)", color: "#64c8ff" }}>
                🔇 无视此事件（消音垫）
              </button>
            )}
            {result ? (() => {
              // 使用实际执行后的 outcome（含动态金币等处理），仅属性显示受 attrApplied 控制
              const displayOutcome = result.attrApplied ? result.outcome : { ...result.outcome, attrDelta: undefined };
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
                  {c.choice.check?.consumeCard && (
                    <span className="block text-xs mt-1" style={{ color: "rgba(255,140,80,0.6)" }}>⚠️ 选择后将消耗卡槽中的卡牌</span>
                  )}
                  {c.choice.check?.consumeItem && (
                    <span className="block text-xs mt-1" style={{ color: "rgba(255,140,80,0.6)" }}>⚠️ 需要并消耗道具「{c.choice.check.consumeItem}」</span>
                  )}
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
