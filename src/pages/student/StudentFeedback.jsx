import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getSubmission, getPrompt } from "../../lib/db";
import { Card, SectionLabel, Stars, Spinner } from "../../components/shared/UI";

// Shows one piece of writing with its marking.
// - Straight after submitting: arrives with `state` and shows the stars celebration.
// - Reviewing later (from "My writing"): loads the saved submission by ID, read-only.
export default function StudentFeedback() {
  const { state } = useLocation();
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const justSubmitted = !!state;

  const [submission, setSubmission] = useState(null);
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const sub = await getSubmission(submissionId);
        if (cancelled) return;
        if (!sub) { setNotFound(true); return; }
        setSubmission(sub);
        const prompt = await getPrompt(sub.prompt_id);
        if (!cancelled) setPromptText(prompt?.prompt_text || "");
      } catch (e) {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [submissionId]);

  // Prefer the feedback just handed over (instant), fall back to the saved copy.
  const feedback = state?.feedback || submission?.ai_feedback;
  const scoreOutOf20 = state?.scoreOutOf20 ?? submission?.score_total;
  const wordCount = state?.wordCount ?? submission?.word_count;
  const starsEarned = state?.starsEarned;
  const streakBonus = state?.streakBonus;

  const formatDate = ts => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const backTarget = justSubmitted ? "/student" : "/student/progress";

  if (loading && !feedback) return <Spinner />;

  if (notFound && !feedback) {
    return (
      <div style={{ padding: "3rem 1.5rem", textAlign: "center", fontFamily: "system-ui, sans-serif", color: "#6b7280" }}>
        <p style={{ marginBottom: "1rem" }}>This piece of writing couldn't be found.</p>
        <button onClick={() => navigate("/student/progress")}
          style={{ padding: "10px 20px", background: "#2563eb", border: "none", borderRadius: 8, color: "white", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          Back to my writing
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {!justSubmitted && (
            <button onClick={() => navigate(backTarget)} style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "inherit", marginRight: 12 }}>← Back</button>
          )}
          <span style={{ fontWeight: 600, color: "#111" }}>{justSubmitted ? "Your feedback" : "Review my writing"}</span>
        </div>
        {justSubmitted && (
          <button onClick={() => navigate("/student")}
            style={{ padding: "8px 18px", background: "#2563eb", border: "none", borderRadius: 8, color: "white", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Done ✓
          </button>
        )}
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Celebration — only straight after submitting */}
        {justSubmitted ? (
          <Card style={{ marginBottom: "1.5rem", textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: 52, letterSpacing: 6, marginBottom: "0.75rem" }}>
              {"★".repeat(starsEarned || 0)}
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
        ) : (
          <Card style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 4 }}>
              {submission?.prompt_title || "My writing"}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {formatDate(submission?.created_at)} · {wordCount} words · Score {scoreOutOf20}/20
            </div>
          </Card>
        )}

        {/* Task question */}
        {submission && (
          <Card style={{ marginBottom: "1.5rem" }}>
            <SectionLabel>The task</SectionLabel>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#374151", whiteSpace: "pre-wrap" }}>
              {promptText || submission.prompt_title || "The full question for this task is no longer available."}
            </div>
          </Card>
        )}

        {/* What he wrote — exactly as submitted */}
        {submission && (
          <Card style={{ marginBottom: "1.5rem" }}>
            <SectionLabel>What I wrote</SectionLabel>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: "#111", whiteSpace: "pre-wrap", background: "#f9fafb", padding: "1rem", borderRadius: 8 }}>
              {submission.response_text}
            </div>
          </Card>
        )}

        {/* Criteria scores */}
        {feedback?.criteria?.length > 0 && (
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
        )}

        {/* Written feedback */}
        {feedback?.explanation && (
          <Card style={{ marginBottom: "1.5rem" }}>
            <SectionLabel>Feedback</SectionLabel>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: "#111" }}>
              {feedback.explanation.split("\n\n").map((p, i) => (
                <p key={i} style={{ marginBottom: "0.75rem" }}>{p}</p>
              ))}
            </div>
          </Card>
        )}

        {/* Sample answer */}
        {feedback?.sampleAnswer && (
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
        )}

        <button onClick={() => navigate(backTarget)}
          style={{ width: "100%", padding: 14, background: "#2563eb", border: "none", borderRadius: 8, color: "white", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          {justSubmitted ? "Back to home" : "Back to my writing"}
        </button>
      </div>
    </div>
  );
}
