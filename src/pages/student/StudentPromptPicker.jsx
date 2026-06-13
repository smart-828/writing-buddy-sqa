import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getStudentPrompts, getCompletedPromptIds, getAdminForStudent } from "../../lib/db";
import { Card, Spinner, EmptyState, Badge } from "../../components/shared/UI";

const skillColor = s => ({ content: "blue", structure: "purple", expression: "green", accuracy: "amber" }[s] || "gray");

export default function StudentPromptPicker() {
  const { type } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const adminId = await getAdminForStudent(profile.id);
      if (!adminId) { setLoading(false); return; }
      const [ps, completed] = await Promise.all([
        getStudentPrompts(adminId, type),
        getCompletedPromptIds(profile.id)
      ]);
      setPrompts(ps);
      setCompletedIds(completed);
      setLoading(false);
    }
    if (profile?.id) load();
  }, [type, profile?.id]);

  const typeLabel = type === "creative" ? "Creative writing" : "Discursive writing";
  const typeIcon  = type === "creative" ? "🖊️" : "💬";

  const incomplete = prompts.filter(p => !completedIds.has(p.id));
  const completed  = prompts.filter(p => completedIds.has(p.id));

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", height: 56 }}>
        <button onClick={() => navigate("/student")} style={{ background: "none", border: "none", fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "inherit", marginRight: 12 }}>← Back</button>
        <span style={{ fontSize: 16 }}>{typeIcon}</span>
        <span style={{ fontWeight: 600, color: "#111", marginLeft: 8 }}>{typeLabel}</span>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {loading ? <Spinner /> : prompts.length === 0 ? (
          <EmptyState icon="📋" title="No prompts available yet" body="Your teacher will add prompts soon." />
        ) : (
          <>
            {incomplete.length > 0 && (
              <>
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1rem" }}>
                  Choose a prompt. Take your time — there is no rush.
                </p>
                <div style={{ display: "grid", gap: 12, marginBottom: completed.length > 0 ? "2rem" : 0 }}>
                  {incomplete.map(p => (
                    <PromptCard key={p.id} prompt={p} done={false}
                      onClick={() => navigate(`/student/write/${p.id}`, { state: { prompt: p } })} />
                  ))}
                </div>
              </>
            )}

            {completed.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
                  Completed
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {completed.map(p => (
                    <PromptCard key={p.id} prompt={p} done={true}
                      onClick={() => navigate(`/student/write/${p.id}`, { state: { prompt: p } })} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PromptCard({ prompt, done, onClick }) {
  return (
    <Card style={{ cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: done ? "#6b7280" : "#111" }}>{prompt.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 12 }}>
          {prompt.target_skill && <Badge color={skillColor(prompt.target_skill)}>{prompt.target_skill}</Badge>}
          {done && (
            <span style={{
              fontSize: 12, fontWeight: 500, color: "#16a34a",
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 6, padding: "2px 8px"
            }}>✓ Completed</span>
          )}
        </div>
      </div>

      <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: prompt.hints?.length ? 10 : 0 }}>
        {prompt.prompt_text}
      </div>

      {prompt.hints?.length > 0 && (
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10, display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Things to think about
          </div>
          {prompt.hints.map((h, i) => (
            <div key={i} style={{ fontSize: 13, color: "#6b7280" }}>• {h}</div>
          ))}
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, fontStyle: "italic" }}>
            These are suggestions only — write freely.
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <div style={{ fontSize: 13, color: "#2563eb", fontWeight: 500 }} onClick={onClick}>
          {done ? "Write again →" : "Start writing →"}
        </div>
      </div>
    </Card>
  );
}
