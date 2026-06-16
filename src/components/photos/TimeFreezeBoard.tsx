"use client";

import { useState, useMemo } from "react";
import { supabase, Photo } from "@/lib/supabase";
import { checkFirstPhoto } from "@/lib/achievement-checker";
import { getGroupKey } from "@/lib/card-storage";

function hashStr(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff; return h;
}

function seedFrom(s: string, n: number): number {
  const h = hashStr(s);
  return ((h * 1103515245 + n * 12345) & 0x7fffffff) / 0x7fffffff;
}

interface Props {
  photos: Photo[];
  monthKey: string;
  category?: string;
  onRefresh: () => void;
  readOnly?: boolean;
}

export default function TimeFreezeBoard({ photos, monthKey, category, onRefresh, readOnly }: Props) {
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [imgSizes, setImgSizes] = useState<Record<string, { w: number; h: number }>>({});

  // Stable random params per photo
  const photoParams = useMemo(() => {
    return photos.map(p => {
      const s1 = seedFrom(p.id, 1);
      const s2 = seedFrom(p.id, 2);
      const s3 = seedFrom(p.id, 3);
      return {
        photo: p,
        rot: Math.round((-15 + s1 * 30) * 10) / 10,
        w: Math.round(140 + s2 * 60),
        padTop: Math.round(-4 + s3 * 12),
        padLeft: Math.round(-6 + seedFrom(p.id, 4) * 12),
      };
    });
  }, [photos]);

  const handleImgLoad = (id: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && !imgSizes[id]) {
      setImgSizes(prev => ({ ...prev, [id]: { w: img.naturalWidth, h: img.naturalHeight } }));
    }
  };

  const handleBatchUpload = async (files: FileList) => {
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) continue;
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `${Date.now()}-${i}-${safeName}`;
        await supabase.storage.from("photos").upload(fileName, file, { cacheControl: "3600", upsert: false });
        const publicUrl = `https://abwduhxhjtivjakbddql.supabase.co/storage/v1/object/public/photos/${fileName}`;
        await supabase.from("photos").insert({ url: publicUrl, description: "", month_key: monthKey, category: category || null });
      }
      // 仅时间定格模式检查8张上限
      if (!category) {
        const { data: all } = await supabase.from("photos").select("*").order("created_at", { ascending: true });
        if (all && all.length > 8) {
          for (const p of all.slice(0, all.length - 8)) {
            if (!p.category) await supabase.from("photos").update({ category: "时光驿站" }).eq("id", p.id);
          }
        }
      }
      const gk=getGroupKey();if(gk)checkFirstPhoto(gk);onRefresh();
    } catch (err: any) {
      alert("上传失败: " + (err?.message || ""));
    } finally { setUploading(false); }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm("撕掉？")) return;
    try { await supabase.storage.from("photos").remove([photo.url.split("/").pop()!]); } catch {}
    await supabase.from("photos").delete().eq("id", photo.id);
    const gk=getGroupKey();if(gk)checkFirstPhoto(gk);onRefresh();
    if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
  };

  return (
    <>
      <div className="relative w-full overflow-y-auto"
        style={{
          height: "100%", minHeight: "420px",
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(139,119,90,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 55%, rgba(139,119,90,0.05) 0%, transparent 50%),
            #11110e
          `,
          border: "1px solid rgba(139,119,90,0.10)",
          scrollbarWidth: "thin",
        }}>

        {/* Upload button */}
        {!readOnly && (
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file"; input.accept = "image/*"; input.multiple = true;
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files?.length) handleBatchUpload(files);
                };
                input.click();
              }}
              disabled={uploading}
              className="font-mono text-xs transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #2a2218, #1a1410)",
                border: "1px solid rgba(255,215,0,0.25)",
                borderBottom: "3px solid rgba(255,215,0,0.15)",
                color: "rgba(255,215,0,0.7)",
                padding: "6px 14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
                letterSpacing: "0.1em",
                cursor: uploading ? "wait" : "pointer",
              }}>{uploading ? "..." : "+ 贴上照片"}</button>
          </div>
        )}

        {readOnly && (
          <div className="absolute top-3 left-4 z-20 pointer-events-none">
            <p className="font-heading text-xs text-cyber-text-dim/30 tracking-[0.2em]">记忆碎片</p>
          </div>
        )}

        {photos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="font-mono text-sm text-cyber-text-dim/25">
              {readOnly ? "暂无记忆" : "贴照片定格时光"}
            </p>
          </div>
        )}

        {/* Flex-wrap scattered polaroid layout */}
        <div className="flex flex-wrap justify-center items-start gap-2 p-6 pt-14"
          style={{ alignContent: "flex-start" }}>
          {photoParams.map(({ photo, rot, w, padTop, padLeft }) => {
            const dim = imgSizes[photo.id];
            const aspect = dim ? dim.w / dim.h : 0.75;
            const h = Math.round(w / aspect);
            return (
              <div
                key={photo.id}
                className="group shrink-0 transition-all duration-300 hover:z-20"
                style={{
                  width: `${w}px`,
                  marginTop: `${padTop}px`,
                  marginLeft: `${padLeft}px`,
                  transform: `rotate(${rot}deg)`,
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `rotate(${rot}deg) scale(1.08)`;
                  e.currentTarget.style.zIndex = "30";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotate(${rot}deg) scale(1)`;
                  e.currentTarget.style.zIndex = "";
                }}>
                <button onClick={() => setSelectedPhoto(photo)}
                  className="block"
                  style={{
                    background: "#f8f6f0",
                    padding: "4px 4px 14px 4px",
                    boxShadow: "1px 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06)",
                    width: "100%",
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    style={{ width: "100%", height: `${h}px`, objectFit: "contain", background: "#f8f6f0", display: "block" }}
                    onLoad={(e) => handleImgLoad(photo.id, e)}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    loading="lazy"
                  />
                </button>
                {/* Tape */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 opacity-50 pointer-events-none"
                  style={{ width: "22px", height: "7px", background: "rgba(210,200,170,0.55)", transform: `rotate(${(hashStr(photo.id)%3-1)*5}deg)` }}/>
                {/* Delete */}
                {!readOnly && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                    className="absolute -top-2 -right-2 z-20 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "#cc3344", color: "white", fontSize: "9px", border: "2px solid #f8f6f0" }}>✕</button>
                )}
                <p className="absolute -bottom-0.5 right-1.5 font-mono text-[7px] text-gray-400/40 pointer-events-none">
                  {new Date(photo.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Viewer */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[85] bg-black/95 flex items-center justify-center" onClick={() => setSelectedPhoto(null)}>
          <button onClick={() => setSelectedPhoto(null)} className="absolute top-6 right-6 text-white/50 hover:text-white font-mono text-2xl z-10">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedPhoto.url} alt="" className="max-w-[90vw] max-h-[85vh] object-contain" onClick={(e) => e.stopPropagation()}/>
        </div>
      )}
    </>
  );
}
