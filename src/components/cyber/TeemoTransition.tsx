"use client";

import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

export default function TeemoTransition({ onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 200);
    }, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center pointer-events-none"
      style={{ background: "rgba(4,2,18,0.85)" }}>
      <div className="text-center" style={{ animation: "teemo-hop 0.3s ease-in-out infinite alternate" }}>
        <span style={{ fontSize: 64, display: "block" }}>🐹</span>
        <p className="font-mono text-sm mt-3 animate-pulse" style={{ color: "rgba(200,200,208,0.4)" }}>
          正在探索...
        </p>
      </div>
      <style>{`
        @keyframes teemo-hop {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-16px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
