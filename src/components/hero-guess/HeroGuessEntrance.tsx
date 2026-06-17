"use client";

import { useState, useEffect } from "react";
import { useEditMode } from "@/lib/edit-mode";
import HeroGuessPanel from "./HeroGuessPanel";

function isSolvedToday(key: string): boolean {
  try { return localStorage.getItem(`hero-solved-${key}`) === new Date().toISOString().split("T")[0]; }
  catch { return false; }
}

export default function HeroGuessEntrance() {
  const [isOpen, setIsOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"standard" | "uzi">("standard");
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);
  const { editMode } = useEditMode();
  const [stdSolved, setStdSolved] = useState(false);
  const [uziSolved, setUziSolved] = useState(false);

  useEffect(() => { setStdSolved(isSolvedToday("standard")); setUziSolved(isSolvedToday("uzi")); }, []);

  const handleClose = () => {
    setIsOpen(false);
    setStdSolved(isSolvedToday("standard"));
    setUziSolved(isSolvedToday("uzi"));
  };

  const bothBright = hoverLeft || hoverRight || editMode;

  return (
    <>
      {/* ═══ Khazix ═══ */}
      <button onClick={() => { setPanelMode("standard"); setIsOpen(true); }}
        onMouseEnter={() => setHoverLeft(true)} onMouseLeave={() => setHoverLeft(false)}
        className="fixed left-8 bottom-16 z-30 group flex flex-col items-center gap-3"
        title="">
        <div className="relative overflow-hidden"
          style={{
            width: "240px", height: "320px",
            clipPath: "polygon(12% 2%, 92% 0%, 98% 88%, 8% 100%, 0% 55%, 6% 22%)",
            transform: bothBright ? "scale(1.06) translateY(-6px)" : "scale(1)",
            filter: bothBright
              ? "brightness(0.7) saturate(1.3) drop-shadow(0 0 25px rgba(0,240,255,0.5))"
              : stdSolved
              ? "brightness(0.85) saturate(1.5) drop-shadow(0 0 35px rgba(0,240,255,0.7))"
              : "brightness(0.3) saturate(0.5)",
            opacity: bothBright ? 1 : stdSolved ? 1 : 0.3,
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
          <img src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Khazix_0.jpg" alt="" draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "88% 72%", transform: "scale(1.35)" }}/>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 55% 25%, rgba(0,240,255,0.3) 0%, transparent 50%)",
            opacity: (hoverLeft || stdSolved) ? 1 : 0, transition: "opacity 0.5s",
          }}/>
          <div className="absolute inset-0 pointer-events-none" style={{
            boxShadow: bothBright ? "inset 0 0 30px rgba(0,240,255,0.15)" : "inset 0 0 10px rgba(0,240,255,0.05)",
            border: bothBright ? "1px solid rgba(0,240,255,0.4)" : stdSolved ? "1px solid rgba(0,240,255,0.5)" : "1px solid rgba(0,240,255,0.15)",
            clipPath: "polygon(12% 2%, 92% 0%, 98% 88%, 8% 100%, 0% 55%, 6% 22%)", transition: "all 0.5s",
          }}/>
        </div>
        {/* Solved star */}
        {stdSolved && <div className="absolute -top-2 -right-2 pointer-events-none font-heading text-lg"
          style={{ color: "#00f0ff", textShadow: "0 0 20px rgba(0,240,255,0.8), 0 0 40px rgba(0,240,255,0.4)" }}>✦</div>}
      </button>

      {/* ═══ Aatrox ═══ */}
      <button onClick={() => { setPanelMode("uzi"); setIsOpen(true); }}
        onMouseEnter={() => setHoverRight(true)} onMouseLeave={() => setHoverRight(false)}
        className="fixed right-8 top-12 z-30 group flex flex-col items-center gap-3"
        title="">
        <div className="relative overflow-hidden"
          style={{
            width: "240px", height: "320px",
            clipPath: "polygon(8% 0%, 90% 5%, 100% 48%, 94% 98%, 2% 95%, 0% 58%)",
            transform: bothBright ? "scale(1.06) translateY(-6px)" : "scale(1)",
            filter: bothBright
              ? "brightness(0.7) saturate(1.3) drop-shadow(0 0 25px rgba(216,0,255,0.5))"
              : uziSolved
              ? "brightness(0.85) saturate(1.5) drop-shadow(0 0 35px rgba(216,0,255,0.7))"
              : "brightness(0.3) saturate(0.5)",
            opacity: bothBright ? 1 : uziSolved ? 1 : 0.3,
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
          <img src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg" alt="" draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "71% 72%", transform: "scaleX(-1) scale(1.05)" }}/>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 45% 25%, rgba(216,0,255,0.3) 0%, transparent 50%)",
            opacity: (hoverRight || uziSolved) ? 1 : 0, transition: "opacity 0.5s",
          }}/>
          <div className="absolute inset-0 pointer-events-none" style={{
            boxShadow: bothBright ? "inset 0 0 30px rgba(216,0,255,0.15)" : "inset 0 0 10px rgba(216,0,255,0.05)",
            border: bothBright ? "1px solid rgba(216,0,255,0.4)" : uziSolved ? "1px solid rgba(216,0,255,0.5)" : "1px solid rgba(216,0,255,0.15)",
            clipPath: "polygon(8% 0%, 90% 5%, 100% 48%, 94% 98%, 2% 95%, 0% 58%)", transition: "all 0.5s",
          }}/>
        </div>
        {uziSolved && <div className="absolute -top-2 -right-2 pointer-events-none font-heading text-lg"
          style={{ color: "#d800ff", textShadow: "0 0 20px rgba(216,0,255,0.8), 0 0 40px rgba(216,0,255,0.4)" }}>✦</div>}
      </button>

      {/* ═══ Clash SVG ═══ */}
      {bothBright && !editMode && (
        <div className="fixed inset-0 z-20 pointer-events-none" style={{ opacity: 0.5 }}>
          <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cL" x1="0%" y1="100%" x2="50%" y2="50%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0"/><stop offset="73%" stopColor="#00f0ff" stopOpacity="1"/><stop offset="100%" stopColor="#ffffff" stopOpacity="1"/>
              </linearGradient>
              <linearGradient id="mL" x1="100%" y1="0%" x2="50%" y2="50%">
                <stop offset="0%" stopColor="#d800ff" stopOpacity="0"/><stop offset="73%" stopColor="#d800ff" stopOpacity="1"/><stop offset="100%" stopColor="#ffffff" stopOpacity="1"/>
              </linearGradient>
              <radialGradient id="rG" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.6"/><stop offset="30%" stopColor="white" stopOpacity="0.15"/><stop offset="100%" stopColor="white" stopOpacity="0"/>
              </radialGradient>
              <filter id="cG"><feGaussianBlur stdDeviation="3"/><feMerge><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="cGb"><feGaussianBlur stdDeviation="8"/><feMerge><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <style>{`
              @keyframes dK{from{stroke-dashoffset:800}to{stroke-dashoffset:0}}
              @keyframes dA{from{stroke-dashoffset:800}to{stroke-dashoffset:0}}
              @keyframes cI{0%{opacity:0;transform:scale(0)}100%{opacity:1;transform:scale(1)}}
              .lk{stroke-dasharray:800;animation:dK 3s ease-out forwards}
              .la{stroke-dasharray:800;animation:dA 3s ease-out forwards;animation-delay:.3s}
              .cb{opacity:0;transform-origin:963px 538px;animation:cI .8s ease-out forwards;animation-delay:3s}
            `}</style>
            <path className="lk" d="M140 820 Q480 600 948 546" fill="none" stroke="#00f0ff" strokeWidth="6" opacity="0.12" filter="url(#cGb)" strokeLinecap="round"/>
            <path className="la" d="M1780 160 Q1420 480 978 530" fill="none" stroke="#d800ff" strokeWidth="6" opacity="0.12" filter="url(#cGb)" strokeLinecap="round"/>
            <path className="lk" d="M140 820 Q480 600 948 546" fill="none" stroke="url(#cL)" strokeWidth="1.5" filter="url(#cG)" strokeLinecap="round"/>
            <path className="la" d="M1780 160 Q1420 480 978 530" fill="none" stroke="url(#mL)" strokeWidth="1.5" filter="url(#cG)" strokeLinecap="round"/>
            <g className="cb" filter="url(#cGb)">
              <circle cx="963" cy="538" r="40" fill="url(#rG)"/>
              <circle cx="963" cy="538" r="3" fill="white" opacity="0.9"><animate attributeName="r" values="2;7;2" dur="1.5s" repeatCount="indefinite"/></circle>
              <line x1="945" y1="520" x2="981" y2="556" stroke="white" strokeWidth="1" opacity="0.5"/>
              <line x1="981" y1="520" x2="945" y2="556" stroke="white" strokeWidth="1" opacity="0.5"/>
              {[0,60,120,180,240,300].map((a,i)=>{const r=(a*Math.PI)/180,l=18+(i%2)*10;return <line key={a} x1="963" y1="538" x2={963+Math.cos(r)*l} y2={538+Math.sin(r)*l} stroke={i%2===0?"#00f0ff":"#d800ff"} strokeWidth="1" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur={`${1.2+(i%3)*0.4}s`} repeatCount="indefinite" begin={`${i*0.12}s`}/></line>})}
              <circle cx="963" cy="538" r="6" fill="none" stroke="white" strokeWidth="1" opacity="0.4"><animate attributeName="r" values="6;35;6" dur="2.5s" repeatCount="indefinite"/></circle>
            </g>
          </svg>
        </div>
      )}

      {isOpen && <HeroGuessPanel key={panelMode} isOpen={isOpen} onClose={handleClose} initialMode={panelMode}/>}
    </>
  );
}
