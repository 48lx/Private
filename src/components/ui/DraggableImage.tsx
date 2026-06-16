"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useEditMode } from "@/lib/edit-mode";
import { supabase } from "@/lib/supabase";

interface Props {
  src: string; alt: string; className?: string; imgStyle?: React.CSSProperties;
  storageKey: string; defaultX?: string; defaultY?: string; defaultScale?: number;
}

export default function DraggableImage({
  src, alt: _alt, className, imgStyle, storageKey,
  defaultX = "50%", defaultY = "20%", defaultScale = 1,
}: Props) {
  const { editMode } = useEditMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const posRef = useRef({ x: defaultX, y: defaultY, s: defaultScale });

  const [posX, setPosX] = useState(defaultX);
  const [posY, setPosY] = useState(defaultY);
  const [scale, setScale] = useState(defaultScale);
  const [loaded, setLoaded] = useState(false);

  // 从 Supabase 加载位置（fallback：localStorage）
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("background_positions").select("*").eq("image_key", storageKey).single();
        if (data) {
          setPosX(data.pos_x); setPosY(data.pos_y); setScale(data.scale);
          posRef.current = { x: data.pos_x, y: data.pos_y, s: data.scale };
        } else {
          // fallback localStorage
          const lx = localStorage.getItem(`${storageKey}-x`);
          const ly = localStorage.getItem(`${storageKey}-y`);
          const ls = localStorage.getItem(`${storageKey}-scale`);
          if (lx) setPosX(lx);
          if (ly) setPosY(ly);
          if (ls) setScale(parseFloat(ls));
          posRef.current = { x: lx || defaultX, y: ly || defaultY, s: ls ? parseFloat(ls) : defaultScale };
        }
      } catch {
        const lx = localStorage.getItem(`${storageKey}-x`) || defaultX;
        const ly = localStorage.getItem(`${storageKey}-y`) || defaultY;
        const ls = parseFloat(localStorage.getItem(`${storageKey}-scale`) || String(defaultScale));
        setPosX(lx); setPosY(ly); setScale(ls);
        posRef.current = { x: lx, y: ly, s: ls };
      }
      setLoaded(true);
    })();
  }, [storageKey]);

  const save = async (x: string, y: string, s: number) => {
    try {
      await supabase.from("background_positions").upsert({
        image_key: storageKey, pos_x: x, pos_y: y, scale: s, updated_at: new Date().toISOString(),
      }, { onConflict: "image_key" });
    } catch {
      localStorage.setItem(`${storageKey}-x`, x);
      localStorage.setItem(`${storageKey}-y`, y);
      localStorage.setItem(`${storageKey}-scale`, String(s));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode || !containerRef.current || !bgRef.current) return;
    e.preventDefault();
    dragging.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const anchorX = parseFloat(posRef.current.x);
    const anchorY = parseFloat(posRef.current.y);
    const clickPX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickPY = ((e.clientY - rect.top) / rect.height) * 100;
    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      if (!dragging.current || !bgRef.current) return;
      const px = ((ev.clientX - rect.left) / rect.width) * 100;
      const py = ((ev.clientY - rect.top) / rect.height) * 100;
      const nx = Math.round(Math.max(-50, Math.min(150, anchorX + px - clickPX)));
      const ny = Math.round(Math.max(-50, Math.min(150, anchorY + py - clickPY)));
      bgRef.current.style.backgroundPosition = `${nx}% ${ny}%`;
      posRef.current = { x: `${nx}%`, y: `${ny}%`, s: posRef.current.s };
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setPosX(posRef.current.x); setPosY(posRef.current.y);
    };
    document.addEventListener("mousemove", onMove, { passive: false });
    document.addEventListener("mouseup", onUp);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!editMode) return;
    e.preventDefault();
    setScale((s) => Math.max(0.5, Math.min(5.0, s + (e.deltaY > 0 ? -0.05 : 0.05))));
  }, [editMode]);

  useEffect(() => { posRef.current = { x: posX, y: posY, s: scale }; }, [posX, posY, scale]);
  useEffect(() => { if (!editMode || !loaded) return; const t = setTimeout(() => save(posX, posY, scale), 800); return () => clearTimeout(t); }, [posX, posY, scale, editMode, loaded]);

  return (
    <div ref={containerRef} className={className} style={{
      cursor: editMode ? "grab" : undefined, overflow: "hidden",
      userSelect: editMode ? "none" : undefined, touchAction: editMode ? "none" : undefined,
      ...(editMode && { outline: "2px dashed rgba(0,240,255,0.6)", outlineOffset: "-2px" }),
    }} onWheel={handleWheel} onMouseDown={editMode ? handleMouseDown : undefined}>
      <div ref={bgRef} style={{
        width: "100%", height: "100%",
        backgroundImage: `url(${src})`,
        backgroundSize: `${100 * scale}%`,
        backgroundPosition: `${posX} ${posY}`,
        backgroundRepeat: "no-repeat",
        ...imgStyle,
      }}/>
      {editMode && (
        <div style={{ position: "absolute", top: 4, right: 4, zIndex: 60, pointerEvents: "none" }}>
          <span style={{ background: "rgba(0,0,0,0.7)", padding: "2px 5px", fontFamily: "monospace", fontSize: "9px", color: "#00f0ff", borderRadius: 2 }}>
            x:{posX} y:{posY} s:{scale.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
