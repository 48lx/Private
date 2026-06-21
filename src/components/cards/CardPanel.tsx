"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ALL_CARDS, CardDef, RARITY_LABELS, RARITY_COLORS, drawMulti, MERGE_CHAIN, UPGRADE_GROUPS, UPGRADE_NAMES, MERGE_VIDEOS, CARD_WEIGHT_BY_RARITY, decomposeValue } from "@/lib/cards";
import { getGroupKey, setGroupKey, getTokens, spendTokens, getCollection, addCardsBulk, mergeCards4to1, MERGE_RATES, decomposeCard } from "@/lib/card-storage";
import { checkFirstLogin, checkMergeFailed, checkGemCard, checkFreljordComplete, checkRevelation, syncUnlocked, checkReturnAfterAbsence, checkHellRed, checkHellGold } from "@/lib/achievement-checker";
import { checkDailyCheckin } from "@/lib/card-storage";

export default function CardPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [groupKey, setGroupKeyLocal] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [collection, setCollection] = useState<{ card_id: string; count: number }[]>([]);
  const [filter, setFilter] = useState<"all" | "white" | "blue" | "gold" | "ultimate" | "special">("all");
  const [drawing, setDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<CardDef[] | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [mergeCardId, setMergeCardId] = useState<string | null>(null);
  const [mergeVideo, setMergeVideo] = useState(false);
  const [toast, setToast] = useState<{ text: string; color: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = getGroupKey();
    if (key) { setGroupKeyLocal(key); loadData(key); setLoggedIn(true); }
    // 监听外部奖励刷新事件
    const onReload = () => { if (key) loadData(key); };
    window.addEventListener("card-reload", onReload);
    return () => window.removeEventListener("card-reload", onReload);
  }, []);

  const loadData = async (key: string) => {
    const t = await getTokens(key);
    const c = await getCollection(key);
    setTokens(t); setCollection(c);
    // 成就检查
    checkFreljordComplete(key, c);
    checkRevelation(key, c);
  };

  const handleLogin = async () => {
    if (!groupKey.trim()) return;
    setGroupKey(groupKey.trim()); setLoggedIn(true);
    await loadData(groupKey.trim());
    await syncUnlocked(groupKey.trim());
    // 成就
    const r = await checkFirstLogin(groupKey.trim());
    if (r?.success) { showToast(`🏆 成就解锁！${r.achName}`, "#ffd700"); await loadData(groupKey.trim()); }
  };
  const handleLogout = () => {
    try { localStorage.removeItem("card-group"); } catch {}
    setLoggedIn(false); setGroupKeyLocal(""); setTokens(0); setCollection([]);
  };

  const handleDraw = async (count: number) => {
    if (!loggedIn || drawing) return;
    const ok = await spendTokens(groupKey, count*100);
    if (!ok) { alert("代币不足！"); return; }
    setDrawing(true);
    const cards = drawMulti(count);
    // 批量写入——一次网络请求搞定
    await addCardsBulk(groupKey, cards.map(c => c.id));
    // 成就检查
    const gemCard = cards.find(c => c.type === "gem");
    if (gemCard) { const gr = await checkGemCard(groupKey, gemCard.id); if (gr?.success) showToast(`🏆 成就解锁！${gr.achName}`, "#ffd700"); }
    setDrawResult(cards);
    await loadData(groupKey);
    setDrawing(false);
  };

  const doDecompose = async (cardId: string, count: number) => {
    if (count <= 1) { alert("只剩1张，不可分解"); return; }
    const decomposeAll = count - 1; // 保留1张
    const refund = decomposeValue(cardId) * decomposeAll;
    if (!confirm(`分解 ${decomposeAll} 张（保留1张），返还 ${refund} 币？`)) return;
    await decomposeCard(groupKey, cardId, decomposeAll, refund);
    await loadData(groupKey);
  };

  // 使用特殊卡效果
  const useSpecialCard = async (cardId: string) => {
    const card = ALL_CARDS.find(c => c.id === cardId);
    if (!card) return;
    // 妮蔻之助：自选同稀有度任意卡
    if (cardId.startsWith("mimic-")) {
      const rarity = card.rarity === "ultimate" ? "ultimate" : card.rarity;
      const pool = ALL_CARDS.filter(c => c.rarity === rarity && !c.id.startsWith("mimic-"));
      const name = prompt(`妮蔻之助·${RARITY_LABELS[rarity]}\n输入要兑换的英雄名：`);
      if (!name) return;
      const target = pool.find(c => c.name === name || c.id.includes(name));
      if (!target) { alert("未找到该卡"); return; }
      await decomposeCard(groupKey, cardId, 1, 0); // 消耗百变卡
      await addCardsBulk(groupKey, [target.id]);
      showToast(`✅ 获得 ${target.name}`, "#00ff88");
      await loadData(groupKey);
    }
    // 崔斯特的赌约
    else if (cardId === "twisted-gamble") {
      if (!confirm("崔斯特的赌约\n红=-200币(30%) 蓝=随机蓝卡(60%) 金=妮蔻之助·金(10%)\n确认抽牌？")) return;
      const roll = Math.random();
      await decomposeCard(groupKey, cardId, 1, 0);
      if (roll < 0.3) { // 红 30%
        await spendTokens(groupKey, 200);
        checkHellRed(groupKey); showToast("💔 红牌！-200币", "#ff3355");
      } else if (roll < 0.9) { // 蓝 60%
        const bluePool = ALL_CARDS.filter(c => c.rarity === "blue" && !c.id.startsWith("mimic-"));
        const picked = bluePool[Math.floor(Math.random() * bluePool.length)];
        await addCardsBulk(groupKey, [picked.id]);
        showToast(`💙 蓝牌！获得 ${picked.name}`, "#4da8da");
      } else { // 金 10%
        await addCardsBulk(groupKey, ["mimic-gold"]);
        checkHellGold(groupKey); showToast("💛 金牌！获得妮蔻之助·金", "#ffd700");
      }
      await loadData(groupKey);
    }
    // 孤立无援：从未拥有卡中单抽
    else if (cardId === "lonely-pull") {
      const owned = new Set(collection.map(c => c.card_id));
      const missing = ALL_CARDS.filter(c => !owned.has(c.id));
      if (missing.length === 0) { alert("图鉴已全！"); return; }
      // 按权重抽
      const totalW = missing.reduce((s, c) => s + CARD_WEIGHT_BY_RARITY[c.rarity], 0);
      let r = Math.random() * totalW;
      let picked = missing[0];
      for (const c of missing) { r -= CARD_WEIGHT_BY_RARITY[c.rarity]; if (r <= 0) { picked = c; break; } }
      await decomposeCard(groupKey, cardId, 1, 0);
      await addCardsBulk(groupKey, [picked.id]);
      showToast(`🔍 获得 ${picked.name} (${RARITY_LABELS[picked.rarity]})`, "#00ff88");
      await loadData(groupKey);
    }
  };

  const doDecomposeAll = async () => {
    const toDecompose: { id: string; count: number; refund: number }[] = [];
    for (const [id, count] of collectionMap) {
      if (count <= 1) continue;
      // 跳过所有可升级卡（螳螂/剑魔/GEM/2077全链）
      const card = ALL_CARDS.find(c => c.id === id);
      if (card?.upgradable) continue;
      toDecompose.push({ id, count: count - 1, refund: decomposeValue(id) * (count - 1) });
    }
    if (toDecompose.length === 0) { alert("没有可分解的卡牌"); return; }
    const totalRefund = toDecompose.reduce((s, t) => s + t.refund, 0);
    if (!confirm(`一键分解 ${toDecompose.length} 种卡（共 ${totalRefund} 币）？`)) return;
    // 并发分解
    await Promise.all(toDecompose.map(t => decomposeCard(groupKey, t.id, t.count, t.refund)));
    await loadData(groupKey);
    showToast(`分解完成，获得 ${totalRefund} 币`, "#ffd700");
  };

  const [mergeAnim, setMergeAnim] = useState<"success" | "fail" | null>(null);

  const doMerge = async (fromId: string, toId: string, rateKey: string) => {
    setMergeAnim(null);
    setMergeVideo(true);
    const result = await mergeCards4to1(groupKey, fromId, toId, rateKey);
    if (!result.success && result.lost === 0) { alert("卡牌不足（需要4张）"); setMergeVideo(false); return; }
    await loadData(groupKey);
    if (result.success) {
      const nextCard = ALL_CARDS.find(c => c.id === result.toCardId);
      showToast(`合成成功！获得 ${nextCard?.name || ""}`, "#00ff88");
    } else {
      showToast("合成失败 · 保留1张", "#ff3355");
      const r = await checkMergeFailed(groupKey);
      if (r?.success) { showToast(`🏆 成就解锁！${r.achName}`, "#ffd700"); await loadData(groupKey); }
    }
  };

  const showToast = (text: string, color: string) => {
    setToast({ text, color });
    setTimeout(() => setToast(null), 2000);
  };

  // 获取指定卡的下一个合成目标（使用 MERGE_CHAIN 查找）
  const getMergeTarget = (cardId: string): CardDef | null => {
    const nextId = MERGE_CHAIN[cardId];
    if (!nextId) return null;
    return ALL_CARDS.find(c => c.id === nextId) || null;
  };

  const isSpecial = (id: string) => id.startsWith("mimic-") || id === "twisted-gamble" || id === "lonely-pull";
  const filteredCards = ALL_CARDS.filter(c => {
    if (filter === "all") return true;
    if (filter === "special") return isSpecial(c.id);
    return c.rarity === filter;
  });
  const collectionMap = new Map(collection.map(c => [c.card_id, c.count]));

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) return;
    if (isOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, display: "flex" });
      gsap.fromTo(panelRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.3)" });
    } else {
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: () => { if (overlayRef.current) overlayRef.current.style.display = "none"; } });
    }
  }, [isOpen]);

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className="fixed top-6 right-20 z-40 w-12 h-12 flex items-center justify-center transition-all duration-300 group"
        style={{ background: "rgba(13,13,36,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,215,0,0.3)" }}
        title="卡牌图鉴">
        <span className="font-mono text-lg text-cyber-text-dim group-hover:text-cyber-gold transition-colors">🃏</span>
      </button>

      <div ref={overlayRef} className="fixed inset-0 z-[80] items-center justify-center"
        style={{ display: "none", background: "rgba(8,4,28,0.85)", backdropFilter: "blur(4px)" }}
        onClick={e => { if (e.target === overlayRef.current) setIsOpen(false); }}>
        <div ref={panelRef} className="relative glass-cyber border flex flex-col"
          style={{ width: "min(1200px, 95vw)", height: "min(900px, 85vh)", borderColor: "rgba(180,140,255,0.2)", overflow: "visible", boxShadow: "0 0 80px rgba(120,40,220,0.2), 0 0 200px rgba(0,180,255,0.08), inset 0 0 40px rgba(120,40,220,0.04)" }}>

          {/* Floating side buttons — left edge */}
          {loggedIn && (
            <div className="absolute top-1/3 flex flex-col gap-3 z-50" style={{ left: "-50px" }}>
              <button onClick={async () => { const c = await checkDailyCheckin(groupKey); if (c) { showToast(`📅 获得 ${ALL_CARDS.find(x=>x.id===c)?.name||c}`, "#4da8da"); await loadData(groupKey); } else { alert("今日已签到"); } }}
                className="font-mono text-sm border cursor-pointer transition-all hover:-translate-x-4"
                style={{ writingMode: "vertical-rl", color: "rgba(0,200,255,0.8)", borderColor: "rgba(0,200,255,0.3)", background: "rgba(8,4,28,0.95)", borderRadius: "6px 0 0 6px", width: "48px", padding: "16px 10px", textAlign: "center", letterSpacing: "0.3em", boxShadow: "0 0 10px rgba(0,200,255,0.1)" }}>
                📅签到
              </button>
              <button onClick={doDecomposeAll}
                className="font-mono text-sm border cursor-pointer transition-all hover:-translate-x-4"
                style={{ writingMode: "vertical-rl", color: "rgba(255,80,120,0.8)", borderColor: "rgba(255,80,120,0.3)", background: "rgba(8,4,28,0.95)", borderRadius: "6px 0 0 6px", width: "48px", padding: "16px 10px", textAlign: "center", letterSpacing: "0.3em", boxShadow: "0 0 10px rgba(255,80,120,0.08)" }}>
                一键分解
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(180,140,255,0.15)", background: "rgba(120,40,220,0.06)" }}>
            <div className="flex items-center gap-3">
              <h3 className="font-heading text-sm tracking-[0.2em] neon-gold" style={{ color: "#ffd700" }}>🃏 卡牌图鉴</h3>
              {loggedIn && <span className="font-mono text-xs px-2 py-0.5 border" style={{ color: "rgba(200,200,208,0.4)", borderColor: "rgba(200,200,208,0.12)" }}>{groupKey}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm" style={{ color: "#ffd700" }}>🪙 {tokens}</span>
              {loggedIn && <button onClick={handleLogout} className="font-mono text-[10px] px-2 py-1 border" style={{ color: "rgba(200,200,208,0.3)", borderColor: "rgba(200,200,208,0.1)" }}>换号</button>}
              <button onClick={() => setIsOpen(false)} className="font-mono text-lg" style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
            </div>
          </div>

          {!loggedIn ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="font-mono text-sm mb-4" style={{ color: "rgba(200,200,208,0.4)" }}>输入暗号绑定存档</p>
                <input type="text" value={groupKey} onChange={e => setGroupKeyLocal(e.target.value)} placeholder="暗号（任意字符）" onKeyDown={e => e.key === "Enter" && handleLogin()}
                  className="px-4 py-2 font-mono text-sm border text-center mb-3"
                  style={{ width: "280px", background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,215,0,0.2)", color: "#ffd700", borderRadius: 2 }}/>
                <br/>
                <button onClick={handleLogin} className="font-heading text-sm px-8 py-2 tracking-[0.15em]"
                  style={{ border: "1px solid rgba(255,215,0,0.3)", color: "#ffd700", background: "rgba(255,215,0,0.06)" }}>进入图鉴</button>
              </div>
            </div>
          ) : (
            <>
              {/* Filter */}
              <div className="flex border-b" style={{ borderColor: "rgba(180,140,255,0.1)" }}>
                {(["all", "white", "blue", "gold", "ultimate", "special"] as const).map(r =>
                  <button key={r} onClick={() => setFilter(r)} className="flex-1 py-2.5 font-mono text-xs transition-colors"
                    style={{ color: filter === r ? RARITY_COLORS[r] : "rgba(200,200,208,0.3)", borderBottom: filter === r ? `2px solid ${RARITY_COLORS[r]}` : "2px solid transparent" }}>
                    {r === "all" ? "全部" : RARITY_LABELS[r]}
                  </button>
                )}
              </div>

              {/* Collection */}
              <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin", overflowX: "hidden" }}>
                <div className="grid grid-cols-5 gap-3">
                  {filteredCards.map(card => {
                    const have = collectionMap.get(card.id) || 0;
                    const isUpgradable = card.upgradable && card.upgradableGroup;
                    const isFunctional = card.id.startsWith("mimic-") || card.id === "twisted-gamble" || card.id === "lonely-pull";
                    const canPreview = card.imageFile && !isUpgradable;
                    return (
                      <div key={card.id} className="relative text-center p-2 border transition-all group hover:scale-105"
                        style={{
                          borderColor: have > 0 ? RARITY_COLORS[card.rarity] : "rgba(180,160,255,0.15)",
                          background: have > 0
                            ? `${RARITY_COLORS[card.rarity]}15`
                            : "rgba(160,140,255,0.03)",
                          opacity: have > 0 ? 1 : 0.55,
                          minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "center",
                          cursor: (isFunctional && have > 0) || isUpgradable || canPreview ? "pointer" : "default",
                          boxShadow: have > 0 ? `0 0 12px ${RARITY_COLORS[card.rarity]}22` : "none",
                        }}
                        onClick={() => {
                          if (isFunctional && have > 0) {
                            useSpecialCard(card.id);
                          } else if (isUpgradable) {
                            setMergeTarget(card.upgradableGroup!); setMergeCardId(card.id);
                          } else if (canPreview) {
                            setImagePreview(`/cards/${card.imageFile}`);
                          }
                        }}>
                        {card.imageFile && (
                          <div className="w-full mb-1.5" style={{ aspectRatio: "5/7", overflow: "hidden", borderRadius: "2px" }}>
                            <img src={`/cards/${card.imageFile}`} alt="" className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                          </div>
                        )}
                        <p className="font-mono text-base font-bold truncate"
                          style={{
                            color: have > 0 ? RARITY_COLORS[card.rarity] : "rgba(210,200,240,0.55)",
                            textShadow: have > 0 ? `0 0 6px ${RARITY_COLORS[card.rarity]}44` : "none",
                          }}>{card.name}</p>
                        {!card.imageFile && <p className="font-mono text-[10px] mt-0.5" style={{ color: "rgba(200,200,220,0.35)" }}>{RARITY_LABELS[card.rarity]}{card.upgradable ? " 🔄" : ""}</p>}
                        {have > 0 && <p className="font-mono text-xs absolute top-0.5 right-1.5 font-bold" style={{ color: RARITY_COLORS[card.rarity], textShadow: `0 0 4px ${RARITY_COLORS[card.rarity]}66` }}>×{have}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Draw */}
              <div className="p-4 border-t flex gap-3" style={{ borderColor: "rgba(180,140,255,0.12)", background: "rgba(120,40,220,0.03)" }}>
                {drawing ? (
                  <div className="flex-1 flex items-center justify-center gap-3 py-4">
                    <span className="font-mono text-sm animate-pulse" style={{ color: "#ffd700" }}>抽取中...</span>
                    <span className="animate-spin text-xl">🃏</span>
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleDraw(1)} disabled={tokens < 100}
                      className="flex-1 py-3 font-mono text-sm border transition-all disabled:opacity-20 cursor-pointer hover:scale-105"
                      style={{ borderColor: "rgba(255,215,0,0.2)", color: "#ffd700", background: "rgba(255,215,0,0.04)" }}>单抽 🪙100</button>
                    <button onClick={() => handleDraw(10)} disabled={tokens < 1000}
                      className="flex-1 py-3 font-mono text-sm border transition-all disabled:opacity-20 cursor-pointer hover:scale-105"
                      style={{ borderColor: "rgba(255,215,0,0.3)", color: "#ffd700", background: "rgba(255,215,0,0.08)" }}>十连 🪙1000</button>
                    <button onClick={() => handleDraw(100)} disabled={tokens < 10000}
                      className="flex-1 py-3 font-mono text-sm border transition-all disabled:opacity-20 cursor-pointer hover:scale-105"
                      style={{ borderColor: "rgba(255,107,255,0.3)", color: "#ff6bff", background: "rgba(255,107,255,0.06)" }}>
                      百连 🪙10000
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Merge popup */}
        {mergeTarget && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ background: "rgba(8,4,28,0.9)", backdropFilter: "blur(4px)" }}
            onClick={() => setMergeTarget(null)}>
            <div className="p-8 border" style={{ width: "700px", background: "rgba(16,8,40,0.98)", borderColor: "rgba(180,140,255,0.2)", boxShadow: "0 0 60px rgba(120,40,220,0.2)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading text-lg tracking-[0.2em] neon-gold" style={{ color: "#ffd700" }}>
                  ⬆ {UPGRADE_NAMES[mergeTarget]} · 四合一
                </h3>
                <button onClick={() => { setMergeTarget(null); setMergeCardId(null); setMergeVideo(false); setMergeAnim(null); }} className="font-mono text-xl" style={{ color: "rgba(200,200,208,0.3)" }}>✕</button>
              </div>
              {mergeCardId && (() => {
                const card = ALL_CARDS.find(c => c.id === mergeCardId);
                if (!card) return <p className="font-mono text-sm" style={{ color: "rgba(200,200,208,0.3)" }}>卡牌不存在</p>;
                const nextCard = getMergeTarget(mergeCardId);
                const count = collectionMap.get(card.id) || 0;
                if (!nextCard) {
                  return <p className="font-mono text-lg text-center" style={{ color: RARITY_COLORS[card.rarity] }}>已是最高级 · ×{count}</p>;
                }
                const rateKey = `${card.rarity}->${nextCard.rarity}`;
                const rate = MERGE_RATES[rateKey] ?? 100;
                return (
                  <div className="flex items-center justify-between p-5 border"
                    style={{ borderColor: RARITY_COLORS[card.rarity], background: `${RARITY_COLORS[card.rarity]}08` }}>
                    <div>
                      <p className="font-mono text-xl" style={{ color: RARITY_COLORS[card.rarity] }}>{card.name}</p>
                      <p className="font-mono text-base mt-1" style={{ color: RARITY_COLORS[card.rarity] }}>
                        {RARITY_LABELS[card.rarity]} → {RARITY_LABELS[nextCard.rarity]} · 成功率 {rate}%
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-2xl" style={{ color: RARITY_COLORS[card.rarity] }}>×{count}</span>
                      <button onClick={() => doMerge(card.id, nextCard.id, rateKey)}
                        disabled={count < 4}
                        className="font-mono text-base px-6 py-3 border transition-all disabled:opacity-15 cursor-pointer hover:scale-105"
                        style={{
                          borderColor: RARITY_COLORS[nextCard.rarity],
                          color: count >= 4 ? RARITY_COLORS[nextCard.rarity] : "rgba(200,200,208,0.2)",
                          background: count >= 4 ? `${RARITY_COLORS[nextCard.rarity]}11` : "transparent",
                        }}>
                        {count >= 4 ? `合成(${rate}%)` : `${count}/4`}
                      </button>
                    </div>
                  </div>
                );
              })()}
              {mergeVideo && MERGE_VIDEOS[mergeTarget] && (
                <div className="mt-6 rounded overflow-hidden" style={{ width: "100%", maxHeight: "400px" }}>
                  <video src={MERGE_VIDEOS[mergeTarget]} autoPlay playsInline
                    style={{ width: "100%", maxHeight: "400px", objectFit: "contain" }}/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image preview modal */}
        {imagePreview && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center"
            style={{ background: "rgba(4,2,18,0.92)", backdropFilter: "blur(8px)", cursor: "pointer" }}
            onClick={() => setImagePreview(null)}>
            <img src={imagePreview} alt="卡片原图"
              className="max-w-[85vw] max-h-[88vh] object-contain rounded"
              style={{ boxShadow: "0 0 80px rgba(120,40,220,0.3), 0 0 200px rgba(0,180,255,0.12)" }}
              onClick={e => e.stopPropagation()}/>
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-bounce"
            style={{
              padding: "10px 20px",
              background: "rgba(13,13,36,0.95)",
              border: `1px solid ${toast.color}33`,
              color: toast.color,
              fontFamily: "var(--font-heading), sans-serif",
              fontSize: "14px",
              letterSpacing: "0.1em",
              textShadow: `0 0 10px ${toast.color}44`,
              borderRadius: "4px",
            }}>
            {toast.text}
          </div>
        )}

        {/* Draw result */}
        {drawResult && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" style={{ background: "rgba(8,4,28,0.95)", backdropFilter: "blur(4px)" }} onClick={() => setDrawResult(null)}>
            <p className="font-heading text-base mb-4 tracking-[0.2em]" style={{ color: "#ffd700", textShadow: "0 0 10px rgba(255,215,0,0.4)" }}>抽卡结果</p>
            <div className="grid grid-cols-5 gap-3 max-h-[65vh] overflow-y-auto p-3">
              {drawResult.map((c, i) => (
                <div key={i} className="text-center p-2 border"
                  style={{ borderColor: RARITY_COLORS[c.rarity], background: `${RARITY_COLORS[c.rarity]}14`, boxShadow: `0 0 10px ${RARITY_COLORS[c.rarity]}18` }}>
                  {c.imageFile && (
                    <div className="w-full mb-1" style={{ aspectRatio: "5/7", overflow: "hidden", borderRadius: "2px" }}>
                      <img src={`/cards/${c.imageFile}`} alt="" className="w-full h-full object-cover"/>
                    </div>
                  )}
                  <p className="font-mono text-sm font-bold" style={{ color: RARITY_COLORS[c.rarity] }}>{c.name}</p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: RARITY_COLORS[c.rarity] }}>{RARITY_LABELS[c.rarity]}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setDrawResult(null)} className="mt-4 font-mono text-sm px-6 py-2 border transition-all hover:scale-105" style={{ borderColor: "rgba(255,215,0,0.4)", color: "#ffd700", background: "rgba(255,215,0,0.06)" }}>确认</button>
          </div>
        )}
      </div>
    </>
  );
}
