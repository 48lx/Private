"use client";

import { useState, useCallback, useEffect } from "react";
import { useEditMode } from "@/lib/edit-mode";
import DraggableImage from "@/components/ui/DraggableImage";
import { supabase } from "@/lib/supabase";

function heroName(url: string): string {
  const m = url.match(/splash\/(\w+)_\d+\.jpg/);
  return m ? m[1].toLowerCase() : url.slice(-20);
}

const DEFAULT_SETS = [
  {
    name: "诺克萨斯",
    skins: [
      "/splash/Darius_0.jpg",
      "/splash/Katarina_0.jpg",
      "/splash/Ambessa_0.jpg",
      "/splash/Swain_0.jpg",
    ],
  },
  {
    name: "艾欧尼亚",
    skins: [
      "/splash/Sett_0.jpg",
      "/splash/Yasuo_0.jpg",
      "/splash/Yone_0.jpg",
      "/splash/Irelia_0.jpg",
    ],
  },
  {
    name: "暗影岛",
    skins: [
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Thresh_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Gwen_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Viego_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Mordekaiser_0.jpg",
    ],
  },
  {
    name: "虚空",
    skins: [
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Kaisa_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Khazix_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Belveth_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Chogath_0.jpg",
    ],
  },
  {
    name: "德玛西亚",
    skins: [
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/XinZhao_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/JarvanIV_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Galio_0.jpg",
      "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Garen_0.jpg",
    ],
  },
];

type SkinSet = { name: string; skins: string[] };

