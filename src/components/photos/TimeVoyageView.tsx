"use client";

import { useState, useMemo, useRef } from "react";
import { supabase, Photo } from "@/lib/supabase";
import { checkKdaCategory, checkCategoryCount } from "@/lib/achievement-checker";
import { getGroupKey } from "@/lib/card-storage";

// 驿站作为默认特殊系列
const DEFAULT_FILM = { name: "时光驿站", cover: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ekko_0.jpg", count: 0 };

interface Props {
  photos: Photo[];
  categories: string[];
  uncategorizedCount: number;
  onSelectCategory: (cat: string) => void;
  onRefresh: () => void;
}

export default function TimeVoyageView({
  photos, categories, uncategorizedCount, onSelectCategory, onRefresh,
}: Props) {
  const [hoveredFilm, setHoveredFilm] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatFile, setNewCatFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const paused = hoveredFilm !== null;

  const films = useMemo(() => {
    const real = categories.map(cat => {
      const catPhotos = photos.filter(p => p.category === cat);
      const cover = cat === "时光驿站"
        ? "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ekko_0.jpg"
        : catPhotos[0]?.url || "";
      return { name: cat, cover, count: catPhotos.length, real: true };
    });
    return real.length > 0 ? real : [{ ...DEFAULT_FILM, real: false }];
  }, [categories, photos]);

  const handleCreate = async () => {
    if (!newCatName.trim() || !newCatFile) return;
    setUploading(true);
    try {
      const safe = newCatFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileName = `${Date.now()}-${safe}`;
      await supabase.storage.from("photos").upload(fileName, newCatFile, { cacheControl: "3600", upsert: false });
      const url = `https://abwduhxhjtivjakbddql.supabase.co/storage/v1/object/public/photos/${fileName}`;
      await supabase.from("photos").insert({ url, description: "", month_key: "", category: newCatName.trim() });
      setNewCatName(""); setNewCatFile(null); setShowNewModal(false);
      const gk=getGroupKey();if(gk){checkKdaCategory(gk,newCatName);checkCategoryCount(gk,categories.length+1);}onRefresh();
    } catch (err: any) { alert("创建失败: " + (err?.message || "")); }
    finally { setUploading(false); }
  };

  const handleDelete = async (cat: string) => {
    if (!confirm(`删除"${cat}"？照片变成未分类。`)) return;
    await supabase.from("photos").update({ category: null }).eq("category", cat);
    const gk=getGroupKey();if(gk){checkKdaCategory(gk,newCatName);checkCategoryCount(gk,categories.length+1);}onRefresh();
  };

  const FilmCard = ({ film, isHov }: { film: typeof films[0]; isHov: boolean }) => (
    <button onClick={() => onSelectCategory(film.name)}
      onMouseEnter={() => setHoveredFilm(film.name)} onMouseLeave={() => setHoveredFilm(null)}
      className="flex items-center gap-5 w-full px-4 py-4 transition-all duration-500 mx-auto"
      style={{
        transform: isHov ? "scale(1.05)" : "scale(1)",
        filter: isHov ? "brightness(1.15) drop-shadow(0 0 20px rgba(77,168,218,0.4))" : "brightness(0.8)",
        transition: "all 0.5s", maxWidth: "92%",
      }}>
      <div className="flex items-center gap-5 w-full p-3"
        style={{
          border: isHov ? "1px solid rgba(77,168,218,0.3)" : "1px solid rgba(139,119,90,0.05)",
          background: isHov ? "rgba(77,168,218,0.05)" : "transparent", transition: "all 0.5s",
        }}>
        <div className="shrink-0 overflow-hidden"
          style={{ width: isHov ? "340px" : "300px", height: isHov ? "200px" : "176px", border: "1px solid rgba(139,119,90,0.1)", transition: "all 0.5s" }}>
          <img src={film.cover} alt="" className="w-full h-full object-cover" style={{ filter: "sepia(0.15) brightness(0.9)" }}/>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-heading text-sm tracking-[0.15em] truncate"
            style={{ color: isHov ? "#4da8da" : "rgba(200,200,180,0.3)", textShadow: isHov ? "0 0 15px rgba(77,168,218,0.5)" : "none", transition: "all 0.5s", fontSize: "15px" }}>
            {film.name}
          </p>
          <p className="font-mono text-[10px] mt-1" style={{ color: "rgba(200,200,180,0.15)" }}>{film.count} fragments</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="h-full flex gap-4" style={{ minHeight: "420px" }}>
      <div className="flex-1 overflow-hidden relative"
        style={{ background: `linear-gradient(90deg, rgba(139,119,90,0.03) 0%, transparent 4%, transparent 96%, rgba(139,119,90,0.03) 100%), #11110e`, border: "1px solid rgba(139,119,90,0.06)" }}>
        <div className="absolute left-2.5 inset-y-0 z-10 pointer-events-none flex flex-col gap-[5px] py-3">
          {Array.from({ length: 60 }, (_, i) => <div key={i} style={{ width: 5, height: 3, background: "#0a0a08", border: "1px solid rgba(139,119,90,0.06)", borderRadius: 1 }}/>)}
        </div>
        <div className="absolute right-2.5 inset-y-0 z-10 pointer-events-none flex flex-col gap-[5px] py-3">
          {Array.from({ length: 60 }, (_, i) => <div key={i} style={{ width: 5, height: 3, background: "#0a0a08", border: "1px solid rgba(139,119,90,0.06)", borderRadius: 1 }}/>)}
        </div>

        {!paused ? (
          <div className="px-10 py-6" style={{ height: "100%" }}>
            <style>{`@keyframes filmRoll { from { transform: translateY(0); } to { transform: translateY(-50%); } } .auto-track { animation: filmRoll ${films.length * 4}s linear infinite; }`}</style>
            <div className="auto-track">
              {[...films, ...films].map((film, idx) => <FilmCard key={`a-${film.name}-${idx}`} film={film} isHov={false}/>)}
            </div>
          </div>
        ) : (
          <div className="px-10 py-6 overflow-y-auto" style={{ height: "100%", scrollbarWidth: "thin", scrollbarColor: "rgba(77,168,218,0.2) transparent" }}>
            {films.map((film, idx) => <FilmCard key={`m-${film.name}-${idx}`} film={film} isHov={hoveredFilm === film.name}/>)}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="shrink-0 flex flex-col items-center justify-center gap-2" style={{ width: "90px" }}>
        {hoveredFilm ? (
          <div className="flex-1 flex items-center">
            <p className="font-heading" style={{ writingMode: "vertical-rl", textOrientation: "upright", fontSize: "26px", color: "#4da8da", textShadow: "0 0 15px rgba(77,168,218,0.8), 0 0 40px rgba(77,168,218,0.4)", letterSpacing: "0.25em" }}>
              {hoveredFilm}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex items-center">
            <p className="font-mono" style={{ writingMode: "vertical-rl", fontSize: "9px", color: "rgba(200,200,208,0.1)", letterSpacing: "0.3em" }}>时空奇旅</p>
          </div>
        )}

        <button onClick={() => setShowNewModal(true)}
          className="font-heading text-[10px] px-2 py-3 tracking-[0.1em] transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, rgba(216,0,255,0.08), rgba(216,0,255,0.03))", border: "1px solid rgba(216,0,255,0.15)", color: "rgba(216,0,255,0.5)", textShadow: "0 0 8px rgba(216,0,255,0.2)", writingMode: "vertical-rl" }}>
          新建系列
        </button>

        <button onClick={() => {
          if (hoveredFilm) handleDelete(hoveredFilm);
          else {
            const cat = prompt("输入要删除的分类名称：");
            if (cat) handleDelete(cat);
          }
        }}
          className="font-heading text-[10px] px-2 py-3 tracking-[0.1em] transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, rgba(255,51,85,0.06), rgba(255,51,85,0.02))", border: "1px solid rgba(255,51,85,0.12)", color: "rgba(255,51,85,0.4)", textShadow: "0 0 6px rgba(255,51,85,0.15)", writingMode: "vertical-rl" }}>
          删除系列
        </button>
      </div>

      {/* New category modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ background: "rgba(5,5,16,0.85)" }}
          onClick={() => setShowNewModal(false)}>
          <div className="glass-cyber p-6 w-[420px]" style={{ border: "1px solid rgba(216,0,255,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-sm text-cyber-magenta neon-magenta mb-4 tracking-[0.2em]">新建系列</h3>
            <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
              placeholder="系列名称（如：演唱会回忆）"
              className="w-full bg-cyber-bg border border-cyber-border px-3 py-2 font-mono text-xs text-cyber-text placeholder:text-cyber-text-dim/30 mb-3 focus:outline-none focus:border-cyber-magenta/50"/>
            <label className="block mb-3 cursor-pointer">
              <div className="w-full border border-dashed border-cyber-border p-6 text-center hover:border-cyber-magenta/40 transition-colors">
                <p className="font-mono text-xs text-cyber-text-dim/40">
                  {newCatFile ? newCatFile.name : "点击选择封面图片"}
                </p>
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => setNewCatFile(e.target.files?.[0] || null)}/>
            </label>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={uploading || !newCatName.trim() || !newCatFile}
                className="flex-1 py-2 font-mono text-xs border border-cyber-magenta/30 text-cyber-magenta/70 hover:bg-cyber-magenta/10 transition-colors disabled:opacity-30">
                {uploading ? "创建中..." : "确认创建"}
              </button>
              <button onClick={() => setShowNewModal(false)}
                className="flex-1 py-2 font-mono text-xs border border-cyber-border text-cyber-text-dim hover:text-cyber-text transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
