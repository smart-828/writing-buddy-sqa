import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getProfile, getStudentSubmissions, getLatestProgressSummary, saveProgressSummary } from "../../lib/db";
import { buildProgressPrompt } from "../../prompts/aiPrompts";
import { Card, Button, SectionLabel, Badge, Stars, Spinner, EmptyState } from "../../components/shared/UI";

const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

export default function AdminStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    async function load() {
      const [p, subs, sum] = await Promise.all([
        getProfile(studentId),
        getStudentSubmissions(studentId),
        getLatestProgressSummary(studentId)
      ]);
      setStudent(p);
      setSubmissions(subs);
      setSummary(sum);
      setLoading(false);
    }
    load();
  }, [studentId]);

  async function generateSummary() {
    if (submissions.length < 3) return;
    setGeneratingSummary(true);
    try {
      const last5 = [...submissions].reverse().slice(-5);
      const { system, user } = buildProgressPrompt(last5);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 800, system, messages: [{ role: "user", content: user }] })
      });
      const data = await res.json();
      const text = data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      await saveProgressSummary(studentId, { submissionCount: submissions.length, summaryText: parsed.summary });
      setSummary({ summary_text: parsed.summary, generated_at: new Date() });
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingSummary(false);
    }
  }

  // Build trend data for chart
  const trendData = [...submissions].reverse().map((s, i) => {
    const entry = { name: `#${i + 1}`, total: s.score_total };
    s.ai_feedback?.criteria?.forEach(c => {
      entry[c.name.split(" ")[0]] = c.score;
    });
    return entry;
  });

  const criteriaNames = submissions[0]?.ai_feedback?.criteria?.map(c => c.name.split(" ")[0]) || [];
  const colors = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626"];

  const formatDate = ts => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{
        background: "white", borderBottom: "1px solid #e5e7eb",
        padding: "0 1.5rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 56
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button small variant="ghost" onClick={() => navigate("/admin")}>← Back</Button>
          <span style={{ fontWeight: 600, color: "#111" }}>{student?.display_name}</span>
          <Badge color={student?.curriculum === "n5_scotland" ? "blue" : "purple"}>
            {student?.curriculum === "n5_scotland" ? "N5 Scotland" : "GCSE England"}
          </Badge>
        </div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          {submissions.length} submission{submissions.length !== 1 ? "s" : ""} · {student?.total_stars} ★ total
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Trend chart */}
        {submissions.length >= 3 && (
          <Card style={{ marginBottom: "1.5rem" }}>
            <SectionLabel>Score trend</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {criteriaNames.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name}
                    stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {submissions.length < 3 && (
          <Card style={{ marginBottom: "1.5rem", textAlign: "center", color: "#6b7280", fontSize: 14 }}>
            Trend chart appears after 3 submissions. {3 - submissions.length} more to go.
          </Card>
        )}

        {/* Progress summary */}
        <Card style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <SectionLabel>AI progress summary</SectionLabel>
            <Button small onClick={generateSummary} disabled={submissions.length < 3 || generatingSummary}>
              {generatingSummary ? "Generating…" : submissions.length < 3 ? `Need ${3 - submissions.length} more` : "Regenerate"}
            </Button>
          </div>
          {summary ? (
            <div style={{ fontSize: 14, lineHeight: 1.75, color: "#374151" }}>
              {summary.summary_text.split("\n\n").map((p, i) => (
                <p key={i} style={{ marginBottom: "0.75rem" }}>{p}</p>
              ))}
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: "0.5rem" }}>
                Generated {formatDate(summary.generated_at)}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: "#6b7280" }}>
              {submissions.length < 3
                ? `Progress summary available after 3 submissions.`
                : "Click Regenerate to generate a progress summary."}
            </div>
          )}
        </Card>

        {/* Submissions list */}
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: "1rem" }}>All submissions</h3>

        {submissions.length === 0 ? (
          <EmptyState icon="📝" title="No submissions yet" body="David hasn't submitted any writing yet." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {submissions.map(s => (
              <div key={s.id}>
                <Card style={{ cursor: "pointer" }} onClick={() => setSelectedSubmission(selectedSubmission?.id === s.id ? null : s)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#111", marginBottom: 4 }}>
                        {s.writing_type === "creative" ? "Creative" : "Discursive"} · {s.word_count} words
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>{formatDate(s.created_at)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{s.score_total}/20</span>
                      <Stars score={s.stars_earned} max={3} size={16} />
                      <span style={{ color: "#d1d5db" }}>{selectedSubmission?.id === s.id ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </Card>

                {selectedSubmission?.id === s.id && (
                  <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: "1px solid #f3f4f6" }}>
                    <SectionLabel>Student's writing</SectionLabel>
                    <div style={{ fontSize: 14, lineHeight: 1.75, color: "#374151", whiteSpace: "pre-wrap", marginBottom: "1.5rem", background: "#f9fafb", padding: "1rem", borderRadius: 8 }}>
                      {s.response_text}
                    </div>

                    <SectionLabel>Criteria scores</SectionLabel>
                    {s.ai_feedback?.criteria?.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 180, fontSize: 13, color: "#374151", flexShrink: 0 }}>{c.name}</div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <Stars score={c.score} size={14} />
                            <span style={{ fontSize: 12, color: "#6b7280" }}>{c.score}/5</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#6b7280" }}>{c.comment}</div>
                        </div>
                      </div>
                    ))}

                    <div style={{ marginTop: "1.25rem" }}>
                      <SectionLabel>AI feedback</SectionLabel>
                      <div style={{ fontSize: 14, lineHeight: 1.75, color: "#374151" }}>
                        {s.ai_feedback?.explanation?.split("\n\n").map((p, i) => (
                          <p key={i} style={{ marginBottom: "0.75rem" }}>{p}</p>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: "1.25rem" }}>
                      <SectionLabel>Sample strong answer</SectionLabel>
                      <div style={{ fontSize: 14, lineHeight: 1.75, color: "#374151", background: "#f9fafb", padding: "1rem", borderRadius: 8 }}>
                        {s.ai_feedback?.sampleAnswer?.split("\n\n").map((p, i) => (
                          <p key={i} style={{ marginBottom: "0.5rem" }}>{p}</p>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
