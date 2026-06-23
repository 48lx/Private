"use client";

import { useState, useEffect, useMemo } from "react";
import { getProgress, setProgress, addTokens, spendTokens } from "@/lib/card-storage";
import { getAttrs, getTags, getItems, adjustAttrs, addTag, removeTag, addItem, removeItem, PlayerAttrs, PlayerState } from "@/lib/player-state";
import { pickEvent, checkRequire } from "@/lib/event-engine";
import { GameEvent, DailyLog } from "@/lib/event-types";
import { demaciaEvents } from "@/data/events/demacia";
import InventoryPanel from "./InventoryPanel";
import EventPanel from "./EventPanel";

interface Region {
  id: string; name: string;
  x: number; y: number; w: number; h: number;
  color: string;
  locked?: boolean;
}

const REGIONS: Region[] = [
  { id: "freljord",   name: "弗雷尔卓德", x: 8,    y: 2,    w: 29.9, h: 22,   color: "#7ec8e3" },
  { id: "demacia",    name: "德玛西亚",   x: 7.7,  y: 28.6, w: 19,   h: 19,   color: "#c9a96e" },
  { id: "noxus",      name: "诺克萨斯",   x: 29.8, y: 24.7, w: 19.5, h: 29.4, color: "#c0392b" },
  { id: "piltover",   name: "皮尔特沃夫", x: 50.2, y: 31.8, w: 13.1, h: 16.7, color: "#f4d03f" },
  { id: "zaun",       name: "祖安",       x: 51.9, y: 49.1, w: 9,    h: 10.2, color: "#27ae60" },
  { id: "ionia",      name: "艾欧尼亚",   x: 65.2, y: 10.3, w: 22,   h: 38,   color: "#e67e22" },
  { id: "bilgewater", name: "比尔吉沃特", x: 71.7, y: 53.1, w: 14.9, h: 26.4, color: "#2980b9" },
  { id: "ixtal",      name: "以绪塔尔",   x: 57.3, y: 59.7, w: 14.1, h: 18,   color: "#1abc9c" },
  { id: "shurima",    name: "恕瑞玛",     x: 33.8, y: 65.5, w: 24,   h: 22,   color: "#f39c12" },
  { id: "shadow",     name: "暗影岛",     x: 86.9, y: 71.6, w: 8.3,  h: 11.2, color: "#2c3e50", locked: true },
  { id: "targon",     name: "巨神峰",     x: 27.3, y: 75.6, w: 5.9,  h: 6.6,  color: "#b8860b", locked: true },
];

// 相邻关系
const ADJACENCY: Record<string, string[]> = {
  freljord:   ["demacia"],
  demacia:    ["freljord", "noxus"],
  noxus:      ["piltover", "freljord", "demacia", "ionia"],
  ionia:      ["noxus", "piltover", "bilgewater"],
  piltover:   ["zaun", "noxus", "ionia", "bilgewater"],
  zaun:       ["piltover", "bilgewater", "ixtal", "shurima"],
  ixtal:      ["zaun", "shurima", "bilgewater"],
  bilgewater: ["ionia", "piltover", "zaun", "ixtal", "shadow"],
  shadow:     ["bilgewater", "ixtal"],
  shurima:    ["ixtal", "targon", "zaun"],
  targon:     ["shurima"],
};

const START_REGION = "demacia";
const EXPLORE_COST = 2;
const MOVE_COST = 3;

interface Props {
  groupKey: string;
  onClose: () => void;
  onRegionClick: (region: Region) => void;
}

