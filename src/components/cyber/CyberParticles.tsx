"use client";

import { useEffect, useRef } from "react";

interface Props { visible: boolean; }

export default function CyberParticles({ visible }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.opacity = visible ? "0.6" : "0";
    containerRef.current.style.transition = "opacity 1.5s ease";
  }, [visible]);

  const streams = Array.from({ length: 16 }, (_, i) => ({
    left: `${4 + i * 6}%`,
    height: `${8 + (i % 5) * 3}%`,
    speed: `${4 + (i % 4) * 2}s`,
    delay: `${i * 0.5}s`,
    color: i % 3 === 0 ? "#00f0ff" : i % 3 === 1 ? "#d800ff" : "#ffd700",
  }));

  return (
    <div ref={containerRef} className="fixed inset-0 z-[2] pointer-events-none" style={{ opacity: 0.6 }}>
      {/* ── Floating data streams ── */}
      {streams.map((s, i) => (
        <div
          key={`s-${i}`}
          className="absolute"
          style={{
            left: s.left, top: "-10%",
            width: "1px", height: s.height,
            background: `linear-gradient(180deg, transparent, ${s.color}66 20%, ${s.color}44 80%, transparent)`,
            animation: `fall ${s.speed} linear infinite`,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* ── Horizontal scanning lines ── */}
      <div className="absolute left-0 w-full pointer-events-none" style={{
        height: "1px",
        background: "linear-gradient(90deg, transparent, #00f0ff44 20%, #00f0ff66 50%, #00f0ff44 80%, transparent)",
        animation: "scanDown 8s linear infinite",
        top: "0%",
      }}/>
      <div className="absolute left-0 w-full pointer-events-none" style={{
        height: "1px",
        background: "linear-gradient(90deg, transparent, #d800ff33 20%, #d800ff55 50%, #d800ff33 80%, transparent)",
        animation: "scanDown 11s linear infinite",
        top: "30%",
        animationDelay: "4s",
      }}/>

      {/* ── Drifting nodes with glow ── */}
      {Array.from({ length: 30 }, (_, i) => {
        const left = `${3 + ((i * 71 + 19) % 94)}%`;
        const top = `${2 + ((i * 53 + 37) % 96)}%`;
        const size = 2 + (i % 3);
        const color = i % 4 === 0 ? "#d800ff" : "#00f0ff";
        return (
          <div
            key={`n-${i}`}
            className="absolute rounded-full"
            style={{
              left, top,
              width: size, height: size,
              backgroundColor: color,
              boxShadow: `0 0 ${size*3}px ${color}, 0 0 ${size*6}px ${color}66`,
              animation: `driftNode ${3 + (i%4)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.2) % 4}s`,
              /* custom var for drift direction */
              ["--dx" as string]: `${((i%3)-1)*25}px`,
              ["--dy" as string]: `${((i%5)-2)*20}px`,
            }}
          />
        );
      })}

      {/* ── Rotating hexagons ── */}
      {Array.from({ length: 8 }, (_, i) => {
        const left = `${8 + ((i * 67 + 5) % 84)}%`;
        const top = `${5 + ((i * 43 + 11) % 90)}%`;
        return (
          <div
            key={`h-${i}`}
            className="absolute"
            style={{
              left, top,
              width: `${12 + (i%3)*8}px`,
              height: `${12 + (i%3)*8}px`,
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              border: "1px solid rgba(0,240,255,0.2)",
              animation: `spin ${8 + (i%4)*4}s linear infinite`,
              opacity: 0.4,
            }}
          />
        );
      })}

      {/* ── Flickering code matrix columns (right side) ── */}
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={`m-${i}`}
          className="absolute font-mono pointer-events-none"
          style={{
            right: `${3 + i * 5}%`,
            top: "-5%",
            fontSize: "10px",
            color: "#00f0ff22",
            writingMode: "vertical-rl",
            animation: `fall ${6 + i * 2}s linear infinite`,
            animationDelay: `${i * 1.5}s`,
            letterSpacing: "2px",
            lineHeight: "8px",
          }}
        >
          {Array.from({ length: 30 }, () =>
            Math.random() > 0.5 ? "1" : "0"
          ).join(" ")}
        </div>
      ))}
    </div>
  );
}
