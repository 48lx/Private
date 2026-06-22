"use client";

import { useState } from "react";
import gsap from "gsap";

interface Region {
  id: string;
  name: string;
  gridArea: string;       // CSS grid placement
  color: string;
  locked?: boolean;
  lockedLabel?: string;
}

const REGIONS: Region[] = [
  { id: "freljord",    name: "弗雷尔卓德", gridArea: "1 / 1 / 3 / 3", color: "#7ec8e3" },
  { id: "demacia",     name: "德玛西亚",   gridArea: "1 / 3 / 3 / 5", color: "#c9a96e" },
  { id: "noxus",       name: "诺克萨斯",   gridArea: "1 / 5 / 3 / 7", color: "#c0392b" },
  { id: "piltover",    name: "皮尔特沃夫", gridArea: "3 / 1 / 5 / 2", color: "#f4d03f" },
  { id: "zaun",        name: "祖安",       gridArea: "5 / 1 / 7 / 2", color: "#27ae60" },
  { id: "ionia",       name: "艾欧尼亚",   gridArea: "3 / 2 / 6 / 5", color: "#e67e22" },
  { id: "bilgewater",  name: "比尔吉沃特", gridArea: "3 / 5 / 5 / 7", color: "#2980b9" },
  { id: "ixtal",       name: "以绪塔尔",   gridArea: "6 / 2 / 7 / 5", color: "#1abc9c" },
  { id: "shurima",     name: "恕瑞玛",     gridArea: "5 / 5 / 7 / 7", color: "#f39c12" },
  { id: "bandle",      name: "班德尔城",   gridArea: "7 / 3 / 8 / 5", color: "#9b59b6" },
  { id: "shadow",      name: "暗影岛",     gridArea: "8 / 5 / 9 / 7", color: "#2c3e50",
    locked: true, lockedLabel: "路途凶险 · 暂不开放" },
  { id: "targon",      name: "巨神峰",     gridArea: "8 / 1 / 9 / 3", color: "#b8860b",
    locked: true, lockedLabel: "终局地点 · 暂不开放" },
];

interface Props {
  onClose: () => void;
  onRegionClick: (region: Region) => void;
}

export default function RuneterraMap({ onClose, onRegionClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center"
      style={{ background: "rgba(4,2,18,0.95)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="flex flex-col items-center" style={{ width: "min(900px, 94vw)", height: "min(750px, 88vh)" }}
        onClick={e => e.stopPropagation()}>

        {/* Title */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          <h3 className="font-heading text-lg tracking-[0.2em]"
            style={{ color: "#ffd700", textShadow: "0 0 12px rgba(255,215,0,0.4)" }}>
            🗺️ 符文大陆
          </h3>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs" style={{ color: "rgba(200,200,208,0.3)" }}>
              点击区域探索秘宝
            </span>
            <button onClick={onClose} className="font-mono text-xl" style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
          </div>
        </div>

        {/* Map grid: 8 rows × 6 columns */}
        <div className="flex-1 w-full relative"
          style={{
            display: "grid",
            gridTemplateRows: "repeat(8, 1fr)",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "4px",
            padding: "4px",
            background: "rgba(10,20,40,0.6)",
            border: "1px solid rgba(100,140,200,0.15)",
            borderRadius: "4px",
          }}>
          {/* Ocean background */}
          <div className="absolute inset-0 opacity-10"
            style={{
              background: "radial-gradient(ellipse at 30% 40%, rgba(0,150,200,0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(0,100,180,0.2) 0%, transparent 50%)",
              pointerEvents: "none",
            }} />

          {REGIONS.map(region => (
            <div
              key={region.id}
              className="relative flex items-center justify-center cursor-pointer transition-all duration-300 border overflow-hidden"
              style={{
                gridArea: region.gridArea,
                borderColor: hovered === region.id
                  ? region.color + "99"
                  : region.locked
                    ? "rgba(100,100,100,0.2)"
                    : region.color + "33",
                background: hovered === region.id
                  ? region.color + "18"
                  : region.locked
                    ? "rgba(40,40,50,0.3)"
                    : region.color + "08",
                boxShadow: hovered === region.id
                  ? `inset 0 0 30px ${region.color}22`
                  : "none",
                filter: region.locked ? "grayscale(0.6)" : "none",
                borderRadius: "3px",
              }}
              onMouseEnter={() => setHovered(region.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                if (region.locked) return;
                onRegionClick(region);
              }}>
              {/* Region name */}
              <div className="text-center z-10">
                <span className="font-heading block transition-all duration-300"
                  style={{
                    fontSize: region.locked ? "14px" : hovered === region.id ? "18px" : "15px",
                    color: region.locked
                      ? "rgba(150,150,160,0.4)"
                      : hovered === region.id
                        ? region.color
                        : region.color + "cc",
                    textShadow: hovered === region.id && !region.locked
                      ? `0 0 10px ${region.color}88`
                      : "none",
                    letterSpacing: "0.1em",
                  }}>
                  {region.name}
                </span>
                {hovered === region.id && region.locked && region.lockedLabel && (
                  <span className="font-mono block mt-1" style={{ fontSize: "10px", color: "rgba(200,200,200,0.3)" }}>
                    {region.lockedLabel}
                  </span>
                )}
              </div>

              {/* Decorative dots for unlocked regions */}
              {!region.locked && (
                <div className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle, ${region.color}44 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }} />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-3 font-mono text-xs" style={{ color: "rgba(200,200,208,0.25)" }}>
          <span>🔓 可探索</span>
          <span>🔒 暂不开放</span>
          <span>✨ 共 10 个区域</span>
        </div>
      </div>
    </div>
  );
}
