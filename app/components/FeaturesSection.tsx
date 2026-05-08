"use client";

import { useEffect, useRef } from "react";

const CARDS = [
  { pos: { top: "22%", left: "2%",   right: "auto" }, num: "01", status: "CRITICAL",     accent: "#E63946", delay: 0.15, title: "NO VISIBILITY\nAT RUNTIME",              body: "Your agent runs as a black box once deployed. You have no way to see what it's actually doing during each run." },
  { pos: { top: "58%", left: "2%",   right: "auto" }, num: "02", status: "HIGH",         accent: "#F5A623", delay: 0.35, title: "NO WAY\nTO STOP IT",                     body: "Alerts come too late. By the time anyone investigates, the damage is already done. There's no enforcement layer." },
  { pos: { top: "22%", left: "auto", right: "2%"   }, num: "03", status: "CRITICAL",     accent: "#E63946", delay: 0.25, title: "NO AUDIT\nTRAIL",                         body: "Your CISO, auditor, or enterprise client asks for proof. You have no session reports. Nothing to show." },
  { pos: { top: "58%", left: "auto", right: "2%"   }, num: "04", status: "SUPPLY CHAIN", accent: "#4D9FFF", delay: 0.45, title: "NO CONTROL OVER\nWHAT IT WAS BUILT WITH", body: "You received the agent from a contractor or agency. You don't know every dependency it pulls in, every API it calls, or every capability it was given." },
] as const;

function HudBrackets({ color, size = 14 }: { color: string; size?: number }) {
  const b = (s: React.CSSProperties) => <div style={{ position: "absolute", background: color, ...s }} />;
  return (
    <>
      {b({ top: 0, left: 0,  width: size, height: 1 })} {b({ top: 0, left: 0,  width: 1, height: size })}
      {b({ top: 0, right: 0, width: size, height: 1 })} {b({ top: 0, right: 0, width: 1, height: size })}
      {b({ bottom: 0, left: 0,  width: size, height: 1 })} {b({ bottom: 0, left: 0,  width: 1, height: size })}
      {b({ bottom: 0, right: 0, width: size, height: 1 })} {b({ bottom: 0, right: 0, width: 1, height: size })}
    </>
  );
}

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const allRefs    = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        allRefs.current.forEach((el) => {
          if (el) el.style.animationPlayState = "running";
        });
        observer.disconnect();
      },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const reg = (el: HTMLElement | null, i: number) => { allRefs.current[i] = el; };

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{
        minHeight: "100vh", position: "relative", overflow: "hidden",
        background: `
          radial-gradient(ellipse 80% 60% at 50% 0%,   rgba(0,102,255,.06)  0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 80%,  rgba(0,102,255,.06)  0%, transparent 55%),
          linear-gradient(180deg, #060810 0%, #0A0F1E 50%, #060810 100%)
        `,
      }}
    >
      {/* Grid */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(0,102,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,102,255,.03) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(0,102,255,.35) 30%,rgba(0,102,255,.35) 70%,transparent)" }} />

      {/* ── Heading ─────────────────────────────────────────── */}
      <div
        ref={(el) => reg(el, 10)}
        style={{ position: "absolute", top: "5%", left: 0, right: 0, textAlign: "center", zIndex: 2, animation: "heading-reveal 0.9s cubic-bezier(0.16,1,0.3,1) 0s forwards", animationPlayState: "paused" } as React.CSSProperties}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ height: 1, width: 56, background: "rgba(230,57,70,.45)" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.44em", color: "#E63946", textTransform: "uppercase", opacity: .8 }}>SOUND FAMILIAR?</span>
          <div style={{ height: 1, width: 56, background: "rgba(230,57,70,.45)" }} />
        </div>
        <h2 style={{ fontFamily: "var(--font-space)", fontWeight: 700, fontSize: "clamp(32px,5vw,72px)", letterSpacing: "-0.03em", textTransform: "uppercase", color: "var(--cream)", lineHeight: 1.05 }}>
          YOU DEPLOYED AN AI AGENT.
          <span style={{ display: "block", color: "#E63946" }}>NOW WHAT?</span>
        </h2>
      </div>

      {/* ── Targeting ring (single, subtle) ─────────────────── */}
      <div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%,-50%)", width: 320, height: 320, pointerEvents: "none", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(0,102,255,.08)", animation: "spin-cw 40s linear infinite" }} />
      </div>

      {/* ── Cards ───────────────────────────────────────────── */}
      {CARDS.map((card, i) => (
        <div
          key={card.num}
          ref={(el) => reg(el, i)}
          style={{
            position: "absolute", top: card.pos.top, left: card.pos.left, right: card.pos.right,
            width: "30%", height: "34%",
            background: "rgba(15,22,40,.92)", backdropFilter: "blur(12px)",
            border: "1px solid var(--border-primary)",
            padding: "28px 28px 24px", display: "flex", flexDirection: "column", overflow: "hidden",
            animation: `card-reveal 0.85s cubic-bezier(0.16,1,0.3,1) ${card.delay}s forwards`,
            animationPlayState: "paused",
          }}
        >
          <HudBrackets color={card.accent} size={14} />

          {/* Status badge */}
          <div style={{ position: "absolute", top: 12, right: 18, display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.28em", color: card.accent }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: card.accent, animation: `dot-blink ${1.2 + i * 0.2}s ease infinite` }} />
            {card.status}
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.34em", color: card.accent, marginBottom: 16, opacity: .8 }}>{card.num}</div>

          <h3 style={{ fontFamily: "var(--font-space)", fontWeight: 700, fontSize: "clamp(14px,1.2vw,18px)", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--cream)", marginBottom: 12, lineHeight: 1.2, whiteSpace: "pre-line" }}>
            {card.title}
          </h3>

          <p style={{ fontFamily: "var(--font-space)", fontSize: "clamp(11px,0.85vw,13px)", color: "var(--text-secondary)", lineHeight: 1.75, flex: 1 }}>
            {card.body}
          </p>
        </div>
      ))}

      {/* ── Closing ─────────────────────────────────────────── */}
      <div
        ref={(el) => reg(el, 30)}
        style={{ position: "absolute", bottom: "4%", left: 0, right: 0, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.22em", lineHeight: 2, animation: "closing-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.65s forwards", animationPlayState: "paused" } as React.CSSProperties}
      >
        <div style={{ color: "var(--text-secondary)" }}>// THIS ISN&apos;T A FUTURE RISK.</div>
        <div style={{ color: "rgba(230,57,70,.7)" }}>IT&apos;S THE CURRENT STATE OF AI AGENT DEPLOYMENT — RIGHT NOW.</div>
      </div>
    </section>
  );
}
