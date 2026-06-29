"use client";

import { useState, useEffect, useCallback } from "react";
import { ALL_CARDS } from "@/lib/cards";

interface AchievementUnlock {
  name: string;
  cardId?: string;
  tokens: number;
}

export default function AchievementModal() {
  const [queue, setQueue] = useState<AchievementUnlock[]>([]);
  const [current, setCurrent] = useState<AchievementUnlock | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as AchievementUnlock;
      setQueue(prev => [...prev, detail]);
    };
    window.addEventListener("achievement-unlocked", handler);
    return () => window.removeEventListener("achievement-unlocked", handler);
  }, []);

  useEffect(() => {
    if (!visible && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
      setVisible(true);
    }
  }, [queue, visible]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setCurrent(null);
  }, []);

  if (!visible || !current) return null;

  const cardDef = current.cardId ? ALL_CARDS.find(c => c.id === current.cardId) : null;
  const cardImage = cardDef?.imageFile
    ? `/cards/${cardDef.imageFile}`
    : cardDef?.imageUrl || null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center animate-in fade-in"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={handleClose}>
      <div className="flex flex-col items-center p-8 border rounded-lg max-w-sm w-[90vw] animate-in zoom-in"
        style={{
          borderColor: "rgba(255,215,0,0.3)",
          background: "linear-gradient(180deg, rgba(20,10,40,0.98) 0%, rgba(10,5,20,0.98) 100%)",
          boxShadow: "0 0 60px rgba(255,215,0,0.15), 0 0 120px rgba(180,80,255,0.08)",
        }}
        onClick={e => e.stopPropagation()}>

        {/* Icon */}
        <div className="text-5xl mb-3" style={{ filter: "drop-shadow(0 0 12px rgba(255,215,0,0.4))" }}>
          🏆
        </div>

        {/* Title */}
        <h2 className="font-heading text-2xl tracking-[0.08em] mb-1" style={{ color: "#ffd700", textShadow: "0 0 20px rgba(255,215,0,0.3)" }}>
          成就解锁！
        </h2>

        {/* Achievement name */}
        <p className="font-mono text-lg mb-4" style={{ color: "rgba(255,255,255,0.9)" }}>
          {current.name}
        </p>

        {/* Card reward */}
        {cardDef && (
          <div className="flex flex-col items-center mb-4 p-3 border rounded w-full"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
            <span className="font-mono text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              获得卡牌
            </span>
            {cardImage ? (
              <img src={cardImage} alt={cardDef.name}
                className="w-24 h-24 object-contain mb-1 rounded"
                style={{ background: "rgba(0,0,0,0.3)" }} />
            ) : (
              <span className="text-2xl mb-1">🃏</span>
            )}
            <span className="font-mono text-sm" style={{ color: "#ffd700" }}>
              {cardDef.name}
            </span>
          </div>
        )}

        {/* 新大陆额外奖励 */}
        {current.name === "新大陆" && (
          <div className="flex flex-col items-center mb-4 p-3 border rounded w-full"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
            <span className="font-mono text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              额外道具
            </span>
            <span className="text-3xl mb-1">🍎</span>
            <span className="font-mono text-sm" style={{ color: "#ffd700" }}>
              随机属性果实 ×5
            </span>
          </div>
        )}

        {/* Token reward */}
        <div className="flex items-center gap-2 mb-6 font-mono text-lg"
          style={{ color: "#ffd700" }}>
          <span>🪙</span>
          <span>{current.tokens.toLocaleString()} 金币</span>
        </div>

        {/* Confirm button */}
        <button onClick={handleClose}
          className="font-mono text-base px-8 py-2.5 border rounded transition-all hover:scale-105"
          style={{
            borderColor: "rgba(255,215,0,0.4)",
            color: "#ffd700",
            background: "rgba(255,215,0,0.08)",
          }}>
          确 定
        </button>
      </div>
    </div>
  );
}
