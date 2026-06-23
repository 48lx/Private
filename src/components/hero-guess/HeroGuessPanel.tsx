"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import {
  champions, Champion, getPersonalDailyHero,
  compareGuess, GuessResult, MatchLevel, searchChampions,
} from "@/lib/lol-data";
import { checkWrongGuesses } from "@/lib/achievement-checker";
import { getGroupKey, getTokens, getProgress, setProgress, addTokens, addCard, spendTokens } from "@/lib/card-storage";
import { ALL_CARDS } from "@/lib/cards";

interface Props { isOpen: boolean; onClose: () => void; initialMode?: "standard" | "uzi"; }
const MAX_GUESSES = 4;
const UZI_MAX = 9;
const ALL_DIMS = ["gender","species","lanes","region","releaseYear","attackType","resourceType"];
const dimLabels: Record<string, string> = {
  gender: "性别", species: "种族", lanes: "分路", region: "地区",
  releaseYear: "年份", attackType: "攻击", resourceType: "消耗",
};

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export default function HeroGuessPanel({ isOpen, onClose, initialMode }: Props) {
  // 根据入口自动切换模式
  useEffect(() => {
    if (!isOpen) return;
    if (initialMode === "uzi" && !uziMode) enterUziMode();
    else if (initialMode === "standard" && uziMode) exitUziMode();
  }, [isOpen, initialMode]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Champion[]>([]);
  const [dailyHero, setDailyHero] = useState<Champion | null>(null);
  const [history, setHistory] = useState<{ champion: Champion; results: GuessResult[] }[]>([]);
  const [solved, setSolved] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // UZI mode
  const [uziMode, setUziMode] = useState(false);
  const [uziHero, setUziHero] = useState<Champion | null>(null);
  const [stains, setStains] = useState<string[]>([]);
  const [stainSnapshots, setStainSnapshots] = useState<string[][]>([]);
  const [uziGuessed, setUziGuessed] = useState<Set<string>>(new Set());
  const [tokenBalance, setTokenBalance] = useState(0);

  // 获取代币
  useEffect(() => {
    const gk = getGroupKey();
    if (gk) getTokens(gk).then(setTokenBalance);
  }, [isOpen, solved]);

  const answer = uziMode ? uziHero : dailyHero;
  const maxGuesses = uziMode ? UZI_MAX : MAX_GUESSES;

  useEffect(() => {
    setDailyHero(getPersonalDailyHero("nexus-2026"));
    // UZI answer: 基于日期+固定种子
    const uziDay = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const uziIdx = (uziDay * 7919 + 3457) % champions.length;
    setUziHero(champions[uziIdx]);
    const uziStains = pickRandom(ALL_DIMS, 5);
    setStains(uziStains);
  }, []);

  const enterUziMode = () => {
    setUziMode(true);
    const uziDay = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const uziIdx = (uziDay * 7919 + 3457) % champions.length;
    setUziHero(champions[uziIdx]);
    setHistory([]); setSolved(false); setUziGuessed(new Set());
    setStains(pickRandom(ALL_DIMS, 5)); setStainSnapshots([]);
  };
  const exitUziMode = () => {
    setUziMode(false);
    setHistory([]); setSolved(false); setRetryCount(0);
    setUziGuessed(new Set());
  };

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) return;
    if (isOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, display: "flex" });
      gsap.fromTo(panelRef.current, { scale: 0.85, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" });
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2,
        onComplete: () => { if (overlayRef.current) overlayRef.current.style.display = "none"; },
      });
    }
  }, [isOpen]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSuggestions(value.length >= 1 ? searchChampions(value).slice(0, 8) : []);
  }, []);

  const resetRound = async () => {
    if (!uziMode) {
      const gk = getGroupKey();
      if (gk) {
        const ok = await spendTokens(gk, 100);
        if (!ok) { alert("代币不足！需要100币重新猜测"); return; }
        setTokenBalance(b => b - 100);
      }
      setRetryCount(c => c + 1);
    }
    setHistory([]); setSolved(false);
    setQuery(""); setSuggestions([]);
    if (uziMode) {
      setUziGuessed(new Set());
      const s = pickRandom(ALL_DIMS, 5);
      setStains(s);
      setStainSnapshots([]);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const giveReward = async (mode: "standard" | "uzi") => {
    const gk = getGroupKey();
    if (!gk) return;
    const key = `guess-reward-${mode}-${today}`;
    const already = await getProgress(gk, key);
    if (already === "1") return; // 今日已领
    await setProgress(gk, key, "1");
    const amount = mode === "uzi" ? 2000 : 1000;
    await addTokens(gk, amount);
    const hero = mode === "uzi" ? uziHero : dailyHero;
    if (hero) {
      const cardId = `champ-${hero.id}`;
      await addCard(gk, cardId, 1);
      alert(`🎁 奖励到账！\n+${amount} 币\n+白卡 ${hero.name}`);
      window.dispatchEvent(new Event("card-reload"));
    } else {
      alert(`🎁 奖励到账！\n+${amount} 币`);
      window.dispatchEvent(new Event("card-reload"));
    }
  };

  // 保存/恢复答题进度（绑定暗号+日期）
  const progressKey = () => `${getGroupKey() || "anon"}-guess-${uziMode ? "uzi" : "std"}-${today}`;
  const saveProgress = (h: typeof history, s: boolean, snaps: string[][]) => {
    try { localStorage.setItem(progressKey(), JSON.stringify({ h, s, snaps })); } catch {}
  };
  const loadProgress = () => {
    try {
      const raw = localStorage.getItem(progressKey());
      if (raw) {
        const { h, s, snaps } = JSON.parse(raw);
        setHistory(h); setSolved(s);
        if (snaps) setStainSnapshots(snaps);
      }
    } catch {}
  };
  // 模式稳定后再加载进度
  useEffect(() => { if (isOpen) { const t = setTimeout(loadProgress, 50); return () => clearTimeout(t); } }, [isOpen, uziMode]);
  useEffect(() => { if (history.length > 0) saveProgress(history, solved, stainSnapshots); }, [history, solved, stainSnapshots]);

  const guessCount = history.length;

  const handleGuess = (champion: Champion) => {
    if (!answer || solved) return;
    if (uziMode && uziGuessed.has(champion.id)) return; // UZI: no repeats
    if (history.length >= maxGuesses) return;

    const results = compareGuess(champion, answer);
    const isCorrect = champion.id === answer.id;
    const newHistory = [...history, { champion, results }];
    setHistory(newHistory);
    setQuery(""); setSuggestions([]);

    if (uziMode) {
      setUziGuessed(prev => new Set(prev).add(champion.id));
      // 污渍数随猜测递减
      const stainCount = newHistory.length <= 1 ? 5 : newHistory.length <= 2 ? 4 : newHistory.length <= 4 ? 3 : newHistory.length <= 6 ? 2 : newHistory.length <= 8 ? 1 : 0;
      const fresh = pickRandom(ALL_DIMS, stainCount);
      setStains(fresh);
      setStainSnapshots(prev => [...prev, fresh]);
      if (isCorrect) giveReward("uzi"); if (isCorrect || newHistory.length >= UZI_MAX) setSolved(true); try { localStorage.setItem("hero-solved-uzi", new Date().toISOString().split("T")[0]); } catch {} try { const gk=getGroupKey(); window.dispatchEvent(new CustomEvent("orb-check",{detail:{groupKey:gk}})); } catch {}
    } else {
      const gk=getGroupKey();if(gk&&!isCorrect)checkWrongGuesses(gk);if(isCorrect) { giveReward("standard"); setSolved(true); } try { localStorage.setItem("hero-solved-standard", new Date().toISOString().split("T")[0]); } catch {} try { window.dispatchEvent(new CustomEvent("orb-check",{detail:{groupKey:gk}})); } catch {}
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const matchColor = (level: MatchLevel) => {
    if (level === "full") return { bg: "rgba(0,255,136,0.12)", border: "rgba(0,255,136,0.35)", text: "#00ff88", dot: "●" };
    if (level === "partial") return { bg: "rgba(255,215,0,0.12)", border: "rgba(255,215,0,0.35)", text: "#ffd700", dot: "◐" };
    return { bg: "rgba(255,51,85,0.1)", border: "rgba(255,51,85,0.25)", text: "#ff3355", dot: "○" };
  };

  const guessesLeft = maxGuesses - guessCount;
  const blocked = solved || guessCount >= maxGuesses;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[60] items-center justify-center" style={{ display: "none", background: "rgba(5,5,16,0.92)" }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div ref={panelRef} className="relative glass-cyber border overflow-hidden flex"
        style={{ width: "min(1200px, 96vw)", height: "88vh", borderColor: "rgba(0,240,255,0.2)", fontSize: "18px" }}>

        {/* LEFT: Hero Preview */}
        {showPreview && (
          <div className="shrink-0 overflow-y-auto border-r" style={{ width: "260px", borderColor: "rgba(0,240,255,0.08)", scrollbarWidth: "thin" }}>
            <div className="sticky top-0 p-2 border-b" style={{ background: "rgba(5,5,16,0.95)", borderColor: "rgba(0,240,255,0.08)" }}>
              <input type="text" placeholder="筛选（支持别名）..."
                className="w-full px-2 py-1.5 font-mono border focus:outline-none"
                style={{ fontSize: "14px", background: "rgba(255,255,255,0.03)", borderColor: "rgba(0,240,255,0.12)", color: "#c8c8d0", borderRadius: 2 }}
                onInput={e => {
                  const v = (e.target as HTMLInputElement).value;
                  const filtered = v ? searchChampions(v) : champions;
                  const ids = new Set(filtered.map(c => c.id));
                  document.querySelectorAll(".preview-item").forEach(el => {
                    const cid = el.getAttribute("data-cid");
                    (el as HTMLElement).style.display = (!v || (cid && ids.has(cid))) ? "" : "none";
                  });
                }}/>
            </div>
            {champions.map(c => (
              <button key={c.id} data-cid={c.id}
                className="preview-item w-full text-left px-3 py-1.5 flex items-center gap-2 border-b transition-colors"
                style={{ borderColor: "rgba(0,240,255,0.04)", color: uziMode && uziGuessed.has(c.id) ? "rgba(255,51,85,0.4)" : "rgba(200,200,208,0.5)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,240,255,0.06)"; e.currentTarget.style.color = "#c8c8d0"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = uziMode && uziGuessed.has(c.id) ? "rgba(255,51,85,0.4)" : "rgba(200,200,208,0.5)"; }}
                onClick={() => handleGuess(c)}>
                <img src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${c.id.charAt(0).toUpperCase() + c.id.slice(1)}.png`}
                  alt="" className="w-6 h-6 rounded-sm shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                <span className="font-mono truncate" style={{ fontSize: "14px" }}>{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* MAIN */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(0,240,255,0.08)", background: "rgba(0,240,255,0.03)" }}>
            <button onClick={() => setShowPreview(!showPreview)}
              className="font-heading tracking-[0.15em] transition-colors px-3 py-1.5 border"
              style={{
                fontSize: "16px", color: showPreview ? "#00f0ff" : "rgba(200,200,208,0.4)",
                borderColor: showPreview ? "rgba(0,240,255,0.3)" : "rgba(200,200,208,0.1)",
                background: showPreview ? "rgba(0,240,255,0.06)" : "transparent",
              }}>
              📋 英雄图鉴
            </button>
            <div className="flex items-center gap-3">
              {/* UZI mode toggle */}
              <button onClick={uziMode ? exitUziMode : enterUziMode}
                className="font-heading tracking-[0.1em] px-3 py-1.5 border transition-colors"
                style={{
                  fontSize: "14px",
                  color: uziMode ? "#ffd700" : "rgba(200,200,208,0.5)",
                  borderColor: uziMode ? "rgba(255,215,0,0.4)" : "rgba(200,200,208,0.15)",
                  background: uziMode ? "rgba(255,215,0,0.08)" : "transparent",
                  textShadow: uziMode ? "0 0 10px rgba(255,215,0,0.4)" : "none",
                }}>
                {uziMode ? "标准模式" : "污渍！永远的神！"}
              </button>
              <h2 className="font-heading tracking-[0.2em]" style={{ fontSize: "24px", color: "#ffd700", textShadow: "0 0 10px rgba(255,215,0,0.4)" }}>
                {solved ? "✦ 破解 ✦" : blocked ? (uziMode ? "挑战结束" : "次数用尽") : (uziMode ? "污渍！永远的神！" : "英雄猜谜")}
              </h2>
            </div>
            <button onClick={onClose} className="font-mono hover:opacity-80 px-2" style={{ fontSize: "22px", color: "rgba(200,200,208,0.3)" }}>✕</button>
          </div>

          {/* Search */}
          {!blocked && (
            <div className="px-5 py-3 border-b relative" style={{ borderColor: "rgba(0,240,255,0.06)" }}>
              <input type="text" value={query} onChange={e => handleQueryChange(e.target.value)}
                placeholder={`搜索英雄（${guessesLeft} 次机会${uziMode ? " · 不可重复" : ""}）`}
                className="w-full px-4 py-3 font-mono border focus:outline-none"
                style={{ fontSize: "18px", background: "rgba(255,255,255,0.03)", borderColor: "rgba(0,240,255,0.15)", color: "#c8c8d0", borderRadius: 2 }}
                autoFocus/>
              {suggestions.length > 0 && (
                <div className="absolute left-5 right-5 z-10" style={{ top: "calc(100% - 4px)", background: "rgba(13,13,36,0.98)", border: "1px solid rgba(0,240,255,0.2)", maxHeight: "280px", overflow: "auto" }}>
                  {suggestions.map(c => (
                    <button key={c.id} onClick={() => handleGuess(c)}
                      disabled={uziMode && uziGuessed.has(c.id)}
                      className="w-full text-left px-3 py-2.5 font-mono flex items-center gap-2 transition-colors disabled:opacity-20"
                      style={{ fontSize: "16px", color: "#c8c8d0" }}
                      onMouseEnter={e => { if (!(uziMode && uziGuessed.has(c.id))) (e.currentTarget.style.background = "rgba(0,240,255,0.08)"); }}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <img src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${c.id.charAt(0).toUpperCase() + c.id.slice(1)}.png`}
                        alt="" className="w-8 h-8 rounded-sm"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                      {c.name}
                      {uziMode && uziGuessed.has(c.id) && <span className="ml-auto text-xs" style={{ color: "#ff3355" }}>已猜</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between px-5 py-1.5 border-b" style={{ borderColor: "rgba(0,240,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
            <span className="font-mono" style={{ fontSize: "13px", color: "rgba(200,200,208,0.25)" }}>
              🪙 {tokenBalance} · {uziMode
                ? `污渍！永远的神！ · ${7 - stains.length} 维可见`
                : (blocked ? `今日第 ${retryCount + 1} 轮` : `剩余 ${guessesLeft} 次`)}
            </span>
          </div>

          {/* Guess history */}
          <div className="flex-1 overflow-y-auto px-5 py-3" style={{ scrollbarWidth: "thin" }}>
            {history.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-mono" style={{ fontSize: "16px", color: "rgba(200,200,208,0.15)" }}>搜索英雄开始猜测</p>
                <p className="font-mono mt-2" style={{ fontSize: "13px", color: "rgba(200,200,208,0.1)" }}>
                  {uziMode ? `${UZI_MAX} 次机会 · 不可重复 · 污渍逐次消退` : `每日谜底随机 · ${MAX_GUESSES} 次机会`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((guess, i) => {
                  const myStains = uziMode ? (stainSnapshots[i] || stains) : [];
                  const revealedDims = uziMode
                    ? ALL_DIMS.filter(d => !myStains.includes(d))
                    : ALL_DIMS;
                  const visibleResults = guess.results.filter(r => revealedDims.includes(r.dimension));
                  const hiddenCount = guess.results.length - visibleResults.length;

                  return (
                    <div key={i} className="p-3 border" style={{
                      borderColor: guess.champion.id === answer?.id ? "rgba(255,215,0,0.3)" : "rgba(0,240,255,0.06)",
                      background: guess.champion.id === answer?.id ? "rgba(255,215,0,0.05)" : "transparent",
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <img src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${guess.champion.id.charAt(0).toUpperCase() + guess.champion.id.slice(1)}.png`}
                          alt="" className="w-8 h-8 rounded-sm"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                        <span className="font-heading" style={{ fontSize: "20px", color: "#c8c8d0" }}>{guess.champion.name}</span>
                        {guess.champion.id === answer?.id && (
                          <span className="font-heading ml-auto tracking-[0.1em]" style={{ fontSize: "16px", color: "#ffd700", textShadow: "0 0 8px rgba(255,215,0,0.4)" }}>✦ 正确</span>
                        )}
                      </div>
                      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                        {guess.results.map(r => {
                          const isHidden = uziMode && myStains.includes(r.dimension);
                          if (isHidden) {
                            return (
                              <div key={r.dimension} className="text-center p-1.5 border relative group"
                                style={{ borderColor: "rgba(80,60,40,0.25)", background: "rgba(60,40,20,0.2)" }}>
                                <span style={{ fontSize: "18px", filter: "blur(2px)", opacity: 0.4 }}>🫧</span>
                                {!blocked && !solved && (
                                  <button onClick={async (e) => { e.stopPropagation(); const gk = getGroupKey(); if (!gk) return; const ok = await spendTokens(gk, 50); if (!ok) { alert("代币不足"); return; } setTokenBalance(b => b - 50); setStainSnapshots(prev => prev.map((s, si) => si === i ? s.filter(d => d !== r.dimension) : s)); }}
                                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 font-mono text-[8px] px-0.5 border cursor-pointer"
                                    style={{ color: "#ffd700", background: "rgba(0,0,0,0.8)", borderColor: "rgba(255,215,0,0.3)" }}>✕50</button>
                                )}
                              </div>
                            );
                          }
                          const c = matchColor(r.matchLevel);
                          return (
                            <div key={r.dimension} className="text-center p-1.5 border" style={{ borderColor: c.border, background: c.bg }}>
                              <p className="font-mono mb-0.5" style={{ fontSize: "12px", color: "rgba(200,200,208,0.35)" }}>{dimLabels[r.dimension] || r.label}</p>
                              <p className="font-mono" style={{ fontSize: "16px", color: c.text }}>{c.dot}</p>
                              <p className="font-mono mt-0.5 leading-tight" style={{ fontSize: "13px", color: c.text, opacity: 0.75 }}>{r.guessValue}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t flex items-center justify-center gap-4" style={{ borderColor: "rgba(0,240,255,0.06)" }}>
            {history.length > 0 && !uziMode && !solved && (
              <button onClick={resetRound}
                className="font-heading tracking-[0.15em] px-6 py-2.5 transition-all cursor-pointer hover:scale-105"
                style={{ fontSize: "17px", border: "1px solid rgba(0,240,255,0.3)", color: "#00f0ff", background: "rgba(0,240,255,0.06)" }}>
                ↻ 重新猜测 🪙100 ({retryCount + 1})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
