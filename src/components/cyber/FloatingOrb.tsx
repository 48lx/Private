"use client";

import { useEffect, useRef } from "react";

interface Props {
  unlocked: boolean;
  onClick: () => void;
}

const ORBITERS = [
  { size: 200, speed: "8s",  dot: 3,   color: "#00f0ff", offset: 0 },
  { size: 240, speed: "12s", dot: 2,   color: "#00f0ff", offset: 45 },
  { size: 220, speed: "10s", dot: 2.5, color: "#d800ff", offset: 90 },
  { size: 260, speed: "14s", dot: 1.5, color: "#d800ff", offset: 135 },
  { size: 190, speed: "7s",  dot: 2.5, color: "#00f0ff", offset: 180 },
  { size: 280, speed: "16s", dot: 1.5, color: "#ffd700", offset: 270 },
];

export default function FloatingOrb({ unlocked, onClick }: Props) {
  const orbRef = useRef<HTMLDivElement>(null);

  // Gentle idle float
  useEffect(() => {
    const el = orbRef.current;
    if (!el) return;
    let t = 0, raf = 0;
    const float = () => {
      t += 0.015;
      const y = Math.sin(t) * 8;
      const scale = 1 + Math.sin(t * 0.6) * 0.04;
      el.style.transform = `translateY(${y}px) scale(${scale})`;
      raf = requestAnimationFrame(float);
    };
    raf = requestAnimationFrame(float);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={orbRef}
      className="relative cursor-pointer group select-none"
      onClick={onClick}
      title={unlocked ? "符文大陆秘宝" : "完成今日猜英双挑战后解锁"}
      style={{ width: 300, height: 300 }}
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
              boxShadow: `0 0 ${o.dot * 5}px ${o.color}, 0 0 ${o.dot * 10}px ${o.color}88`,
              top: "50%", left: "0",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      ))}

      {/* Outer pulse ring */}
      <div
        className="absolute rounded-full"
        style={{
          inset: -20,
          border: `1.5px solid ${unlocked ? "rgba(255,215,0,0.12)" : "rgba(0,240,255,0.06)"}`,
          boxShadow: unlocked
            ? "0 0 50px rgba(255,215,0,0.1), 0 0 100px rgba(216,0,255,0.06)"
            : "0 0 30px rgba(0,240,255,0.04)",
          animation: "pulse-glow 3s ease-in-out infinite",
        }}
      />

      {/* Core sphere */}
      <div
        className="absolute rounded-full flex items-center justify-center transition-all duration-700"
        style={{
          inset: 50,
          background: unlocked
            ? "radial-gradient(circle at 40% 35%, rgba(255,215,0,0.25), rgba(216,0,255,0.15) 50%, rgba(0,240,255,0.1) 100%)"
            : "radial-gradient(circle at 40% 35%, rgba(0,240,255,0.08), rgba(5,5,16,0.5) 70%)",
          border: unlocked
            ? "1.5px solid rgba(255,215,0,0.35)"
            : "1px solid rgba(0,240,255,0.12)",
          boxShadow: unlocked
            ? "0 0 40px rgba(255,215,0,0.25), 0 0 80px rgba(216,0,255,0.15), inset 0 0 30px rgba(255,215,0,0.1)"
            : "0 0 20px rgba(0,240,255,0.06), inset 0 0 15px rgba(0,240,255,0.03)",
        }}
      >
        {/* Inner glow */}
        <div
          className="absolute rounded-full transition-all duration-700"
          style={{
            inset: 12,
            background: unlocked
              ? "radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(0,240,255,0.04) 0%, transparent 70%)",
          }}
        />

        {/* Icon */}
        <span
          className="relative font-mono transition-all duration-700"
          style={{
            fontSize: 40,
            filter: unlocked ? "none" : "grayscale(0.7)",
            opacity: unlocked ? 1 : 0.35,
          }}
        >
          {unlocked ? "🔮" : "🔒"}
        </span>
      </div>

      {/* Label below */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none"
        style={{ bottom: -40, width: 260 }}>
        <span
          className="font-heading block transition-all duration-500"
          style={{
            fontSize: 13,
            color: unlocked ? "#ffd700" : "rgba(200,200,208,0.25)",
            letterSpacing: "0.2em",
            textShadow: unlocked ? "0 0 8px rgba(255,215,0,0.3)" : "none",
          }}>
          {unlocked ? "符文大陆秘宝" : "悬浮球秘宝"}
        </span>
        {!unlocked && (
          <span className="font-mono block mt-1" style={{ fontSize: 10, color: "rgba(200,200,208,0.15)" }}>
            完成今日猜英双挑战后解锁
          </span>
        )}
      </div>
    </div>
  );
}
