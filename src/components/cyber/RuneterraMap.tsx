"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface Region {
  id: string; name: string;
  x: number; y: number; w: number; h: number;
  color: string;
  locked?: boolean;
  lockedLabel?: string;
}

const DEFAULT_REGIONS: Region[] = [
  { id: "freljord",   name: "弗雷尔卓德", x: 8,  y: 2,  w: 37, h: 22, color: "#7ec8e3" },
  { id: "demacia",    name: "德玛西亚",   x: 6,  y: 24, w: 19, h: 18, color: "#c9a96e" },
  { id: "noxus",      name: "诺克萨斯",   x: 53, y: 4,  w: 38, h: 32, color: "#c0392b" },
  { id: "piltover",   name: "皮尔特沃夫", x: 26, y: 28, w: 9,  h: 10, color: "#f4d03f" },
  { id: "zaun",       name: "祖安",       x: 26, y: 38, w: 9,  h: 12, color: "#27ae60" },
  { id: "ionia",      name: "艾欧尼亚",   x: 75, y: 16, w: 22, h: 38, color: "#e67e22" },
  { id: "bilgewater", name: "比尔吉沃特", x: 58, y: 56, w: 22, h: 24, color: "#2980b9" },
  { id: "ixtal",      name: "以绪塔尔",   x: 20, y: 54, w: 18, h: 18, color: "#1abc9c" },
  { id: "shurima",    name: "恕瑞玛",     x: 40, y: 44, w: 24, h: 22, color: "#f39c12" },
  { id: "bandle",     name: "班德尔城",   x: 40, y: 32, w: 11, h: 11, color: "#9b59b6" },
  { id: "shadow",     name: "暗影岛",     x: 76, y: 66, w: 20, h: 28, color: "#2c3e50", locked: true, lockedLabel: "路途凶险 · 暂不开放" },
  { id: "targon",     name: "巨神峰",     x: 2,  y: 66, w: 16, h: 24, color: "#b8860b", locked: true, lockedLabel: "终局地点 · 暂不开放" },
];

interface Props {
  onClose: () => void;
  onRegionClick: (region: Region) => void;
}

