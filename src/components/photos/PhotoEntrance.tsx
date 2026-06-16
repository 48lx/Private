"use client";

import { useState } from "react";
import COAMemorial from "./COAMemorial";

export default function PhotoEntrance() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-8 top-1/2 -translate-y-1/2 z-30 group flex flex-col items-center gap-3"
        title="COA纪念册"
      >
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer gear ring */}
          <div className="absolute rounded-full border border-cyber-cyan/20 group-hover:border-cyber-cyan/50 transition-all duration-500"
            style={{ width: "100%", height: "100%", animation: "spin 20s linear infinite",
              boxShadow: "0 0 15px rgba(0,240,255,0.1), inset 0 0 15px rgba(0,240,255,0.05)" }}/>
          {/* Middle ring */}
          <div className="absolute rounded-full border border-cyber-magenta/15 group-hover:border-cyber-magenta/40 transition-all duration-500"
            style={{ width: "70%", height: "70%", animation: "spin-reverse 14s linear infinite" }}/>
          {/* Inner ring */}
          <div className="absolute rounded-full border border-cyber-gold/15 group-hover:border-cyber-gold/40 transition-all duration-500"
            style={{ width: "42%", height: "42%", animation: "spin 10s linear infinite" }}/>
          {/* Book icon */}
          <p className="relative font-mono text-xl text-cyber-cyan/40 group-hover:text-cyber-cyan/90 transition-all duration-500"
            style={{ textShadow: "0 0 10px rgba(0,240,255,0.3)" }}>
            📖
          </p>
        </div>
        <div className="text-center">
          <p className="font-heading text-[10px] text-cyber-cyan/50 group-hover:text-cyber-cyan/90 neon-cyan transition-all tracking-[0.2em]">
            COA纪念册
          </p>
          <p className="font-mono text-[8px] text-cyber-text-dim/30 group-hover:text-cyber-text-dim/60 transition-colors">
            CHRONICLES OF ARCADIA
          </p>
        </div>
        <div className="w-px h-8 bg-gradient-to-b from-cyber-cyan/20 to-transparent group-hover:from-cyber-cyan/40 transition-colors" />
      </button>

      <COAMemorial isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
