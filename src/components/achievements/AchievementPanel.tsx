"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ACHIEVEMENTS, Achievement } from "@/lib/achievements";
import { getGroupKey, getProgress } from "@/lib/card-storage";
import { ALL_CARDS, RARITY_LABELS, RARITY_COLORS } from "@/lib/cards";
import { syncUnlocked } from "@/lib/achievement-checker";

function cardInfo(cardId: string): { name: string; rarity: string; color: string } {
  const c = ALL_CARDS.find(c => c.id === cardId);
  return { name: c?.name || cardId, rarity: RARITY_LABELS[c?.rarity || "white"], color: RARITY_COLORS[c?.rarity || "white"] };
}

export default function AchievementPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadUnlocked();
  }, [isOpen]);

  const loadUnlocked = async () => {
    const key = getGroupKey();
    if (!key) return;
    const set = new Set<string>();
    for (const ach of ACHIEVEMENTS) {
      const v = await getProgress(key, `ach-${ach.key}`);
      if (v === "1") set.add(ach.key);
    }
    setUnlocked(set);
  };

  useEffect(() => {
    if (!panelRef.current) return;
    gsap.to(panelRef.current, {
      x: isOpen ? 0 : "-110%",
      duration: 0.4, ease: "power3.out",
    });
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40" style={{ background: "rgba(5,5,16,0.5)" }}
          onClick={() => setIsOpen(false)}/>
      )}

      <button onClick={() => setIsOpen(true)}
        className="fixed top-6 left-6 z-40 w-12 h-12 flex items-center justify-center transition-all duration-300 group"
        style={{ background: "rgba(13,13,36,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,240,255,0.3)" }}
        title="成就系统">
        <span className="font-mono text-lg text-cyber-text-dim group-hover:text-cyber-cyan transition-colors">🏆</span>
      </button>

      <div ref={panelRef} className="fixed top-0 left-0 h-full z-50 flex flex-col"
        style={{ width: "570px", background: "rgba(5,5,16,0.96)", borderRight: "1px solid rgba(0,240,255,0.12)", backdropFilter: "blur(16px)", transform: "translateX(-110%)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(0,240,255,0.08)" }}>
          <h3 className="font-heading tracking-[0.2em]" style={{ fontSize: "18px", color: "#00f0ff", textShadow: "0 0 10px rgba(0,240,255,0.4)" }}>🏆 成就系统</h3>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm px-2 py-0.5 border" style={{ color: "#ffd700", borderColor: "rgba(255,215,0,0.2)" }}>
              {unlocked.size}/{ACHIEVEMENTS.length}
            </span>
            <button onClick={() => setIsOpen(false)} className="font-mono text-xl" style={{ color: "rgba(200,200,208,0.4)" }}>✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin" }}>
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlocked.has(ach.key);
            return (
              <div key={ach.key} className="mb-2 p-3 border transition-all"
                style={{
                  borderColor: isUnlocked ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.05)",
                  background: isUnlocked ? "rgba(255,215,0,0.05)" : "rgba(255,255,255,0.01)",
                  opacity: isUnlocked ? 1 : 0.6,
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading text-base" style={{ color: isUnlocked ? "#ffd700" : "rgba(200,200,208,0.4)" }}>
                    {isUnlocked ? "✦" : "◇"} {ach.name}
                  </span>
                  {ach.status === "testing" && (
                    <span className="font-mono text-xs px-1.5 py-0.5 border" style={{ color: "rgba(255,215,0,0.5)", borderColor: "rgba(255,215,0,0.2)" }}>未测试</span>
                  )}
                  {ach.hidden && !isUnlocked && (
                    <span className="font-mono text-xs px-1.5 py-0.5 border" style={{ color: "rgba(216,0,255,0.4)", borderColor: "rgba(216,0,255,0.15)" }}>隐藏</span>
                  )}
                </div>
                {isUnlocked && (
                  <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: "rgba(255,215,0,0.08)" }}>
                    <p className="font-mono text-sm" style={{ color: "rgba(200,200,208,0.3)" }}>{ach.trigger}</p>
                    <p className="font-mono text-sm mt-1" style={{ color: "#ffd700" }}>
                      🎁 {ach.reward.type === "card" ? (() => { const ci = cardInfo(ach.reward.cardId!); return `${ci.name} · ${ci.rarity}`; })() : `${ach.reward.amount}代币`}
                    </p>
                  </div>
                )}
                {!isUnlocked && !ach.hidden && (
                  <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <p className="font-mono text-sm" style={{ color: "rgba(200,200,208,0.2)" }}>{ach.trigger}</p>
                    <p className="font-mono text-sm mt-1" style={{ color: "rgba(255,215,0,0.3)" }}>
                      🎁 {ach.reward.type === "card" ? (() => { const ci = cardInfo(ach.reward.cardId!); return `${ci.name} · ${ci.rarity}`; })() : `${ach.reward.amount}代币`}
                    </p>
                  </div>
                )}
                {!isUnlocked && ach.hidden && (
                  <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <p className="font-mono text-sm" style={{ color: "rgba(200,200,208,0.12)" }}>??? · 隐藏成就</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
