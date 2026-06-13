import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getAdminPrompts, addPrompt, togglePrompt } from "../../lib/db";
import { buildPromptGeneratorSystem } from "../../prompts/aiPrompts";
import { Card, Button, Badge, SectionLabel, EmptyState, Spinner } from "../../components/shared/UI";

const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

const SKILL_OPTIONS = [
  { value: "content",    label: "Content and ideas" },
  { value: "structure",  label: "Structure" },
  { value: "expression", label: "Expression" },
  { value: "accuracy",   label: "Technical accuracy" }
];

const skillColor = s => ({ content: "blue", structure: "purple", expression: "green", accuracy: "amber" }[s] || "gray");
const typeColor  = t => t === "creative" ? "green" : "amber";

export default function AdminPrompts() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate mode
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ type: "creative", targetSkill: "expression" });
  const [generated, setGenerated] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      getAdminPrompts(profile.id).then(p => { setPrompts(p); setLoading(false); });
    }
  }, [profile]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerated([]);
    setSelected(new Set());
    try {
      const system = buildPromptGeneratorSystem(genForm.type, genForm.targetSkill, profile.curriculum || "n5_scotland");
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
          max_tokens: 2000,
          system,
          messages: [{ role: "user", content: "Generate the prompts now." }]
        })
      });
      const data = await res.json();
      const text = data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      setGenerated(parsed.prompts || []);
    } catch (e) {
      alert("Generation failed: " + e.message);
    } finally {
      setGenerating(false);
    }
  }

  function toggleSelect(i) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function handleSaveSelected() {
    if (!selected.size) return;
    setSaving(true);
    try {
      await Promise.all(
        [...selected].map(i => addPrompt(profile.id, {
          title: generated[i].title,
          promptText: generated[i].prompt_text,
          type: genForm.type,
          targetSkill: genForm.targetSkill,
          hints: generated[i].hints
        }))
      );
      const updated = await getAdminPrompts(profile.id);
      setPrompts(updated);
      setGenerated([]);
      setSelected(new Set());
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id, current) {
    await togglePrompt(id, !current);
    setPrompts(p => p.map(pr => pr.id === id ? { ...pr, is_active: !current } : pr));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button small variant="ghost" onClick={() => navigate("/admin")}>← Back</Button>
          <span style={{ fontWeight: 600, color: "#111" }}>Writing prompts</span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Generate panel */}
        <Card style={{ marginBottom: "1.5rem", borderColor: "#2563eb" }}>
          <SectionLabel>Generate prompts with AI</SectionLabel>
          <div style={{ display: "flex", gap: 12, marginBottom: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>Writing type</label>
              <select value={genForm.type} onChange={e => setGenForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#111" }}>
                <option value="creative">Creative writing</option>
                <option value="discursive">Discursive writing</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }}>Target skill</label>
              <select value={genForm.targetSkill} onChange={e => setGenForm(f => ({ ...f, targetSkill: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", color: "#111" }}>
                {SKILL_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <Button variant="primary" onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating…" : "Generate 8 prompts"}
              </Button>
            </div>
          </div>

          {generated.length > 0 && (
            <>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: "0.75rem" }}>
                Select the prompts you want to add:
              </div>
              <div style={{ display: "grid", gap: 10, marginBottom: "1rem" }}>
                {generated.map((p, i) => (
                  <div key={i} onClick={() => toggleSelect(i)}
                    style={{
                      padding: "0.875rem 1rem", border: `1px solid ${selected.has(i) ? "#2563eb" : "#e5e7eb"}`,
                      borderRadius: 8, cursor: "pointer", background: selected.has(i) ? "#eff6ff" : "white"
                    }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, border: `2px solid ${selected.has(i) ? "#2563eb" : "#d1d5db"}`,
                        background: selected.has(i) ? "#2563eb" : "white", flexShrink: 0, marginTop: 1,
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {selected.has(i) && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#111", marginBottom: 4 }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>{p.prompt_text}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {p.hints?.map((h, hi) => (
                            <div key={hi} style={{ fontSize: 12, color: "#6b7280" }}>• {h}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="primary" onClick={handleSaveSelected} disabled={!selected.size || saving}>
                {saving ? "Saving…" : `Add ${selected.size} selected prompt${selected.size !== 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </Card>

        {/* Existing prompts */}
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: "1rem" }}>
          Your prompts ({prompts.length})
        </h3>

        {loading ? <Spinner /> : prompts.length === 0 ? (
          <EmptyState icon="📋" title="No prompts yet" body="Generate your first prompts above." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {prompts.map(p => (
              <Card key={p.id} style={{ opacity: p.is_active ? 1 : 0.55 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{p.title}</span>
                      <Badge color={typeColor(p.type)}>{p.type}</Badge>
                      {p.target_skill && <Badge color={skillColor(p.target_skill)}>{p.target_skill}</Badge>}
                      {!p.is_active && <Badge color="red">Inactive</Badge>}
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>{p.prompt_text}</div>
                    {p.hints?.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {p.hints.map((h, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#6b7280" }}>• {h}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button small variant={p.is_active ? "danger" : "default"}
                    onClick={() => handleToggle(p.id, p.is_active)}
                    style={{ marginLeft: 16, flexShrink: 0 }}>
                    {p.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
