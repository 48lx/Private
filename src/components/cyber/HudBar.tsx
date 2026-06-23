"use client";

import { useState, useEffect } from "react";

export default function HudBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-8 bg-cyber-bg/90 border-t border-cyber-border flex items-center justify-between px-4 font-mono text-[10px] text-cyber-text-dim/60">
      {/* Left: time */}
      <div className="flex items-center gap-3">
        <span className="text-cyber-cyan/70">{time}</span>
        <span className="text-cyber-border">│</span>
        <span>SYS: NOMINAL</span>
      </div>

      {/* Center: version / tagline */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-cyber-cyan/40 tracking-[0.2em]">
          N.E.X.U.S. v0.4.51
        </span>
      </div>

      {/* Right: status indicators */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-green shadow-[0_0_4px_#00ff88]" />
          CORE
        </span>
        <span className="text-cyber-border">│</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan/50" />
          NET
        </span>
        <span className="text-cyber-border">│</span>
        <span className="text-cyber-text-dim/30">
          NODE:01
        </span>
      </div>
    </div>
  );
}