export default function RuneterraMap({ groupKey, onClose, onRegionClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [vitality, setVitality] = useState(0);
  const [currentRegion, setCurrentRegion] = useState(START_REGION);
  const [toast, setToast] = useState<string | null>(null);
  const [attrs, setAttrs] = useState<PlayerAttrs>({ 力量: 3, 智力: 3, 敏捷: 3, 魅力: 3 });
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);

  const ALL_EVENTS = [...demaciaEvents];

  const applyOutcome = async (outcome: import("@/lib/event-types").EventOutcome) => {
    if (!groupKey) return;
    if (outcome.tokens) {
      if (outcome.tokens > 0) await addTokens(groupKey, outcome.tokens);
      else await spendTokens(groupKey, -outcome.tokens);
    }
    if (outcome.vitality) {
      const v = vitality + outcome.vitality;
      await saveVitality(Math.max(0, v));
    }
    if (outcome.attrDelta) await adjustAttrs(groupKey, outcome.attrDelta);
    if (outcome.addTags) for (const t of outcome.addTags) await addTag(groupKey, t);
    if (outcome.removeTags) for (const t of outcome.removeTags) await removeTag(groupKey, t);
    if (outcome.addItems) for (const i of outcome.addItems) await addItem(groupKey, i);
    // Refresh state
    const a = await getAttrs(groupKey);
    const tags = await getTags(groupKey);
    const items = await getItems(groupKey);
    setAttrs(a);
    const vRaw = await getProgress(groupKey, "map-vitality");
    if (vRaw) {
      const vd = JSON.parse(vRaw);
      setVitality(vd.v);
    }
    setPlayerState({ attrs: a, tags, items });
  };

  const adjacentSet = useMemo(() => {
    return new Set(ADJACENCY[currentRegion] || []);
  }, [currentRegion]);

  // 加载活力与当前位置
  useEffect(() => {
    if (!groupKey) return;
    (async () => {
      // 属性
      const a = await getAttrs(groupKey);
      const tags = await getTags(groupKey);
      const items = await getItems(groupKey);
      setAttrs(a);
      setPlayerState({ attrs: a, tags, items });
      // 活力
      const today = new Date().toISOString().split("T")[0];
      const vRaw = await getProgress(groupKey, "map-vitality");
      let vData: { v: number; date: string };
      if (vRaw) {
        vData = JSON.parse(vRaw);
        if (vData.date !== today) vData = { v: 8, date: today };
      } else {
        vData = { v: 8, date: today };
      }
      setVitality(vData.v);
      // 位置
      const region = await getProgress(groupKey, "map-region");
      if (region && REGIONS.some(r => r.id === region)) setCurrentRegion(region);
      // 持久化初始化
      await setProgress(groupKey, "map-vitality", JSON.stringify(vData));
      if (!region) await setProgress(groupKey, "map-region", START_REGION);
    })();
  }, [groupKey]);

  const saveVitality = async (v: number) => {
    const today = new Date().toISOString().split("T")[0];
    await setProgress(groupKey, "map-vitality", JSON.stringify({ v, date: today }));
    setVitality(v);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleRegionClick = async (region: Region) => {
    if (region.locked) {
      showToast("暂未开放");
      return;
    }

    const rid = region.id;

    // 当前区域：探索
    if (rid === currentRegion) {
      if (vitality < EXPLORE_COST) { showToast(`活力不足（需${EXPLORE_COST}点）`); return; }
      await saveVitality(vitality - EXPLORE_COST);
      // 如果是德玛西亚，尝试触发事件
      if (rid === "demacia" && playerState) {
        const dailyLog: DailyLog | null = null; // 测试阶段不限重复
        const picked = pickEvent(rid, ALL_EVENTS, playerState, dailyLog);
        if (picked) {
          setCurrentEvent(picked);
          return;
        }
      }
      showToast(`🔍 探索 ${region.name}（-${EXPLORE_COST}活力）`);
      onRegionClick(region);
      return;
    }

    // 相邻区域：移动
    if (adjacentSet.has(rid)) {
      if (vitality < MOVE_COST) { showToast(`活力不足（需${MOVE_COST}点）`); return; }
      await setProgress(groupKey, "map-region", rid);
      setCurrentRegion(rid);
      await saveVitality(vitality - MOVE_COST);
      showToast(`🚶 前往 ${region.name}（-${MOVE_COST}活力）`);
      onRegionClick(region);
      return;
    }

    // 不相邻
    showToast(`无法直接到达${region.name}，需要从相邻区域移动`);
  };

  const isAdjacent = (id: string) => adjacentSet.has(id) || id === currentRegion;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center"
      style={{ background: "rgba(3,2,14,0.96)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="flex flex-col items-center"
        style={{ width: "min(1000px, 96vw)", height: "min(780px, 92vh)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between w-full mb-2 px-2">
          <div className="flex items-center gap-4">
            <h3 className="font-heading text-lg tracking-[0.2em]"
              style={{ color: "#ffd700", textShadow: "0 0 12px rgba(255,215,0,0.4)" }}>
              🗺️ 符文大陆
            </h3>
            {/* Vitality bar */}
            <div className="flex items-center gap-2 font-mono text-sm">
              <span style={{ color: "#00ff88" }}>⚡</span>
              <span style={{ color: vitality > 2 ? "#00ff88" : "#ff3355" }}>{vitality}</span>
              <span style={{ color: "rgba(200,200,208,0.3)", fontSize: 10 }}>/8</span>
            </div>
            {/* Divider */}
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
            {/* Attrs */}
            <div className="flex items-center gap-3 font-mono text-xs">
              {(["力量","智力","敏捷","魅力"] as (keyof PlayerAttrs)[]).map(k => {
                const colors: Record<string, string> = { 力量: "#ff6666", 智力: "#6699ff", 敏捷: "#66ff66", 魅力: "#ff88ff" };
                const labels: Record<string, string> = { 力量: "力", 智力: "智", 敏捷: "敏", 魅力: "魅" };
                return (
                  <span key={k} className="flex items-center gap-0.5">
                    <span style={{ color: "rgba(200,200,208,0.3)" }}>{labels[k]}</span>
                    <span style={{ color: colors[k] }}>{attrs[k]}</span>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs" style={{ color: "rgba(200,200,208,0.3)" }}>
              📍 {REGIONS.find(r => r.id === currentRegion)?.name || ""}
            </span>
            <InventoryPanel />
            <button onClick={onClose} className="font-mono text-xl hover:scale-110 transition-transform"
              style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 w-full relative overflow-hidden"
          style={{ border: "1px solid rgba(180,160,200,0.15)", borderRadius: "6px", background: "rgba(10,15,25,0.8)" }}>
          {!imgFailed && (
            <img src="/runeterra-original.png" alt="符文大陆"
              className="absolute inset-0 w-full h-full object-cover opacity-75"
              loading="eager"
              onError={() => setImgFailed(true)} />
          )}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(3,2,14,0.6) 100%)", pointerEvents: "none" }} />
          {imgFailed && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <p className="font-mono text-sm" style={{ color: "rgba(200,200,220,0.12)" }}>将符文大陆地图放入 public/runeterra-original.png</p>
            </div>
          )}

          {/* Current location marker */}
          {REGIONS.filter(r => r.id === currentRegion).map(r => (
            <div key="current" className="absolute pointer-events-none"
              style={{
                left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%`,
                border: "2px solid rgba(0,255,136,0.5)",
                background: "rgba(0,255,136,0.06)",
                boxShadow: "inset 0 0 30px rgba(0,255,136,0.15), 0 0 20px rgba(0,255,136,0.1)",
                borderRadius: "4px", zIndex: 5,
              }}
            />
          ))}

          {REGIONS.map(region => {
            const isHovered = hovered === region.id;
            const isCurrent = region.id === currentRegion;
            const canReach = isAdjacent(region.id);

            return (
              <div key={region.id}
                className="absolute transition-all duration-200"
                style={{
                  left: `${region.x}%`, top: `${region.y}%`,
                  width: `${region.w}%`, height: `${region.h}%`,
                  border: isCurrent ? "2px solid rgba(0,255,136,0.5)"
                    : isHovered ? `2px solid ${region.color}88`
                    : "1px solid transparent",
                  background: isCurrent ? "rgba(0,255,136,0.06)"
                    : isHovered ? `${region.color}12`
                    : "transparent",
                  boxShadow: isCurrent ? "inset 0 0 30px rgba(0,255,136,0.15)"
                    : isHovered ? `inset 0 0 50px ${region.color}20`
                    : "none",
                  borderRadius: "4px",
                  filter: region.locked ? "grayscale(0.7)" : canReach ? "none" : "brightness(0.5)",
                  zIndex: isHovered ? 10 : 1,
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onMouseEnter={() => setHovered(region.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleRegionClick(region)}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: isHovered || isCurrent ? 1 : 0, transition: "opacity 0.3s" }}>
                  <div className="text-center">
                    <span className="font-heading block font-bold"
                      style={{
                        fontSize: "22px",
                        color: region.locked ? "rgba(150,150,160,0.35)"
                          : isCurrent ? "#00ff88"
                          : region.color,
                        textShadow: isHovered && !region.locked && !isCurrent
                          ? `0 0 18px ${region.color}cc, 0 0 36px ${region.color}66`
                          : isCurrent ? "0 0 12px rgba(0,255,136,0.6)" : "none",
                        letterSpacing: "0.08em",
                      }}>
                      {region.name}
                    </span>
                    {region.locked && (
                      <span className="font-mono block mt-1" style={{ fontSize: 10, color: "rgba(200,200,200,0.3)" }}>
                        暂未开放
                      </span>
                    )}
                    {isHovered && !region.locked && !isCurrent && !canReach && (
                      <span className="font-mono block mt-1" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
                        无法直接到达
                      </span>
                    )}
                    {isCurrent && (
                      <div className="mx-auto mt-1 flex items-center gap-1 justify-center">
                        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#00ff88", boxShadow: "0 0 8px #00ff88", animation: "pulse-glow 1.5s ease-in-out infinite" }} />
                        <span className="font-mono" style={{ fontSize: 8, color: "rgba(0,255,136,0.4)" }}>当前位置</span>
                      </div>
                    )}
                    {isHovered && canReach && !isCurrent && !region.locked && (
                      <span className="font-mono block mt-1" style={{ fontSize: 9, color: region.color + "88" }}>
                        {region.id === currentRegion ? `探索 -${EXPLORE_COST}⚡` : `前往 -${MOVE_COST}⚡`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Cost legend */}
          <div className="absolute bottom-3 left-3 font-mono text-xs flex gap-4"
            style={{ color: "rgba(200,200,208,0.2)", background: "rgba(5,5,16,0.7)", padding: "4px 8px", borderRadius: 3 }}>
            <span>🔍 探索 -{EXPLORE_COST}⚡</span>
            <span>🚶 移动 -{MOVE_COST}⚡</span>
          </div>
        </div>

        {/* Event Panel */}
        {currentEvent && playerState && (
          <EventPanel
            event={currentEvent}
            playerState={playerState}
            onResult={async (choiceIndex, success) => {
              const choice = currentEvent.choices[choiceIndex];
              if (choice) {
                const outcome = success ? choice.success : (choice.failure || choice.success);
                await applyOutcome(outcome);
              }
            }}
            onClose={() => setCurrentEvent(null)}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[130] pointer-events-none animate-bounce"
            style={{
              padding: "8px 18px", background: "rgba(13,13,36,0.95)",
              border: "1px solid rgba(255,215,0,0.3)", color: "#ffd700",
              fontFamily: "monospace", fontSize: 13, borderRadius: 4,
              textShadow: "0 0 8px rgba(255,215,0,0.3)",
            }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
