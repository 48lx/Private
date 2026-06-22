"use client";

import { useEffect, useRef } from "react";

interface Props {
  unlocked: boolean;
  onClick: () => void;
}

const ORBITERS = [
  { size: 140, speed: "7s",  dot: 2.5, color: "#00f0ff", offset: 0 },
  { size: 170, speed: "10s", dot: 2,   color: "#d800ff", offset: 60 },
  { size: 155, speed: "8s",  dot: 2,   color: "#00f0ff", offset: 130 },
  { size: 185, speed: "13s", dot: 1.5, color: "#ffd700", offset: 220 },
];

export default function FloatingOrb({ unlocked, onClick }: Props) {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = orbRef.current;
    if (!el) return;
    let t = 0, raf = 0;
    const float = () => {
      t += 0.018;
      const y = Math.sin(t) * 7;
      el.style.transform = `translateY(${y}px)`;
      raf = requestAnimationFrame(float);
    };
    raf = requestAnimationFrame(float);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={orbRef}
      className="fixed cursor-pointer z-50 group"
      style={{ bottom: "140px", left: "50%", marginLeft: "-40px" }}
      onClick={onClick}
      title={unlocked ? "符文大陆秘宝" : "完成今日猜英双挑战后解锁"}
    >
      {/* Orbiting particles */}
      {ORBITERS.map((o, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: o.size, height: o.size,
            left: "50%", top: "50%",
            marginLeft: -o.size / 2, marginTop: -o.size / 2,
            animation: `spin ${o.speed} linear infinite`,
            transform: `rotate(${o.offset}deg)`,
            pointerEvents: "none",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: o.dot, height: o.dot,
              backgroundColor: o.color,
              boxShadow: `0 0 ${o.dot * 4}px ${o.color}, 0 0 ${o.dot * 8}px ${o.color}88`,
              top: "50%", left: "0",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      ))}

      {/* Core sphere */}
      <div
        className="relative flex items-center justify-center rounded-full transition-all duration-700"
        style={{
          width: 80, height: 80,
          background: unlocked
            ? "radial-gradient(circle at 40% 35%, rgba(255,215,0,0.25), rgba(216,0,255,0.15), rgba(0,240,255,0.1))"
            : "radial-gradient(circle, rgba(0,240,255,0.06), rgba(5,5,16,0.5))",
          border: unlocked
            ? "1.5px solid rgba(255,215,0,0.35)"
            : "1px solid rgba(0,240,255,0.12)",
          boxShadow: unlocked
            ? "0 0 30px rgba(255,215,0,0.2), 0 0 60px rgba(216,0,255,0.1), inset 0 0 20px rgba(255,215,0,0.06)"
            : "0 0 12px rgba(0,240,255,0.05), inset 0 0 10px rgba(0,240,255,0.02)",
        }}
      >
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: 80, height: 80,
            border: `1px solid ${unlocked ? "rgba(255,215,0,0.15)" : "rgba(0,240,255,0.05)"}`,
            animationDuration: "3s",
            opacity: 0.5,
          }}
        />
        <span
          className="font-mono transition-all duration-700"
          style={{
            fontSize: 24,
            filter: unlocked ? "none" : "grayscale(0.7)",
            opacity: unlocked ? 1 : 0.35,
          }}>
          {unlocked ? "🔮" : "🔒"}
        </span>
      </div>

      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
        style={{ bottom: -28 }}>
        <span className="font-mono text-xs px-2 py-0.5 border"
          style={{
            color: unlocked ? "#ffd700" : "rgba(200,200,208,0.3)",
            borderColor: unlocked ? "rgba(255,215,0,0.2)" : "rgba(200,200,208,0.1)",
            background: "rgba(5,5,16,0.9)",
          }}>
          {unlocked ? "符文大陆秘宝" : "完成今日猜英双挑战后解锁"}
        </span>
      </div>
    </div>
  );
}