export default function RuneterraMap({ onClose, onRegionClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [regions, setRegions] = useState<Region[]>(DEFAULT_REGIONS);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; edge: string; startX: number; startY: number; orig: Region } | null>(null);

  const nudge = useCallback((id: string, dx: number, dy: number, dw: number, dh: number) => {
    setRegions(prev => prev.map(r =>
      r.id === id ? { ...r, x: r.x + dx, y: r.y + dy, w: Math.max(3, r.w + dw), h: Math.max(3, r.h + dh) } : r
    ));
  }, []);

  // Mouse drag for moving/resizing
  const onMouseDown = useCallback((e: React.MouseEvent, region: Region, edge: string) => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { id: region.id, edge, startX: e.clientX, startY: e.clientY, orig: { ...region } };
  }, [editMode]);

  useEffect(() => {
    if (!editMode) return;
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d || !mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      const dx = ((e.clientX - d.startX) / rect.width) * 100;
      const dy = ((e.clientY - d.startY) / rect.height) * 100;
      setRegions(prev => prev.map(r => {
        if (r.id !== d.id) return r;
        const o = d.orig;
        switch (d.edge) {
          case "move":  return { ...r, x: o.x + dx, y: o.y + dy };
          case "n":     return { ...r, y: o.y + dy, h: Math.max(3, o.h - dy) };
          case "s":     return { ...r, h: Math.max(3, o.h + dy) };
          case "w":     return { ...r, x: o.x + dx, w: Math.max(3, o.w - dx) };
          case "e":     return { ...r, w: Math.max(3, o.w + dx) };
          case "nw":    return { ...r, x: o.x + dx, y: o.y + dy, w: Math.max(3, o.w - dx), h: Math.max(3, o.h - dy) };
          case "ne":    return { ...r, y: o.y + dy, w: Math.max(3, o.w + dx), h: Math.max(3, o.h - dy) };
          case "sw":    return { ...r, x: o.x + dx, w: Math.max(3, o.w - dx), h: Math.max(3, o.h + dy) };
          case "se":    return { ...r, w: Math.max(3, o.w + dx), h: Math.max(3, o.h + dy) };
          default:      return r;
        }
      }));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [editMode]);

  const exportRegions = () => {
    const json = JSON.stringify(regions.map(r => ({
      id: r.id, name: r.name, x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10,
      w: Math.round(r.w * 10) / 10, h: Math.round(r.h * 10) / 10,
      color: r.color, locked: r.locked,
    })), null, 2);
    console.log("REGIONS:", json);
    navigator.clipboard.writeText(json).then(() => alert("已复制到剪贴板！粘贴到 console 或告诉我"));
  };

  const resetRegions = () => { setRegions(DEFAULT_REGIONS); };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center"
      style={{ background: "rgba(3,2,14,0.96)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="flex flex-col items-center"
        style={{ width: "min(1000px, 96vw)", height: "min(780px, 92vh)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between w-full mb-2 px-2">
          <h3 className="font-heading text-lg tracking-[0.2em]"
            style={{ color: "#ffd700", textShadow: "0 0 12px rgba(255,215,0,0.4)" }}>
            🗺️ 符文大陆
          </h3>
          <div className="flex items-center gap-3">
            {/* Edit toggle */}
            <button onClick={() => setEditMode(!editMode)}
              className="font-mono text-xs px-3 py-1 border transition-all"
              style={{
                color: editMode ? "#000" : "#ffd700",
                background: editMode ? "#ffd700" : "transparent",
                borderColor: editMode ? "#ffd700" : "rgba(255,215,0,0.2)",
              }}>
              {editMode ? "✎ 编辑中" : "✎ 编辑"}
            </button>
            {editMode && (
              <>
                <button onClick={exportRegions}
                  className="font-mono text-xs px-3 py-1 border"
                  style={{ color: "#00ff88", borderColor: "rgba(0,255,136,0.3)" }}>
                  📋 导出
                </button>
                <button onClick={resetRegions}
                  className="font-mono text-xs px-3 py-1 border"
                  style={{ color: "#ff3355", borderColor: "rgba(255,51,85,0.3)" }}>
                  ↺ 重置
                </button>
              </>
            )}
            <button onClick={onClose} className="font-mono text-xl hover:scale-110 transition-transform"
              style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
          </div>
        </div>

        {/* Map container */}
        <div ref={mapRef} className="flex-1 w-full relative overflow-hidden"
          style={{
            border: "1px solid rgba(180,160,200,0.15)",
            borderRadius: "6px",
            background: imgFailed
              ? "radial-gradient(ellipse at 40% 40%, #1a2a3a 0%, #0a1018 100%)"
              : "rgba(10,15,25,0.8)",
          }}>
          {!imgFailed && (
            <img src="/runeterra-original.png" alt="符文大陆"
              className="absolute inset-0 w-full h-full object-cover opacity-75"
              onError={() => setImgFailed(true)} />
          )}
          <div className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(3,2,14,0.6) 100%)",
              pointerEvents: "none",
            }} />
          {imgFailed && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <p className="font-mono text-sm text-center leading-relaxed" style={{ color: "rgba(200,200,220,0.12)" }}>
                将符文大陆地图放入 public/runeterra-original.png
              </p>
            </div>
          )}

          {/* Region hotspots */}
          {regions.map(region => {
            const isHovered = hovered === region.id;
            const isDragging = editMode && dragRef.current?.id === region.id;
            return (
              <div key={region.id}
                className="absolute transition-all duration-150"
                style={{
                  left: `${region.x}%`, top: `${region.y}%`,
                  width: `${region.w}%`, height: `${region.h}%`,
                  border: editMode
                    ? `2px solid ${region.color}cc`
                    : isHovered
                      ? `2px solid ${region.color}99`
                      : `1px solid ${region.locked ? "rgba(100,100,100,0.15)" : region.color + "22"}`,
                  background: editMode
                    ? `${region.color}30`
                    : isHovered
                      ? `${region.color}18`
                      : region.locked
                        ? "rgba(40,40,50,0.2)"
                        : `${region.color}06`,
                  boxShadow: editMode
                    ? `0 0 8px ${region.color}40`
                    : isHovered
                      ? `inset 0 0 40px ${region.color}30, 0 0 20px ${region.color}20`
                      : "none",
                  borderRadius: "4px",
                  filter: region.locked ? "grayscale(0.7)" : "none",
                  zIndex: isDragging ? 20 : isHovered || editMode ? 10 : 1,
                  cursor: editMode ? "move" : region.locked ? "default" : "pointer",
                  userSelect: "none",
                }}
                onMouseEnter={() => !editMode && setHovered(region.id)}
                onMouseLeave={() => setHovered(null)}
                onMouseDown={e => editMode && onMouseDown(e, region, "move")}
                onClick={() => {
                  if (editMode || region.locked) return;
                  onRegionClick(region);
                }}>
                {/* Region label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="font-heading block"
                      style={{
                        fontSize: editMode ? "11px" : isHovered ? "18px" : "14px",
                        color: region.locked ? "rgba(150,150,160,0.35)"
                          : editMode ? region.color : isHovered ? region.color : region.color + "aa",
                        textShadow: (isHovered || editMode) && !region.locked ? `0 0 14px ${region.color}99` : "none",
                        letterSpacing: "0.08em",
                      }}>
                      {region.name}
                      {editMode && <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 4 }}>({region.x}%,{region.y}% {region.w}%×{region.h}%)</span>}
                    </span>
                  </div>
                </div>

                {/* Edit handles */}
                {editMode && (
                  <>
                    {(["nw","n","ne","w","e","sw","s","se"] as const).map(edge => {
                      const pos: Record<string, React.CSSProperties> = {
                        nw: { top: -4, left: -4 }, n: { top: -4, left: "50%", marginLeft: -4 },
                        ne: { top: -4, right: -4 }, w: { top: "50%", left: -4, marginTop: -4 },
                        e: { top: "50%", right: -4, marginTop: -4 }, sw: { bottom: -4, left: -4 },
                        s: { bottom: -4, left: "50%", marginLeft: -4 }, se: { bottom: -4, right: -4 },
                      };
                      return (
                        <div key={edge}
                          className="absolute rounded-full"
                          style={{
                            ...pos[edge],
                            width: 8, height: 8,
                            background: region.color,
                            border: "1px solid #fff",
                            cursor: edge + "-resize",
                            zIndex: 30,
                          }}
                          onMouseDown={e => onMouseDown(e, region, edge)}
                        />
                      );
                    })}
                    {/* Nudge buttons */}
                    <div className="absolute flex gap-0.5 pointer-events-auto" style={{ bottom: "100%", left: 0, marginBottom: 2 }}>
                      {[
                        ["←", -0.5, 0, 0, 0], ["→", 0.5, 0, 0, 0],
                        ["↑", 0, -0.5, 0, 0], ["↓", 0, 0.5, 0, 0],
                        ["+W", 0, 0, 0.5, 0], ["-W", 0, 0, -0.5, 0],
                        ["+H", 0, 0, 0, 0.5], ["-H", 0, 0, 0, -0.5],
                      ].map(([label, dx, dy, dw, dh]) => (
                        <button key={label as string}
                          className="font-mono border"
                          style={{ fontSize: 8, padding: "1px 3px", color: region.color, borderColor: region.color + "44", background: "rgba(0,0,0,0.7)" }}
                          onClick={e => { e.stopPropagation(); nudge(region.id, Number(dx), Number(dy), Number(dw), Number(dh)); }}
                          onMouseDown={e => e.stopPropagation()}>
                          {label as string}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-5 mt-2 font-mono text-xs" style={{ color: "rgba(200,200,208,0.2)" }}>
          {editMode
            ? <span style={{ color: "#ffd700" }}>🖐 拖拽移动 · 边角调整大小 · 箭头微调 · 导出后告诉我</span>
            : <><span>🔮 已解锁区域</span><span>🔒 暂不开放</span></>}
        </div>
      </div>
    </div>
  );
}
