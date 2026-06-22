"use client";

import { useState, useEffect } from "react";

interface Region {
  id: string;
  name: string;
  // 相对于地图容器的百分比定位 (left, top, width, height)
  x: number; y: number; w: number; h: number;
  color: string;
  locked?: boolean;
  lockedLabel?: string;
}

const REGIONS: Region[] = [
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
  { id: "shadow",     name: "暗影岛",     x: 76, y: 66, w: 20, h: 28, color: "#2c3e50",
    locked: true, lockedLabel: "路途凶险 · 暂不开放" },
  { id: "targon",     name: "巨神峰",     x: 2,  y: 66, w: 16, h: 24, color: "#b8860b",
    locked: true, lockedLabel: "终局地点 · 暂不开放" },
];

interface Props {
  onClose: () => void;
  onRegionClick: (region: Region) => void;
}

export default function RuneterraMap({ onClose, onRegionClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

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
            <span className="font-mono text-xs" style={{ color: "rgba(200,200,208,0.25)" }}>
              {REGIONS.filter(r => !r.locked).length} 区域可探索
            </span>
            <button onClick={onClose} className="font-mono text-xl hover:scale-110 transition-transform"
              style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
          </div>
        </div>

        {/* Map container */}
        <div className="flex-1 w-full relative overflow-hidden"
          style={{
            border: "1px solid rgba(180,160,200,0.15)",
            borderRadius: "6px",
            background: imgFailed
              ? "radial-gradient(ellipse at 40% 40%, #1a2a3a 0%, #0a1018 100%)"
              : "rgba(10,15,25,0.8)",
          }}>

          {/* Map background image */}
          {!imgFailed && (
            <img
              src="/runeterra-original.png"
              alt="符文大陆"
              className="absolute inset-0 w-full h-full object-cover opacity-75"
              onError={() => setImgFailed(true)}
            />
          )}

          {/* Dark overlay for atmosphere */}
          <div className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(3,2,14,0.6) 100%)",
              pointerEvents: "none",
            }} />

          {/* Fallback decoration when no image */}
          {imgFailed && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <p className="font-mono text-sm text-center leading-relaxed"
                style={{ color: "rgba(200,200,220,0.12)" }}>
                将符文大陆地图放入 public/runeterra-original.png<br/>
                <span style={{ fontSize: 11 }}>
                  参考：League of Legends Universe 官方地图
                </span>
              </p>
            </div>
          )}

          {/* Region hotspots */}
          {REGIONS.map(region => {
            const isHovered = hovered === region.id;
            return (
              <div
                key={region.id}
                className="absolute cursor-pointer transition-all duration-300"
                style={{
                  left: `${region.x}%`, top: `${region.y}%`,
                  width: `${region.w}%`, height: `${region.h}%`,
                  border: isHovered
                    ? `2px solid ${region.color}99`
                    : `1px solid ${region.locked ? "rgba(100,100,100,0.15)" : region.color + "22"}`,
                  background: isHovered
                    ? `${region.color}18`
                    : region.locked
                      ? "rgba(40,40,50,0.2)"
                      : `${region.color}06`,
                  boxShadow: isHovered
                    ? `inset 0 0 40px ${region.color}30, 0 0 20px ${region.color}20`
                    : "none",
                  borderRadius: "4px",
                  filter: region.locked ? "grayscale(0.7)" : "none",
                  zIndex: isHovered ? 10 : 1,
                }}
                onMouseEnter={() => setHovered(region.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  if (region.locked) return;
                  onRegionClick(region);
                }}>
                {/* Region name label */}
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ pointerEvents: "none" }}>
                  <div className="text-center transition-all duration-300"
                    style={{
                      transform: isHovered ? "scale(1.1)" : "scale(1)",
                    }}>
                    <span className="font-heading block"
                      style={{
                        fontSize: isHovered ? "18px" : "14px",
                        color: region.locked
                          ? "rgba(150,150,160,0.35)"
                          : isHovered
                            ? region.color
                            : region.color + "aa",
                        textShadow: isHovered && !region.locked
                          ? `0 0 14px ${region.color}99`
                          : "none",
                        letterSpacing: "0.08em",
                      }}>
                      {region.name}
                    </span>
                    {isHovered && region.locked && (
                      <span className="font-mono block mt-1"
                        style={{ fontSize: "10px", color: "rgba(200,200,200,0.3)" }}>
                        {region.lockedLabel}
                      </span>
                    )}
                    {isHovered && !region.locked && (
                      <div className="mx-auto mt-1.5" style={{
                        width: 6, height: 6,
                        borderRadius: "50%",
                        backgroundColor: region.color,
                        boxShadow: `0 0 8px ${region.color}`,
                        animation: "pulse-glow 1.5s ease-in-out infinite",
                      }} />
                    )}
                  </div>
                </div>

                {/* Region border glow on hover */}
                {isHovered && !region.locked && (
                  <div className="absolute inset-0 rounded pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 20px ${region.color}44`,
                      animation: "pulse-glow 2s ease-in-out infinite",
                    }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer legend */}
        <div className="flex items-center gap-5 mt-2 font-mono text-xs"
          style={{ color: "rgba(200,200,208,0.2)" }}>
          <span>🔮 已解锁区域</span>
          <span>🔒 暂不开放</span>
          <span className="ml-4" style={{ color: "rgba(200,200,208,0.12)" }}>
            hover 区域查看名称 · 点击探索
          </span>
        </div>
      </div>
    </div>
  );
}
