"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { supabase, Photo } from "@/lib/supabase";
import TimeFreezeBoard from "./TimeFreezeBoard";
import TimeVoyageView from "./TimeVoyageView";

interface Props { isOpen: boolean; onClose: () => void; }

export default function COAMemorial({ isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"freeze" | "voyage">("freeze");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryPhotos, setCategoryPhotos] = useState<Photo[]>([]);

  const fetchAllPhotos = async () => {
    const { data } = await supabase
      .from("photos").select("*")
      .order("created_at", { ascending: false });
    if (data) setPhotos(data as Photo[]);
  };

  useEffect(() => { if (isOpen) fetchAllPhotos(); }, [isOpen]);

  useEffect(() => {
    if (!overlayRef.current) return;
    if (isOpen) {
      gsap.set(overlayRef.current, { display: "flex" });
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.4 });
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3,
        onComplete: () => { if (overlayRef.current) overlayRef.current.style.display = "none"; },
      });
    }
  }, [isOpen, selectedCategory]);

  if (!isOpen) return null;

  // 时间定格 = 无分类的最近8张
  const freezePhotos = photos.filter(p => !p.category).slice(0, 8);

  // 时空奇旅 = 有分类的 + 超8张的无分类
  const uncategorizedOverflow = photos.filter(p => !p.category).slice(8);
  const categorizedPhotos = photos.filter(p => p.category);
  const voyagePhotos = [...categorizedPhotos, ...uncategorizedOverflow];

  // Categories from voyage photos
  const categories = [...new Set(voyagePhotos.map(p => p.category).filter(Boolean))] as string[];

  const uncategorizedCount = voyagePhotos.filter(p => !p.category).length;

  if (selectedCategory) {
    const catPhotos = photos.filter(p => p.category === selectedCategory);
    return (
      <div className="fixed inset-0 z-[70]" style={{ background: "#0c0c18f5" }}>
        <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelectedCategory(null)}
              className="font-mono text-xs text-cyber-cyan/60 hover:text-cyber-cyan transition-colors">
              ◀ 返回时空奇旅
            </button>
            <h2 className="font-heading text-xl text-cyber-gold neon-gold tracking-[0.2em]">
              记忆碎片 · {selectedCategory}
            </h2>
            <button onClick={onClose} className="text-cyber-text-dim hover:text-cyber-gold transition-colors font-mono text-xl">✕</button>
          </div>
          <TimeFreezeBoard photos={catPhotos} monthKey="" category={selectedCategory} onRefresh={fetchAllPhotos} />
        </div>
      </div>
    );
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[70] items-center justify-center"
      style={{ display: "none", background: "#0c0c18f5" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>

      <div className="relative w-full h-full max-w-7xl mx-auto flex p-4 gap-4">
        {/* ── Left sidebar ── */}
        <div className="shrink-0 flex flex-col justify-center relative" style={{ width: "180px" }}>
          {/* Particle gradient top */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
            height: "20%",
            background: "linear-gradient(180deg, rgba(0,240,255,0.04) 0%, rgba(216,0,255,0.02) 40%, transparent 100%)",
          }}/>
          {/* Particle gradient bottom */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
            height: "20%",
            background: "linear-gradient(0deg, rgba(216,0,255,0.04) 0%, rgba(0,240,255,0.02) 40%, transparent 100%)",
          }}/>

          <div className="flex flex-col gap-2 items-center justify-center relative" style={{ height: "60%" }}>
            {/* Animated particles from center line */}
            <style>{`
              @keyframes sideParticleUp {
                0% { transform: translateY(0) scale(1); opacity: 0.6; }
                100% { transform: translateY(-60px) scale(0); opacity: 0; }
              }
              @keyframes sideParticleDown {
                0% { transform: translateY(0) scale(1); opacity: 0.6; }
                100% { transform: translateY(60px) scale(0); opacity: 0; }
              }
              .side-particle-up { animation: sideParticleUp 2s ease-out infinite; }
              .side-particle-down { animation: sideParticleDown 2s ease-out infinite; }
            `}</style>

            <button onClick={() => setTab("freeze")}
              className="text-center px-4 py-5 transition-all duration-300 w-full group relative">
              {/* Hover glow bg */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "radial-gradient(ellipse at center, rgba(0,240,255,0.08) 0%, transparent 70%)" }}/>
              <p className="font-heading tracking-[0.2em] relative"
                style={{
                  color: tab === "freeze" ? "#00f0ff" : "rgba(200,200,208,0.3)",
                  textShadow: tab === "freeze" ? "0 0 15px rgba(0,240,255,0.5)" : "none",
                  fontSize: "24px",
                }}>
                ⏳
              </p>
              <p className="font-heading tracking-[0.15em] mt-2"
                style={{
                  color: tab === "freeze" ? "#00f0ff" : "rgba(200,200,208,0.35)",
                  textShadow: tab === "freeze" ? "0 0 10px rgba(0,240,255,0.4)" : "none",
                  fontSize: "18px",
                }}>
                时间定格
              </p>
              <p className="font-mono mt-1.5"
                style={{ color: tab === "freeze" ? "rgba(0,240,255,0.4)" : "rgba(200,200,208,0.15)", fontSize: "13px" }}>
                {freezePhotos.length}/8
              </p>
            </button>

            {/* Divider line */}
            <div className="w-12" style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(200,200,208,0.15), transparent)",
            }}/>

            <button onClick={() => setTab("voyage")}
              className="text-center px-4 py-5 transition-all duration-300 w-full group relative">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "radial-gradient(ellipse at center, rgba(216,0,255,0.08) 0%, transparent 70%)" }}/>
              <p className="font-heading tracking-[0.2em] relative"
                style={{
                  color: tab === "voyage" ? "#d800ff" : "rgba(200,200,208,0.3)",
                  textShadow: tab === "voyage" ? "0 0 15px rgba(216,0,255,0.5)" : "none",
                  fontSize: "24px",
                }}>
                🎞
              </p>
              <p className="font-heading tracking-[0.15em] mt-2"
                style={{
                  color: tab === "voyage" ? "#d800ff" : "rgba(200,200,208,0.35)",
                  textShadow: tab === "voyage" ? "0 0 10px rgba(216,0,255,0.4)" : "none",
                  fontSize: "18px",
                }}>
                时空奇旅
              </p>
              <p className="font-mono mt-1.5"
                style={{ color: tab === "voyage" ? "rgba(216,0,255,0.4)" : "rgba(200,200,208,0.15)", fontSize: "13px" }}>
                {voyagePhotos.length} 张 · {categories.length} 类
              </p>
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg text-cyber-gold neon-gold tracking-[0.2em]">
              {tab === "freeze" ? "时间定格" : "时空奇旅"}
            </h2>
            <button onClick={onClose} className="text-cyber-text-dim hover:text-cyber-gold transition-colors font-mono text-xl">✕</button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {tab === "freeze" && (
              <TimeFreezeBoard
                photos={freezePhotos}
                monthKey=""
                onRefresh={fetchAllPhotos}
              />
            )}

            {tab === "voyage" && (
              <TimeVoyageView
                photos={voyagePhotos}
                categories={categories}
                uncategorizedCount={uncategorizedCount}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                onRefresh={fetchAllPhotos}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
