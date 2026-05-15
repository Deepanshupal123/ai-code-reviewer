import { useState, useCallback, useEffect, useRef } from "react";

const LANGUAGES = ["javascript", "python", "java", "typescript", "go", "rust", "cpp", "php", "ruby", "swift"];

const SEVERITY_CONFIG = {
  critical:   { color: "#ff3b5c", bg: "rgba(255,59,92,0.07)", border: "rgba(255,59,92,0.25)", glow: "rgba(255,59,92,0.3)", icon: "⬡", label: "Critical" },
  warning:    { color: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.3)", icon: "◈", label: "Warning" },
  suggestion: { color: "#6ee7f7", bg: "rgba(110,231,247,0.05)", border: "rgba(110,231,247,0.2)", glow: "rgba(110,231,247,0.2)", icon: "◆", label: "Tip" },
};

const LANG_ICONS = {
  javascript: "JS", python: "PY", java: "JV", typescript: "TS",
  go: "GO", rust: "RS", cpp: "C+", php: "PHP", ruby: "RB", swift: "SW"
};

const SAMPLE_CODE = `function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  const result = db.execute(query);
  
  var userData = result[0];
  if (userData != null) {
    console.log("User found: " + userData.password);
    return userData;
  }
}`;

const ParticleField = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: "50%",
          background: `rgba(${Math.random() > 0.5 ? "120,100,255" : "0,220,255"},${p.opacity})`,
          animation: `float ${p.duration}s ${p.delay}s infinite ease-in-out alternate`,
        }} />
      ))}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(88,60,230,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 60% at 80% 80%, rgba(0,200,255,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 50% 50%, rgba(255,30,80,0.04) 0%, transparent 70%)
        `
      }} />
    </div>
  );
};

const HexGrid = () => (
  <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0, opacity: 0.03 }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hex" width="60" height="52" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,17 58,35 30,50 2,35 2,17" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  </div>
);

const ScoreRing = ({ score, color }) => {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 10);
  return (
    <div style={{ position: "relative", width: 90, height: 90 }}>
      <svg width="90" height="90" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginTop: 2 }}>SCORE</span>
      </div>
    </div>
  );
};

const StatPill = ({ count, label, color, bg, border }) => (
  count > 0 ? (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
      background: bg, border: `1px solid ${border}`, borderRadius: 20,
      fontSize: 11, color, fontWeight: 600, letterSpacing: "0.04em"
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0,
        boxShadow: `0 0 6px ${color}` }} />
      {count} {label}
    </div>
  ) : null
);

const LanguageBadge = ({ lang }) => (
  <div style={{
    width: 28, height: 28, borderRadius: 6, fontSize: 9,
    background: "rgba(120,100,255,0.15)", border: "1px solid rgba(120,100,255,0.3)",
    color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, letterSpacing: "0.02em"
  }}>
    {LANG_ICONS[lang] || lang.slice(0, 2).toUpperCase()}
  </div>
);

export default function App() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState("javascript");
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("issues");
  const [copied, setCopied] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [hoveredIssue, setHoveredIssue] = useState(null);

  useEffect(() => {
    if (loading) {
      const id = setInterval(() => setScanLine(p => (p + 3) % 100), 30);
      return () => clearInterval(id);
    }
  }, [loading]);

  const reviewCode = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true); setError(null); setReview(null);
    try {
      const res = await fetch("https://ai-code-reviewer-sdtc.onrender.com/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) throw new Error("Server error");
      setReview(await res.json());
      setActiveTab("issues");
    } catch {
      setError("Could not connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }, [code, language]);

  const copyCode = () => {
    navigator.clipboard.writeText(review?.refactoredSnippet || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = s => s >= 8 ? "#00e5a0" : s >= 5 ? "#f59e0b" : "#ff3b5c";
  const scoreLabel = s => s >= 8 ? "Excellent" : s >= 5 ? "Needs Work" : "Poor";
  const criticalCount = review?.issues?.filter(i => i.severity === "critical").length || 0;
  const warningCount = review?.issues?.filter(i => i.severity === "warning").length || 0;
  const sugCount = review?.issues?.filter(i => i.severity === "suggestion").length || 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #06060f 0%, #0a0818 40%, #080c18 100%)",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      color: "#e2e8f0",
      overflow: "hidden"
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes float { from { transform: translateY(-8px) } to { transform: translateY(8px) } }
        @keyframes pulse-ring { 0%,100% { opacity:0.4; transform:scale(1) } 50% { opacity:1; transform:scale(1.05) } }
        @keyframes shimmer { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scan { 0% { top:0 } 100% { top:100% } }
        @keyframes glitch1 { 0%,100%{clip-path:inset(0 0 95% 0)} 25%{clip-path:inset(30% 0 50% 0)} 75%{clip-path:inset(70% 0 10% 0)} }
        @keyframes borderFlow {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        .issue-card:hover { transform: translateX(4px) !important; }
        .tab-btn:hover { color: #a78bfa !important; }
        .review-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(88,60,230,0.6) !important; }
        .lang-option:hover { background: rgba(120,100,255,0.12) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(120,100,255,0.3); border-radius: 2px; }
      `}</style>

      <ParticleField />
      <HexGrid />

      {/* ── TOP HEADER ── */}
      <header style={{
        position: "relative", zIndex: 20,
        height: 56,
        backdropFilter: "blur(20px) saturate(180%)",
        background: "rgba(6,6,15,0.7)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.5rem",
      }}>
        {/* Animated border bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(120,100,255,0.6), rgba(0,200,255,0.4), transparent)",
          backgroundSize: "200% 100%",
          animation: "borderFlow 4s ease infinite"
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg, #5c3ce8 0%, #00c8ff 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, boxShadow: "0 0 24px rgba(92,60,232,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            fontWeight: 900, color: "#fff"
          }}>⬡</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              <span style={{ color: "#f8fafc" }}>Code</span>
              <span style={{
                background: "linear-gradient(90deg, #a78bfa, #6ee7f7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>Review</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>.ai</span>
            </div>
          </div>
          <span style={{
            fontSize: 9, padding: "2px 8px", borderRadius: 4,
            background: "rgba(92,60,232,0.2)", border: "1px solid rgba(92,60,232,0.4)",
            color: "#a78bfa", letterSpacing: "0.12em", fontWeight: 700
          }}>BETA</span>
        </div>

        {/* Right: model badge + stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "10+", sub: "languages" },
              { label: "AI", sub: "powered" },
              { label: "0ms", sub: "latency" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "3px 10px", borderRadius: 6,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                textAlign: "center",
                display: i > 0 && window.innerWidth < 900 ? "none" : "block"
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{s.label}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{
            fontSize: 11, padding: "4px 12px", borderRadius: 6,
            background: "rgba(0,200,255,0.06)", border: "1px solid rgba(0,200,255,0.2)",
            color: "#6ee7f7", display: "flex", alignItems: "center", gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5a0",
              boxShadow: "0 0 8px #00e5a0", animation: "pulse-ring 2s infinite" }} />
            Groq · Llama 3.3
          </div>
        </div>
      </header>

      {/* ── HERO BANNER (shown when no review) ── */}
      {!review && !loading && (
        <div style={{
          position: "relative", zIndex: 5,
          padding: "24px 0 0",
          textAlign: "center",
          animation: "fadeIn 0.5s ease"
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 16px", borderRadius: 20,
            background: "rgba(92,60,232,0.1)", border: "1px solid rgba(92,60,232,0.25)",
            fontSize: 11, color: "#a78bfa", marginBottom: 10, letterSpacing: "0.06em"
          }}>
            <span style={{ animation: "pulse-ring 2s infinite", width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
            AI-POWERED CODE ANALYSIS ENGINE
          </div>
          <h1 style={{
            margin: "0 0 6px",
            fontSize: "clamp(20px, 3vw, 32px)",
            fontWeight: 800,
            background: "linear-gradient(90deg, #fff 0%, #a78bfa 40%, #6ee7f7 80%, #fff 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 4s linear infinite"
          }}>Instant Code Review. Zero Compromise.</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
            Security · Performance · Best Practices · Refactoring
          </p>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        height: review || loading ? "calc(100vh - 56px)" : "calc(100vh - 56px - 100px)",
        margin: review || loading ? 0 : "0",
      }}>

        {/* ══ LEFT PANEL — EDITOR ══ */}
        <div style={{
          display: "flex", flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(4,4,12,0.5)",
          backdropFilter: "blur(10px)",
        }}>
          {/* Editor chrome bar */}
          <div style={{
            padding: "8px 1.25rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.015)",
            display: "flex", alignItems: "center", gap: 10
          }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
                <div key={i} style={{
                  width: 11, height: 11, borderRadius: "50%", background: c,
                  boxShadow: `0 0 8px ${c}55`
                }} />
              ))}
            </div>
            <div style={{
              flex: 1, textAlign: "center", fontSize: 11,
              color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em"
            }}>
              <LanguageBadge lang={language} />
            </div>

            {/* Language select styled */}
            <div style={{ position: "relative" }}>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                style={{
                  appearance: "none", background: "rgba(92,60,232,0.12)",
                  border: "1px solid rgba(92,60,232,0.3)", borderRadius: 7,
                  color: "#a78bfa", fontSize: 11, padding: "4px 28px 4px 10px",
                  fontFamily: "inherit", cursor: "pointer", outline: "none",
                  letterSpacing: "0.04em"
                }}>
                {LANGUAGES.map(l => (
                  <option key={l} value={l} style={{ background: "#0a0818" }}>{l}</option>
                ))}
              </select>
              <span style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                color: "#a78bfa", fontSize: 9, pointerEvents: "none"
              }}>▼</span>
            </div>
          </div>

          {/* Code editor */}
          <div style={{
            flex: 1, display: "flex", overflow: "hidden",
            background: "rgba(3,3,10,0.6)",
            position: "relative"
          }}>
            {/* Line numbers */}
            <div style={{
              padding: "1rem 0",
              minWidth: 44, textAlign: "right",
              fontSize: 11, lineHeight: "21px",
              color: "rgba(255,255,255,0.12)",
              paddingRight: 12, paddingLeft: 8,
              borderRight: "1px solid rgba(255,255,255,0.04)",
              userSelect: "none",
              background: "rgba(0,0,0,0.2)"
            }}>
              {code.split("\n").map((_, i) => (
                <div key={i} style={{ transition: "color 0.2s" }}>{i + 1}</div>
              ))}
            </div>

            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                padding: "1rem 1.25rem 1rem 0.75rem",
                fontSize: 12.5, lineHeight: "21px",
                color: "#c9d1e0", resize: "none",
                fontFamily: "inherit", overflowY: "auto",
                caretColor: "#a78bfa",
              }}
              placeholder="// Paste your code here and click Review..."
            />

            {/* Scan line when loading */}
            {loading && (
              <div style={{
                position: "absolute", left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg, transparent, rgba(120,100,255,0.8), rgba(0,200,255,0.6), transparent)",
                top: `${scanLine}%`, transition: "top 0.05s linear",
                boxShadow: "0 0 12px rgba(120,100,255,0.6)",
                pointerEvents: "none"
              }} />
            )}
          </div>

          {/* Editor footer */}
          <div style={{
            padding: "5px 1.25rem",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(0,0,0,0.2)",
            display: "flex", gap: 16, fontSize: 10,
            color: "rgba(255,255,255,0.15)", alignItems: "center"
          }}>
            <span>{code.split("\n").length} lines</span>
            <span>{code.length} chars</span>
            <span style={{ marginLeft: "auto" }}>UTF-8</span>
            <span>{language}</span>
          </div>

          {/* Review button */}
          <div style={{
            padding: "14px 1.25rem",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.015)"
          }}>
            <button
              className="review-btn"
              onClick={reviewCode}
              disabled={loading || !code.trim()}
              style={{
                width: "100%", padding: "13px",
                background: loading
                  ? "rgba(92,60,232,0.15)"
                  : "linear-gradient(135deg, #5c3ce8 0%, #2563eb 50%, #0ea5e9 100%)",
                border: loading ? "1px solid rgba(92,60,232,0.3)" : "none",
                borderRadius: 11, color: "#fff",
                fontSize: 12.5, fontWeight: 700, fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.08em",
                transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: loading ? "none" : "0 8px 32px rgba(92,60,232,0.45)",
                position: "relative", overflow: "hidden"
              }}
            >
              {/* Shimmer overlay */}
              {!loading && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 3s linear infinite"
                }} />
              )}
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{
                    width: 14, height: 14,
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderTop: "2px solid #fff",
                    borderRadius: "50%", display: "inline-block",
                    animation: "spin 0.7s linear infinite"
                  }} />
                  Analyzing with AI...
                </span>
              ) : (
                <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>▶</span> Run Code Review
                </span>
              )}
            </button>

            {/* Feature tags */}
            <div style={{
              display: "flex", gap: 6, marginTop: 10, justifyContent: "center", flexWrap: "wrap"
            }}>
              {["Security", "Performance", "Bugs", "Style"].map(tag => (
                <span key={tag} style={{
                  fontSize: 9, padding: "2px 8px", borderRadius: 4,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em"
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL — RESULTS ══ */}
        <div style={{
          display: "flex", flexDirection: "column", overflow: "hidden",
          background: "rgba(4,4,14,0.4)", backdropFilter: "blur(10px)"
        }}>

          {/* EMPTY STATE */}
          {!review && !loading && !error && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 0,
              animation: "fadeIn 0.6s ease",
              padding: "2rem"
            }}>
              {/* Big glowing hex icon */}
              <div style={{
                width: 100, height: 100, borderRadius: 24,
                background: "linear-gradient(135deg, rgba(92,60,232,0.15), rgba(0,200,255,0.08))",
                border: "1px solid rgba(92,60,232,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 44, marginBottom: 24,
                boxShadow: "0 0 60px rgba(92,60,232,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
                animation: "pulse-ring 3s infinite"
              }}>⬡</div>

              <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "#f1f5f9" }}>
                Ready to Analyze
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "0 0 32px", textAlign: "center", lineHeight: 1.6, maxWidth: 280 }}>
                Paste your code in the editor, select your language, and hit Run Code Review
              </p>

              {/* Feature grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 10, width: "100%", maxWidth: 320
              }}>
                {[
                  { icon: "🛡", title: "Security Audit", desc: "SQL injection, XSS & more" },
                  { icon: "⚡", title: "Performance", desc: "Bottlenecks & optimizations" },
                  { icon: "🔍", title: "Bug Detection", desc: "Logic & runtime errors" },
                  { icon: "✨", title: "Refactoring", desc: "Clean, idiomatic code" },
                ].map((f, i) => (
                  <div key={i} style={{
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    transition: "all 0.2s"
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{f.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0", marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div style={{
              margin: "1.5rem", padding: "14px 16px",
              background: "rgba(255,59,92,0.06)", border: "1px solid rgba(255,59,92,0.2)",
              borderLeft: "3px solid #ff3b5c",
              borderRadius: 10, color: "#ff8099", fontSize: 12, lineHeight: 1.6,
              animation: "fadeIn 0.3s ease"
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: "#ff3b5c" }}>⬡ Connection Error</div>
              {error}
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 24
            }}>
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "2px solid rgba(92,60,232,0.15)",
                  borderTop: "2px solid #5c3ce8",
                  animation: "spin 0.9s linear infinite",
                  boxShadow: "0 0 20px rgba(92,60,232,0.3)"
                }} />
                <div style={{
                  position: "absolute", inset: 10, borderRadius: "50%",
                  border: "2px solid rgba(0,200,255,0.1)",
                  borderTop: "2px solid #0ea5e9",
                  animation: "spin 1.4s linear infinite reverse",
                  boxShadow: "0 0 15px rgba(14,165,233,0.2)"
                }} />
                <div style={{
                  position: "absolute", inset: 22, borderRadius: "50%",
                  border: "1.5px solid rgba(167,139,250,0.15)",
                  borderTop: "1.5px solid #a78bfa",
                  animation: "spin 0.6s linear infinite"
                }} />
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 20, animation: "pulse-ring 1.5s infinite"
                }}>⬡</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{
                  fontSize: 14, fontWeight: 700, margin: "0 0 6px",
                  background: "linear-gradient(90deg, #a78bfa, #6ee7f7)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                }}>AI is reviewing your code</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                  Scanning for vulnerabilities, bugs & improvements...
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Security", "Patterns", "Performance", "Style"].map((step, i) => (
                  <div key={step} style={{
                    fontSize: 9, padding: "3px 10px", borderRadius: 4,
                    background: "rgba(92,60,232,0.1)", border: "1px solid rgba(92,60,232,0.2)",
                    color: "#a78bfa", letterSpacing: "0.06em",
                    animation: `pulse-ring 1.5s ${i * 0.3}s infinite`
                  }}>{step}</div>
                ))}
              </div>
            </div>
          )}

          {/* ── RESULTS ── */}
          {review && (
            <>
              {/* Score header */}
              <div style={{
                padding: "16px 1.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.015)",
                animation: "fadeIn 0.4s ease"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                  <ScoreRing score={review.score} color={scoreColor(review.score)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 18, fontWeight: 800, marginBottom: 4,
                      color: scoreColor(review.score),
                      textShadow: `0 0 20px ${scoreColor(review.score)}55`
                    }}>
                      {scoreLabel(review.score)}
                    </div>
                    <p style={{
                      fontSize: 11.5, color: "rgba(255,255,255,0.4)",
                      margin: 0, lineHeight: 1.6,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden"
                    }}>{review.summary}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <StatPill count={criticalCount} label="critical" color="#ff3b5c" bg="rgba(255,59,92,0.08)" border="rgba(255,59,92,0.2)" />
                  <StatPill count={warningCount} label="warnings" color="#f59e0b" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.2)" />
                  <StatPill count={sugCount} label="tips" color="#6ee7f7" bg="rgba(110,231,247,0.06)" border="rgba(110,231,247,0.2)" />
                  {review.issues?.length === 0 && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", background: "rgba(0,229,160,0.08)",
                      border: "1px solid rgba(0,229,160,0.25)", borderRadius: 20,
                      fontSize: 11, color: "#00e5a0", fontWeight: 600
                    }}>
                      <span>✓</span> All Clear!
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={{
                display: "flex",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(0,0,0,0.15)",
                padding: "0 1.5rem"
              }}>
                {[
                  { id: "issues", label: "Issues", count: review.issues?.length || 0 },
                  { id: "positives", label: "Wins", count: review.positives?.length || 0 },
                  { id: "fix", label: "Refactored", count: null },
                ].map(tab => (
                  <button key={tab.id}
                    className="tab-btn"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "10px 14px", fontSize: 11,
                      background: "none", border: "none",
                      borderBottom: activeTab === tab.id
                        ? "2px solid #a78bfa"
                        : "2px solid transparent",
                      color: activeTab === tab.id ? "#a78bfa" : "rgba(255,255,255,0.25)",
                      fontFamily: "inherit", cursor: "pointer",
                      letterSpacing: "0.06em", fontWeight: 600,
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: 6
                    }}>
                    {tab.label}
                    {tab.count !== null && tab.count > 0 && (
                      <span style={{
                        fontSize: 9, padding: "1px 6px", borderRadius: 10,
                        background: activeTab === tab.id ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.07)",
                        color: activeTab === tab.id ? "#a78bfa" : "rgba(255,255,255,0.3)"
                      }}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>

                {/* ISSUES TAB */}
                {activeTab === "issues" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {review.issues?.length === 0 && (
                      <div style={{
                        textAlign: "center", padding: "3rem 1rem",
                        color: "#00e5a0", animation: "fadeIn 0.5s ease"
                      }}>
                        <div style={{ fontSize: 40, marginBottom: 12, filter: "drop-shadow(0 0 20px #00e5a0)" }}>✓</div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Excellent! No issues found.</p>
                        <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Your code is clean and well-written.</p>
                      </div>
                    )}
                    {review.issues?.map((issue, i) => {
                      const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.suggestion;
                      return (
                        <div
                          key={i}
                          className="issue-card"
                          onMouseEnter={() => setHoveredIssue(i)}
                          onMouseLeave={() => setHoveredIssue(null)}
                          style={{
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            borderLeft: `3px solid ${cfg.color}`,
                            borderRadius: 10,
                            padding: "12px 14px",
                            transition: "all 0.2s ease",
                            animation: `fadeIn 0.3s ${i * 0.05}s ease both`,
                            boxShadow: hoveredIssue === i ? `0 4px 24px ${cfg.glow}` : "none"
                          }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7, flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: 10, padding: "2px 8px", fontWeight: 700,
                              background: `${cfg.color}22`, color: cfg.color,
                              borderRadius: 4, letterSpacing: "0.06em"
                            }}>{cfg.label.toUpperCase()}</span>
                            {issue.line !== "general" && (
                              <span style={{
                                fontSize: 10, color: "rgba(255,255,255,0.3)",
                                background: "rgba(255,255,255,0.05)",
                                padding: "2px 7px", borderRadius: 4
                              }}>L:{issue.line}</span>
                            )}
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#e2e8f0" }}>{issue.title}</span>
                          </div>
                          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", margin: "0 0 8px", lineHeight: 1.65 }}>
                            {issue.description}
                          </p>
                          <div style={{
                            fontSize: 11.5, color: "#86efac",
                            background: "rgba(0,0,0,0.4)",
                            borderRadius: 7, padding: "8px 12px",
                            borderLeft: "2px solid rgba(134,239,172,0.3)",
                            whiteSpace: "pre-wrap", lineHeight: 1.7,
                            fontFamily: "inherit"
                          }}>
                            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: "0.06em" }}>FIX → </span>
                            {issue.fix}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* POSITIVES TAB */}
                {activeTab === "positives" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {review.positives?.map((p, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 12, fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                        padding: "10px 14px",
                        background: "rgba(0,229,160,0.04)",
                        border: "1px solid rgba(0,229,160,0.1)",
                        borderRadius: 9, lineHeight: 1.65,
                        animation: `fadeIn 0.3s ${i * 0.06}s ease both`
                      }}>
                        <span style={{
                          color: "#00e5a0", fontSize: 14, marginTop: 1, flexShrink: 0,
                          filter: "drop-shadow(0 0 6px #00e5a0)"
                        }}>✓</span>
                        {p}
                      </div>
                    ))}
                    {(!review.positives || review.positives.length === 0) && (
                      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No positives noted.</p>
                    )}
                  </div>
                )}

                {/* REFACTORED TAB */}
                {activeTab === "fix" && (
                  <div style={{ animation: "fadeIn 0.4s ease" }}>
                    {review.refactoredSnippet ? (
                      <>
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          alignItems: "center", marginBottom: 12
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              width: 8, height: 8, borderRadius: "50%",
                              background: "#28c840", boxShadow: "0 0 8px #28c840"
                            }} />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
                              REFACTORED · {language}
                            </span>
                          </div>
                          <button onClick={copyCode} style={{
                            fontSize: 10, padding: "5px 14px",
                            background: copied ? "rgba(0,229,160,0.1)" : "rgba(92,60,232,0.12)",
                            border: `1px solid ${copied ? "rgba(0,229,160,0.3)" : "rgba(92,60,232,0.3)"}`,
                            borderRadius: 6, color: copied ? "#00e5a0" : "#a78bfa",
                            fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
                            letterSpacing: "0.04em", transition: "all 0.3s"
                          }}>
                            {copied ? "✓ Copied!" : "Copy"}
                          </button>
                        </div>
                        <pre style={{
                          background: "rgba(0,0,0,0.5)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 10, padding: "1rem 1.25rem",
                          fontSize: 11.5, color: "#86efac",
                          overflowX: "auto", whiteSpace: "pre-wrap",
                          lineHeight: 1.8, margin: 0,
                          fontFamily: "inherit",
                          boxShadow: "inset 0 2px 20px rgba(0,0,0,0.4)"
                        }}>
                          {review.refactoredSnippet}
                        </pre>
                      </>
                    ) : (
                      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No refactored snippet available.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
