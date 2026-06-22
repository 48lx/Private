"use client";

import { useState, useEffect } from "react";
import { EditModeProvider } from "@/lib/edit-mode";
import SkinBackground from "@/components/cyber/SkinBackground";
import CyberParticles from "@/components/cyber/CyberParticles";
import HudBar from "@/components/cyber/HudBar";
import FloatingOrb from "@/components/cyber/FloatingOrb";
import RuneterraMap from "@/components/cyber/RuneterraMap";
import PhotoEntrance from "@/components/photos/PhotoEntrance";
import HeroGuessEntrance from "@/components/hero-guess/HeroGuessEntrance";
import CardPanel from "@/components/cards/CardPanel";
import AchievementPanel from "@/components/achievements/AchievementPanel";

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
  const [showMap, setShowMap] = useState(false);
  const [orbUnlocked, setOrbUnlocked] = useState(false);

  // 检查今日猜英双挑战是否完成
  const checkOrbUnlock = () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const std = localStorage.getItem("hero-solved-standard");
      const uzi = localStorage.getItem("hero-solved-uzi");
      if (std === today && uzi === today) setOrbUnlocked(true);
    } catch {}
  };

  useEffect(() => { checkOrbUnlock(); }, []);
  useEffect(() => {
    const onCheck = () => checkOrbUnlock();
    window.addEventListener("orb-check", onCheck);
    return () => window.removeEventListener("orb-check", onCheck);
  }, []);

  return (
    <EditModeProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#050510]">
        <CyberParticles visible={true} />
        <SkinBackground onSkinChange={setCurrentSkinSet} bright={false} />

        <HeroGuessEntrance />
        <PhotoEntrance />
        <CardPanel />
        <AchievementPanel />

        {/* 悬浮球 — 页面中心 */}
        <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <FloatingOrb
              unlocked={orbUnlocked}
              onClick={() => { if (orbUnlocked) setShowMap(true); }}
            />
          </div>
        </div>

        {showMap && (
          <RuneterraMap
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