function loadCustomSets(): SkinSet[] {
  try {
    const raw = localStorage.getItem("custom-skin-sets");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomSets(sets: SkinSet[]) {
  try { localStorage.setItem("custom-skin-sets", JSON.stringify(sets)); } catch {}
}

function loadDeletedDefaults(): string[] {
  try { return JSON.parse(localStorage.getItem("deleted-default-sets") || "[]"); }
  catch { return []; }
}

interface Props {
  onSkinChange?: (setName: string) => void;
  bright?: boolean;
}

export default function SkinBackground({ onSkinChange, bright }: Props) {
  const [customSets, setCustomSets] = useState<SkinSet[]>([]);
  const [currentSet, setCurrentSet] = useState(0);
  const [fading, setFading] = useState(false);
  const [showNewSetForm, setShowNewSetForm] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetFiles, setNewSetFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [uploadingSet, setUploadingSet] = useState(false);
  const { editMode, toggleEditMode } = useEditMode();

  useEffect(() => { setCustomSets(loadCustomSets()); }, []);

  // 已删除的默认系列
  const deletedDefaults: string[] = (() => {
    try { return JSON.parse(localStorage.getItem("deleted-default-sets") || "[]"); }
    catch { return []; }
  })();
  const activeDefaults = DEFAULT_SETS.filter(s => !deletedDefaults.includes(s.name));

  const allSets = [...activeDefaults, ...customSets];
  const skinSet = allSets[currentSet] || DEFAULT_SETS[0];
  const skinBrightness = bright ? 0.7 : 0.3;
  const skinSaturate = bright ? 0.85 : 0.65;

  const handleChange = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setCurrentSet((prev) => (prev + 1) % allSets.length);
      setFading(false);
      onSkinChange?.(allSets[(currentSet + 1) % allSets.length]?.name || "");
    }, 600);
  }, [currentSet, onSkinChange, allSets]);

  const handleAddSet = async () => {
    if (!newSetName.trim()) return;
    const files = newSetFiles.filter(Boolean) as File[];
    if (files.length === 0) { alert("请至少选择一张图片"); return; }
    setUploadingSet(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `skin-${Date.now()}-${safe}`;
        await supabase.storage.from("photos").upload(fileName, file, { cacheControl: "3600", upsert: false });
        urls.push(`https://abwduhxhjtivjakbddql.supabase.co/storage/v1/object/public/photos/${fileName}`);
      }
      const newSet: SkinSet = { name: newSetName.trim(), skins: urls };
      const updated = [...customSets, newSet];
      setCustomSets(updated);
      saveCustomSets(updated);
      setNewSetName("");
      setNewSetFiles([null, null, null, null]);
      setShowNewSetForm(false);
      setCurrentSet(allSets.length);
    } catch (err: any) { alert("创建失败: " + (err?.message || "")); }
    finally { setUploadingSet(false); }
  };

  const handleDeleteSet = (idx: number) => {
    if (allSets.length <= 1) { alert("至少保留一个系列"); return; }
    const globalIdx = idx - DEFAULT_SETS.length;
    if (globalIdx >= 0) {
      // 删除自定义系列
      const updated = customSets.filter((_, i) => i !== globalIdx);
      setCustomSets(updated);
      saveCustomSets(updated);
      setCurrentSet(Math.min(currentSet, DEFAULT_SETS.length + updated.length - 1));
    } else {
      // 删除默认系列 — 加入黑名单
      const deleted = loadDeletedDefaults();
      const setName = DEFAULT_SETS[idx]?.name;
      if (setName) deleted.push(setName);
      localStorage.setItem("deleted-default-sets", JSON.stringify(deleted));
      setCurrentSet(0);
      // 强制刷新
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 flex" style={{ opacity: fading ? 0 : 1, transition: "opacity 0.6s ease" }}>
        {skinSet.skins.map((url, i) => (
          <div key={`${currentSet}-${i}`} className="flex-1 relative">
            <DraggableImage
              src={url} alt=""
              storageKey={`skin-${heroName(url)}`}
              defaultX="50%" defaultY="10%" defaultScale={1.5}
              className="absolute inset-0"
              imgStyle={{
                filter: `brightness(${skinBrightness}) saturate(${skinSaturate})`,
                transition: editMode ? "none" : "filter 1.5s ease",
              }}
            />
            {i > 0 && (
              <div className="absolute inset-y-0 left-0 z-10 pointer-events-none"
                style={{ width: "10%", background: "linear-gradient(270deg, transparent 0%, rgba(5,5,16,0.8) 100%)" }} />
            )}
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: "15%", background: "linear-gradient(180deg, rgba(5,5,16,0.7) 0%, transparent 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: "25%", background: "linear-gradient(0deg, rgba(5,5,16,0.8) 0%, transparent 100%)" }} />

      {/* Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {editMode && (
            <button onClick={() => setShowNewSetForm(true)} className="font-mono text-xs transition-all"
              style={{
                background: "rgba(255,215,0,0.1)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,215,0,0.3)", padding: "8px 14px",
                color: "rgba(255,215,0,0.7)",
              }}>
              + 新建系列
            </button>
          )}
          <button onClick={toggleEditMode} className="font-mono text-xs transition-all"
            style={{
              background: editMode ? "rgba(0,240,255,0.15)" : "rgba(13,13,36,0.7)",
              backdropFilter: "blur(8px)",
              border: editMode ? "1px solid rgba(0,240,255,0.6)" : "1px solid rgba(0,240,255,0.2)",
              padding: "8px 14px",
              color: editMode ? "#00f0ff" : "rgba(0,240,255,0.5)",
            }}>
            {editMode ? "◇ 退出编辑" : "◆ 编辑布局"}
          </button>
          <button onClick={handleChange} className="font-mono text-xs text-cyber-cyan/70 hover:text-cyber-cyan transition-all group"
            style={{
              background: "rgba(13,13,36,0.7)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(0,240,255,0.2)", padding: "8px 14px",
            }}>
            <span className="mr-2 opacity-40 group-hover:opacity-80 transition-opacity">◈</span>
            切换背景
            <span className="ml-2 opacity-40">[{skinSet.name}]</span>
          </button>
          {/* Delete set button — edit mode only */}
          {editMode && allSets.length > 1 && (
            <button onClick={() => handleDeleteSet(currentSet)} className="font-mono text-xs"
              style={{
                background: "rgba(255,51,85,0.12)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,51,85,0.25)", padding: "8px 12px",
                color: "rgba(255,51,85,0.6)",
              }}>
              ✕ 删除此系列
            </button>
          )}
        </div>
      </div>

      {/* New series form modal */}
      {showNewSetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(5,5,16,0.85)" }}
          onClick={() => setShowNewSetForm(false)}>
          <div className="glass-cyber p-6 w-[500px] max-h-[80vh] overflow-y-auto"
            style={{ border: "1px solid rgba(0,240,255,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-sm text-cyber-gold mb-4 tracking-[0.2em]">新建皮肤系列</h3>
            <input
              type="text" value={newSetName}
              onChange={e => setNewSetName(e.target.value)}
              placeholder="系列名称"
              className="w-full bg-cyber-bg border border-cyber-border px-3 py-2 font-mono text-xs text-cyber-text placeholder:text-cyber-text-dim/30 mb-4 focus:outline-none focus:border-cyber-gold/50"
            />
            {[0, 1, 2, 3].map(i => (
              <label key={i} className="block mb-2 cursor-pointer">
                <div className="w-full border border-dashed border-cyber-border p-3 text-left hover:border-cyber-gold/30 transition-colors">
                  <span className="font-mono text-xs text-cyber-text-dim/40">
                    {newSetFiles[i] ? newSetFiles[i]!.name : `图片 ${i + 1} — 点击选择`}
                  </span>
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = [...newSetFiles];
                    f[i] = e.target.files?.[0] || null;
                    setNewSetFiles(f);
                  }}/>
              </label>
            ))}
            <div className="flex gap-2 mt-4">
              <button onClick={handleAddSet} disabled={uploadingSet}
                className="flex-1 py-2 font-mono text-xs border border-cyber-gold/30 text-cyber-gold hover:bg-cyber-gold/10 transition-colors disabled:opacity-30">
                {uploadingSet ? "上传中..." : "确认创建"}
              </button>
              <button onClick={() => setShowNewSetForm(false)}
                className="flex-1 py-2 font-mono text-xs border border-cyber-border text-cyber-text-dim hover:text-cyber-text transition-colors">
                取消
              </button>
            </div>
            <p className="font-mono text-[9px] text-cyber-text-dim/30 mt-3 text-center">
              选择 1-4 张本地图片上传
            </p>
          </div>
        </div>
      )}

      {editMode && !showNewSetForm && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{
            background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.4)",
            padding: "6px 20px", fontFamily: "var(--font-share-tech-mono), monospace",
            fontSize: "11px", color: "#00f0ff", letterSpacing: "0.2em",
          }}>
          编辑模式 — 拖拽图片 · 滚轮缩放 · 新建系列
        </div>
      )}
    </div>
  );
}
