import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { buildSystemPrompt } from "../../prompts/aiPrompts";
import { saveSubmission, checkAndAwardStreakBonus } from "../../lib/db";

const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;
const STARS_PER_SUBMISSION = 3;

export default function StudentWritingEditor() {
  const { state } = useLocation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const prompt = state?.prompt;

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(true);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minWords = 300;
  const targetWords = 500;
  const ready = wordCount >= minWords;
  const atTarget = wordCount >= targetWords;

  async function handleSubmit() {
    if (!ready) return;
    setLoading(true);
    setError("");
    try {
      const system = buildSystemPrompt(profile.curriculum, prompt.type);
      const userMsg = `Writing prompt: ${prompt.prompt_text}\n\nStudent response:\n${text}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 3500,
          system,
          messages: [{ role: "user", content: userMsg }]
        })
      });

      if (!res.ok) throw new Error("AI feedback failed. Please try again.");
      const data = await res.json();
      const raw = data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
      let feedback;
      try {
        feedback = JSON.parse(raw);
      } catch(parseErr) {
        // Try to extract partial JSON if response was cut off
        const match = raw.match(/(\{[\s\S]*"criteria"[\s\S]*"explanation"[\s\S]*)/);
        if (match) {
          const partial = match[1].replace(/,\s*$/, '') + ',"sampleAnswer":"The response was too long to generate a sample answer. Please try again."}';
          try { feedback = JSON.parse(partial); } catch(e2) { throw new Error("AI response was too long. Please try again."); }
        } else {
          throw new Error("AI response was too long. Please try again.");
        }
      }

      // Normalise score to 20
      const rawTotal = feedback.criteria.reduce((s, c) => s + c.score, 0);
      const maxRaw = feedback.criteria.length * 5;
      const scoreOutOf20 = Math.round((rawTotal / maxRaw) * 20);

      const submissionId = await saveSubmission(profile.id, {
        promptId: prompt.id,
        promptTitle: prompt.title,
        responseText: text,
        wordCount,
        writingType: prompt.type,
        curriculum: profile.curriculum,
        scoreTotal: scoreOutOf20,
        starsEarned: STARS_PER_SUBMISSION,
        aiFeedback: feedback,
        targetSkill: prompt.target_skill || null
      });

      // Check weekly streak bonus
      const streakBonus = await checkAndAwardStreakBonus(profile.id);

      navigate(`/student/feedback/${submissionId}`, {
        state: { feedback, scoreOutOf20, starsEarned: STARS_PER_SUBMISSION, wordCount, streakBonus }
      });
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!prompt) { navigate("/student"); return null; }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, flexShrink: 0, position: "sticky", top: 0, background: "white", zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            fontSize: 13, fontWeight: 500,
            color: wordCount < minWords ? "#9ca3af" : atTarget ? "#16a34a" : "#f59e0b"
          }}>
            {wordCount} / {targetWords} words
          </div>
          {/* Progress bar */}
          <div style={{ width: 80, height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 999,
              width: `${Math.min((wordCount / targetWords) * 100, 100)}%`,
              background: wordCount < minWords ? "#e5e7eb" : atTarget ? "#16a34a" : "#f59e0b",
              transition: "width 0.3s ease"
            }} />
          </div>
          {atTarget && <span style={{ fontSize: 12, color: "#16a34a" }}>✓ Great length!</span>}
          {ready && !atTarget && <span style={{ fontSize: 12, color: "#f59e0b" }}>{targetWords - wordCount} more for full marks</span>}
        </div>
        <button onClick={handleSubmit} disabled={!ready || loading}
          style={{
            padding: "8px 20px",
            background: loading ? "#e5e7eb" : !ready ? "#e5e7eb" : atTarget ? "#16a34a" : "#f59e0b",
            border: "none", borderRadius: 8,
            color: ready && !loading ? "white" : "#9ca3af",
            fontSize: 14, fontWeight: 500,
            cursor: ready && !loading ? "pointer" : "not-allowed",
            fontFamily: "inherit"
          }}>
          {loading ? "Getting feedback…" : "Submit for feedback"}
        </button>
      </div>

      {/* Prompt + hints */}
      <div style={{ padding: "1.25rem 1.5rem", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", flexShrink: 0, position: "sticky", top: 56, zIndex: 9 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Your prompt</div>
        <div style={{ fontSize: 15, color: "#111", lineHeight: 1.6, marginBottom: prompt.hints?.length ? 10 : 0 }}>{prompt.prompt_text}</div>
        {prompt.hints?.length > 0 && (
          <>
            <button onClick={() => setShowHints(h => !h)}
              style={{ background: "none", border: "none", fontSize: 12, color: "#2563eb", cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: showHints ? 8 : 0 }}>
              {showHints ? "Hide hints ▲" : "Show hints ▼"}
            </button>
            {showHints && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {prompt.hints.map((h, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#374151" }}>• {h}</div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Writing area */}
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Start writing here…" autoFocus
        style={{
          flex: 1, width: "100%", padding: "1.5rem", border: "none", outline: "none",
          resize: "none", fontSize: 16, lineHeight: 1.8, color: "#111",
          fontFamily: "Georgia, serif", boxSizing: "border-box", minHeight: "calc(100vh - 200px)",
          }} />


      {error && (
        <div style={{ padding: "0.75rem 1.5rem", background: "#fef2f2", borderTop: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <div style={{ fontSize: 15, color: "#374151", fontWeight: 500 }}>Reading your writing…</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>This takes about 15 seconds</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
