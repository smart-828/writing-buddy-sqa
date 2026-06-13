import { useLocation, useNavigate } from "react-router-dom";
import { Card, SectionLabel, Stars } from "../../components/shared/UI";

export default function StudentFeedback() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) { navigate("/student"); return null; }

  const { feedback, scoreOutOf20, starsEarned, wordCount, streakBonus } = state;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <span style={{ fontWeight: 600, color: "#111" }}>Your feedback</span>
        <button onClick={() => navigate("/student")}
          style={{ padding: "8px 18px", background: "#2563eb", border: "none", borderRadius: 8, color: "white", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          Done ✓
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Stars earned */}
        <Card style={{ marginBottom: "1.5rem", textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: 52, letterSpacing: 6, marginBottom: "0.75rem" }}>
            {"★".repeat(starsEarned)}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 4 }}>
            Well done — {starsEarned} stars earned!
          </div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Score: {scoreOutOf20}/20 · {wordCount} words written</div>
          {streakBonus && (
            <div style={{ marginTop: 12, display: "inline-block", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 999, padding: "6px 16px", fontSize: 13, color: "#b45309", fontWeight: 500 }}>
              ⚡ Weekly streak bonus — +1 extra star!
            </div>
          )}
        </Card>

        {/* Criteria scores */}
        <Card style={{ marginBottom: "1.5rem" }}>
          <SectionLabel>How you did</SectionLabel>
          {feedback.criteria.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 175, fontSize: 14, color: "#374151", flexShrink: 0, paddingTop: 2 }}>{c.name}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <Stars score={c.score} size={16} />
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{c.score}/5</span>
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{c.comment}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Written feedback */}
        <Card style={{ marginBottom: "1.5rem" }}>
          <SectionLabel>Feedback</SectionLabel>
          <div style={{ fontSize: 15, lineHeight: 1.8, color: "#111" }}>
            {feedback.explanation.split("\n\n").map((p, i) => (
              <p key={i} style={{ marginBottom: "0.75rem" }}>{p}</p>
            ))}
          </div>
        </Card>

        {/* Sample answer */}
        <Card style={{ marginBottom: "1.5rem" }}>
          <SectionLabel>A sample strong answer</SectionLabel>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: "1rem" }}>
            This is one way a strong response might look — not the only way, just one example.
          </p>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "#374151", background: "#f9fafb", padding: "1rem", borderRadius: 8 }}>
            {feedback.sampleAnswer.split("\n\n").map((p, i) => (
              <p key={i} style={{ marginBottom: "0.5rem" }}>{p}</p>
            ))}
          </div>
        </Card>

        <button onClick={() => navigate("/student")}
          style={{ width: "100%", padding: 14, background: "#2563eb", border: "none", borderRadius: 8, color: "white", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          Back to home
        </button>
      </div>
    </div>
  );
}
