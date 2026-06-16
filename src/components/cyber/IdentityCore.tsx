"use client";

import { useEffect, useRef, useState } from "react";

const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

// Orbiting particles config
const ORBITERS = [
  { size: 180, speed: "8s", dot: 3, color: "#00f0ff", offset: 0 },
  { size: 220, speed: "12s", dot: 2, color: "#00f0ff", offset: 45 },
  { size: 200, speed: "10s", dot: 2.5, color: "#d800ff", offset: 90 },
  { size: 240, speed: "14s", dot: 1.5, color: "#d800ff", offset: 135 },
  { size: 170, speed: "7s", dot: 2, color: "#00f0ff", offset: 180 },
  { size: 260, speed: "16s", dot: 1.5, color: "#ffffff", offset: 270 },
];

interface Props {
  onDismiss: () => void;
}

export default function IdentityCore({ onDismiss }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouse = useRef({ x: -999, y: -999 });
  const [fading, setFading] = useState(false);

  const handleClick = () => {
    setFading(true);
    onDismiss(); // 立即触发亮度渐变，与消散同步
    setTimeout(() => {}, 1000); // 占位，纯CSS控制淡出，1s后父组件移除DOM
  };

  // Mouse parallax
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!el) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 14;
        const y = (e.clientY / window.innerHeight - 0.5) * 14;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center cursor-pointer"
      onClick={handleClick}
      style={{
        willChange: "transform, opacity",
        opacity: fading ? 0 : 1,
        transition: "opacity 1s ease-out",
      }}
      title="驱动核心"
    >
      <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>
        {/* Orbiting particles */}
        {ORBITERS.map((o, i) => (
          <div
            key={`orbit-${i}`}
            className="absolute rounded-full"
            style={{
              width: o.size, height: o.size,
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
                top: "50%",
                left: "0",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        ))}

        {/* Pulse ring */}
        <div
          className="rounded-full"
          style={{
            position: "absolute", width: 312, height: 312,
            border: "1px solid rgba(0,240,255,0.08)",
            boxShadow: "0 0 40px rgba(0,240,255,0.04), inset 0 0 40px rgba(0,240,255,0.03)",
            animation: "pulse-glow 3s ease-in-out infinite",
          }}
        />

        {/* Outer rotating hex */}
        <div
          style={{
            position: "absolute", width: 264, height: 264,
            clipPath: HEX,
            border: "1px solid rgba(0,240,255,0.25)",
            background: "linear-gradient(135deg, rgba(0,240,255,0.06), rgba(216,0,255,0.06))",
            animation: "spin 22s linear infinite",
            backfaceVisibility: "hidden",
          }}
        />

        {/* Middle counter-rotating hex */}
        <div
          style={{
            position: "absolute", width: 210, height: 210,
            clipPath: HEX,
            border: "1px solid rgba(0,240,255,0.18)",
            background: "rgba(13,13,36,0.7)",
            animation: "spin-reverse 16s linear infinite",
            backfaceVisibility: "hidden",
          }}
        />

        {/* Inner static hex */}
        <div
          style={{
            position: "absolute", width: 162, height: 162,
            clipPath: HEX,
            border: "1px solid rgba(0,240,255,0.35)",
            background: "rgba(5,5,16,0.9)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3,
          }}
        >
          <span style={{
            fontFamily: "var(--font-orbitron), sans-serif",
            fontSize: 10, color: "#00f0ff", letterSpacing: "0.2em",
            textShadow: "0 0 7px #00f0ff, 0 0 14px #00f0ff88",
            opacity: 0.8,
          }}>
            N.E.X.U.S.
          </span>
          <div style={{
            width: 28, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.5), transparent)",
          }} />
          <span style={{
            fontFamily: "var(--font-share-tech-mono), monospace",
            fontSize: 22, color: "#00f0ff",
            textShadow: "0 0 10px #00f0ff, 0 0 25px #00f0ff66",
          }}>
            驱动核心
          </span>
        </div>
      </div>

      <span style={{
        fontFamily: "var(--font-share-tech-mono), monospace",
        fontSize: 11, color: "rgba(200,200,208,0.25)",
        letterSpacing: "0.2em", marginTop: 16,
      }}>
        IDENTITY CORE // ONLINE
      </span>
    </div>
  );
}
