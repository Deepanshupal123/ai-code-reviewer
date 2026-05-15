import { useState, useCallback } from "react";

const LANGUAGES = ["javascript", "python", "java", "typescript", "go", "rust", "cpp", "php", "ruby", "swift"];

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: "✕", label: "Critical" },
  warning:  { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: "⚠", label: "Warning"  },
  suggestion:{ color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: "💡", label: "Suggestion"},
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

export default function App() {
  const [code, setCode]         = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState("javascript");
  const [review, setReview]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState("issues");

  const reviewCode = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setReview(null);

    try {
      const res = await fetch("http://localhost:3001/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setReview(data);
      setActiveTab("issues");
    } catch (e) {
      setError("Could not connect to backend. Make sure the server is running on port 3001.");
    } finally {
      setLoading(false);
    }
  }, [code, language]);

  const scoreColor = (s) => s >= 8 ? "#22c55e" : s >= 5 ? "#f59e0b" : "#ef4444";
  const scoreLabel = (s) => s >= 8 ? "Great" : s >= 5 ? "Needs Work" : "Poor";

  const criticalCount   = review?.issues?.filter(i => i.severity === "critical").length   || 0;
  const warningCount    = review?.issues?.filter(i => i.severity === "warning").length    || 0;
  const suggestionCount = review?.issues?.filter(i => i.severity === "suggestion").length || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0f", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#e2e8f0" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1e1e2e", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬡</div>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.05em", color: "#f8fafc" }}>CodeReview<span style={{ color: "#7c3aed" }}>.ai</span></span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["●", "●", "●"].map((d, i) => (
            <span key={i} style={{ fontSize: 10, color: ["#ef4444","#f59e0b","#22c55e"][i], opacity: 0.8 }}>{d}</span>
          ))}
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "calc(100vh - 56px)" }}>
        {/* LEFT — Code Editor */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid #1e1e2e" }}>
          {/* Toolbar */}
          <div style={{ padding: "12px 1.5rem", borderBottom: "1px solid #1e1e2e", display: "flex", alignItems: "center", gap: 12, background: "#111116" }}>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{ background: "#1e1e2e", border: "1px solid #2d2d3d", borderRadius: 6, color: "#a78bfa", fontSize: 12, padding: "4px 10px", fontFamily: "inherit", cursor: "pointer" }}
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <span style={{ fontSize: 11, color: "#4b5563", marginLeft: "auto" }}>{code.split("\n").length} lines</span>
          </div>

          {/* Line Numbers + Textarea */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ padding: "1rem 0", background: "#0a0a0d", minWidth: 44, textAlign: "right", fontSize: 12, lineHeight: "22px", color: "#374151", userSelect: "none", paddingRight: 12, paddingLeft: 8 }}>
              {code.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              style={{ flex: 1, background: "#0a0a0d", border: "none", outline: "none", padding: "1rem 1.5rem 1rem 0.5rem", fontSize: 13, lineHeight: "22px", color: "#e2e8f0", resize: "none", fontFamily: "inherit", overflowY: "auto" }}
              placeholder="Paste your code here..."
            />
          </div>

          {/* Review Button */}
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #1e1e2e", background: "#111116" }}>
            <button
              onClick={reviewCode}
              disabled={loading || !code.trim()}
              style={{ width: "100%", padding: "10px", background: loading ? "#2d2d3d" : "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.04em", transition: "opacity 0.2s" }}
            >
              {loading ? "⟳  Analyzing with Claude..." : "▶  Review Code"}
            </button>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!review && !loading && !error && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#374151" }}>
              <div style={{ fontSize: 40 }}>⬡</div>
              <p style={{ fontSize: 13, margin: 0 }}>Paste your code and click Review</p>
            </div>
          )}

          {error && (
            <div style={{ margin: "1.5rem", padding: "1rem", background: "#1a0a0a", border: "1px solid #450a0a", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 40, height: 40, border: "3px solid #1e1e2e", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Claude is reviewing your code...</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {review && (
            <>
              {/* Score Bar */}
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #1e1e2e", background: "#111116", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: scoreColor(review.score) }}>{review.score}</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Score / 10</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: scoreColor(review.score) }}>{scoreLabel(review.score)}</div>
                  </div>
                </div>
                <div style={{ flex: 1, height: 6, background: "#1e1e2e", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${review.score * 10}%`, background: scoreColor(review.score), borderRadius: 3, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 12 }}>
                  {criticalCount > 0    && <span style={{ color: "#ef4444" }}>{criticalCount} critical</span>}
                  {warningCount > 0     && <span style={{ color: "#f59e0b" }}>{warningCount} warnings</span>}
                  {suggestionCount > 0  && <span style={{ color: "#3b82f6" }}>{suggestionCount} tips</span>}
                </div>
              </div>

              <p style={{ margin: "12px 1.5rem 0", fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>{review.summary}</p>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid #1e1e2e", padding: "0 1.5rem", marginTop: 12 }}>
                {["issues", "positives", "fix"].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: "8px 14px", fontSize: 12, background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #7c3aed" : "2px solid transparent", color: activeTab === tab ? "#a78bfa" : "#6b7280", fontFamily: "inherit", cursor: "pointer", textTransform: "capitalize", letterSpacing: "0.03em" }}>
                    {tab === "issues" ? `Issues (${review.issues?.length || 0})` : tab === "positives" ? "Positives" : "Refactored"}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
                {activeTab === "issues" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {review.issues?.length === 0 && <p style={{ color: "#6b7280", fontSize: 13 }}>No issues found!</p>}
                    {review.issues?.map((issue, i) => {
                      const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.suggestion;
                      return (
                        <div key={i} style={{ background: "#111116", border: `1px solid #1e1e2e`, borderLeft: `3px solid ${cfg.color}`, borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 11, padding: "2px 8px", background: cfg.bg, color: cfg.color, borderRadius: 4, fontWeight: 600 }}>{cfg.label}</span>
                            {issue.line !== "general" && <span style={{ fontSize: 11, color: "#4b5563" }}>Line {issue.line}</span>}
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginLeft: 4 }}>{issue.title}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px", lineHeight: 1.6 }}>{issue.description}</p>
                          <div style={{ fontSize: 12, color: "#6ee7b7", background: "#0a1a0f", borderRadius: 6, padding: "8px 10px", whiteSpace: "pre-wrap" }}>
                            <span style={{ color: "#4b5563" }}>Fix: </span>{issue.fix}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === "positives" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {review.positives?.map((p, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#9ca3af", padding: "8px 0", borderBottom: "1px solid #1e1e2e" }}>
                        <span style={{ color: "#22c55e" }}>✓</span> {p}
                      </div>
                    ))}
                    {(!review.positives || review.positives.length === 0) && <p style={{ color: "#6b7280", fontSize: 13 }}>No positives noted.</p>}
                  </div>
                )}

                {activeTab === "fix" && (
                  <div>
                    {review.refactoredSnippet ? (
                      <pre style={{ background: "#0a0a0d", border: "1px solid #1e1e2e", borderRadius: 8, padding: "1rem", fontSize: 12, color: "#6ee7b7", overflowX: "auto", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                        {review.refactoredSnippet}
                      </pre>
                    ) : (
                      <p style={{ color: "#6b7280", fontSize: 13 }}>No refactored snippet provided for this code.</p>
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
