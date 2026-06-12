import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getPrompts } from "../../lib/db";
import { Card, Spinner, EmptyState } from "../../components/shared/UI";

export default function StudentPromptPicker() {
  const { type } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrompts({ curriculum: profile?.curriculum, writingType: type }).then(p => {
      setPrompts(p);
      setLoading(false);
    });
  }, [type, profile]);

  const typeLabel = type === "creative" ? "Creative writing" : "Discursive writing";
  const typeIcon = type === "creative" ? "🖊️" : "💬";

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", height: 56 }}>
        <button onClick={() => navigate("/student")} style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "inherit", marginRight: 12 }}>← Back</button>
        <span style={{ fontSize: 16 }}>{typeIcon}</span>
        <span style={{ fontWeight: 600, color: "#111", marginLeft: 8 }}>{typeLabel}</span>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.5rem" }}>
          Choose a prompt to write about. Take your time — there is no rush.
        </p>

        {loading ? <Spinner /> : prompts.length === 0 ? (
          <EmptyState icon="📋" title="No prompts available yet" body="Your teacher will add prompts soon." />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {prompts.map(p => (
              <Card key={p.id} style={{ cursor: "pointer" }}
                onClick={() => navigate(`/student/write/${p.id}`, { state: { prompt: p } })}>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#111", marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 12 }}>{p.prompt_text}</div>
                <div style={{ fontSize: 13, color: "#2563eb" }}>Start writing →</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
