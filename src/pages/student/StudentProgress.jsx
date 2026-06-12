import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAuth } from "../../hooks/useAuth";
import { getStudentSubmissions, getLatestProgressSummary } from "../../lib/db";
import { Card, SectionLabel, Stars, Spinner, EmptyState } from "../../components/shared/UI";

export default function StudentProgress() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      getStudentSubmissions(profile.id),
      getLatestProgressSummary(profile.id)
    ]).then(([subs, sum]) => {
      setSubmissions(subs);
      setSummary(sum);
      setLoading(false);
    });
  }, [profile]);

  const chronological = [...submissions].reverse();

  const trendData = chronological.map((s, i) => {
    const entry = { name: `#${i + 1}` };
    s.ai_feedback?.criteria?.forEach(c => {
      entry[c.name.split(" ")[0]] = c.score;
    });
    return entry;
  });

  const criteriaNames = submissions[0]?.ai_feedback?.criteria?.map(c => c.name.split(" ")[0]) || [];
  const colors = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626"];

  // Personal bests per criterion
  const personalBests = {};
  if (submissions.length > 0 && submissions[0].ai_feedback?.criteria) {
    submissions[0].ai_feedback.criteria.forEach(c => { personalBests[c.name] = 0; });
    submissions.forEach(s => {
      s.ai_feedback?.criteria?.forEach(c => {
        if (c.score > (personalBests[c.name] || 0)) personalBests[c.name] = c.score;
      });
    });
  }

  // Trend direction for each criterion (last 3 submissions)
  function trendArrow(criterionName) {
    if (chronological.length < 3) return null;
    const recent = chronological.slice(-3).map(s => s.ai_feedback?.criteria?.find(c => c.name === criterionName)?.score || 0);
    const diff = recent[2] - recent[0];
    if (diff > 0) return { arrow: "↑", color: "#16a34a" };
    if (diff < 0) return { arrow: "↓", color: "#dc2626" };
    return { arrow: "→", color: "#6b7280" };
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", height: 56 }}>
        <button onClick={() => navigate("/student")} style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "inherit", marginRight: 12 }}>← Back</button>
        <span style={{ fontWeight: 600, color: "#111" }}>My progress</span>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {submissions.length === 0 ? (
          <EmptyState icon="📈" title="No submissions yet" body="Submit your first piece of writing to start tracking your progress." action={
            <button onClick={() => navigate("/student")} style={{ padding: "10px 20px", background: "#2563eb", border: "none", borderRadius: 8, color: "white", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Start writing</button>
          } />
        ) : (
          <>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
              {[
                { label: "Submissions", value: submissions.length },
                { label: "Total stars", value: `${profile?.total_stars || 0} ⭐` },
                { label: "Best score", value: `${Math.max(...submissions.map(s => s.score_total))}/20` }
              ].map(s => (
                <div key={s.label} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            {submissions.length >= 3 ? (
              <Card style={{ marginBottom: "1.5rem" }}>
                <SectionLabel>Score trend by criterion</SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    {criteriaNames.map((name, i) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            ) : (
              <Card style={{ marginBottom: "1.5rem", textAlign: "center", color: "#6b7280", fontSize: 14, padding: "1.5rem" }}>
                Trend chart appears after 3 submissions. {3 - submissions.length} more to go.
              </Card>
            )}

            {/* Personal bests + trend arrows */}
            {Object.keys(personalBests).length > 0 && (
              <Card style={{ marginBottom: "1.5rem" }}>
                <SectionLabel>Personal bests</SectionLabel>
                {Object.entries(personalBests).map(([name, best]) => {
                  const trend = trendArrow(name);
                  return (
                    <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontSize: 14, color: "#374151" }}>{name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Stars score={best} size={15} />
                        <span style={{ fontSize: 13, color: "#6b7280" }}>{best}/5 best</span>
                        {trend && (
                          <span style={{ fontSize: 16, color: trend.color, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{trend.arrow}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {submissions.length < 3 && (
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                    Trend arrows appear after 3 submissions.
                  </div>
                )}
              </Card>
            )}

            {/* AI progress summary */}
            {summary && (
              <Card style={{ marginBottom: "1.5rem" }}>
                <SectionLabel>What your teacher says</SectionLabel>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: "#111" }}>
                  {summary.summary_text.split("\n\n").map((p, i) => (
                    <p key={i} style={{ marginBottom: "0.75rem" }}>{p}</p>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
