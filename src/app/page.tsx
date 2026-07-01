"use client";

import { useState, useEffect } from "react";
import { EditModeProvider } from "@/lib/edit-mode";
import SkinBackground from "@/components/cyber/SkinBackground";
import CyberParticles from "@/components/cyber/CyberParticles";
import IdentityCore from "@/components/cyber/IdentityCore";
import HudBar from "@/components/cyber/HudBar";
import FloatingOrb from "@/components/cyber/FloatingOrb";
import RuneterraMap from "@/components/cyber/RuneterraMap";
import PhotoEntrance from "@/components/photos/PhotoEntrance";
import HeroGuessEntrance from "@/components/hero-guess/HeroGuessEntrance";
import CardPanel from "@/components/cards/CardPanel";
import AchievementPanel from "@/components/achievements/AchievementPanel";
import { getGroupKey, getProgress, setProgress } from "@/lib/card-storage";

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: `${10 + ((i * 37 + 13) % 80)}%`,
  top: `${5 + ((i * 53 + 7) % 90)}%`,
  duration: `${3 + (i % 4)}s`,
  delay: `${(i * 0.7) % 4}s`,
  dx: `${((i % 3) - 1) * 40}px`,
  dy: `${((i % 5) - 2) * 30}px`,
}));

export default function Home() {
  const [currentSkinSet, setCurrentSkinSet] = useState("虚空暗裔");
  const [coreDismissed, setCoreDismissed] = useState(false);
  const [coreFading, setCoreFading] = useState(false);
  const [coreLocked, setCoreLocked] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [orbUnlocked, setOrbUnlocked] = useState(false);
  const [groupKey, setGroupKey] = useState("");

  const checkOrbUnlock = async (): Promise<boolean> => {
    try {
      const gk = getGroupKey();
      if (!gk) { setOrbUnlocked(false); return false; }
      setGroupKey(gk);
      const today = new Date().toISOString().split("T")[0];
      // 优先 Supabase，回退 localStorage
      const [std, uzi] = await Promise.all([
        getProgress(gk, `orb-std-${today}`),
        getProgress(gk, `orb-uzi-${today}`),
      ]);
      const stdOk = std === "1" || localStorage.getItem(`hero-solved-standard-${gk}`) === today;
      const uziOk = uzi === "1" || localStorage.getItem(`hero-solved-uzi-${gk}`) === today;
      // 同步到 Supabase
      if (!std && localStorage.getItem(`hero-solved-standard-${gk}`) === today) {
        await setProgress(gk, `orb-std-${today}`, "1");
      }
      if (!uzi && localStorage.getItem(`hero-solved-uzi-${gk}`) === today) {
        await setProgress(gk, `orb-uzi-${today}`, "1");
      }
      const result = stdOk && uziOk;
      setOrbUnlocked(result);
      return result;
    } catch { return false; }
  };

  useEffect(() => { checkOrbUnlock(); }, []);
  useEffect(() => {
    const onCheck = async (e: Event) => {
      const gk = getGroupKey();
      if (!gk) return;
      const mode = (e as CustomEvent).detail?.mode || "standard";
      const today = new Date().toISOString().split("T")[0];
      await setProgress(gk, `orb-${mode}-${today}`, "1");
      // 新大陆成就：首次解锁悬浮球
      const wasUnlocked = orbUnlocked;
      const nowUnlocked = await checkOrbUnlock();
      if (!wasUnlocked && nowUnlocked) {
        const { tryUnlock: unlockAch } = await import("@/lib/achievement-checker");
        const r = await unlockAch(gk, "new-continent");
        if (r?.success) {
          try { window.dispatchEvent(new Event("card-group-changed")); } catch {}
        }
      }
    };
    window.addEventListener("orb-check", onCheck);
    // 换号时重新检测（同标签页）
    const onGroupChange = () => checkOrbUnlock();
    window.addEventListener("card-group-changed", onGroupChange);
    // 跨标签页
    const onStorage = (e: StorageEvent) => { if (e.key === "card-group") checkOrbUnlock(); };
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("orb-check", onCheck); window.removeEventListener("card-group-changed", onGroupChange); window.removeEventListener("storage", onStorage); };
  }, []);

  const unlockCore = () => {
    setCoreFading(true);
    setCoreLocked(false);
    setTimeout(() => setCoreDismissed(true), 1100);
  };

  return (
    <EditModeProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#050510]">
        <CyberParticles visible={coreLocked} />
        <SkinBackground onSkinChange={setCurrentSkinSet} bright={coreFading} />

        {!coreDismissed && (
          <div className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: coreLocked ? 100 : 10 }}>
            {coreLocked && (
              <div className="absolute inset-0" style={{ background: "rgba(5,5,16,0.3)" }} />
            )}
            <IdentityCore onDismiss={unlockCore} />
          </div>
        )}

        {!coreLocked && (
          <>
            <HeroGuessEntrance />
            <PhotoEntrance />
            <CardPanel />
            <AchievementPanel />
            <FloatingOrb
              unlocked={orbUnlocked}
              onClick={() => { if (orbUnlocked) setShowMap(true); }}
            />
            {/* 跨天测试按钮 — 重置事件+活力，不碰悬浮球 */}
            <div className="fixed z-50" style={{ bottom: "80px", left: "50%", marginLeft: "-20px" }}>
              <button onClick={async () => {
                if (!confirm("模拟跨天？\n• 重置今日事件（可重新探索）\n• 活力回满\n• 不影响悬浮球/猜英")) return;
                const gk = getGroupKey();
                const today = new Date().toISOString().split("T")[0];
                if (gk) {
                  // 1. 清除今日事件触发记录
                  await setProgress(gk, `daily-events-${today}`, "");
                  // 2. 活力补满（不低于当前值，修正暴增max）
                  const { getItems } = await import("@/lib/player-state");
                  const items = await getItems(gk);
                  const { getAttrs } = await import("@/lib/player-state");
                  const attrs = await getAttrs(gk);
                  const strBonus = Math.floor((attrs.力量 || 0) / 10);
                  const hasSash = items.some((i: any) => i.itemId === "大胃王绶带" && i.qty > 0) ? 2 : 0;
                  const hasArmor = items.some((i: any) => i.itemId === "沉重的铠甲" && i.qty > 0) ? 2 : 0;
                  const correctMax = 8 + hasSash + hasArmor + strBonus;
                  const vRaw = await getProgress(gk, "map-vitality");
                  const oldV = vRaw ? JSON.parse(vRaw).v : correctMax;
                  const newV = Math.max(oldV, correctMax);
                  await setProgress(gk, "map-vitality", JSON.stringify({ v: newV, max: correctMax, date: today }));
                  alert(`已跨天：事件已重置，活力 ${newV}/${correctMax}。关闭地图重新进入即可。`);
                } else {
                  alert("请先登录卡牌暗号");
                }
              }}
                className="font-mono text-[10px] px-2 py-1 border opacity-20 hover:opacity-70 transition-opacity"
                style={{ color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)" }}
                title="模拟跨天（重置事件+活力）">⏩ 跨天</button>
            </div>
          </>
        )}

        {showMap && (
          <RuneterraMap
            groupKey={groupKey}
            onClose={() => setShowMap(false)}
            onRegionClick={(region) => {
              setShowMap(false);
            }}
          />
        )}

        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <p style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(200,200,208,0.2)", letterSpacing: "0.2em" }}>
            {currentSkinSet} · SKIN WALL ACTIVE
          </p>
        </div>

        <HudBar />

        <div className="fixed inset-0 z-[1] pointer-events-none" style={{ opacity: 0.2 }}>
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: p.left, top: p.top,
                width: "2px", height: "2px",
                backgroundColor: "#00f0ff",
                animation: `drift ${p.duration} infinite`,
                animationDelay: p.delay,
                "--dx": p.dx, "--dy": p.dy,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </EditModeProvider>
  );
}
